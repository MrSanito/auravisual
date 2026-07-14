"use client";

import React from "react";
import { Calendar, ChevronDown, Filter } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle: string;
  showFilters?: boolean;
  rightSlot?: React.ReactNode;
}

export function TopBar({ title, subtitle, showFilters = true, rightSlot = null }: TopBarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      {rightSlot ? (
        rightSlot
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Calendar size={15} className="text-gray-400" />
            01 May 2025 - 31 May 2025
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {showFilters && (
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Filter size={15} className="text-gray-400" />
              Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
