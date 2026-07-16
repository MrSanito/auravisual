"use client";

import React, { useMemo, useState } from "react";
import { Download, Printer, Search, ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { TopBar } from "./TopBar";
import { TrendCard } from "./TrendCard";
import { Badge, ModeBadge, CategoryIcon, RowMenu } from "./Badge";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "react-toastify";
import {
  formatINR,
  expenseCategoryMeta,
  incomeCategoryMeta,
  paymentModes,
  accounts,
  extraTransactions,
  Transaction,
} from "../data/mockData";

interface ReportsPageProps {
  expenses: Transaction[];
  incomes: Transaction[];
  dbAccounts?: any[];
  dbCategories?: any[];
  onRefresh?: () => void;
}

export function ReportsPage({
  expenses,
  incomes,
  dbAccounts = [],
  dbCategories = [],
  onRefresh,
}: ReportsPageProps) {
  const { user } = useAuth();

  // State hooks for inline editing and deletion modal
  const [editingTxId, setEditingTxId] = useState<string | number | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    date: "",
    category: "",
    amount: "",
    mode: "",
    account: "",
    party: "",
    notes: "",
  });
  const [txToDelete, setTxToDelete] = useState<string | number | null>(null);

  // Helper to parse dates like "14 May 2025" to "2025-05-14"
  const parseDateToInputFormat = (dateStr: string): string => {
    try {
      const parts = dateStr.split(" ");
      if (parts.length < 3) return new Date().toISOString().split("T")[0];
      const day = parts[0];
      const monthName = parts[1];
      const year = parts[2];
      const months: Record<string, string> = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
        Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
      };
      const month = months[monthName] || "01";
      return `${year}-${month}-${day.padStart(2, "0")}`;
    } catch (e) {
      return new Date().toISOString().split("T")[0];
    }
  };

  const startEditing = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditForm({
      date: parseDateToInputFormat(tx.date),
      category: tx.category,
      amount: String(tx.amount),
      mode: tx.mode,
      account: tx.account,
      party: tx.party,
      notes: tx.notes === "—" ? "" : tx.notes,
    });
  };

  const cancelEditing = () => {
    setEditingTxId(null);
  };

  const saveEdit = async (id: string | number) => {
    if (!user) {
      toast.error("Unauthorized. Please log in first.");
      return;
    }

    if (!editForm.date) {
      toast.error("Please select a valid date.");
      return;
    }

    if (!editForm.category) {
      toast.error("Please select a valid category.");
      return;
    }

    if (!editForm.account) {
      toast.error("Please select a valid account.");
      return;
    }

    const amountNum = Number(editForm.amount);
    if (!editForm.amount || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }

    if (!editForm.party || !editForm.party.trim()) {
      toast.error("Please enter a valid merchant/party name.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          accountName: editForm.account,
          categoryName: editForm.category,
          amount: editForm.amount,
          party: editForm.party.trim(),
          mode: editForm.mode,
          notes: editForm.notes,
          date: editForm.date,
        }),
      });

      if (response.ok) {
        toast.success("Transaction updated successfully!");
        setEditingTxId(null);
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to update transaction");
      }
    } catch (err) {
      console.error("Save transaction edit error:", err);
      toast.error("Failed to connect to the server");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user.id,
        },
      });

      if (response.ok) {
        toast.success("Transaction deleted successfully!");
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to delete transaction");
      }
    } catch (err) {
      console.error("Delete transaction error:", err);
      toast.error("Failed to connect to the server");
    }
  };

  const expenseCategories = dbCategories && dbCategories.length > 0
    ? dbCategories.filter((c) => c.type === "EXPENSE").map((c) => c.name)
    : Object.keys(expenseCategoryMeta);

  const incomeCategories = dbCategories && dbCategories.length > 0
    ? dbCategories.filter((c) => c.type === "INCOME").map((c) => c.name)
    : Object.keys(incomeCategoryMeta);
  const completedExpenses = expenses.filter(e => e.status !== "PENDING");
  const completedIncomes = incomes.filter(i => i.status !== "PENDING");

  const totalExpenses = completedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = completedIncomes.reduce((s, e) => s + e.amount, 0);
  const totalSavings = totalIncome - totalExpenses;

  // Dynamically compute expenses over time grouped by date
  const expensesOverTime = useMemo(() => {
    const dateMap: Record<string, number> = {};
    completedExpenses.forEach((e) => {
      const parts = e.date.split(" ");
      const key = parts.slice(0, 2).join(" ");
      dateMap[key] = (dateMap[key] || 0) + e.amount;
    });
    const mapped = Object.entries(dateMap).map(([date, value]) => ({ date, value }));
    return mapped.sort((a, b) => new Date(a.date + " 2025").getTime() - new Date(b.date + " 2025").getTime());
  }, [completedExpenses]);

  // Dynamically compute income over time grouped by date
  const incomeOverTime = useMemo(() => {
    const dateMap: Record<string, number> = {};
    completedIncomes.forEach((i) => {
      const parts = i.date.split(" ");
      const key = parts.slice(0, 2).join(" ");
      dateMap[key] = (dateMap[key] || 0) + i.amount;
    });
    const mapped = Object.entries(dateMap).map(([date, value]) => ({ date, value }));
    return mapped.sort((a, b) => new Date(a.date + " 2025").getTime() - new Date(b.date + " 2025").getTime());
  }, [completedIncomes]);

  // Dynamically compute savings over time grouped by date
  const savingsOverTime = useMemo(() => {
    const dateMap: Record<string, number> = {};
    incomes.forEach((i) => {
      const parts = i.date.split(" ");
      const key = parts.slice(0, 2).join(" ");
      dateMap[key] = (dateMap[key] || 0) + i.amount;
    });
    expenses.forEach((e) => {
      const parts = e.date.split(" ");
      const key = parts.slice(0, 2).join(" ");
      dateMap[key] = (dateMap[key] || 0) - e.amount;
    });
    const mapped = Object.entries(dateMap).map(([date, value]) => ({ date, value }));
    return mapped.sort((a, b) => new Date(a.date + " 2025").getTime() - new Date(b.date + " 2025").getTime());
  }, [expenses, incomes]);

  // Dynamically compute category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    let total = 0;
    const map: Record<string, number> = {};
    completedExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    const data = Object.entries(map)
      .map(([name, value]) => {
        const meta = expenseCategoryMeta[name] || expenseCategoryMeta.Others;
        return {
          name,
          value,
          pct: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
          color: meta?.color || "#64748b",
        };
      })
      .sort((a, b) => b.value - a.value);
    return data;
  }, [completedExpenses, totalExpenses]);

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
  const [expandedBank, setExpandedBank] = useState<string | null>(null);

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
    <div className="p-4 md:p-8">
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
                  {formatINR(c.value)} ({c.pct.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bank Account Summaries */}
      <div className="mt-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">Bank Accounts Summary</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {dbAccounts.map((account) => {
            const accName = account.AccountName;
            
            // Calculate total inflow (income) and outflow (expenses) for this specific account
            const accountIncomes = completedIncomes.filter((i) => i.account === accName);
            const accountExpenses = completedExpenses.filter((e) => e.account === accName);
            
            const totalInflow = accountIncomes.reduce((sum, i) => sum + i.amount, 0);
            const totalOutflow = accountExpenses.reduce((sum, e) => sum + e.amount, 0);
            
            const accountTxs = allTransactions.filter((t) => t.account === accName);
            const isExpanded = expandedBank === account.id;

            return (
              <div key={account.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{accName}</p>
                      <p className="text-[10px] text-gray-400">{account.BankName}</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {accountTxs.length} txs
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <p className="text-gray-400">Opening Balance</p>
                      <p className="font-semibold text-gray-700">{formatINR(Number(account.openingBalance) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Current Balance</p>
                      <p className="font-bold text-gray-900">{formatINR(Number(account.balance) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-green-600">Total Inflow (+)</p>
                      <p className="font-semibold text-green-600">+{formatINR(totalInflow)}</p>
                    </div>
                    <div>
                      <p className="text-red-500">Total Outflow (-)</p>
                      <p className="font-semibold text-red-500">-{formatINR(totalOutflow)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-50 pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setExpandedBank(isExpanded ? null : account.id)}
                    className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                  >
                    {isExpanded ? "Hide Transactions" : "View Transactions"}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 max-h-48 overflow-y-auto space-y-2 pr-1 border-t border-gray-50 pt-3">
                      {accountTxs.length === 0 ? (
                        <p className="text-center text-[11px] text-gray-400 italic">No transactions with this bank.</p>
                      ) : (
                        accountTxs.map((t) => {
                          const isExpense = t.kind === "expense";
                          return (
                            <div key={t.id} className="flex justify-between items-center text-[11px] bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="font-semibold text-gray-700 truncate">{t.party}</p>
                                <p className="text-[9px] text-gray-400">{t.date} • {t.category}</p>
                              </div>
                              <span className={`font-bold shrink-0 ${isExpense ? "text-red-500" : "text-green-600"}`}>
                                {isExpense ? "-" : "+"}{formatINR(t.amount)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

        <div className="overflow-x-auto min-h-[180px]">
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
                const isEditing = editingTxId === t.id;
                return (
                  <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    {isEditing ? (
                      <>
                        <td className="px-5 py-3">
                          <input
                            type="date"
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-full"
                            value={editForm.date}
                            onChange={(el) => setEditForm((f) => ({ ...f, date: el.target.value }))}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <Badge tone={isExpense ? "red" : "green"}>{isExpense ? "Expense" : "Income"}</Badge>
                        </td>
                        <td className="px-2 py-3">
                          <select
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-full"
                            value={editForm.category}
                            onChange={(el) => setEditForm((f) => ({ ...f, category: el.target.value }))}
                          >
                            {(isExpense ? expenseCategories : incomeCategories).map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          <input
                            type="text"
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-full"
                            value={editForm.party}
                            onChange={(el) => setEditForm((f) => ({ ...f, party: el.target.value }))}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <input
                            type="number"
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-full"
                            value={editForm.amount}
                            onChange={(el) => setEditForm((f) => ({ ...f, amount: el.target.value }))}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <select
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-full"
                            value={editForm.mode}
                            onChange={(el) => setEditForm((f) => ({ ...f, mode: el.target.value }))}
                          >
                            {paymentModes.map((m) => (
                              <option key={m}>{m}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          <select
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-full"
                            value={editForm.account}
                            onChange={(el) => setEditForm((f) => ({ ...f, account: el.target.value }))}
                          >
                            {activeAccounts.map((a) => (
                              <option key={a} value={a}>{a}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          <input
                            type="text"
                            placeholder="Optional notes"
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-full"
                            value={editForm.notes}
                            onChange={(el) => setEditForm((f) => ({ ...f, notes: el.target.value }))}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              disabled={isSavingEdit}
                              onClick={() => saveEdit(t.id)}
                              className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 shadow-sm disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
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
                        <td className="px-2 py-3">
                          <RowMenu onDelete={() => setTxToDelete(t.id)} onEdit={() => startEditing(t)} />
                        </td>
                      </>
                    )}
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
      {/* Delete Confirmation Modal */}
      {txToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2 font-sans font-sans">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-5 font-sans">
              Are you sure you want to delete this transaction? This action will revert the account balance change and cannot be undone.
            </p>
            
            <div className="flex items-center justify-end gap-2.5 font-sans">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(txToDelete);
                  setTxToDelete(null);
                }}
                className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 font-sans"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
