"use client";

import { useEffect, useRef, useState } from "react";
import { SimParams } from "@/lib/types";
import { RotateCcw, Zap, Clock, CalendarClock } from "lucide-react";

type Patch = { simDay?: number; consumptionSpikeMultiplier?: number; replenishmentDelayDays?: number };

interface Props {
  simDay: number;
  simParams: SimParams;
  onChange: (patch: Patch) => void;
  onReset: () => void;
}

const COMMIT_DELAY_MS = 200;

export default function SimControls({ simDay, simParams, onChange, onReset }: Props) {
  // Dragging a range slider fires onChange on every tick. Committing each tick
  // straight to the server used to mean a burst of overlapping POST requests
  // (and a flickery opacity dip on every step) while the user was still mid-drag.
  // These local "draft" values track the slider visually in real time, while the
  // actual network update is debounced and coalesced (below) until the user pauses.
  const [draftDay, setDraftDay] = useState(simDay);
  const [draftSpike, setDraftSpike] = useState(simParams.consumptionSpikeMultiplier);
  const [draftDelay, setDraftDelay] = useState(simParams.replenishmentDelayDays);

  // Re-sync each draft independently whenever ITS OWN server-confirmed value
  // changes (initial load, Reset, or a commit landing) — comparing primitives
  // rather than the whole `simParams` object (a new object every response)
  // so committing one slider never stomps another slider's still-in-progress
  // drag. Adjusting state during render (React's documented pattern for
  // "resetting state when a prop changes") avoids an extra render pass.
  const [prev, setPrev] = useState({
    simDay,
    spike: simParams.consumptionSpikeMultiplier,
    delay: simParams.replenishmentDelayDays,
  });
  if (prev.simDay !== simDay) {
    setPrev((p) => ({ ...p, simDay }));
    setDraftDay(simDay);
  }
  if (prev.spike !== simParams.consumptionSpikeMultiplier) {
    setPrev((p) => ({ ...p, spike: simParams.consumptionSpikeMultiplier }));
    setDraftSpike(simParams.consumptionSpikeMultiplier);
  }
  if (prev.delay !== simParams.replenishmentDelayDays) {
    setPrev((p) => ({ ...p, delay: simParams.replenishmentDelayDays }));
    setDraftDelay(simParams.replenishmentDelayDays);
  }

  // Pending changes across all three sliders are coalesced into a single
  // debounced request rather than each slider firing its own — so quickly
  // nudging two sliders in succession sends one consistent PATCH instead of
  // two requests that could land out of order.
  const pendingPatch = useRef<Patch>({});
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (commitTimer.current) clearTimeout(commitTimer.current);
    };
  }, []);

  function queueChange(patch: Patch) {
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      const toSend = pendingPatch.current;
      pendingPatch.current = {};
      onChange(toSend);
    }, COMMIT_DELAY_MS);
  }

  function cancelPending() {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    pendingPatch.current = {};
  }

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-lg border border-slate-700/70 bg-slate-800/40 px-4 py-3">
      <div className="flex items-center gap-2 min-w-[220px]">
        <CalendarClock size={15} className="text-slate-400 shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Simulate forward</span>
            <span className="text-slate-200 font-medium">Day {draftDay}</span>
          </div>
          <input
            type="range"
            min={0}
            max={45}
            value={draftDay}
            onChange={(e) => {
              const v = Number(e.target.value);
              setDraftDay(v);
              queueChange({ simDay: v });
            }}
            aria-label="Simulate forward, day"
            className="w-full accent-sky-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-[220px]">
        <Zap size={15} className="text-slate-400 shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Consumption spike</span>
            <span className="text-slate-200 font-medium">{draftSpike.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={draftSpike}
            onChange={(e) => {
              const v = Number(e.target.value);
              setDraftSpike(v);
              queueChange({ consumptionSpikeMultiplier: v });
            }}
            aria-label="Consumption spike multiplier"
            className="w-full accent-orange-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-[220px]">
        <Clock size={15} className="text-slate-400 shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Replenishment delay</span>
            <span className="text-slate-200 font-medium">+{draftDelay}d</span>
          </div>
          <input
            type="range"
            min={0}
            max={14}
            value={draftDelay}
            onChange={(e) => {
              const v = Number(e.target.value);
              setDraftDelay(v);
              queueChange({ replenishmentDelayDays: v });
            }}
            aria-label="Replenishment delay in days"
            className="w-full accent-red-500"
          />
        </div>
      </div>

      <button
        onClick={() => {
          cancelPending();
          onReset();
        }}
        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-600/60 rounded-md px-3 py-1.5 ml-auto"
      >
        <RotateCcw size={13} />
        Reset simulation
      </button>
    </div>
  );
}
