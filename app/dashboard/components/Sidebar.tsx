"use client";

import React from "react";
import {
  TrendingUp,
  PieChart as PieIcon,
  ArrowLeftRight,
  BarChart3,
  FileBarChart,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

interface SidebarProps {
  page: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ page, onNavigate, isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { key: "budget", label: "Budget Planner", icon: PieIcon },
    { key: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { key: "audit", label: "Category Audit", icon: BarChart3 },
    { key: "reports", label: "Reports", icon: FileBarChart },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`} 
        onClick={onClose}
      />

      <aside className={`fixed inset-y-0 left-0 z-50 flex h-full w-60 shrink-0 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:flex ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Brand Header */}
        <div className="flex items-center gap-2 px-5 py-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
            <TrendingUp size={18} strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold text-gray-900">Fin Tracker</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onNavigate(item.key);
                  if (onClose) onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={17} strokeWidth={2.2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Session & Logout */}
        <div className="border-t border-gray-100 p-4">
          {user && (
            <div className="mb-3 flex items-center gap-3 px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <UserIcon size={14} className="stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-gray-800">{user.username}</p>
                <p className="text-[10px] text-gray-400">Authenticated</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              if (onClose) onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={17} strokeWidth={2.2} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
