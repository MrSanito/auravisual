import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Run delete and balance revert inside database transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const transaction = await tx.transaction.findFirst({
        where: { id, userId },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Revert the account balance change
      const revertChange = transaction.type === "INCOME" ? -Number(transaction.amount) : Number(transaction.amount);
      
      await tx.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: { increment: revertChange },
          lastUpdate: new Date(),
        },
      });

      // Soft-delete the transaction record
      await tx.transaction.update({
        where: { id },
        data: { isDeleted: true },
      });

      return { success: true };
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Delete transaction error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete transaction" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { accountName, categoryName, amount, party, mode, notes, date } = await request.json();

    if (!accountName || !categoryName || !amount) {
      return NextResponse.json({ error: "Account, category and amount are required" }, { status: 400 });
    }

    const transactionAmount = Number(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Find existing transaction
      const existingTx = await tx.transaction.findFirst({
        where: { id, userId },
        include: { account: true, category: true },
      });

      if (!existingTx) {
        throw new Error("Transaction not found");
      }

      // 2. Revert the old balance change on the old account
      const oldRevertChange = existingTx.type === "INCOME" ? -Number(existingTx.amount) : Number(existingTx.amount);
      await tx.account.update({
        where: { id: existingTx.accountId },
        data: {
          balance: { increment: oldRevertChange },
          lastUpdate: new Date(),
        },
      });

      // 3. Resolve the (possibly new) Account
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

      // 4. Resolve the (possibly new) Category
      let category = await tx.category.findFirst({
        where: { userId, name: categoryName, type: existingTx.type },
      });

      if (!category) {
        category = await tx.category.create({
          data: {
            userId,
            name: categoryName,
            type: existingTx.type,
          },
        });
      }

      const consolidatedDescription = `${party || "Unknown"} - ${notes || ""}`.trim() + (mode ? ` (${mode})` : "");

      // 5. Update the Transaction
      const updatedTx = await tx.transaction.update({
        where: { id },
        data: {
          accountId: account.id,
          categoryId: category.id,
          amount: transactionAmount,
          description: consolidatedDescription,
          createdAt: date ? new Date(date) : existingTx.createdAt,
        },
        include: {
          account: true,
          category: true,
        },
      });

      // 6. Apply new balance to the target account
      const newBalanceChange = existingTx.type === "INCOME" ? transactionAmount : -transactionAmount;
      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: { increment: newBalanceChange },
          lastUpdate: new Date(),
        },
      });

      return updatedTx;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Update transaction error:", error);
    return NextResponse.json({ error: error.message || "Failed to update transaction" }, { status: 500 });
  }
}
