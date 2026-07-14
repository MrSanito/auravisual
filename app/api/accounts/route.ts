import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createAt: "asc" },
    });

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

    const { AccountName, BankName, balance } = await request.json();

    if (!AccountName || !BankName) {
      return NextResponse.json({ error: "Account Name and Bank Name are required" }, { status: 400 });
    }

    const newAccount = await prisma.account.create({
      data: {
        userId,
        AccountName,
        BankName,
        balance: Number(balance) || 0,
      },
    });

    return NextResponse.json(newAccount);
  } catch (error: any) {
    console.error("Create account error:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
