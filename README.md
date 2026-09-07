# MedWatch

Regional medicine shortage early-warning dashboard — built for **Manipal Hackathon 2026, Round 1, Healthcare / SDG 3**.

**Live app:** https://manipal-hackathon-medwatch.vercel.app
**Full project report:** see `PITCH.md`
**Demo video script:** see `VIDEO_SCRIPT.md`

## What it does

A single facility running low on a medicine can look like routine inventory noise. MedWatch detects when the pattern is bigger than that: it forecasts when each facility will run out of each medicine, distinguishes an isolated stockout from a regional pattern across multiple nearby facilities, and recommends which surplus facility should send stock to which at-risk one — with the reasoning behind every number always visible.

- Per-facility, per-medicine depletion forecasts with a confidence score and plain-English reasoning
- Regional clustering: "Isolated Event" vs. "Regional Risk", with a demand-side vs. supply-side root-cause read
- A 20-day Projected Risk Trend chart showing how today's signal could develop
- Surplus → at-risk redistribution matching, ranked by urgency, with a before/after impact preview
- A Priority Action Queue merging every signal into one ranked list
- "Ask MedWatch" — an LLM chat layer grounded strictly in the computed data (never invents numbers)
- An AI-written situation report, exportable in one click
- A time-slider and stress-test controls (consumption spike, replenishment delay) to watch the system react live

Facility names, types, and GPS coordinates are **real** — 11 government PHCs/CHCs/hospitals in Udupi district, Karnataka, sourced from OpenStreetMap. Stock levels and consumption are **simulated**, since no public dataset publishes real per-facility inventory at that granularity. See `PITCH.md` for the full real-vs-simulated breakdown.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The AI features (`Ask MedWatch`, AI situation report) need a Groq API key. Create `.env.local`:

```bash
GROQ_API_KEY=your_key_here
```

Without it, the app still runs — the AI chat will show an error, and the situation report falls back to a deterministic text template automatically.

## Running tests

```bash
npm test
```

Covers the core deterministic engine — forecasting, regional clustering, and redistribution matching — with no network or AI dependency.

## Project structure

```
src/lib/
  generator.ts        real facility/GPS data + seeded synthetic consumption history
  forecast.ts          weighted moving average -> days-to-stockout + confidence
  clustering.ts        groups by real taluk + medicine -> isolated / watch / regional
  redistribution.ts    surplus -> at-risk matching (real haversine distance), ranked by urgency
  store.ts             in-memory world state + time-slider projection
  ai-context.ts        serializes computed state into grounding text for the LLM
  groq.ts              thin wrapper around Groq's chat completions API
src/app/
  page.tsx             dashboard UI
  api/state/           GET/POST current world state + apply time-slider/params
  api/ask/              "Ask MedWatch" chat endpoint
  api/report/          AI situation report endpoint (with deterministic fallback)
src/components/        dashboard panels (map, priority queue, risk trend chart, etc.)
```

No database, no auth — an in-memory data layer is a deliberate scope decision for a 5-day Round 1 prototype, and the problem statement explicitly allows simulated data.

## Tech stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS + Recharts, deployed on Vercel. AI layer via Groq (`openai/gpt-oss-120b`).
