"use client";

import React, { useMemo, useState } from "react";
import {
  List,
  ArrowUpCircle,
  ArrowDownCircle,
  Tag,
  Search,
  Pencil,
  Trash2,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { TopBar } from "./TopBar";
import { Badge, CategoryIcon } from "./Badge";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import {
  categoryAuditSeed,
  INITIAL_EXPENSE_COUNTS,
  INITIAL_INCOME_COUNTS,
  Transaction,
  CategoryAuditItem,
} from "../data/mockData";

interface CategoryAuditPageProps {
  expenses: Transaction[];
  incomes: Transaction[];
  dbCategories?: any[];
  onRefresh?: () => void;
}

export function CategoryAuditPage({
  expenses,
  incomes,
  dbCategories = [],
  onRefresh,
}: CategoryAuditPageProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Type");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", kind: "Expense" });
  const pageSize = 10;

  // Edit category states
  const [editingCategory, setEditingCategory] = useState<CategoryAuditItem | null>(null);
  const [editName, setEditName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryAuditItem | null>(null);

  const allCategories = useMemo(() => {
    // Fallback to seeds if dbCategories array is empty
    if (!dbCategories || dbCategories.length === 0) {
      return categoryAuditSeed.map((c) => {
        let current = 0;
        let initial = 0;
        if (c.kind === "expense") {
          current = expenses.filter((e) => e.category === c.name).length;
          initial = INITIAL_EXPENSE_COUNTS[c.name] || 0;
        } else {
          current = incomes.filter((i) => i.category === c.name).length;
          initial = INITIAL_INCOME_COUNTS[c.name] || 0;
        }
        return { ...c, count: c.baseCount + Math.max(0, current - initial) };
      });
    }

    return dbCategories.map((dbCat) => {
      const name = dbCat.name;
      const kind = dbCat.type?.toLowerCase() === "income" ? "income" : "expense";
      
      const seedItem = categoryAuditSeed.find(
        (s) => s.name.toLowerCase() === name.toLowerCase() && s.kind === kind
      );

      let current = 0;
      let initial = 0;
      if (kind === "expense") {
        current = expenses.filter((e) => e.category === name).length;
        initial = INITIAL_EXPENSE_COUNTS[name] || 0;
      } else {
        current = incomes.filter((i) => i.category === name).length;
        initial = INITIAL_INCOME_COUNTS[name] || 0;
      }

      const baseCount = seedItem?.baseCount || 0;
      const count = baseCount + Math.max(0, current - initial);

      return {
        id: dbCat.id,
        name,
        kind,
        icon: seedItem?.icon || (kind === "expense" ? MoreHorizontal : Tag),
        color: seedItem?.color || (kind === "expense" ? "#64748b" : "#7c3aed"),
        bg: seedItem?.bg || (kind === "expense" ? "#f1f5f9" : "#ede9fe"),
        baseCount,
        lastUsed: seedItem?.lastUsed || null,
        count,
      };
    });
  }, [dbCategories, expenses, incomes]);

  const totalCategories = allCategories.length;
  const expenseCount = allCategories.filter((c) => c.kind === "expense").length;
  const incomeCount = allCategories.filter((c) => c.kind === "income").length;
  const unusedCount = allCategories.filter((c) => (c.count || 0) === 0).length;

  const filtered = useMemo(() => {
    return allCategories.filter((c) => {
      const matchesTab = tab === "all" || c.kind === tab;
      const matchesType =
        typeFilter === "All Type" || c.kind === (typeFilter === "Expense" ? "expense" : "income");
      const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesType && matchesSearch;
    });
  }, [allCategories, tab, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const changeFilter = (setter: (val: string) => void) => (val: string) => {
    setter(val);
    setPage(1);
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim() || !user) return;
    const type = newCat.kind === "Expense" ? "EXPENSE" : "INCOME";

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          name: newCat.name.trim(),
          type,
        }),
      });

      if (response.ok) {
        toast.success("Category created successfully!");
        setNewCat({ name: "", kind: "Expense" });
        setShowAddModal(false);
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to create category");
      }
    } catch (err) {
      console.error("Create category error:", err);
      toast.error("Failed to connect to the server");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim() || !user) return;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (response.ok) {
        toast.success("Category updated successfully!");
        setEditingCategory(null);
        setEditName("");
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to update category");
      }
    } catch (err) {
      console.error("Update category error:", err);
      toast.error("Failed to connect to the server");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!user) return;
    setIsDeleting(id);

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user.id,
        },
      });

      if (response.ok) {
        toast.success("Category deleted successfully!");
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to delete category");
      }
    } catch (err) {
      console.error("Delete category error:", err);
      toast.error("Failed to connect to the server");
    } finally {
      setIsDeleting(null);
    }
  };

  const stats = [
    { label: "Total Categories", value: totalCategories, sub: `${expenseCount} Expense • ${incomeCount} Income`, icon: List, color: "#2563eb", bg: "#dbeafe" },
    { label: "Income Categories", value: incomeCount, sub: "Active", subColor: "text-green-600", icon: ArrowUpCircle, color: "#16a34a", bg: "#dcfce7" },
    { label: "Expense Categories", value: expenseCount, sub: "Active", subColor: "text-red-500", icon: ArrowDownCircle, color: "#ef4444", bg: "#fee2e2" },
    { label: "Unused Categories", value: unusedCount, sub: "Not used in last 90 days", icon: Tag, color: "#a855f7", bg: "#f3e8ff" },
  ];

  const selectCls =
    "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="p-8">
      <TopBar
        title="Category Audit"
        subtitle="Manage all income and expense categories used in your transactions."
        rightSlot={
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={15} /> Add New Category
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                <Icon size={18} />
              </span>
              <div>
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className={`text-xs ${s.subColor || "text-gray-400"}`}>{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 pt-4">
          <div className="flex gap-5">
            {[
              { key: "all", label: "All Categories" },
              { key: "income", label: "Income Categories" },
              { key: "expense", label: "Expense Categories" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pb-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => changeFilter(setSearch)(e.target.value)}
                placeholder="Search category..."
                className="w-52 rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select className={selectCls} value={typeFilter} onChange={(e) => changeFilter(setTypeFilter)(e.target.value)}>
              <option>All Type</option>
              <option>Expense</option>
              <option>Income</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-gray-400">
                <th className="px-5 py-2.5 font-medium">Icon</th>
                <th className="px-2 py-2.5 font-medium">Category Name</th>
                <th className="px-2 py-2.5 font-medium">Type</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-5 py-3">
                    <CategoryIcon meta={c} />
                  </td>
                  <td className="px-2 py-3 font-medium text-gray-700">{c.name}</td>
                  <td className="px-2 py-3">
                    <Badge tone={c.kind === "expense" ? "red" : "green"}>
                      {c.kind === "expense" ? "Expense" : "Income"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(c);
                          setEditName(c.name);
                        }}
                        className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingCategory(c);
                        }}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">
                    No categories match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
          <p className="text-sm text-gray-400">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1} to{" "}
            {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} categories
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setPage(i + 1)}
                className={`h-8 w-8 rounded-lg text-sm font-medium ${
                  i + 1 === safePage ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">Add New Category</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={addCategory} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Category Name</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Travel"
                  value={newCat.name}
                  onChange={(e) => setNewCat((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Type</label>
                <select
                  value={newCat.kind}
                  onChange={(e) => setNewCat((f) => ({ ...f, kind: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option>Expense</option>
                  <option>Income</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">Edit Category</h3>
              <button type="button" onClick={() => setEditingCategory(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Category Name</label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 animate-pulse"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">Delete Category</h3>
              <button type="button" onClick={() => setDeletingCategory(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete category <span className="font-semibold text-gray-800">"{deletingCategory.name}"</span>?
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting === deletingCategory.id}
                  onClick={async () => {
                    await handleDeleteCategory(deletingCategory.id);
                    setDeletingCategory(null);
                  }}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isDeleting === deletingCategory.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
