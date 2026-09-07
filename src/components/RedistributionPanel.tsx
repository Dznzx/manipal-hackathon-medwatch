"use client";

import { useState } from "react";
import { RedistributionSuggestion } from "@/lib/types";
import WhyPopover from "./WhyPopover";
import { ArrowRight, CheckCircle2, Truck } from "lucide-react";

export default function RedistributionPanel({ suggestions }: { suggestions: RedistributionSuggestion[] }) {
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  if (suggestions.length === 0) {
    return <div className="text-sm text-slate-500 py-6 text-center">No redistribution opportunities identified right now.</div>;
  }

  return (
    <div className="space-y-2.5">
      {suggestions.map((s) => {
        const isAccepted = accepted.has(s.id);
        return (
          <div key={s.id} className="rounded-lg border border-slate-700/70 bg-slate-800/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-sm text-slate-200 font-medium min-w-0">
                <Truck size={14} className="text-sky-400 shrink-0" />
                <span className="truncate">{s.fromFacilityName}</span>
                <ArrowRight size={13} className="text-slate-500 shrink-0" />
                <span className="truncate">{s.toFacilityName}</span>
              </div>
              <span className="text-[11px] shrink-0 rounded-full bg-sky-500/10 text-sky-300 px-2 py-0.5 font-medium">
                urgency {s.urgencyScore}
              </span>
            </div>
            <div className="mt-1.5 text-xs text-slate-400">
              {s.medicineName} · <span className="text-slate-300 font-medium">{s.suggestedQuantity} units</span> · {s.distance} km away
            </div>
            {s.withoutTransferDays !== null && (
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <span className="rounded bg-red-500/10 text-red-300 px-1.5 py-0.5">Without: {s.withoutTransferDays}d</span>
                <ArrowRight size={11} className="text-slate-600" />
                <span className="rounded bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5">With: ~{s.withTransferDays}d</span>
                <span className="text-slate-500">(+{s.extraDaysGained}d gained)</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <WhyPopover title="Why this transfer?" lines={s.reasoning} />
              <button
                onClick={() => setAccepted((prev) => new Set(prev).add(s.id))}
                disabled={isAccepted}
                className={`flex items-center gap-1 text-[11px] rounded-md px-2 py-1 font-medium transition-colors ${
                  isAccepted ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700/60 text-slate-200 hover:bg-slate-600/60"
                }`}
              >
                <CheckCircle2 size={12} />
                {isAccepted ? "Flagged for action" : "Flag for action"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
