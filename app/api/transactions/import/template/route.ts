import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's accounts and categories to generate a dynamic template
    const accounts = await prisma.account.findMany({ where: { userId, isDeleted: false } });
    const categories = await prisma.category.findMany({ where: { userId } });

    const accountName = accounts.length > 0 ? accounts[0].AccountName : "Cash";
    const incCategory = categories.find(c => c.type === "INCOME")?.name || "Salary";
    const expCategory = categories.find(c => c.type === "EXPENSE")?.name || "Food";

    // Build CSV content
    const headers = ["Date", "Type", "Category", "Amount", "Payment Mode", "Account", "Party", "Notes"];
    const rows = [
      headers.join(","),
      `2025-05-14,INCOME,${incCategory},50000,Bank Transfer,${accountName},ABC Corp,Monthly Salary`,
      `2025-05-15,EXPENSE,${expCategory},1500,UPI,${accountName},Swiggy,Lunch`
    ];

    const csvContent = rows.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="transactions_template.csv"',
      },
    });
  } catch (error: any) {
    console.error("Template generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate template" }, { status: 500 });
  }
}
