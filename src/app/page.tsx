"use client";

import { useCallback, useEffect, useState } from "react";
import { StateResponse } from "@/lib/api-types";
import Panel from "@/components/Panel";
import FacilityMap from "@/components/FacilityMap";
import FacilityList from "@/components/FacilityList";
import FacilityDetail from "@/components/FacilityDetail";
import RegionalRiskPanel from "@/components/RegionalRiskPanel";
import RedistributionPanel from "@/components/RedistributionPanel";
import SimControls from "@/components/SimControls";
import PriorityQueue from "@/components/PriorityQueue";
import RiskTrendChart from "@/components/RiskTrendChart";
import AskMedWatch from "@/components/AskMedWatch";
import { downloadTextFile } from "@/lib/report";
import { Activity, Map, AlertTriangle, Truck, ListChecks, FileDown, Loader2 } from "lucide-react";

export default function Home() {
  const [data, setData] = useState<StateResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json: StateResponse = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Couldn't load facility network. Check that the server is running and retry.");
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount — synchronizing with the server's world state,
    // not deriving state from props/state, so this is the intended use of
    // an effect rather than the anti-pattern this rule otherwise guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const update = useCallback(
    async (patch: object) => {
      setLoading(true);
      try {
        const res = await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json: StateResponse = await res.json();
        setData(json);
        setError(null);
      } catch {
        setError("Couldn't apply that change. Retry in a moment.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const downloadReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await fetch("/api/report", { method: "POST" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      downloadTextFile(`medwatch-situation-report-day${data?.simDay ?? 0}.txt`, json.report);
      setError(null);
    } catch {
      setError("Couldn't generate the report. Retry in a moment.");
    } finally {
      setReportLoading(false);
    }
  }, [data]);

  if (error && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
        <p>{error}</p>
        <button onClick={load} className="rounded-md bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700">
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 text-slate-400 text-sm">
        <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-600 border-t-sky-400 animate-spin" />
        Loading facility network…
      </div>
    );
  }

  const regionalClusterIds = new Set(
    data.regionalRisks.filter((r) => r.riskLevel === "regional").map((r) => r.clusterId)
  );
  const selectedFacility = data.facilities.find((f) => f.id === selectedId) ?? null;
  const regionalCount = data.regionalRisks.filter((r) => r.riskLevel === "regional").length;
  const criticalCount = data.forecasts.filter((f) => f.status === "critical").length;

  return (
    <div className="flex-1 flex flex-col max-w-[1500px] w-full mx-auto px-5 py-4 gap-4">
      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-3 py-2">{error}</div>
      )}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-sky-500/15 flex items-center justify-center">
            <Activity size={17} className="text-sky-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-100 leading-tight">MedWatch</h1>
            <p className="text-[11px] text-slate-500 leading-tight">Regional medicine shortage early warning</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-medium ${regionalCount > 0 ? "bg-red-500/10 text-red-300" : "bg-slate-800 text-slate-400"}`}>
            {regionalCount} regional risk{regionalCount === 1 ? "" : "s"}
          </span>
          <span className={`rounded-full px-2.5 py-1 font-medium ${criticalCount > 0 ? "bg-orange-500/10 text-orange-300" : "bg-slate-800 text-slate-400"}`}>
            {criticalCount} critical stock{criticalCount === 1 ? "" : "s"}
          </span>
          <button
            onClick={downloadReport}
            disabled={reportLoading}
            className="flex items-center gap-1.5 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-60 px-2.5 py-1 font-medium text-slate-300"
          >
            {reportLoading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
            AI situation report
          </button>
        </div>
      </header>

      <SimControls
        simDay={data.simDay}
        simParams={data.simParams}
        onChange={(patch) => update(patch)}
        onReset={() => update({ reset: true })}
      />

      <RiskTrendChart trend={data.riskTrend} currentDay={data.simDay} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
        <PriorityQueue risks={data.regionalRisks} suggestions={data.suggestions} />
        <AskMedWatch />
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1fr] gap-4 flex-1 min-h-0 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <div className="flex flex-col gap-4 min-h-0">
          <Panel title="Facility Map" subtitle="Dashed regions = active regional risk · blue arrows = suggested transfers" icon={<Map size={15} className="text-slate-400" />} className="h-[340px]" bodyClassName="p-2">
            <FacilityMap
              facilities={data.facilities}
              forecasts={data.forecasts}
              selectedId={selectedId}
              onSelect={setSelectedId}
              regionalClusterIds={regionalClusterIds}
              suggestions={data.suggestions}
            />
          </Panel>
          <Panel title="Facilities" subtitle={`${data.facilities.length} facilities in network`} icon={<ListChecks size={15} className="text-slate-400" />} className="flex-1 min-h-0" bodyClassName="p-0">
            <FacilityList facilities={data.facilities} forecasts={data.forecasts} selectedId={selectedId} onSelect={setSelectedId} />
          </Panel>
        </div>

        <Panel
          title="Regional Risk Alerts"
          subtitle="Isolated events vs. emerging regional patterns"
          icon={<AlertTriangle size={15} className="text-slate-400" />}
          className="min-h-0"
        >
          <RegionalRiskPanel risks={data.regionalRisks} />
        </Panel>

        <Panel
          title="Redistribution Suggestions"
          subtitle="Surplus → at-risk, ranked by urgency"
          icon={<Truck size={15} className="text-slate-400" />}
          className="min-h-0"
        >
          <RedistributionPanel suggestions={data.suggestions} />
        </Panel>
      </div>

      {selectedFacility && (
        <FacilityDetail
          facility={selectedFacility}
          medicines={data.medicines}
          stock={data.stock}
          forecasts={data.forecasts}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
