import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";

export async function POST(request: Request) {
  try {
    console.log("POST REGISTER ENV DATABASE_URL:", process.env.DATABASE_URL);
    const { name, email, password, company } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create user and seed default accounts and categories in a single transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          company: company || "Auravisuals",
        },
      });

      // Seed Default Accounts
      await tx.account.createMany({
        data: [
          {
            userId: newUser.id,
            AccountName: "HDFC Bank",
            BankName: "HDFC",
            balance: 60000, // Matching some of our initial mock data
          },
          {
            userId: newUser.id,
            AccountName: "ICICI Bank",
            BankName: "ICICI",
            balance: 15000,
          },
          {
            userId: newUser.id,
            AccountName: "Cash Wallet",
            BankName: "Cash",
            balance: 2500,
          },
        ],
      });

      // Seed Default Categories
      await tx.category.createMany({
        data: [
          // Income Categories
          { userId: newUser.id, name: "Salary", type: "INCOME" },
          { userId: newUser.id, name: "Freelance", type: "INCOME" },
          { userId: newUser.id, name: "Business Revenue", type: "INCOME" },
          { userId: newUser.id, name: "Interest", type: "INCOME" },
          { userId: newUser.id, name: "Other Income", type: "INCOME" },
          // Expense Categories
          { userId: newUser.id, name: "Food", type: "EXPENSE" },
          { userId: newUser.id, name: "Transport", type: "EXPENSE" },
          { userId: newUser.id, name: "Rent", type: "EXPENSE" },
          { userId: newUser.id, name: "Electricity", type: "EXPENSE" },
          { userId: newUser.id, name: "Internet", type: "EXPENSE" },
          { userId: newUser.id, name: "Fuel", type: "EXPENSE" },
          { userId: newUser.id, name: "Groceries", type: "EXPENSE" },
          { userId: newUser.id, name: "Shopping", type: "EXPENSE" },
          { userId: newUser.id, name: "Entertainment", type: "EXPENSE" },
          { userId: newUser.id, name: "Others", type: "EXPENSE" },
        ],
      });

      return newUser;
    });

    return NextResponse.json({
      message: "Registration successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 500 }
    );
  }
}
