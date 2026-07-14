import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "@/lib/crypto";

export async function POST(request: Request) {
  try {
    const { email: emailInput, password } = await request.json();

    if (!emailInput || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Standardize admin username/email mapping for backward compatibility
    let email = emailInput.trim();
    if (email === "admin") {
      email = "admin@auravisuals.com";
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Dynamic Seed: If admin doesn't exist yet, auto-register them seamlessly with mock data seeded!
    if (!user && email === "admin@auravisuals.com" && password === "admin") {
      const hashedPassword = await hashPassword("admin");
      
      user = await prisma.$transaction(async (tx: any) => {
        const newUser = await tx.user.create({
          data: {
            name: "Admin User",
            email: "admin@auravisuals.com",
            passwordHash: hashedPassword,
            company: "Auravisuals",
          },
        });

        // 1. Seed Default Accounts (balances matches final math after transaction offset)
        const hdfc = await tx.account.create({
          data: {
            userId: newUser.id,
            AccountName: "HDFC Bank",
            BankName: "HDFC",
            balance: 140680,
          },
        });
        const icici = await tx.account.create({
          data: {
            userId: newUser.id,
            AccountName: "ICICI Bank",
            BankName: "ICICI",
            balance: 15000,
          },
        });
        const cash = await tx.account.create({
          data: {
            userId: newUser.id,
            AccountName: "Cash Wallet",
            BankName: "Cash",
            balance: 2500,
          },
        });

        // 2. Seed Default Categories
        const categoriesToCreate = [
          // Income
          { name: "Salary", type: "INCOME" },
          { name: "Freelance", type: "INCOME" },
          { name: "Business Revenue", type: "INCOME" },
          { name: "Interest", type: "INCOME" },
          { name: "Other Income", type: "INCOME" },
          // Expense
          { name: "Food", type: "EXPENSE" },
          { name: "Transport", type: "EXPENSE" },
          { name: "Rent", type: "EXPENSE" },
          { name: "Electricity", type: "EXPENSE" },
          { name: "Internet", type: "EXPENSE" },
          { name: "Fuel", type: "EXPENSE" },
          { name: "Groceries", type: "EXPENSE" },
          { name: "Shopping", type: "EXPENSE" },
          { name: "Entertainment", type: "EXPENSE" },
          { name: "Others", type: "EXPENSE" },
        ];

        const createdCategories: any[] = [];
        for (const cat of categoriesToCreate) {
          const c = await tx.category.create({
            data: {
              userId: newUser.id,
              name: cat.name,
              type: cat.type as any,
            },
          });
          createdCategories.push(c);
        }

        // 3. Seed Default Transactions
        const hdfcId = hdfc.id;
        const findCatId = (name: string, type: string) => 
          createdCategories.find(c => c.name === name && c.type === type)?.id || "";

        // Seed Incomes
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Salary", "INCOME"), type: "INCOME", amount: 60000, description: "ABC Pvt Ltd - May Salary (Bank Transfer)", createdAt: new Date("2025-05-14T00:00:00Z") }
        });
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Freelance", "INCOME"), type: "INCOME", amount: 25600, description: "Client - Rohan - Design project (UPI)", createdAt: new Date("2025-05-10T00:00:00Z") }
        });
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Business Revenue", "INCOME"), type: "INCOME", amount: 50000, description: "Customer A - Project Payment (Bank Transfer)", createdAt: new Date("2025-05-08T00:00:00Z") }
        });
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Interest", "INCOME"), type: "INCOME", amount: 650, description: "HDFC Bank - Savings Interest (Bank Transfer)", createdAt: new Date("2025-05-05T00:00:00Z") }
        });
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Other Income", "INCOME"), type: "INCOME", amount: 2350, description: "Refund - Refund (UPI)", createdAt: new Date("2025-05-03T00:00:00Z") }
        });
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Freelance", "INCOME"), type: "INCOME", amount: 47000, description: "Client - Amit - Freelance Work (Bank Transfer)", createdAt: new Date("2025-05-01T00:00:00Z") }
        });

        // Seed Expenses
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Food", "EXPENSE"), type: "EXPENSE", amount: 850, description: "Swiggy - Lunch (UPI)", createdAt: new Date("2025-05-14T00:00:00Z") }
        });
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Transport", "EXPENSE"), type: "EXPENSE", amount: 320, description: "Uber - Cab ride (UPI)", createdAt: new Date("2025-05-14T00:00:00Z") }
        });
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Rent", "EXPENSE"), type: "EXPENSE", amount: 25000, description: "Mr. Sharma - May Rent (Bank Transfer)", createdAt: new Date("2025-05-13T00:00:00Z") }
        });
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Electricity", "EXPENSE"), type: "EXPENSE", amount: 2500, description: "BESCOM - Bill Payment (UPI)", createdAt: new Date("2025-05-12T00:00:00Z") }
        });
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Internet", "EXPENSE"), type: "EXPENSE", amount: 1000, description: "Airtel - Monthly Pack (UPI)", createdAt: new Date("2025-05-11T00:00:00Z") }
        });
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Fuel", "EXPENSE"), type: "EXPENSE", amount: 1200, description: "IndianOil - Bike Fuel (Card)", createdAt: new Date("2025-05-10T00:00:00Z") }
        });
        await tx.transaction.create({
          data: { userId: newUser.id, accountId: hdfcId, categoryId: findCatId("Groceries", "EXPENSE"), type: "EXPENSE", amount: 1450, description: "Dmart - Weekly Groceries (UPI)", createdAt: new Date("2025-05-09T00:00:00Z") }
        });

        return newUser;
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordCorrect = await verifyPassword(password, user.passwordHash);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        token: "mock-jwt-token-xyz-123",
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to login" },
      { status: 500 }
    );
  }
}
