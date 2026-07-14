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
} from "lucide-react";
import { TopBar } from "./TopBar";
import { Badge } from "./Badge";
import { ProgressBar } from "./ProgressBar";
import {
  formatINR,
  fixedExpensesData,
  fixedExpensesExtra,
  variableBudgetData,
  variableBudgetExtra,
  expectedIncomeData,
  expectedIncomeExtra,
  CURRENT_CASH,
  CURRENT_BANK_BALANCE,
  BASE_EXPENSE_OFFSET,
  Transaction,
} from "../data/mockData";

interface BudgetPlannerPageProps {
  expenses: Transaction[];
  incomes: Transaction[];
  dbAccounts?: any[];
  onNavigate: (page: string) => void;
}

export function BudgetPlannerPage({ expenses, incomes, dbAccounts = [], onNavigate }: BudgetPlannerPageProps) {
  const [showAllFixed, setShowAllFixed] = useState(false);
  const [showAllVariable, setShowAllVariable] = useState(false);
  const [showAllIncome, setShowAllIncome] = useState(false);

  const totalIncome = incomes.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = BASE_EXPENSE_OFFSET + expenses.reduce((s, e) => s + e.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

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
      : [
          { id: "mock-hdfc", AccountName: "HDFC Bank", balance: 140680 },
          { id: "mock-icici", AccountName: "ICICI Bank", balance: 15000 },
        ];
  }, [dbAccounts]);

  const stats = [
    { label: "Current Cash", value: formatINR(cashBalance), sub: "In Hand", icon: Wallet, color: "#16a34a", bg: "#dcfce7" },
    { label: "Current Bank Balance", value: formatINR(bankBalance), sub: "Total in Bank", icon: Landmark, color: "#2563eb", bg: "#dbeafe" },
    { label: "Total Income", value: formatINR(totalIncome), sub: "This Month", icon: TrendingUp, color: "#7c3aed", bg: "#ede9fe" },
    { label: "Total Expenses", value: formatINR(totalExpenses), sub: "This Month", icon: TrendingDown, color: "#ef4444", bg: "#fee2e2" },
    { label: "Net Savings", value: formatINR(netSavings), sub: "Income - Expenses", icon: DollarSign, color: "#16a34a", bg: "#dcfce7" },
    { label: "Savings Rate", value: `${savingsRate.toFixed(2)}%`, sub: "% of Income", icon: PieIcon, color: "#2563eb", bg: "#dbeafe" },
  ];

  const fixedRows = showAllFixed ? [...fixedExpensesData, ...fixedExpensesExtra] : fixedExpensesData;
  const variableRows = showAllVariable ? [...variableBudgetData, ...variableBudgetExtra] : variableBudgetData;
  const incomeRows = showAllIncome ? [...expectedIncomeData, ...expectedIncomeExtra] : expectedIncomeData;

  const thCls = "px-2 py-2.5 font-medium first:pl-5";

  return (
    <div className="p-8">
      <TopBar title="Budget Planner" subtitle="Overview of your budget, income and expenses" showFilters={false} />

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

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Fixed Expenses */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-semibold text-gray-800">Fixed Expenses</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-400">
                  <th className={thCls}>Expense</th>
                  <th className={thCls}>Budget</th>
                  <th className={thCls}>Due Date</th>
                  <th className={thCls}>Paid</th>
                  <th className={thCls}>Paid Amount</th>
                  <th className={thCls}>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {fixedRows.map((f) => (
                  <tr key={f.id} className="border-t border-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-700">{f.name}</td>
                    <td className="px-2 py-3 text-gray-600">{formatINR(f.budget)}</td>
                    <td className="px-2 py-3 text-gray-500">{f.due}</td>
                    <td className="px-2 py-3">
                      {f.status === "Paid" ? (
                        <Badge tone="green">✓ Paid</Badge>
                      ) : (
                        <Badge tone="amber">pending</Badge>
                      )}
                    </td>
                    <td className="px-2 py-3 text-gray-600">{formatINR(f.paid)}</td>
                    <td className="px-2 py-3 font-medium text-gray-700">{formatINR(f.budget - f.paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-5 py-3 text-center">
            <button
              type="button"
              onClick={() => setShowAllFixed((s) => !s)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {showAllFixed ? "Show Less" : "View All Fixed Expenses"}
            </button>
          </div>
        </div>

        {/* Variable Budget */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-semibold text-gray-800">Variable Budget</p>
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
                {variableRows.map((v) => {
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
                })}
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

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Expected Income */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-semibold text-gray-800">Expected Income</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-400">
                  <th className={thCls}>Source</th>
                  <th className={thCls}>Expected</th>
                  <th className={thCls}>Received</th>
                  <th className={thCls}>Remaining</th>
                  <th className={`${thCls} w-32`}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {incomeRows.map((r) => {
                  const pct = r.expected > 0 ? Math.round((r.received / r.expected) * 100) : 0;
                  return (
                    <tr key={r.id} className="border-t border-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-700">{r.source}</td>
                      <td className="px-2 py-3 text-gray-600">{formatINR(r.expected)}</td>
                      <td className="px-2 py-3 text-gray-600">{formatINR(r.received)}</td>
                      <td className="px-2 py-3 text-gray-600">{formatINR(r.expected - r.received)}</td>
                      <td className="px-2 py-3">
                        <ProgressBar pct={pct} color={pct === 0 ? "#d1d5db" : "#22c55e"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-5 py-3 text-center">
            <button
              type="button"
              onClick={() => setShowAllIncome((s) => !s)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {showAllIncome ? "Show Less" : "View All Income Sources"}
            </button>
          </div>
        </div>

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
