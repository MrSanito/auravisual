import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

    // Fetch transactions with full category and account details
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId,
        isDeleted: false,
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error: any) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch transactions" }, { status: 500 });
  }
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

    const { accountName, categoryName, type, amount, party, mode, notes, date } = await request.json();

    if (!accountName || !categoryName || !amount) {
      return NextResponse.json({ error: "Account, category and amount are required" }, { status: 400 });
    }

    const transactionAmount = Number(amount);
    const transactionType = type === "INCOME" ? "INCOME" : "EXPENSE";

    // Build the consolidated description string
    const consolidatedDescription = `${party || "Unknown"} - ${notes || ""}`.trim() + (mode ? ` (${mode})` : "");

    // Process creation and balance adjustment in a secure transaction
    const newTransaction = await prisma.$transaction(async (tx: any) => {
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

      // 3. Determine if future-dated (PENDING)
      const txDate = date ? new Date(date) : new Date();
      // Compare without time part to see if it's strictly in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const txDateMidnight = new Date(txDate);
      txDateMidnight.setHours(0, 0, 0, 0);
      
      const isFuture = txDateMidnight > today;
      const txStatus = isFuture ? "PENDING" : "COMPLETED";

      // 4. Create the Transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId: account.id,
          categoryId: category.id,
          type: transactionType,
          amount: transactionAmount,
          description: consolidatedDescription,
          status: txStatus,
          createdAt: txDate,
        },
        include: {
          account: true,
          category: true,
        },
      });

      // 5. Update the Account Balance (only if COMPLETED)
      if (txStatus === "COMPLETED") {
        const balanceChange = transactionType === "INCOME" ? transactionAmount : -transactionAmount;
        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: { increment: balanceChange },
            lastUpdate: new Date(),
          },
        });
      }

      return transaction;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return NextResponse.json(newTransaction);
  } catch (error: any) {
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: error.message || "Failed to create transaction" }, { status: 500 });
  }
}
