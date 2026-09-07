"use client";

import { RegionalRisk } from "@/lib/types";
import { RISK_LEVEL_COLORS, RISK_LEVEL_LABEL } from "@/lib/ui";
import WhyPopover from "./WhyPopover";
import { AlertTriangle, Eye, MapPin } from "lucide-react";

const ICONS = { regional: AlertTriangle, watch: Eye, isolated: MapPin };

export default function RegionalRiskPanel({ risks }: { risks: RegionalRisk[] }) {
  if (risks.length === 0) {
    return (
      <div className="text-sm text-slate-500 py-6 text-center">No emerging shortage signals detected right now.</div>
    );
  }

  return (
    <div className="space-y-2.5">
      {risks.map((r) => {
        const colors = RISK_LEVEL_COLORS[r.riskLevel];
        const Icon = ICONS[r.riskLevel];
        return (
          <div key={`${r.clusterId}:${r.medicineId}`} className={`rounded-lg border ${colors.border} ${colors.bg} p-3`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon size={15} className={colors.text} />
                <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
                  {RISK_LEVEL_LABEL[r.riskLevel]}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">score {r.score}</span>
            </div>
            <div className="mt-1.5 text-sm text-slate-200 font-medium">
              {r.medicineName} · {r.clusterName}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {r.facilitiesAtRisk.map((f) => (
                <span key={f.facilityId} className="text-[11px] rounded bg-slate-800/70 px-1.5 py-0.5 text-slate-300">
                  {f.facilityName} · {f.daysToStockout}d
                </span>
              ))}
            </div>
            <div className="mt-2">
              <WhyPopover title={`Why "${RISK_LEVEL_LABEL[r.riskLevel]}"?`} lines={r.reasoning} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
