"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { Landmark, Plus, Loader2, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import { TopBar } from "./TopBar";
import { useAuth } from "@/app/context/AuthContext";
import { formatINR } from "../data/mockData";

interface AccountsPageProps {
  dbAccounts?: any[];
  onRefresh?: () => void;
}

export function AccountsPage({ dbAccounts = [], onRefresh }: AccountsPageProps) {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [deletingAccount, setDeletingAccount] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!accountName.trim() || !bankName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const opBal = Number(openingBalance) || 0;
    if (isNaN(opBal) || opBal < 0) {
      toast.error("Opening balance must be a non-negative number");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          AccountName: accountName.trim(),
          BankName: bankName.trim(),
          openingBalance: opBal,
        }),
      });

      if (response.ok) {
        toast.success("Account added successfully!");
        setAccountName("");
        setBankName("");
        setOpeningBalance("");
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to add account");
      }
    } catch (err) {
      console.error("Add account error:", err);
      toast.error("Connection failed");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingAccount) return;

    if (!editingAccount.AccountName.trim() || !editingAccount.BankName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const opBal = Number(editingAccount.openingBalance) || 0;
    if (isNaN(opBal) || opBal < 0) {
      toast.error("Opening balance must be a non-negative number");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          AccountName: editingAccount.AccountName.trim(),
          BankName: editingAccount.BankName.trim(),
          openingBalance: opBal,
        }),
      });

      if (response.ok) {
        toast.success("Account updated successfully!");
        setEditingAccount(null);
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to update account");
      }
    } catch (err) {
      console.error("Update account error:", err);
      toast.error("Connection failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletingAccount) return;

    if (deleteConfirmText !== deletingAccount.AccountName) {
      toast.error("Account name does not match. Deletion cancelled.");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/accounts/${deletingAccount.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user.id,
        },
      });

      if (response.ok) {
        toast.success("Account deleted successfully!");
        setDeletingAccount(null);
        setDeleteConfirmText("");
        if (onRefresh) onRefresh();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to delete account");
      }
    } catch (err) {
      console.error("Delete account error:", err);
      toast.error("Connection failed");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <TopBar title="Manage Bank Accounts" subtitle="Add new bank accounts, view starting balances, and monitor running balances." />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Add Account Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <Plus className="text-blue-600" size={18} />
            <h3 className="text-sm font-semibold text-gray-800">Add Bank Account</h3>
          </div>
          <form onSubmit={handleAddAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Account Name</label>
              <input
                type="text"
                placeholder="e.g. HDFC Salary Account"
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. HDFC"
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Opening Balance (₹)</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Landmark size={16} />}
              Add Account
            </button>
          </form>
        </div>

        {/* Accounts List */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
            <Landmark className="text-blue-600" size={18} />
            <h3 className="text-sm font-semibold text-gray-800">Your Accounts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-400">
                  <th className="px-5 py-3 font-medium">Account Name</th>
                  <th className="px-2 py-3 font-medium">Bank Name</th>
                  <th className="px-2 py-3 font-medium">Opening Balance</th>
                  <th className="px-2 py-3 font-medium">Current Balance</th>
                  <th className="px-2 py-3 font-medium">Created Date</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dbAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400 italic">No bank accounts configured yet.</td>
                  </tr>
                ) : (
                  dbAccounts.map((a) => (
                    <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-4 font-semibold text-gray-700">{a.AccountName}</td>
                      <td className="px-2 py-4 text-gray-600">{a.BankName}</td>
                      <td className="px-2 py-4 text-gray-600 font-medium">{formatINR(Number(a.openingBalance) || 0)}</td>
                      <td className="px-2 py-4 text-gray-800 font-bold">{formatINR(Number(a.balance) || 0)}</td>
                      <td className="px-2 py-4 text-gray-500 text-xs">
                        {new Date(a.createAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setEditingAccount(a)}
                            className="text-gray-400 hover:text-blue-600 transition"
                            title="Edit Account"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingAccount(a);
                              setDeleteConfirmText("");
                            }}
                            className="text-gray-400 hover:text-red-600 transition"
                            title="Delete Account"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">Edit Account</h2>
              <button onClick={() => setEditingAccount(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Account Name</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={editingAccount.AccountName}
                  onChange={(e) => setEditingAccount({ ...editingAccount, AccountName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bank Name</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={editingAccount.BankName}
                  onChange={(e) => setEditingAccount({ ...editingAccount, BankName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Opening Balance (₹)</label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={editingAccount.openingBalance}
                  onChange={(e) => setEditingAccount({ ...editingAccount, openingBalance: e.target.value })}
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                <AlertCircle size={24} />
              </div>
              <h2 className="text-xl font-bold text-red-900 mb-1">Delete Account?</h2>
              <p className="text-sm text-red-700 max-w-sm">
                This action cannot be undone. To confirm, please type the account name:
              </p>
              <p className="font-semibold text-red-900 mt-2 select-all">{deletingAccount.AccountName}</p>
            </div>
            <div className="p-6 space-y-5 bg-white">
              <input
                type="text"
                placeholder="Type account name to confirm"
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingAccount(null);
                    setDeleteConfirmText("");
                  }}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== deletingAccount.AccountName}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
