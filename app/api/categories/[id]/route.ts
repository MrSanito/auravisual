import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    // Verify ownership
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check duplicate
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        type: category.type,
        NOT: { id },
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Another category with this name already exists" }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 500 });
  }
}

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

    // Verify ownership
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if category has active transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id, isDeleted: false },
    });

    if (transactionCount > 0) {
      return NextResponse.json({
        error: "Cannot delete category because it has active transactions associated with it. Please reassign or delete those transactions first."
      }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 500 });
  }
}
