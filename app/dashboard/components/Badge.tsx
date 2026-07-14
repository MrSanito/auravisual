"use client";

import React, { useState } from "react";
import { MoreVertical, Trash2, LucideIcon } from "lucide-react";
import { CategoryMetaItem } from "../data/mockData";

interface BadgeProps {
  children: React.ReactNode;
  tone: "blue" | "amber" | "purple" | "green" | "red" | "gray";
}

export function Badge({ children, tone }: BadgeProps) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone] || tones.gray}`}
    >
      {children}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return <Badge tone={type === "Fixed" ? "blue" : "amber"}>{type}</Badge>;
}

export function ModeBadge({ mode }: { mode: string }) {
  const tone = mode === "UPI" ? "purple" : mode === "Bank Transfer" ? "blue" : mode === "Card" ? "amber" : "gray";
  return <Badge tone={tone}>{mode}</Badge>;
}

export function CategoryIcon({ meta }: { meta: CategoryMetaItem | { icon: LucideIcon; color: string; bg: string } }) {
  const Icon = meta.icon;
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      <Icon size={16} strokeWidth={2.2} />
    </span>
  );
}

export function RowMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            <button
              type="button"
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
