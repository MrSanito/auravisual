"use client";

import React, { useState } from "react";
import {
  Wallet,
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  Plus,
  Minus,
  Upload,
  Info,
  Calendar,
  ChevronDown
} from "lucide-react";
import { toast } from "react-toastify";
import { TopBar } from "./TopBar";
import { Badge } from "./Badge";
import { ProgressBar } from "./ProgressBar";
import { ImportTransactionsModal } from "./ImportTransactionsModal";
import {
  formatINR,
  fixedExpensesData,
  fixedExpensesExtra,
  variableBudgetData,
  variableBudgetExtra,
  CURRENT_CASH,
  CURRENT_BANK_BALANCE,
  Transaction,
} from "../data/mockData";

interface BudgetPlannerPageProps {
  expenses: Transaction[];
  incomes: Transaction[];
  dbAccounts?: any[];
  dbBudgets?: any[];
  onNavigate: (page: string) => void;
  onRefresh?: () => void;
}

export function BudgetPlannerPage({
  expenses,
  incomes,
  dbAccounts = [],
  dbBudgets = [],
  onNavigate,
  onRefresh,
}: BudgetPlannerPageProps) {
  const [showAllVariable, setShowAllVariable] = useState(false);
  const [showAllExpectedIncome, setShowAllExpectedIncome] = useState(false);
  const [showAllExpectedExpense, setShowAllExpectedExpense] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveAmounts, setApproveAmounts] = useState<Record<string, string>>({});

  // Filter completed vs pending
  const completedIncomes = incomes.filter(i => i.status !== "PENDING");
  const completedExpenses = expenses.filter(e => e.status !== "PENDING");
  
  const pendingIncomes = incomes.filter(i => i.status === "PENDING");
  const pendingExpenses = expenses.filter(e => e.status === "PENDING");

  const totalIncome = completedIncomes.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = completedExpenses.reduce((s, e) => s + e.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const handleApprove = async (id: string, defaultAmount: number) => {
    try {
      setApprovingId(id);
      const userId = dbAccounts && dbAccounts.length > 0 ? dbAccounts[0]?.userId : "";
      if (!userId) return;

      const finalAmount = approveAmounts[id] !== undefined && approveAmounts[id] !== "" 
        ? Number(approveAmounts[id]) 
        : defaultAmount;

      const res = await fetch(`/api/transactions/${id}/approve`, {
        method: "POST",
        headers: { 
          "x-user-id": userId,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ actualAmount: finalAmount })
      });
      if (res.ok) {
        toast.success("Successfully confirmed!");
        if (onRefresh) onRefresh();
        else onNavigate("budget"); // fallback
      } else {
        toast.error("Failed to confirm transaction");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setApprovingId(null);
    }
  };

  // Calculate dynamic Cash Balance (type Cash, or Wallet/Cash in name)
  const cashBalance = dbAccounts && dbAccounts.length > 0
    ? dbAccounts
        .filter(a => a.BankName?.toLowerCase() === "cash" || a.AccountName?.toLowerCase().includes("cash") || a.AccountName?.toLowerCase().includes("wallet"))
        .reduce((sum, a) => sum + Number(a.balance), 0)
    : CURRENT_CASH;

  // Calculate dynamic Bank Balance (anything not cash)
  const bankBalance = dbAccounts && dbAccounts.length > 0
    ? dbAccounts
        .filter(a => !(a.BankName?.toLowerCase() === "cash" || a.AccountName?.toLowerCase().includes("cash") || a.AccountName?.toLowerCase().includes("wallet")))
        .reduce((sum, a) => sum + Number(a.balance), 0)
    : CURRENT_BANK_BALANCE;

  // Bank accounts breakdown breakdown list for tooltip
  const bankAccountsBreakdown = React.useMemo(() => {
    return dbAccounts && dbAccounts.length > 0
      ? dbAccounts.filter(
          (a) => !(a.BankName?.toLowerCase() === "cash" || a.AccountName?.toLowerCase().includes("cash") || a.AccountName?.toLowerCase().includes("wallet"))
        )
      : [];
  }, [dbAccounts]);

  const stats = [
    { label: "Current Cash", value: formatINR(cashBalance), sub: "In Hand", icon: Wallet, color: "#16a34a", bg: "#dcfce7" },
    { label: "Current Bank Balance", value: formatINR(bankBalance), sub: "Total in Bank", icon: Landmark, color: "#2563eb", bg: "#dbeafe" },
    { label: "Total Income", value: formatINR(totalIncome), sub: "This Month", icon: TrendingUp, color: "#7c3aed", bg: "#ede9fe" },
    { label: "Total Expenses", value: formatINR(totalExpenses), sub: "This Month", icon: TrendingDown, color: "#ef4444", bg: "#fee2e2" },
    { label: "Net Savings", value: formatINR(netSavings), sub: "Income - Expenses", icon: DollarSign, color: "#16a34a", bg: "#dcfce7" },
    { label: "Savings Rate", value: `${savingsRate.toFixed(2)}%`, sub: "% of Income", icon: PieIcon, color: "#2563eb", bg: "#dbeafe" },
  ];


  // Sum spent by category (only completed)
  const spentByCategory = React.useMemo(() => {
    const map: Record<string, number> = {};
    completedExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [completedExpenses]);

  // Derive variable budget rows from dbBudgets (if any), fallback to showing categories that have actual expenses
  const variableRows = React.useMemo(() => {
    // 1. Gather all categories that either have a database budget set OR have actual spending this month
    const categoriesWithData = new Set<string>();
    
    // Add categories from database budgets
    dbBudgets.forEach((b) => {
      if (b.category?.name) {
        categoriesWithData.add(b.category.name);
      }
    });

    // Add categories from active expenses
    Object.keys(spentByCategory).forEach((cat) => {
      categoriesWithData.add(cat);
    });

    // Map each category to its limit and spent amount
    const rows = Array.from(categoriesWithData).map((catName, index) => {
      const dbBudget = dbBudgets.find((b) => b.category?.name === catName);
      const budgetLimit = dbBudget ? Number(dbBudget.limit) : 0;
      return {
        id: dbBudget?.id || `db-var-${index}`,
        category: catName,
        budget: budgetLimit,
        spent: spentByCategory[catName] || 0,
      };
    });

    // If not showing all, only show rows that have a non-zero budget OR non-zero spent (limit to first 5)
    if (!showAllVariable) {
      return rows.filter((r) => r.budget > 0 || r.spent > 0).slice(0, 5);
    }
    return rows;
  }, [dbBudgets, spentByCategory, showAllVariable]);


  const thCls = "px-2 py-2.5 font-medium first:pl-5";

  return (
    <div className="p-4 md:p-8">
      <TopBar 
        title="Budget Planner" 
        subtitle="Overview of your budget, income and expenses" 
        showFilters={false}
        rightSlot={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Calendar size={15} className="text-gray-400" />
              01 May 2025 - 31 May 2025
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            >
              <Upload size={16} /> Add Transaction
            </button>
          </div>
        }
      />

      {showImportModal && (
        <ImportTransactionsModal
          userId={dbAccounts && dbAccounts.length > 0 ? dbAccounts[0]?.userId : undefined}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            // refresh data handled by parent ideally, or navigate
            onNavigate("transactions");
          }}
        />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm relative overflow-visible">
              <span
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                <Icon size={17} />
              </span>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">{s.value}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-gray-400">{s.sub}</p>
                {s.label === "Current Bank Balance" && (
                  <div className="relative group/tooltip inline-block">
                    <Info size={11} className="text-gray-400 cursor-help hover:text-blue-500 transition-colors" />
                    {/* Hover Tooltip Card */}
                    <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/tooltip:block z-20 w-48 rounded-xl border border-gray-200 bg-white p-3 shadow-xl text-[10px] text-gray-600 animate-in fade-in slide-in-from-bottom-1 duration-150">
                      <div className="font-bold text-gray-800 border-b border-gray-100 pb-1.5 mb-1.5">
                        Bank Breakdown
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {bankAccountsBreakdown.map((a: any) => (
                          <div key={a.id} className="flex justify-between items-center gap-2">
                            <span className="truncate max-w-[100px] font-semibold text-gray-500">{a.AccountName}</span>
                            <span className="font-bold text-gray-700">{formatINR(a.balance)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6">

        {/* Category Budgets */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-semibold text-gray-800">Category Budgets</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-400">
                  <th className={thCls}>Category</th>
                  <th className={thCls}>Budget</th>
                  <th className={thCls}>Spent</th>
                  <th className={thCls}>Remaining</th>
                  <th className={`${thCls} w-32`}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {variableRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">
                      No budget set or active expenses found.
                    </td>
                  </tr>
                ) : (
                  variableRows.map((v) => {
                  const pct = Math.round((v.spent / v.budget) * 100);
                  return (
                    <tr key={v.id} className="border-t border-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-700">{v.category}</td>
                      <td className="px-2 py-3 text-gray-600">{formatINR(v.budget)}</td>
                      <td className="px-2 py-3 text-gray-600">{formatINR(v.spent)}</td>
                      <td className="px-2 py-3 text-gray-600">{formatINR(v.budget - v.spent)}</td>
                      <td className="px-2 py-3">
                        <ProgressBar pct={pct} color={pct >= 60 ? "#f59e0b" : "#22c55e"} />
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-5 py-3 text-center">
            <button
              type="button"
              onClick={() => setShowAllVariable((s) => !s)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {showAllVariable ? "Show Less" : "View All Variable Budget"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Expected Income */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-semibold text-gray-800">Expected Income (Pending)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-400">
                  <th className={thCls}>Date</th>
                  <th className={thCls}>Source</th>
                  <th className={thCls}>Expected</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingIncomes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500 text-sm">No expected income.</td>
                  </tr>
                ) : (
                  (showAllExpectedIncome ? pendingIncomes : pendingIncomes.slice(0, 5)).map((r: any) => {
                    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : r.date;
                    return (
                      <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-5 py-3 text-gray-600">{dateStr}</td>
                        <td className="px-2 py-3 font-medium text-gray-700">{r.category?.name || r.category}</td>
                        <td className="px-2 py-3 text-gray-600 font-semibold">{formatINR(r.amount)}</td>
                        <td className="px-2 py-3 flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-gray-500 text-xs">₹</span>
                            <input
                              type="number"
                              className="pl-5 pr-2 py-1 w-20 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                              placeholder={String(r.amount)}
                              value={approveAmounts[r.id] !== undefined ? approveAmounts[r.id] : ""}
                              onChange={(e) => setApproveAmounts(prev => ({ ...prev, [r.id]: e.target.value }))}
                            />
                          </div>
                          <button 
                            disabled={approvingId === r.id}
                            onClick={() => handleApprove(r.id, r.amount)}
                            className="text-xs px-2 py-1.5 rounded bg-green-100 text-green-700 font-medium hover:bg-green-200 transition whitespace-nowrap"
                          >
                            {approvingId === r.id ? "Approving..." : "Mark Received"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {pendingIncomes.length > 5 && (
            <div className="border-t border-gray-100 px-5 py-3 text-center">
              <button
                type="button"
                onClick={() => setShowAllExpectedIncome((s) => !s)}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {showAllExpectedIncome ? "Show Less" : "View All Expected Income"}
              </button>
            </div>
          )}
        </div>

        {/* Expected Expense */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-semibold text-gray-800">Expected Expenses (Pending)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-400">
                  <th className={thCls}>Date</th>
                  <th className={thCls}>Category</th>
                  <th className={thCls}>Expected</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500 text-sm">No expected expenses.</td>
                  </tr>
                ) : (
                  (showAllExpectedExpense ? pendingExpenses : pendingExpenses.slice(0, 5)).map((r: any) => {
                    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : r.date;
                    return (
                      <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-5 py-3 text-gray-600">{dateStr}</td>
                        <td className="px-2 py-3 font-medium text-gray-700">{r.category?.name || r.category}</td>
                        <td className="px-2 py-3 text-gray-600 font-semibold">{formatINR(r.amount)}</td>
                        <td className="px-2 py-3 flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-gray-500 text-xs">₹</span>
                            <input
                              type="number"
                              className="pl-5 pr-2 py-1 w-20 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                              placeholder={String(r.amount)}
                              value={approveAmounts[r.id] !== undefined ? approveAmounts[r.id] : ""}
                              onChange={(e) => setApproveAmounts(prev => ({ ...prev, [r.id]: e.target.value }))}
                            />
                          </div>
                          <button 
                            disabled={approvingId === r.id}
                            onClick={() => handleApprove(r.id, r.amount)}
                            className="text-xs px-2 py-1.5 rounded bg-red-100 text-red-700 font-medium hover:bg-red-200 transition whitespace-nowrap"
                          >
                            {approvingId === r.id ? "Approving..." : "Mark Incurred"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {pendingExpenses.length > 5 && (
            <div className="border-t border-gray-100 px-5 py-3 text-center">
              <button
                type="button"
                onClick={() => setShowAllExpectedExpense((s) => !s)}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {showAllExpectedExpense ? "Show Less" : "View All Expected Expenses"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3">

        {/* Quick Actions */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-gray-800">Quick Actions</p>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onNavigate("transactions")}
              className="flex w-full items-center gap-2.5 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-100"
            >
              <Plus size={16} /> Add Income
            </button>
            <button
              type="button"
              onClick={() => onNavigate("transactions")}
              className="flex w-full items-center gap-2.5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
            >
              <Minus size={16} /> Add Expense
            </button>
            <button
              type="button"
              onClick={() => onNavigate("transactions")}
              className="flex w-full items-center gap-2.5 rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-100"
            >
              <Upload size={16} /> Upload Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
