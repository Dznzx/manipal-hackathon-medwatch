# MedWatch — Regional Medicine Shortage Early Warning

**Manipal Hackathon 2026 — Round 1 · Domain: Healthcare (SDG 3)**
Live demo: https://manipal-hackathon-medwatch.vercel.app

## Problem

A single facility running low on a medicine can look like routine inventory noise.
But when several *nearby* facilities decline on the *same* medicine in the *same*
window, that's an early signal of a regional supply disruption — and today there's
no shared view that would let anyone tell the difference in time to act.

## What MedWatch does

1. **Forecasts** when each facility will run out of each medicine, from its own
   consumption history — with a confidence score and a plain-English explanation
   of that confidence, not just a number.
2. **Distinguishes isolated stockouts from regional patterns.** If 2+ nearby
   facilities are trending toward the same stockout in a similar timeframe, it's
   flagged "Regional Risk." If it's one facility alone, it's flagged "Isolated
   Event" — explicitly, so the system never claims more certainty than it has.
3. **Recommends redistribution**: matches facilities with surplus to facilities
   at risk, ranked by urgency (recipient urgency + how much of the gap the
   shipment closes + proximity), with the reasoning always visible.
4. **Simulates forward in time** — a slider lets you watch a shortage emerge day
   by day, and sliders for consumption spikes / replenishment delays let you
   stress-test the system live. A **Projected Risk Trend** chart shows this
   automatically: how today's regional-risk count would develop over the next
   20 days if nothing changes.
5. **Answers questions in plain English** — "Ask MedWatch" is a real LLM (Groq)
   layered on top of the engine, grounded strictly in the current computed
   data. It explains and narrates; it never computes a risk number itself, so
   it can't hallucinate a stockout that isn't there. The same grounding
   powers a one-click AI-written situation report.

## Why this approach

- **No ML model for the core detection.** A weighted moving average + heuristic
  confidence score is transparent, fast to build, and — critically —
  *explainable to a health official in one sentence*, which a black-box model
  isn't. Every number in the UI has a "Why?" popover showing the actual
  reasoning. AI (an LLM) is used deliberately as a layer *on top* of this —
  for natural-language Q&A and report writing — never to compute the risk
  numbers themselves. That split is the point: real AI, without giving up
  auditability.
- **Real facilities, real geography, simulated stock.** The 11 facilities are
  real government PHCs/CHCs/hospitals in Udupi district, Karnataka, with real
  GPS coordinates (sourced from OpenStreetMap via the public Overpass API) and
  real taluk groupings. Distances shown in the UI ("17 km away") are real
  haversine distances between actual locations. Stock levels and consumption
  are simulated and clearly labeled as such — granular per-facility inventory
  data isn't published anywhere publicly, which is exactly the kind of data
  the problem statement explicitly allows a prototype to simulate.
- **Never asserts false certainty.** Regional vs. isolated is always framed as a
  risk level with visible evidence (facility count, time-window overlap,
  average forecast confidence) — not a claim.

## Architecture

Single Next.js app (App Router), in-memory data layer, Recharts for
sparklines — one thing to run, one thing to deploy. No database, no auth: both
explicitly out of scope for a 5-day prototype per the problem statement's
allowance for simulated data.

```
generator.ts        real facility/GPS data + seeded synthetic consumption history
forecast.ts          weighted moving average -> days-to-stockout + confidence
clustering.ts        groups by real taluk + medicine -> isolated / watch / regional
redistribution.ts    surplus -> at-risk matching (real haversine distance), ranked by urgency
store.ts             in-memory world state + time-slider projection
ai-context.ts        serializes the computed state into grounding text for the LLM
groq.ts              thin wrapper around Groq's chat completions API (openai/gpt-oss-120b)
```

## Demo script (see VIDEO_SCRIPT.md)

Kundapura Taluk: 3 real government facilities trending toward an Amoxicillin
stockout within days of each other → flagged regional. Udupi Taluk: 1 facility
low on Insulin, alone → flagged isolated, correctly not escalated. A nearby
facility with Amoxicillin surplus gets matched to the at-risk ones, with real
distance/urgency/reasoning shown.
