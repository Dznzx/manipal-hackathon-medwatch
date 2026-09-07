"use client";

import { RegionalRisk, RedistributionSuggestion } from "@/lib/types";
import WhyPopover from "./WhyPopover";
import { AlertTriangle, Truck, ListOrdered } from "lucide-react";

interface QueueItem {
  id: string;
  kind: "alert" | "transfer";
  score: number;
  title: string;
  subtitle: string;
  reasoning: string[];
}

export default function PriorityQueue({
  risks,
  suggestions,
}: {
  risks: RegionalRisk[];
  suggestions: RedistributionSuggestion[];
}) {
  const alertItems: QueueItem[] = risks
    .filter((r) => r.riskLevel === "regional")
    .map((r) => ({
      id: `alert:${r.clusterId}:${r.medicineId}`,
      kind: "alert",
      score: r.score,
      title: `Investigate ${r.medicineName} shortage forming in ${r.clusterName}`,
      subtitle: `${r.facilitiesAtRisk.length} facilities trending together`,
      reasoning: r.reasoning,
    }));

  const transferItems: QueueItem[] = suggestions.slice(0, 6).map((s) => ({
    id: `transfer:${s.id}`,
    kind: "transfer",
    score: s.urgencyScore,
    title: `Move ${s.suggestedQuantity} ${s.medicineName} from ${s.fromFacilityName} to ${s.toFacilityName}`,
    subtitle: s.withoutTransferDays !== null ? `Extends cover from ${s.withoutTransferDays}d to ~${s.withTransferDays}d` : `${s.distance} km away`,
    reasoning: s.reasoning,
  }));

  const items = [...alertItems, ...transferItems].sort((a, b) => b.score - a.score).slice(0, 6);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-500">
        No priority actions right now — the network looks stable.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <ListOrdered size={15} className="text-slate-400" />
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Priority Action Queue</h3>
          <p className="text-[11px] text-slate-500">Regional alerts and redistribution moves, ranked together by urgency</p>
        </div>
      </div>
      <ol className="divide-y divide-slate-800">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-start gap-3 px-4 py-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
              {i + 1}
            </span>
            <span className="mt-0.5 shrink-0">
              {item.kind === "alert" ? (
                <AlertTriangle size={14} className="text-red-400" />
              ) : (
                <Truck size={14} className="text-sky-400" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-slate-200 truncate">{item.title}</div>
              <div className="text-[11px] text-slate-500">{item.subtitle}</div>
            </div>
            <span className="shrink-0 text-[11px] font-medium text-slate-400 mt-0.5">score {item.score}</span>
            <div className="shrink-0 mt-0.5">
              <WhyPopover title="Why this priority?" lines={item.reasoning} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
