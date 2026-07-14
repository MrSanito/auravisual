"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatINR } from "../data/mockData";

interface TrendCardProps {
  title: string;
  total: number;
  color: string;
  gradId: string;
  data: { date: string; value: number }[];
}

export function TrendCard({ title, total, color, gradId, data }: TrendCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm min-w-0">
      <div className="mb-2 flex items-start justify-between">
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        <div className="text-right">
          <p className="text-[11px] text-gray-400">Total {title.split(" Over")[0]}</p>
          <p className="text-base font-bold" style={{ color }}>
            {formatINR(total)}
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v === 0 ? "\u20B90" : `\u20B9${v / 1000}K`)}
            width={42}
          />
          <Tooltip
            formatter={(v) => [formatINR(v as number), title.split(" Over")[0]]}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={{ r: 3.5, fill: color, strokeWidth: 1.5, stroke: "#fff" }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
