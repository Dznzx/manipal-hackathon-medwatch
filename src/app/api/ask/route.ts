import { NextRequest, NextResponse } from "next/server";
import { getWorld, getSimParams } from "@/lib/store";
import { computeAllForecasts } from "@/lib/forecast";
import { computeRegionalRisks } from "@/lib/clustering";
import { computeRedistributionSuggestions } from "@/lib/redistribution";
import { buildGroundingText, SYSTEM_PROMPT } from "@/lib/ai-context";
import { callGroq } from "@/lib/groq";
import { StateResponse } from "@/lib/api-types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "Missing question." }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "Question is too long." }, { status: 400 });
  }

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
    const answer = await callGroq([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Current MedWatch data:\n\n${grounding}\n\nQuestion: ${question}` },
    ]);
    return NextResponse.json({ answer });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI request failed." }, { status: 502 });
  }
}
