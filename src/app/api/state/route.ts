import { NextRequest, NextResponse } from "next/server";
import { getWorld, getSimParams, setSimParams, setSimDay, resetWorld } from "@/lib/store";
import { computeAllForecasts } from "@/lib/forecast";
import { computeRegionalRisks } from "@/lib/clustering";
import { computeRedistributionSuggestions } from "@/lib/redistribution";

function buildResponse() {
  const world = getWorld();
  const forecasts = computeAllForecasts(world);
  const regionalRisks = computeRegionalRisks(world, forecasts);
  const suggestions = computeRedistributionSuggestions(world, forecasts);
  const simParams = getSimParams();

  return {
    facilities: world.facilities,
    medicines: world.medicines,
    stock: world.stock,
    simDay: world.simDay,
    simParams,
    forecasts,
    regionalRisks,
    suggestions,
  };
}

export async function GET() {
  return NextResponse.json(buildResponse());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (typeof body.simDay === "number") setSimDay(body.simDay);
  if (typeof body.consumptionSpikeMultiplier === "number" || typeof body.replenishmentDelayDays === "number") {
    setSimParams({
      ...(typeof body.consumptionSpikeMultiplier === "number" ? { consumptionSpikeMultiplier: body.consumptionSpikeMultiplier } : {}),
      ...(typeof body.replenishmentDelayDays === "number" ? { replenishmentDelayDays: body.replenishmentDelayDays } : {}),
    });
  }
  if (body.reset === true) resetWorld();

  return NextResponse.json(buildResponse());
}
