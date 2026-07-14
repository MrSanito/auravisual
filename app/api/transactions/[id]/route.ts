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

      // Delete the transaction record
      await tx.transaction.delete({
        where: { id },
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Delete transaction error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete transaction" }, { status: 500 });
  }
}
