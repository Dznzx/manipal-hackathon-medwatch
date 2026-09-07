"use client";

import { RiskTrendPoint } from "@/lib/types";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { TrendingUp } from "lucide-react";

export default function RiskTrendChart({ trend, currentDay }: { trend: RiskTrendPoint[]; currentDay: number }) {
  const peakRegional = Math.max(...trend.map((t) => t.regionalCount), 1);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp size={15} className="text-slate-400" />
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Projected Risk Trend</h3>
          <p className="text-[11px] text-slate-500">
            How today&apos;s signal could develop over the next {trend.length - 1} days if nothing changes — this is what &quot;a local
            problem becoming a wider disruption&quot; looks like as a curve, not just a slider.
          </p>
        </div>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="regionalFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
            <YAxis hide domain={[0, Math.max(3, peakRegional)]} />
            <ReferenceLine x={currentDay} stroke="#38bdf8" strokeDasharray="2 2" />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, fontSize: 11 }}
              labelFormatter={(d) => `Day ${d}`}
              formatter={(value) => [value, "Regional risks"]}
            />
            <Area type="monotone" dataKey="regionalCount" stroke="#ef4444" strokeWidth={1.5} fill="url(#regionalFill)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5">Red line = number of clusters flagged &quot;Regional Risk&quot; · dashed marker = current day</div>
    </div>
  );
}
