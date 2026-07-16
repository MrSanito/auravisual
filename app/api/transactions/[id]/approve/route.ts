import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    let actualAmount: number | undefined;
    try {
      const body = await request.json();
      if (body.actualAmount !== undefined && !isNaN(Number(body.actualAmount))) {
        actualAmount = Number(body.actualAmount);
      }
    } catch (e) {
      // Ignore JSON parse errors if body is empty
    }

    // Process approval in a secure transaction
    const approvedTransaction = await prisma.$transaction(async (tx) => {
      // 1. Fetch the transaction
      const transaction = await tx.transaction.findFirst({
        where: { id, userId },
        include: { account: true },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.status === "COMPLETED") {
        throw new Error("Transaction is already completed");
      }

      // 2. Mark as COMPLETED and update amount if provided
      const finalAmount = actualAmount !== undefined ? actualAmount : Number(transaction.amount);
      
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          status: "COMPLETED",
          amount: finalAmount,
        },
      });

      // 3. Update Account Balance
      const balanceChange = transaction.type === "INCOME" ? finalAmount : -finalAmount;
      await tx.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: { increment: balanceChange },
          lastUpdate: new Date(),
        },
      });

      return updatedTransaction;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return NextResponse.json(approvedTransaction);
  } catch (error: any) {
    console.error("Approve transaction error:", error);
    return NextResponse.json({ error: error.message || "Failed to approve transaction" }, { status: 500 });
  }
}
