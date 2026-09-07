import { WorldState, SimParams, StockRecord } from "./types";
import { generateWorld, DEFAULT_SEED } from "./generator";

// Single in-memory world for the whole server process — intentional for a prototype.
// No DB: this is exactly the P2 scope guard the user set (persistence is out of scope).

export const DEFAULT_SIM_PARAMS: SimParams = {
  consumptionSpikeMultiplier: 1,
  replenishmentDelayDays: 0,
};

interface AppState {
  baseWorld: WorldState;
  simDay: number;
  simParams: SimParams;
}

const globalForState = globalThis as unknown as { __medwatchState?: AppState };

function initState(): AppState {
  return {
    baseWorld: generateWorld(DEFAULT_SEED),
    simDay: 0,
    simParams: { ...DEFAULT_SIM_PARAMS },
  };
}

function getAppState(): AppState {
  if (!globalForState.__medwatchState) {
    globalForState.__medwatchState = initState();
  }
  return globalForState.__medwatchState;
}

// Projects the base (day-0) stock forward to `simDay`, applying spike/delay params.
// This is what makes the time-slider and parameter tweaks feel "live" without
// needing a persisted, mutable event log.
function projectStock(record: StockRecord, simDay: number, params: SimParams): StockRecord {
  const units = record.history.map((h) => h.units);
  const avg = units.length ? units.reduce((a, b) => a + b, 0) / units.length : 0;
  const effectiveConsumption = avg * params.consumptionSpikeMultiplier;

  let stock = record.currentStock;
  let pending = record.pendingReplenishment
    ? { ...record.pendingReplenishment, etaDay: record.pendingReplenishment.etaDay + params.replenishmentDelayDays }
    : null;

  // Routine reordering: a real facility doesn't just run to zero and stop — once
  // stock drops to its reorder point, it places a normal order that arrives after
  // its usual lead time (plus any simulated delay). This keeps stable facilities
  // stable over a long horizon so the demo's "regional vs isolated" contrast stays
  // visible instead of every facility eventually going critical from pure neglect.
  const leadTime = record.replenishmentLeadTimeDays + params.replenishmentDelayDays;
  const routineOrderQty = record.reorderLevel * 3;

  for (let d = 1; d <= simDay; d++) {
    if (pending && d >= pending.etaDay) {
      stock += pending.quantity;
      pending = null;
    }
    stock = Math.max(0, stock - effectiveConsumption);
    if (!pending && stock <= record.reorderLevel && effectiveConsumption > 0) {
      pending = { quantity: routineOrderQty, etaDay: d + leadTime };
    }
  }

  // Append synthetic recent-history entries reflecting the spike so the forecast
  // engine's variance/confidence math reacts to the tweak too, not just the total.
  const projectedHistory =
    params.consumptionSpikeMultiplier !== 1
      ? [...record.history.slice(Math.max(0, record.history.length - 14)), ...Array.from({ length: Math.min(simDay, 7) }, (_, i) => ({
          day: record.history.length + i,
          units: Math.round(effectiveConsumption * 10) / 10,
        }))]
      : record.history;

  // The forecast engine's contract is that pendingReplenishment.etaDay is "days
  // from now", not an absolute day count — rebase it relative to the current
  // simDay before handing it off, otherwise a still-outstanding order looks
  // `simDay` days further away than it really is once time has moved forward.
  const rebasedPending = pending ? { ...pending, etaDay: pending.etaDay - simDay } : null;

  return {
    ...record,
    currentStock: Math.round(stock),
    history: projectedHistory,
    pendingReplenishment: rebasedPending,
  };
}

export function getWorld(): WorldState {
  const state = getAppState();
  const stock = state.baseWorld.stock.map((r) => projectStock(r, state.simDay, state.simParams));
  return { ...state.baseWorld, stock, simDay: state.simDay };
}

// Projects the world at an arbitrary day without touching the stored simDay —
// used to compute a risk trend across a range of days (e.g. for a "how this
// develops over time" chart) without disturbing whatever day the UI is
// currently showing. Uses the current simParams so a stress-test (spike/delay)
// is reflected in the projected trend too.
export function getWorldAtDay(day: number): WorldState {
  const state = getAppState();
  const stock = state.baseWorld.stock.map((r) => projectStock(r, day, state.simParams));
  return { ...state.baseWorld, stock, simDay: day };
}

export function getSimParams(): SimParams {
  return { ...getAppState().simParams };
}

export function setSimParams(partial: Partial<SimParams>) {
  const state = getAppState();
  state.simParams = { ...state.simParams, ...partial };
}

export function setSimDay(day: number) {
  const state = getAppState();
  state.simDay = Math.max(0, day);
}

export function resetWorld() {
  globalForState.__medwatchState = initState();
}
