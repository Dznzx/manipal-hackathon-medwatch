"use client";

import { Facility, Forecast, RedistributionSuggestion } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/ui";

const STATUS_RANK: Record<Forecast["status"], number> = { critical: 3, "at-risk": 2, watch: 1, healthy: 0 };

function worstStatus(forecasts: Forecast[]): Forecast["status"] {
  return forecasts.reduce<Forecast["status"]>((worst, f) => (STATUS_RANK[f.status] > STATUS_RANK[worst] ? f.status : worst), "healthy");
}

interface Props {
  facilities: Facility[];
  forecasts: Forecast[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  regionalClusterIds: Set<string>;
  suggestions?: RedistributionSuggestion[];
}

const VIEW = 100;
const PAD = 14;

// Simple equirectangular projection of real lat/lng onto the SVG plane — fine
// at this scale (a single district), and keeps the map dependency-free per the
// hackathon's scope guard against needing real GIS/map tiles.
function useProjection(facilities: Facility[]) {
  const lats = facilities.map((f) => f.lat);
  const lngs = facilities.map((f) => f.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;
  const span = Math.max(latSpan, lngSpan);

  return (f: { lat: number; lng: number }) => ({
    x: PAD + ((f.lng - minLng) / span) * (VIEW - PAD * 2),
    y: PAD + ((maxLat - f.lat) / span) * (VIEW - PAD * 2), // flip: higher lat = further up
  });
}

export default function FacilityMap({ facilities, forecasts, selectedId, onSelect, regionalClusterIds, suggestions = [] }: Props) {
  const project = useProjection(facilities);
  const positions = new Map(facilities.map((f) => [f.id, project(f)]));

  const clusters = new Map<string, { name: string; points: { x: number; y: number }[] }>();
  for (const f of facilities) {
    if (!clusters.has(f.clusterId)) clusters.set(f.clusterId, { name: f.clusterName, points: [] });
    clusters.get(f.clusterId)!.points.push(positions.get(f.id)!);
  }
  const facilityById = new Map(facilities.map((f) => [f.id, f]));

  return (
    <div className="relative w-full h-full">
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="w-full h-full">
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="0.3" />
        </pattern>
        <marker id="route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#38bdf8" />
        </marker>
      </defs>
      <rect width={VIEW} height={VIEW} fill="url(#grid)" />

      {[...clusters.entries()].map(([clusterId, c]) => {
        const xs = c.points.map((p) => p.x);
        const ys = c.points.map((p) => p.y);
        const minX = Math.min(...xs) - PAD;
        const maxX = Math.max(...xs) + PAD;
        const minY = Math.min(...ys) - PAD;
        const maxY = Math.max(...ys) + PAD;
        const isRegionalAlarm = regionalClusterIds.has(clusterId);
        return (
          <g key={clusterId}>
            <rect
              x={minX}
              y={minY}
              width={maxX - minX}
              height={maxY - minY}
              rx={10}
              fill={isRegionalAlarm ? "rgba(239,68,68,0.06)" : "rgba(148,163,184,0.05)"}
              stroke={isRegionalAlarm ? "rgba(239,68,68,0.35)" : "rgba(148,163,184,0.18)"}
              strokeDasharray={isRegionalAlarm ? "1.5 1.5" : undefined}
              strokeWidth={0.5}
            />
            <text x={minX + 2} y={minY + 4} fontSize={3.2} fill={isRegionalAlarm ? "#fca5a5" : "#94a3b8"} fontWeight={600}>
              {c.name.toUpperCase()}
            </text>
          </g>
        );
      })}

      {suggestions.map((s) => {
        const from = positions.get(s.fromFacilityId);
        const to = positions.get(s.toFacilityId);
        if (!from || !to) return null;
        return (
          <line
            key={s.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#38bdf8"
            strokeWidth={0.5}
            strokeDasharray="1.2 1"
            opacity={0.55}
            markerEnd="url(#route-arrow)"
          />
        );
      })}

      {facilities.map((f) => {
        const fcs = forecasts.filter((fc) => fc.facilityId === f.id);
        const status = worstStatus(fcs);
        const isSelected = selectedId === f.id;
        const rgb = { critical: "#ef4444", "at-risk": "#f97316", watch: "#fbbf24", healthy: "#10b981" }[status];
        const { x, y } = positions.get(f.id)!;
        return (
          <g key={f.id} onClick={() => onSelect(f.id)} className="cursor-pointer">
            {isSelected && <circle cx={x} cy={y} r={4.5} fill="none" stroke={rgb} strokeWidth={0.5} opacity={0.6} />}
            {(status === "critical" || status === "at-risk") && (
              <circle cx={x} cy={y} r={2.6} fill={rgb} opacity={0.25}>
                <animate attributeName="r" values="2.6;4.5;2.6" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={x} cy={y} r={2} fill={rgb} stroke="#0f172a" strokeWidth={0.4} />
            <text x={x} y={y - 3} fontSize={2.6} textAnchor="middle" fill="#cbd5e1" className="select-none">
              {f.name.split(" ")[0].replace(",", "")}
            </text>
          </g>
        );
      })}
    </svg>
      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-2.5 rounded-md bg-slate-950/70 px-2.5 py-1.5 text-[10px] text-slate-300 backdrop-blur-sm">
        {(["healthy", "watch", "at-risk", "critical"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[s].dot}`} />
            {s === "at-risk" ? "At Risk" : s[0].toUpperCase() + s.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
