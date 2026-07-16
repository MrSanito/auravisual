"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  FileText,
  Upload,
  Info,
  Loader2,
} from "lucide-react";
import { TopBar } from "./TopBar";
import { ImportTransactionsModal } from "./ImportTransactionsModal";
import { TypeBadge, ModeBadge, CategoryIcon, RowMenu } from "./Badge";
import { useAuth } from "@/app/context/AuthContext";
import {
  formatINR,
  expenseCategoryMeta,
  incomeCategoryMeta,
  paymentModes,
  accounts,
  Transaction,
} from "../data/mockData";

interface TransactionsPageProps {
  expenses: Transaction[];
  setExpenses: React.Dispatch<React.SetStateAction<Transaction[]>>;
  incomes: Transaction[];
  setIncomes: React.Dispatch<React.SetStateAction<Transaction[]>>;
  dbAccounts?: any[];
  dbCategories?: any[];
  onRefresh?: () => void;
}

export function TransactionsPage({
  expenses,
  incomes,
  dbAccounts = [],
  dbCategories = [],
  onRefresh,
}: TransactionsPageProps) {
  const { user } = useAuth();
  const [showExpenseForm, setShowExpenseForm] = useState(true);
  const [showIncomeForm, setShowIncomeForm] = useState(true);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showAllIncomes, setShowAllIncomes] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Account creation modal state
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    name: "",
    bank: "",
    balance: "",
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Category creation modal state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: "",
    type: "EXPENSE",
  });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [expForm, setExpForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Food",
    amount: "",
    mode: "UPI",
    account: "HDFC Bank",
    party: "",
    notes: "",
  });
  const [incForm, setIncForm] = useState({
    date: new Date().toISOString().split("T")[0],
    source: "Salary",
    amount: "",
    mode: "Bank Transfer",
    account: "HDFC Bank",
    party: "",
    notes: "",
  });

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

  const completedExpenses = expenses.filter(e => e.status !== "PENDING");
  const completedIncomes = incomes.filter(i => i.status !== "PENDING");

  const totalExpenses = completedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = completedIncomes.reduce((s, e) => s + e.amount, 0);

  const activeAccounts = React.useMemo(() => {
    return dbAccounts && dbAccounts.length > 0 
      ? dbAccounts.map((a) => a.AccountName) 
      : accounts;
  }, [dbAccounts]);

  const expenseCategories = React.useMemo(() => {
    return dbCategories && dbCategories.length > 0
      ? dbCategories.filter((c) => c.type === "EXPENSE").map((c) => c.name)
      : Object.keys(expenseCategoryMeta);
  }, [dbCategories]);

  const incomeCategories = React.useMemo(() => {
    return dbCategories && dbCategories.length > 0
      ? dbCategories.filter((c) => c.type === "INCOME").map((c) => c.name)
      : Object.keys(incomeCategoryMeta);
  }, [dbCategories]);

  // Sync form defaults with valid options to prevent submitting hidden default values
  React.useEffect(() => {
    if (activeAccounts && activeAccounts.length > 0) {
      if (!activeAccounts.includes(expForm.account)) {
        setExpForm(prev => ({ ...prev, account: activeAccounts[0] }));
      }
      if (!activeAccounts.includes(incForm.account)) {
        setIncForm(prev => ({ ...prev, account: activeAccounts[0] }));
      }
    }
    
    if (expenseCategories && expenseCategories.length > 0) {
      if (!expenseCategories.includes(expForm.category)) {
        setExpForm(prev => ({ ...prev, category: expenseCategories[0] }));
      }
    }
    
    if (incomeCategories && incomeCategories.length > 0) {
      if (!incomeCategories.includes(incForm.source)) {
        setIncForm(prev => ({ ...prev, source: incomeCategories[0] }));
      }
    }
  }, [activeAccounts, expenseCategories, incomeCategories]);

  const submitNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Unauthorized. Please log in first.");
      return;
    }

    if (!newCategoryForm.name || !newCategoryForm.name.trim()) {
      toast.error("Please enter a category name.");
      return;
    }

    setIsCreatingCategory(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          name: newCategoryForm.name.trim(),
          type: newCategoryForm.type,
        }),
      });

      if (response.ok) {
        const addedCat = await response.json();
        toast.success("Category created successfully!");
        setNewCategoryForm({ name: "", type: "EXPENSE" });
        setShowAddCategoryModal(false);
        
        // Auto-select the newly created category in the appropriate form
        if (addedCat.type === "EXPENSE") {
          setExpForm((f) => ({ ...f, category: addedCat.name }));
        } else {
          setIncForm((f) => ({ ...f, source: addedCat.name }));
        }
        
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to create category");
      }
    } catch (err) {
      console.error("Create category error:", err);
      toast.error("Failed to connect to the server");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const submitNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Unauthorized. Please log in first.");
      return;
    }

    if (!newAccountForm.name || !newAccountForm.name.trim()) {
      toast.error("Please enter an account name.");
      return;
    }

    if (!newAccountForm.bank || !newAccountForm.bank.trim()) {
      toast.error("Please enter a bank/institution name.");
      return;
    }

    const startingBalance = Number(newAccountForm.balance);
    if (newAccountForm.balance !== "" && (isNaN(startingBalance) || startingBalance < 0)) {
      toast.error("Starting balance must be a non-negative number.");
      return;
    }

    setIsCreatingAccount(true);

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          AccountName: newAccountForm.name.trim(),
          BankName: newAccountForm.bank.trim(),
          balance: startingBalance || 0,
        }),
      });

      if (response.ok) {
        const addedAcc = await response.json();
        toast.success("Account created successfully!");
        setNewAccountForm({ name: "", bank: "", balance: "" });
        setShowAddAccountModal(false);
        
        // Auto-select the new account
        setExpForm((f) => ({ ...f, account: addedAcc.AccountName }));
        setIncForm((f) => ({ ...f, account: addedAcc.AccountName }));
        
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to create account");
      }
    } catch (err) {
      console.error("Create account error:", err);
      toast.error("Failed to connect to the server");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Unauthorized. Please log in first.");
      return;
    }

    if (!expForm.date) {
      toast.error("Please select a valid date.");
      return;
    }

    if (!expForm.category || expForm.category === "ADD_NEW_CATEGORY") {
      toast.error("Please select a valid category.");
      return;
    }

    if (!expForm.account || expForm.account === "ADD_NEW_ACCOUNT") {
      toast.error("Please select a valid account.");
      return;
    }

    const amountNum = Number(expForm.amount);
    if (!expForm.amount || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }

    if (!expForm.party || !expForm.party.trim()) {
      toast.error("Please enter a valid merchant/party name.");
      return;
    }

    setIsAddingExpense(true);
    
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          accountName: expForm.account,
          categoryName: expForm.category,
          type: "EXPENSE",
          amount: expForm.amount,
          party: expForm.party.trim(),
          mode: expForm.mode,
          notes: expForm.notes,
          date: expForm.date,
        }),
      });

      if (response.ok) {
        toast.success("Expense added successfully!");
        setExpForm({
          date: new Date().toISOString().split("T")[0],
          category: "Food",
          amount: "",
          mode: "UPI",
          account: activeAccounts[0] || "HDFC Bank",
          party: "",
          notes: "",
        });
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to add expense");
      }
    } catch (err) {
      console.error("Submit expense error:", err);
      toast.error("Failed to connect to the server");
    } finally {
      setIsAddingExpense(false);
    }
  };

  const submitIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Unauthorized. Please log in first.");
      return;
    }

    if (!incForm.date) {
      toast.error("Please select a valid date.");
      return;
    }

    if (!incForm.source || incForm.source === "ADD_NEW_CATEGORY") {
      toast.error("Please select a valid category source.");
      return;
    }

    if (!incForm.account || incForm.account === "ADD_NEW_ACCOUNT") {
      toast.error("Please select a valid account.");
      return;
    }

    const amountNum = Number(incForm.amount);
    if (!incForm.amount || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }

    if (!incForm.party || !incForm.party.trim()) {
      toast.error("Please enter a valid party/payer name.");
      return;
    }

    setIsAddingIncome(true);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          accountName: incForm.account,
          categoryName: incForm.source,
          type: "INCOME",
          amount: incForm.amount,
          party: incForm.party.trim(),
          mode: incForm.mode,
          notes: incForm.notes,
          date: incForm.date,
        }),
      });

      if (response.ok) {
        toast.success("Income added successfully!");
        setIncForm({
          date: new Date().toISOString().split("T")[0],
          source: "Salary",
          amount: "",
          mode: "Bank Transfer",
          account: activeAccounts[0] || "HDFC Bank",
          party: "",
          notes: "",
        });
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to add income");
      }
    } catch (err) {
      console.error("Submit income error:", err);
      toast.error("Failed to connect to the server");
    } finally {
      setIsAddingIncome(false);
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
    }
  };

  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
  const labelCls = "mb-1.5 block text-xs font-medium text-gray-500";

  const visibleExpenses = showAllExpenses ? expenses : expenses.slice(0, 7);
  const visibleIncomes = showAllIncomes ? incomes : incomes.slice(0, 6);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <TopBar title="Transactions" subtitle="Record your income and expenses in one place." />
        <div className="mt-4 sm:mt-0 self-start sm:self-auto">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
          >
            <Upload size={16} /> Import Excel / CSV
          </button>
        </div>
      </div>

      {showImportModal && (
        <ImportTransactionsModal
          userId={user?.id}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Add forms */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Add Expense */}
        <div className="relative overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm">
          {isAddingExpense && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/75 backdrop-blur-[1px]">
              <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-red-600 animate-pulse">
                Updating...
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowExpenseForm((s) => !s)}
            className="flex w-full items-center justify-between bg-red-50 px-5 py-3.5"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-red-600">
              <ArrowDownCircle size={16} /> Add Expense
            </span>
            {showExpenseForm ? <ChevronUp size={16} className="text-red-400" /> : <ChevronDown size={16} className="text-red-400" />}
          </button>
          {showExpenseForm && (
            <form onSubmit={submitExpense} className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={expForm.date}
                    onChange={(e) => setExpForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    className={inputCls}
                    value={expForm.category}
                    onChange={(e) => {
                      if (e.target.value === "ADD_NEW_CATEGORY") {
                        setNewCategoryForm({ name: "", type: "EXPENSE" });
                        setShowAddCategoryModal(true);
                      } else {
                        setExpForm((f) => ({ ...f, category: e.target.value }));
                      }
                    }}
                  >
                    {expenseCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="ADD_NEW_CATEGORY" className="text-blue-600 font-semibold">+ Add New Category...</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className={inputCls}
                    value={expForm.amount}
                    onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Payment Mode</label>
                  <select
                    className={inputCls}
                    value={expForm.mode}
                    onChange={(e) => setExpForm((f) => ({ ...f, mode: e.target.value }))}
                  >
                    {paymentModes.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Account</label>
                  <select
                    className={inputCls}
                    value={expForm.account}
                    onChange={(e) => {
                      if (e.target.value === "ADD_NEW_ACCOUNT") {
                        setShowAddAccountModal(true);
                      } else {
                        setExpForm((f) => ({ ...f, account: e.target.value }));
                      }
                    }}
                  >
                    {activeAccounts.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value="ADD_NEW_ACCOUNT" className="text-blue-600 font-semibold">+ Add New Account...</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Party / Merchant</label>
                  <input
                    type="text"
                    placeholder="e.g. Swiggy"
                    className={inputCls}
                    value={expForm.party}
                    onChange={(e) => setExpForm((f) => ({ ...f, party: e.target.value }))}
                  />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className={labelCls}>Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Add notes"
                    className={inputCls}
                    value={expForm.notes}
                    onChange={(e) => setExpForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
              >
                <Plus size={15} /> Add Expense
              </button>
            </form>
          )}
        </div>

        {/* Add Income */}
        <div className="relative overflow-hidden rounded-xl border border-green-100 bg-white shadow-sm">
          {isAddingIncome && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/75 backdrop-blur-[1px]">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-green-700 animate-pulse">
                Updating...
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowIncomeForm((s) => !s)}
            className="flex w-full items-center justify-between bg-green-50 px-5 py-3.5"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <ArrowUpCircle size={16} /> Add Income
            </span>
            {showIncomeForm ? <ChevronUp size={16} className="text-green-500" /> : <ChevronDown size={16} className="text-green-500" />}
          </button>
          {showIncomeForm && (
            <form onSubmit={submitIncome} className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={incForm.date}
                    onChange={(e) => setIncForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    className={inputCls}
                    value={incForm.source}
                    onChange={(e) => {
                      if (e.target.value === "ADD_NEW_CATEGORY") {
                        setNewCategoryForm({ name: "", type: "INCOME" });
                        setShowAddCategoryModal(true);
                      } else {
                        setIncForm((f) => ({ ...f, source: e.target.value }));
                      }
                    }}
                  >
                    {incomeCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="ADD_NEW_CATEGORY" className="text-blue-600 font-semibold">+ Add New Category...</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className={inputCls}
                    value={incForm.amount}
                    onChange={(e) => setIncForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Receiving Mode</label>
                  <select
                    className={inputCls}
                    value={incForm.mode}
                    onChange={(e) => setIncForm((f) => ({ ...f, mode: e.target.value }))}
                  >
                    {paymentModes.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Account</label>
                  <select
                    className={inputCls}
                    value={incForm.account}
                    onChange={(e) => {
                      if (e.target.value === "ADD_NEW_ACCOUNT") {
                        setShowAddAccountModal(true);
                      } else {
                        setIncForm((f) => ({ ...f, account: e.target.value }));
                      }
                    }}
                  >
                    {activeAccounts.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value="ADD_NEW_ACCOUNT" className="text-blue-600 font-semibold">+ Add New Account...</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Party / Payer</label>
                  <input
                    type="text"
                    placeholder="e.g. ABC Pvt Ltd"
                    className={inputCls}
                    value={incForm.party}
                    onChange={(e) => setIncForm((f) => ({ ...f, party: e.target.value }))}
                  />
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className={labelCls}>Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Add notes"
                    className={inputCls}
                    value={incForm.notes}
                    onChange={(e) => setIncForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
              >
                <Plus size={15} /> Add Income
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Tables */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Expenses table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-red-600">
              <FileText size={16} /> Expenses
            </span>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total Expenses</p>
              <p className="text-lg font-bold text-red-500">{formatINR(totalExpenses)}</p>
            </div>
          </div>
          <div className="overflow-x-auto min-h-[180px]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-400">
                  <th className="px-5 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Category</th>
                  <th className="px-2 py-2 font-medium">Type</th>
                  <th className="px-2 py-2 font-medium">Party</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Mode</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {visibleExpenses.map((e) => {
                  const meta = expenseCategoryMeta[e.category] || expenseCategoryMeta.Others;
                  const isEditing = editingTxId === e.id;
                  return (
                    <tr key={e.id} className="border-t border-gray-50 hover:bg-gray-50/60">
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
                            <select
                              className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-full"
                              value={editForm.category}
                              onChange={(el) => setEditForm((f) => ({ ...f, category: el.target.value }))}
                            >
                              {expenseCategories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-3">
                            <TypeBadge type={meta.type} />
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
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                disabled={isSavingEdit}
                                onClick={() => saveEdit(e.id)}
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
                          <td className="whitespace-nowrap px-5 py-3 text-gray-500">{e.date}</td>
                          <td className="px-2 py-3">
                            <span className="flex items-center gap-2 font-medium text-gray-700">
                              <CategoryIcon meta={meta} /> {e.category}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <TypeBadge type={meta.type} />
                          </td>
                          <td className="px-2 py-3 text-gray-600">{e.party}</td>
                          <td className="whitespace-nowrap px-2 py-3 font-semibold text-red-500">
                            {formatINR(e.amount)}
                          </td>
                          <td className="px-2 py-3">
                            <ModeBadge mode={e.mode} />
                          </td>
                          <td className="px-2 py-3">
                            <RowMenu onDelete={() => setTxToDelete(e.id)} onEdit={() => startEditing(e)} />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 p-4">
            <button
              type="button"
              onClick={() => setShowAllExpenses((s) => !s)}
              className="w-full rounded-lg border border-red-200 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
            >
              {showAllExpenses ? "Show Less" : "View All Expenses"}
            </button>
          </div>
        </div>

        {/* Income table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <ArrowUpCircle size={16} /> Income
            </span>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total Income</p>
              <p className="text-lg font-bold text-green-600">{formatINR(totalIncome)}</p>
            </div>
          </div>
          <div className="overflow-x-auto min-h-[180px]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-400">
                  <th className="px-5 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Category</th>
                  <th className="px-2 py-2 font-medium">Type</th>
                  <th className="px-2 py-2 font-medium">Party</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Mode</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {visibleIncomes.map((inc) => {
                  const meta = incomeCategoryMeta[inc.category] || incomeCategoryMeta["Other Income"];
                  const isEditing = editingTxId === inc.id;
                  return (
                    <tr key={inc.id} className="border-t border-gray-50 hover:bg-gray-50/60">
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
                            <select
                              className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-full"
                              value={editForm.category}
                              onChange={(el) => setEditForm((f) => ({ ...f, category: el.target.value }))}
                            >
                              {incomeCategories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-3">
                            <TypeBadge type={meta.type} />
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
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                disabled={isSavingEdit}
                                onClick={() => saveEdit(inc.id)}
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
                          <td className="whitespace-nowrap px-5 py-3 text-gray-500">{inc.date}</td>
                          <td className="px-2 py-3">
                            <span className="flex items-center gap-2 font-medium text-gray-700">
                              <CategoryIcon meta={meta} /> {inc.category}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <TypeBadge type={meta.type} />
                          </td>
                          <td className="px-2 py-3 text-gray-600">{inc.party}</td>
                          <td className="whitespace-nowrap px-2 py-3 font-semibold text-green-600">
                            {formatINR(inc.amount)}
                          </td>
                          <td className="px-2 py-3">
                            <ModeBadge mode={inc.mode} />
                          </td>
                          <td className="px-2 py-3">
                            <RowMenu onDelete={() => setTxToDelete(inc.id)} onEdit={() => startEditing(inc)} />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 p-4">
            <button
              type="button"
              onClick={() => setShowAllIncomes((s) => !s)}
              className="w-full rounded-lg border border-green-200 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              {showAllIncomes ? "Show Less" : "View All Income"}
            </button>
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <Info size={18} className="mt-0.5 shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-semibold text-gray-800">About Transactions</p>
            <p className="mt-0.5 text-sm text-gray-500">
              All your income and expense entries are automatically reflected in Budget Planner and Category Audit.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
        >
          <Upload size={15} /> Upload Transactions
        </button>
      </div>

      {/* Premium Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Add New Account</h3>
            <p className="text-xs text-gray-500 mb-4">Create a new source of funds to track your balances.</p>
            
            <form onSubmit={submitNewAccount} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, Cash Wallet"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={newAccountForm.name}
                  onChange={(e) => setNewAccountForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Bank / Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC, Cash, ICICI"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={newAccountForm.bank}
                  onChange={(e) => setNewAccountForm(f => ({ ...f, bank: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Starting Balance (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={newAccountForm.balance}
                  onChange={(e) => setNewAccountForm(f => ({ ...f, balance: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAccountModal(false);
                    // Reset to default select options
                    setExpForm((f) => ({ ...f, account: activeAccounts[0] || "HDFC Bank" }));
                    setIncForm((f) => ({ ...f, account: activeAccounts[0] || "HDFC Bank" }));
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAccount}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreatingAccount && <Loader2 size={14} className="animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Add New Category</h3>
            <p className="text-xs text-gray-500 mb-4">Create a custom {newCategoryForm.type.toLowerCase()} category to classify your transactions.</p>
            
            <form onSubmit={submitNewCategory} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subscriptions, Gifts, Consulting"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={newCategoryForm.name}
                  onChange={(e) => setNewCategoryForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    // Reset to default select options
                    setExpForm((f) => ({ ...f, category: expenseCategories[0] || "Food" }));
                    setIncForm((f) => ({ ...f, source: incomeCategories[0] || "Salary" }));
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreatingCategory && <Loader2 size={14} className="animate-spin" />}
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {txToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2 font-sans">Confirm Delete</h3>
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
                className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
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
