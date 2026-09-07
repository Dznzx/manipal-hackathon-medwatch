import { NextRequest, NextResponse } from "next/server";
import { getWorld, getWorldAtDay, getSimParams, setSimParams, setSimDay, resetWorld } from "@/lib/store";
import { computeAllForecasts } from "@/lib/forecast";
import { computeRegionalRisks } from "@/lib/clustering";
import { computeRedistributionSuggestions } from "@/lib/redistribution";
import { RiskTrendPoint } from "@/lib/types";

const TREND_HORIZON_DAYS = 20;

// Projects risk forward across a fixed horizon (independent of whatever day the
// UI is currently showing) so the dashboard can chart how today's local signal
// could develop into a wider one — the problem statement's central framing —
// without anyone needing to manually drag the time-slider to see it.
function computeRiskTrend(): RiskTrendPoint[] {
  const points: RiskTrendPoint[] = [];
  for (let day = 0; day <= TREND_HORIZON_DAYS; day++) {
    const world = getWorldAtDay(day);
    const forecasts = computeAllForecasts(world);
    const risks = computeRegionalRisks(world, forecasts);
    points.push({
      day,
      regionalCount: risks.filter((r) => r.riskLevel === "regional").length,
      isolatedCount: risks.filter((r) => r.riskLevel === "isolated").length,
      atRiskFacilityCount: forecasts.filter((f) => f.status === "critical" || f.status === "at-risk").length,
    });
  }
  return points;
}

function buildResponse() {
  const world = getWorld();
  const forecasts = computeAllForecasts(world);
  const regionalRisks = computeRegionalRisks(world, forecasts);
  const suggestions = computeRedistributionSuggestions(world, forecasts);
  const simParams = getSimParams();
  const riskTrend = computeRiskTrend();

  return {
    facilities: world.facilities,
    medicines: world.medicines,
    stock: world.stock,
    simDay: world.simDay,
    simParams,
    forecasts,
    regionalRisks,
    suggestions,
    riskTrend,
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
