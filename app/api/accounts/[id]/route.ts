import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const accountId = resolvedParams.id;
    
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

    const { AccountName, BankName, openingBalance } = await request.json();

    if (!AccountName || !BankName) {
      return NextResponse.json({ error: "Account Name and Bank Name are required" }, { status: 400 });
    }

    // Verify account belongs to user
    const existingAccount = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!existingAccount || existingAccount.userId !== userId) {
      return NextResponse.json({ error: "Account not found or unauthorized" }, { status: 404 });
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        AccountName,
        BankName,
        openingBalance: Number(openingBalance) || 0,
        lastUpdate: new Date()
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    console.error("Update account error:", error);
    return NextResponse.json({ error: error.message || "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const accountId = resolvedParams.id;
    
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

    // Verify account belongs to user
    const existingAccount = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!existingAccount || existingAccount.userId !== userId) {
      return NextResponse.json({ error: "Account not found or unauthorized" }, { status: 404 });
    }

    // Soft delete the account
    const deletedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        isDeleted: true,
        lastUpdate: new Date()
      },
    });

    // Soft delete all associated transactions
    await prisma.transaction.updateMany({
      where: { accountId: accountId },
      data: {
        isDeleted: true
      }
    });

    return NextResponse.json(deletedAccount);
  } catch (error: any) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete account" }, { status: 500 });
  }
}
