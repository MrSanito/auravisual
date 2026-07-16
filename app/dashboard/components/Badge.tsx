"use client";

import React, { useState, useRef } from "react";
import { MoreVertical, Trash2, Edit, LucideIcon } from "lucide-react";
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

export function RowMenu({ onDelete, onEdit }: { onDelete: () => void; onEdit?: () => void }) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If there is less than 120px of space below the row, open upwards
      setOpenUp(spaceBelow < 120);
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={containerRef} className={`relative ${open ? "z-50" : ""}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 z-50 w-32 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg ${openUp ? "bottom-full mb-1" : "mt-1"}`}>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100"
              >
                <Edit size={13} className="text-gray-500" /> Edit
              </button>
            )}
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
