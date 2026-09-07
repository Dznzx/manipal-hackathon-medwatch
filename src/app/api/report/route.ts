import { NextResponse } from "next/server";
import { getWorld, getSimParams } from "@/lib/store";
import { computeAllForecasts } from "@/lib/forecast";
import { computeRegionalRisks } from "@/lib/clustering";
import { computeRedistributionSuggestions } from "@/lib/redistribution";
import { buildGroundingText } from "@/lib/ai-context";
import { generateSituationReport } from "@/lib/report";
import { callGroq } from "@/lib/groq";
import { StateResponse } from "@/lib/api-types";

const REPORT_SYSTEM_PROMPT = `You write situation reports for health department decision-makers, based on a medicine shortage early-warning dashboard called MedWatch (Udupi district, Karnataka).

Rules:
- Use ONLY the data given to you. Do not invent facility names, numbers, or medicines.
- Preserve every number exactly as given (days-to-stockout, quantities, distances, confidence, scores).
- Structure: a 2-3 sentence executive summary, then "Regional Risks", "Isolated Events", and "Recommended Redistribution" sections, using the facts provided.
- Mention plainly that facility locations are real but stock/consumption figures are simulated for this prototype.
- Plain, direct, professional tone — no marketing language, no exclamation points.
- Output plain text, not markdown.`;

export async function POST() {
  const world = getWorld();
  const forecasts = computeAllForecasts(world);
  const regionalRisks = computeRegionalRisks(world, forecasts);
  const suggestions = computeRedistributionSuggestions(world, forecasts);
  const data: StateResponse = {
    facilities: world.facilities,
    medicines: world.medicines,
    stock: world.stock,
    simDay: world.simDay,
    simParams: getSimParams(),
    forecasts,
    regionalRisks,
    suggestions,
    riskTrend: [],
  };

  const grounding = buildGroundingText(data);

  try {
    const report = await callGroq(
      [
        { role: "system", content: REPORT_SYSTEM_PROMPT },
        { role: "user", content: grounding },
      ],
      900
    );
    return NextResponse.json({ report, source: "ai" });
  } catch {
    // Fall back to the deterministic template report so the demo never breaks
    // on a flaky network call or an exhausted free-tier quota mid-video.
    return NextResponse.json({ report: generateSituationReport(data), source: "fallback" });
  }
}
