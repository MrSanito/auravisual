import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// A simple robust CSV row parser that handles commas inside quotes
function parseCSVRow(text: string) {
  let result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          cur += '"'; i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
  }
  result.push(cur.trim());
  return result;
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists first to handle database resets with stale client sessions
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!userExists) {
      return NextResponse.json({ error: "User not found or session expired" }, { status: 401 });
    }

    const { transactions } = await request.json();

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions provided" }, { status: 400 });
    }

    // Process creation and balance adjustment in a secure transaction
    const result = await prisma.$transaction(async (tx) => {
      const importedTransactions = [];
      const accountBalances: Record<string, number> = {};

      for (let i = 0; i < transactions.length; i++) {
        // Expected JSON structure: { date, type, categoryName, amountStr, mode, accountName, party, notes }
        const row = transactions[i];
        const { date, type, categoryName, amountStr, mode, accountName, party, notes } = row;

        if (!date || !type || !categoryName || !amountStr || !accountName) {
          throw new Error(`Row ${i + 2}: Missing required fields. Please ensure Date, Type, Category, Amount, and Account are filled.`);
        }

        const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g, ""));
        if (isNaN(amount) || amount <= 0) {
          throw new Error(`Row ${i + 2}: Invalid amount '${amountStr}'.`);
        }

        const transactionType = type.toUpperCase() === "INCOME" ? "INCOME" : "EXPENSE";

        // 1. Resolve Account (create if not found)
        let account = await tx.account.findFirst({
          where: { userId, AccountName: accountName },
        });

        if (!account) {
          account = await tx.account.create({
            data: {
              userId,
              AccountName: accountName,
              BankName: accountName.split(" ")[0] || "Bank",
              balance: 0,
            },
          });
        }

        // 2. Resolve Category (create if not found)
        let category = await tx.category.findFirst({
          where: { userId, name: categoryName, type: transactionType },
        });

        if (!category) {
          category = await tx.category.create({
            data: {
              userId,
              name: categoryName,
              type: transactionType,
            },
          });
        }

        const consolidatedDescription = `${party || "Unknown"} - ${notes || ""}`.trim() + (mode ? ` (${mode})` : "");

        // 4. Determine if future-dated (PENDING)
        const txDate = date ? new Date(date) : new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const txDateMidnight = new Date(txDate);
        txDateMidnight.setHours(0, 0, 0, 0);
        
        const isFuture = txDateMidnight > today;
        const txStatus = isFuture ? "PENDING" : "COMPLETED";

        // 5. Create the Transaction
        const transaction = await tx.transaction.create({
          data: {
            userId,
            accountId: account.id,
            categoryId: category.id,
            type: transactionType,
            amount: amount,
            description: consolidatedDescription,
            status: txStatus,
            createdAt: txDate,
          },
        });

        // 6. Accumulate Balance changes (only if COMPLETED)
        if (txStatus === "COMPLETED") {
          const balanceChange = transactionType === "INCOME" ? amount : -amount;
          accountBalances[account.id] = (accountBalances[account.id] || 0) + balanceChange;
        }

        importedTransactions.push(transaction);
      }

      // Apply aggregated balance updates
      for (const [accountId, change] of Object.entries(accountBalances)) {
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: { increment: change },
            lastUpdate: new Date(),
          },
        });
      }

      return importedTransactions;
    });

    return NextResponse.json({ message: "Import successful", count: result.length });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message || "Failed to import transactions" }, { status: 500 });
  }
}
