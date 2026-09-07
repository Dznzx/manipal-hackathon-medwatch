"use client";

import { Facility, Forecast } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/ui";

const STATUS_RANK: Record<Forecast["status"], number> = { critical: 3, "at-risk": 2, watch: 1, healthy: 0 };

export default function FacilityList({
  facilities,
  forecasts,
  selectedId,
  onSelect,
}: {
  facilities: Facility[];
  forecasts: Forecast[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const rows = facilities
    .map((f) => {
      const fcs = forecasts.filter((fc) => fc.facilityId === f.id);
      const worst = fcs.reduce<Forecast["status"]>((w, fc) => (STATUS_RANK[fc.status] > STATUS_RANK[w] ? fc.status : w), "healthy");
      const flagged = fcs.filter((fc) => fc.status !== "healthy").length;
      return { facility: f, worst, flagged };
    })
    .sort((a, b) => STATUS_RANK[b.worst] - STATUS_RANK[a.worst]);

  return (
    <div className="divide-y divide-slate-800">
      {rows.map(({ facility, worst, flagged }) => {
        const colors = STATUS_COLORS[worst];
        const isSelected = selectedId === facility.id;
        return (
          <button
            key={facility.id}
            onClick={() => onSelect(facility.id)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-800/60 transition-colors ${
              isSelected ? "bg-slate-800/80" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm text-slate-200 font-medium truncate">{facility.name}</div>
              <div className="text-[11px] text-slate-500">{facility.type} · {facility.clusterName}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {flagged > 0 && <span className="text-[10px] text-slate-500">{flagged} flagged</span>}
              <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
