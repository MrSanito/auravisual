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

    let accounts = await prisma.account.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createAt: "asc" },
    });

    if (accounts.length === 0) {
      const defaultAccount = await prisma.account.create({
        data: {
          userId,
          AccountName: "Cash",
          BankName: "Cash",
          openingBalance: 0,
          balance: 0,
        }
      });
      accounts = [defaultAccount];
    }

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error("Fetch accounts error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch accounts" }, { status: 500 });
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

    const { AccountName, BankName, openingBalance, balance } = await request.json();

    if (!AccountName || !BankName) {
      return NextResponse.json({ error: "Account Name and Bank Name are required" }, { status: 400 });
    }

    const startingBalance = openingBalance !== undefined 
      ? Number(openingBalance) 
      : (Number(balance) || 0);

    const newAccount = await prisma.account.create({
      data: {
        userId,
        AccountName,
        BankName,
        openingBalance: startingBalance,
        balance: startingBalance,
      },
    });

    return NextResponse.json(newAccount);
  } catch (error: any) {
    console.error("Create account error:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
