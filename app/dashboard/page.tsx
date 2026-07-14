"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Sidebar } from "@/app/dashboard/components/Sidebar";
import { TransactionsPage } from "@/app/dashboard/components/TransactionsPage";
import { ReportsPage } from "@/app/dashboard/components/ReportsPage";
import { BudgetPlannerPage } from "@/app/dashboard/components/BudgetPlannerPage";
import { CategoryAuditPage } from "@/app/dashboard/components/CategoryAuditPage";
import { Transaction } from "@/app/dashboard/data/mockData";
import { Loader2, Menu, TrendingUp } from "lucide-react";

// Mappings helper to convert database format back to frontend Transaction representation
function mapDbTransactionToFrontend(dbTx: any): Transaction {
  const dateObj = new Date(dbTx.createdAt);
  const day = dateObj.getDate();
  
  // Format to standard e.g. "14 May 2025"
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateStr = `${String(day).padStart(2, '0')} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  
  // Parse description back into structured fields: "party - notes (mode)"
  let party = "Unknown";
  let notes = "";
  let mode = "UPI";
  
  const desc = dbTx.description || "";
  
  // Extract payment mode from parentheses if present at the end
  const modeMatch = desc.match(/\(([^)]+)\)$/);
  const cleanDesc = modeMatch ? desc.replace(/\s*\([^)]+\)$/, "") : desc;
  if (modeMatch) {
    mode = modeMatch[1];
  }
  
  // Extract party and notes split by hyphens
  const splitIndex = cleanDesc.indexOf(" - ");
  if (splitIndex !== -1) {
    party = cleanDesc.slice(0, splitIndex).trim();
    notes = cleanDesc.slice(splitIndex + 3).trim();
  } else {
    party = cleanDesc.trim();
  }
  
  return {
    id: dbTx.id,
    day,
    date: dateStr,
    category: dbTx.category?.name || "Others",
    party: party || "Unknown",
    amount: Number(dbTx.amount),
    mode,
    account: dbTx.account?.AccountName || "Cash Wallet",
    notes: notes || "—",
    kind: dbTx.type === "INCOME" ? "income" : "expense"
  };
}

export default function FinTrackerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState("transactions");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [dbAccounts, setDbAccounts] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Client-side authentication guard
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [accountsRes, transactionsRes, categoriesRes] = await Promise.all([
        fetch("/api/accounts", {
          headers: { "x-user-id": user.id }
        }),
        fetch("/api/transactions", {
          headers: { "x-user-id": user.id }
        }),
        fetch("/api/categories", {
          headers: { "x-user-id": user.id }
        })
      ]);
      
      if (!accountsRes.ok || !transactionsRes.ok || !categoriesRes.ok) {
        throw new Error("Failed to load dashboard data");
      }
      
      const accountsData = await accountsRes.json();
      const transactionsData = await transactionsRes.json();
      const categoriesData = await categoriesRes.json();
      
      setDbAccounts(accountsData);
      setDbCategories(categoriesData);
      
      // Map transactions to frontend format
      const mapped = transactionsData.map(mapDbTransactionToFrontend);
      
      setExpenses(mapped.filter((t: any) => t.kind === "expense"));
      setIncomes(mapped.filter((t: any) => t.kind === "income"));
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading || !user || isLoadingData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 font-sans antialiased text-gray-900">
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="relative text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Verifying Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-50 font-sans text-gray-900 md:flex-row">
      {/* Mobile Top Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shrink-0 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
            <TrendingUp size={16} strokeWidth={2.5} />
          </span>
          <span className="text-base font-bold text-gray-900">Fin Tracker</span>
        </div>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none"
        >
          <Menu size={20} />
        </button>
      </header>

      <Sidebar 
        page={page} 
        onNavigate={setPage} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 overflow-y-auto">
        {page === "transactions" && (
          <TransactionsPage
            expenses={expenses}
            setExpenses={setExpenses}
            incomes={incomes}
            setIncomes={setIncomes}
            dbAccounts={dbAccounts}
            dbCategories={dbCategories}
            onRefresh={fetchData}
          />
        )}
        {page === "reports" && (
          <ReportsPage expenses={expenses} incomes={incomes} dbAccounts={dbAccounts} />
        )}
        {page === "budget" && (
          <BudgetPlannerPage
            expenses={expenses}
            incomes={incomes}
            dbAccounts={dbAccounts}
            onNavigate={setPage}
          />
        )}
        {page === "audit" && (
          <CategoryAuditPage
            expenses={expenses}
            incomes={incomes}
            dbCategories={dbCategories}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
}
