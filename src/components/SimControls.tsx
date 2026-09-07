"use client";

import { SimParams } from "@/lib/types";
import { RotateCcw, Zap, Clock, CalendarClock } from "lucide-react";

interface Props {
  simDay: number;
  simParams: SimParams;
  onChange: (patch: { simDay?: number; consumptionSpikeMultiplier?: number; replenishmentDelayDays?: number }) => void;
  onReset: () => void;
}

export default function SimControls({ simDay, simParams, onChange, onReset }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-lg border border-slate-700/70 bg-slate-800/40 px-4 py-3">
      <div className="flex items-center gap-2 min-w-[220px]">
        <CalendarClock size={15} className="text-slate-400 shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Simulate forward</span>
            <span className="text-slate-200 font-medium">Day {simDay}</span>
          </div>
          <input
            type="range"
            min={0}
            max={45}
            value={simDay}
            onChange={(e) => onChange({ simDay: Number(e.target.value) })}
            className="w-full accent-sky-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-[220px]">
        <Zap size={15} className="text-slate-400 shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Consumption spike</span>
            <span className="text-slate-200 font-medium">{simParams.consumptionSpikeMultiplier.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={simParams.consumptionSpikeMultiplier}
            onChange={(e) => onChange({ consumptionSpikeMultiplier: Number(e.target.value) })}
            className="w-full accent-orange-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-[220px]">
        <Clock size={15} className="text-slate-400 shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Replenishment delay</span>
            <span className="text-slate-200 font-medium">+{simParams.replenishmentDelayDays}d</span>
          </div>
          <input
            type="range"
            min={0}
            max={14}
            value={simParams.replenishmentDelayDays}
            onChange={(e) => onChange({ replenishmentDelayDays: Number(e.target.value) })}
            className="w-full accent-red-500"
          />
        </div>
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-600/60 rounded-md px-3 py-1.5 ml-auto"
      >
        <RotateCcw size={13} />
        Reset simulation
      </button>
    </div>
  );
}
