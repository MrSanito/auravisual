import React from "react";

interface ProgressBarProps {
  pct: number;
  color: string;
}

export function ProgressBar({ pct, color }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-medium text-gray-500">{pct}%</span>
    </div>
  );
}
