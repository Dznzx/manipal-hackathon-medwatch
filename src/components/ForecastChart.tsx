"use client";

import { ComposedChart, Area, Line, ReferenceLine, ResponsiveContainer, YAxis } from "recharts";

interface Props {
  currentStock: number;
  avgDailyConsumption: number;
  consumptionStdDev: number;
  reorderLevel: number;
  horizonDays?: number;
}

// Projects stock forward under three consumption assumptions — average, average
// minus one std dev (slower/optimistic), average plus one std dev (faster/
// pessimistic) — and renders the spread as a shaded band. This is what makes
// forecast uncertainty visible at a glance instead of only as a confidence number.
export default function ForecastChart({ currentStock, avgDailyConsumption, consumptionStdDev, reorderLevel, horizonDays = 30 }: Props) {
  const data = Array.from({ length: horizonDays + 1 }, (_, day) => {
    const mid = Math.max(0, currentStock - avgDailyConsumption * day);
    const low = Math.max(0, currentStock - (avgDailyConsumption + consumptionStdDev) * day);
    const high = Math.max(0, currentStock - Math.max(0, avgDailyConsumption - consumptionStdDev) * day);
    return { day, mid, band: [low, high] as [number, number] };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
        <YAxis hide domain={[0, "dataMax"]} />
        <ReferenceLine y={reorderLevel} stroke="#64748b" strokeDasharray="2 2" strokeWidth={1} />
        <Area dataKey="band" stroke="none" fill="#38bdf8" fillOpacity={0.15} isAnimationActive={false} />
        <Line type="monotone" dataKey="mid" stroke="#38bdf8" strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
