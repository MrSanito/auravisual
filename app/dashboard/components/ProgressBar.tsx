import React from "react";

interface ProgressBarProps {
  pct: number;
  color: string;
}

export function ProgressBar({ pct, color }: ProgressBarProps) {
  // Prevent Infinity or NaN from displaying in the UI
  let cleanPct = pct;
  if (pct === Infinity) {
    cleanPct = 100;
  } else if (pct === -Infinity || isNaN(pct)) {
    cleanPct = 0;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, cleanPct))}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-medium text-gray-500">{cleanPct}%</span>
    </div>
  );
}
