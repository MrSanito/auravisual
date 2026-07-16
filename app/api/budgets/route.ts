import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

    return NextResponse.json(budgets);
  } catch (error: any) {
    console.error("Fetch budgets error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch budgets" }, { status: 500 });
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

    const { categoryName, type, limit } = await request.json();

    if (!categoryName || limit === undefined) {
      return NextResponse.json({ error: "Category name and limit are required" }, { status: 400 });
    }

    const budgetLimit = Number(limit);
    if (isNaN(budgetLimit) || budgetLimit < 0) {
      return NextResponse.json({ error: "Limit must be a non-negative number" }, { status: 400 });
    }

    // 1. Resolve Category
    const transactionType = type === "INCOME" ? "INCOME" : "EXPENSE";
    let category = await prisma.category.findFirst({
      where: { userId, name: categoryName, type: transactionType },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          userId,
          name: categoryName,
          type: transactionType,
        },
      });
    }

    // 2. Upsert Budget
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId: {
          userId,
          categoryId: category.id,
        },
      },
      update: {
        limit: budgetLimit,
      },
      create: {
        userId,
        categoryId: category.id,
        limit: budgetLimit,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(budget);
  } catch (error: any) {
    console.error("Upsert budget error:", error);
    return NextResponse.json({ error: error.message || "Failed to save budget" }, { status: 500 });
  }
}
