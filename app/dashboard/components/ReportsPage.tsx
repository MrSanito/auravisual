"use client";

import React, { useMemo, useState } from "react";
import { Download, Printer, Search, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { TopBar } from "./TopBar";
import { TrendCard } from "./TrendCard";
import { Badge, ModeBadge, CategoryIcon } from "./Badge";
import {
  formatINR,
  expenseCategoryMeta,
  incomeCategoryMeta,
  paymentModes,
  accounts,
  extraTransactions,
  expensesOverTime,
  incomeOverTime,
  savingsOverTime,
  categoryBreakdown,
  BASE_EXPENSE_OFFSET,
  Transaction,
} from "../data/mockData";

interface ReportsPageProps {
  expenses: Transaction[];
  incomes: Transaction[];
  dbAccounts?: any[];
}

export function ReportsPage({ expenses, incomes, dbAccounts = [] }: ReportsPageProps) {
  const totalExpenses = BASE_EXPENSE_OFFSET + expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomes.reduce((s, e) => s + e.amount, 0);
  const totalSavings = totalIncome - totalExpenses;

  const activeAccounts = useMemo(() => {
    return dbAccounts && dbAccounts.length > 0
      ? dbAccounts.map((a) => a.AccountName)
      : accounts;
  }, [dbAccounts]);

  const allTransactions = useMemo(() => {
    const expRows = expenses.map((e) => ({ ...e, kind: "expense" }));
    const incRows = incomes.map((i) => ({ ...i, kind: "income" }));
    const combined = [...expRows, ...incRows];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, incomes]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Type");
  const [categoryFilter, setCategoryFilter] = useState("All Category");
  const [accountFilter, setAccountFilter] = useState("All Account");
  const [modeFilter, setModeFilter] = useState("All Mode");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const categoryOptions = useMemo(() => {
    const unique = new Set<string>();
    allTransactions.forEach((t) => {
      if (t.category) {
        unique.add(t.category);
      }
    });
    return ["All Category", ...Array.from(unique)];
  }, [allTransactions]);

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      const matchesSearch =
        !search ||
        (t.category || "").toLowerCase().includes(search.toLowerCase()) ||
        t.party.toLowerCase().includes(search.toLowerCase()) ||
        (t.notes || "").toLowerCase().includes(search.toLowerCase());
      const matchesType =
        typeFilter === "All Type" || (typeFilter === "Expense" ? t.kind === "expense" : t.kind === "income");
      const matchesCategory = categoryFilter === "All Category" || (t.category || "") === categoryFilter;
      const matchesAccount = accountFilter === "All Account" || t.account === accountFilter;
      const matchesMode = modeFilter === "All Mode" || t.mode === modeFilter;
      return matchesSearch && matchesType && matchesCategory && matchesAccount && matchesMode;
    });
  }, [allTransactions, search, typeFilter, categoryFilter, accountFilter, modeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("All Type");
    setCategoryFilter("All Category");
    setAccountFilter("All Account");
    setModeFilter("All Mode");
    setPage(1);
  };

  const changeFilter = (setter: (val: string) => void) => (val: string) => {
    setter(val);
    setPage(1);
  };

  const exportCSV = () => {
    const header = ["Date", "Type", "Category", "Party", "Amount", "Mode", "Account", "Notes"];
    const rows = filtered.map((t) => [
      t.date,
      t.kind === "expense" ? "Expense" : "Income",
      t.category,
      t.party,
      t.amount,
      t.mode,
      t.account,
      t.notes || "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transaction-statement.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      /* no-op in sandboxed environments */
    }
  };

  const selectCls =
    "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    const max = 5;
    let start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + max - 1);
    start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [safePage, totalPages]);

  return (
    <div className="p-8">
      <TopBar title="Reports" subtitle="Analyze your financial data with detailed reports and insights." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <TrendCard title="Expenses Over Time" total={totalExpenses} color="#ef4444" gradId="gradExp" data={expensesOverTime} />
        <TrendCard title="Income Over Time" total={totalIncome} color="#22c55e" gradId="gradInc" data={incomeOverTime} />
        <TrendCard title="Savings Over Time" total={totalSavings} color="#3b82f6" gradId="gradSav" data={savingsOverTime} />

        {/* Donut */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm min-w-0">
          <p className="mb-2 text-sm font-semibold text-gray-700">Expenses by Category (This Period)</p>
          <div className="relative mx-auto h-[150px] w-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {categoryBreakdown.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [formatINR(v as number), n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-bold text-gray-900">{formatINR(totalExpenses)}</p>
              <p className="text-[10px] text-gray-400">Total Expenses</p>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {categoryBreakdown.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
                <span className="font-medium text-gray-500">
                  {formatINR(c.value)} ({c.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statement */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-base font-semibold text-gray-800">Transaction Statement</p>
            <p className="text-sm text-gray-400">All income and expenses between 01 May 2025 and 31 May 2025</p>
          </div>
          <div className="flex gap-2 no-print">
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Download size={14} /> Export (CSV)
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3 no-print">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => changeFilter(setSearch)(e.target.value)}
              placeholder="Search by category, party, notes..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select className={selectCls} value={typeFilter} onChange={(e) => changeFilter(setTypeFilter)(e.target.value)}>
            <option>All Type</option>
            <option>Expense</option>
            <option>Income</option>
          </select>
          <select className={selectCls} value={categoryFilter} onChange={(e) => changeFilter(setCategoryFilter)(e.target.value)}>
            {categoryOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className={selectCls} value={accountFilter} onChange={(e) => changeFilter(setAccountFilter)(e.target.value)}>
            <option>All Account</option>
            {activeAccounts.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select className={selectCls} value={modeFilter} onChange={(e) => changeFilter(setModeFilter)(e.target.value)}>
            <option>All Mode</option>
            {paymentModes.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-gray-400">
                <th className="px-5 py-2.5 font-medium">Date</th>
                <th className="px-2 py-2.5 font-medium">Type</th>
                <th className="px-2 py-2.5 font-medium">Category / Source</th>
                <th className="px-2 py-2.5 font-medium">Party / Payer</th>
                <th className="px-2 py-2.5 font-medium">Amount (₹)</th>
                <th className="px-2 py-2.5 font-medium">Mode</th>
                <th className="px-2 py-2.5 font-medium">Account</th>
                <th className="px-2 py-2.5 font-medium">Notes</th>
                <th className="px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t) => {
                const isExpense = t.kind === "expense";
                const meta = isExpense
                  ? expenseCategoryMeta[t.category] || expenseCategoryMeta.Others
                  : incomeCategoryMeta[t.category] || incomeCategoryMeta["Other Income"];
                return (
                  <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-500">{t.date}</td>
                    <td className="px-2 py-3">
                      <Badge tone={isExpense ? "red" : "green"}>{isExpense ? "Expense" : "Income"}</Badge>
                    </td>
                    <td className="px-2 py-3">
                      <span className="flex items-center gap-2 font-medium text-gray-700">
                        <CategoryIcon meta={meta} /> {t.category}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-gray-600">{t.party}</td>
                    <td
                      className={`whitespace-nowrap px-2 py-3 font-semibold ${isExpense ? "text-red-500" : "text-green-600"}`}
                    >
                      {isExpense ? "-" : "+"}
                      {formatINR(t.amount)}
                    </td>
                    <td className="px-2 py-3">
                      <ModeBadge mode={t.mode} />
                    </td>
                    <td className="px-2 py-3 text-gray-500">{t.account}</td>
                    <td className="px-2 py-3 text-gray-400">{t.notes || "\u2014"}</td>
                    <td className="px-2 py-3 text-gray-300">
                      <MoreHorizontal size={15} />
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-400">
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 no-print">
          <p className="text-sm text-gray-400">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1} to{" "}
            {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} transactions
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            {pageNumbers.map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setPage(n)}
                className={`h-8 w-8 rounded-lg text-sm font-medium ${
                  n === safePage ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 disabled:opacity-40 hover:bg-gray-50"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
