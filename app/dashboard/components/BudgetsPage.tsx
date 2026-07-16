"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { PiggyBank, Loader2, Save, AlertTriangle } from "lucide-react";
import { TopBar } from "./TopBar";
import { useAuth } from "@/app/context/AuthContext";
import { formatINR, expenseCategoryMeta } from "../data/mockData";

interface BudgetsPageProps {
  expenses: any[];
  dbCategories?: any[];
  dbBudgets?: any[];
  onRefresh?: () => void;
}

export function BudgetsPage({
  expenses,
  dbCategories = [],
  dbBudgets = [],
  onRefresh,
}: BudgetsPageProps) {
  const { user } = useAuth();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [limits, setLimits] = useState<Record<string, string>>({});

  const expenseCategories = dbCategories && dbCategories.length > 0
    ? dbCategories.filter((c) => c.type === "EXPENSE")
    : Object.keys(expenseCategoryMeta).map((name) => ({ id: name, name, type: "EXPENSE" }));

  // Group spent by category name
  const spentByCategory = React.useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  // Find budget limit for a category (match by name or ID)
  const getBudgetLimit = (catName: string) => {
    const budget = dbBudgets.find((b) => b.category?.name === catName);
    return budget ? Number(budget.limit) : 0;
  };

  const handleLimitChange = (catName: string, value: string) => {
    setLimits((prev) => ({ ...prev, [catName]: value }));
  };

  const saveBudgetLimit = async (catName: string) => {
    if (!user) {
      toast.error("Unauthorized");
      return;
    }

    const rawLimit = limits[catName] !== undefined ? limits[catName] : String(getBudgetLimit(catName));
    const limitNum = Number(rawLimit);
    if (isNaN(limitNum) || limitNum < 0) {
      toast.error("Budget limit must be a valid positive number.");
      return;
    }

    setSavingId(catName);
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          categoryName: catName,
          type: "EXPENSE",
          limit: limitNum,
        }),
      });

      if (response.ok) {
        toast.success(`Budget limit for ${catName} saved successfully!`);
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to save budget limit");
      }
    } catch (err) {
      console.error("Save budget error:", err);
      toast.error("Connection failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <TopBar title="Set Category Budgets" subtitle="Configure spending limits per category and track your actual progress." />

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-5">
          <PiggyBank className="text-blue-500" size={20} />
          <h3 className="text-base font-semibold text-gray-800">Monthly Expense Limits</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-gray-400">
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-2 py-3 font-medium">Monthly Limit (₹)</th>
                <th className="px-2 py-3 font-medium">Spent this Month</th>
                <th className="px-2 py-3 font-medium">Status</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenseCategories.map((c) => {
                const spent = spentByCategory[c.name] || 0;
                const currentLimit = getBudgetLimit(c.name);
                const inputValue = limits[c.name] !== undefined ? limits[c.name] : String(currentLimit);
                const isOverBudget = currentLimit > 0 && spent > currentLimit;
                const isSaving = savingId === c.name;

                return (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-4 font-semibold text-gray-700">{c.name}</td>
                    <td className="px-2 py-4">
                      <input
                        type="number"
                        placeholder="0"
                        className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 w-32"
                        value={inputValue}
                        onChange={(e) => handleLimitChange(c.name, e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-4 font-medium text-gray-700">{formatINR(spent)}</td>
                    <td className="px-2 py-4">
                      {currentLimit === 0 ? (
                        <span className="text-xs text-gray-400 italic">No limit set</span>
                      ) : isOverBudget ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                          <AlertTriangle size={13} /> Over Budget
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-green-600">✓ On Track</span>
                      )}
                    </td>
                    <td className="px-2 py-4 text-right">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => saveBudgetLimit(c.name)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Save Limit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
