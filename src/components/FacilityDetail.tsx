"use client";

import { Facility, Forecast, Medicine, StockRecord } from "@/lib/types";
import { STATUS_COLORS, confidenceLabel } from "@/lib/ui";
import StatusPill from "./StatusPill";
import WhyPopover from "./WhyPopover";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { X, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface Props {
  facility: Facility;
  medicines: Medicine[];
  stock: StockRecord[];
  forecasts: Forecast[];
  onClose: () => void;
}

const TREND_ICON = { worsening: TrendingDown, improving: TrendingUp, stable: Minus };

export default function FacilityDetail({ facility, medicines, stock, forecasts, onClose }: Props) {
  const rows = medicines
    .map((m) => {
      const record = stock.find((s) => s.facilityId === facility.id && s.medicineId === m.id);
      const forecast = forecasts.find((f) => f.facilityId === facility.id && f.medicineId === m.id);
      return record && forecast ? { medicine: m, record, forecast } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => (a.forecast.daysToStockout ?? 999) - (b.forecast.daysToStockout ?? 999));

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="h-full w-full max-w-md bg-slate-900 border-l border-slate-700 overflow-y-auto overflow-x-visible p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">{facility.type} · {facility.clusterName}</div>
            <h2 className="text-lg font-semibold text-slate-100">{facility.name}</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {rows.map(({ medicine, record, forecast }) => {
            const colors = STATUS_COLORS[forecast.status];
            const TrendIcon = TREND_ICON[forecast.trend];
            const stockPct = Math.min(100, (record.currentStock / (record.reorderLevel * 3)) * 100);
            const chartData = record.history.map((h) => ({ day: h.day, units: h.units }));

            return (
              <div key={medicine.id} className={`rounded-lg border border-slate-700/70 p-3 ${colors.bg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-100">{medicine.name}</span>
                  <StatusPill status={forecast.status} />
                </div>

                <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-500">Current stock</div>
                    <div className="text-slate-200 font-semibold">{record.currentStock} {medicine.unit}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Days to stockout</div>
                    <div className="text-slate-200 font-semibold flex items-center gap-1">
                      {forecast.daysToStockout ?? "—"}
                      <TrendIcon size={12} className={colors.text} />
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Avg daily use</div>
                    <div className="text-slate-200 font-semibold">{forecast.avgDailyConsumption} / day</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Replenishment lead time</div>
                    <div className="text-slate-200 font-semibold">{record.replenishmentLeadTimeDays} days</div>
                  </div>
                </div>

                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700/50 overflow-hidden">
                  <div className={`h-full ${colors.dot}`} style={{ width: `${stockPct}%` }} />
                </div>

                <div className="mt-2 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line type="monotone" dataKey="units" stroke="#94a3b8" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {record.pendingReplenishment && (
                  <div className="mt-1 text-[11px] text-sky-300">
                    Incoming: {record.pendingReplenishment.quantity} {medicine.unit} due in {record.pendingReplenishment.etaDay} days
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {confidenceLabel(forecast.confidence)} ({Math.round(forecast.confidence * 100)}%)
                  </span>
                  <WhyPopover title="Forecast confidence" lines={[forecast.confidenceReasoning]} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
