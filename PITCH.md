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
   stress-test the system live.

## Why this approach

- **No ML model.** A weighted moving average + heuristic confidence score is
  transparent, fast to build, and — critically — *explainable to a health
  official in one sentence*, which a black-box model isn't. Every number in the
  UI has a "Why?" popover showing the actual reasoning.
- **Simulated data, real structure.** 11 facilities across 3 geographic clusters,
  5 essential medicines, seeded so the demo is reproducible. The problem
  statement explicitly allows this for a prototype.
- **Never asserts false certainty.** Regional vs. isolated is always framed as a
  risk level with visible evidence (facility count, time-window overlap,
  average forecast confidence) — not a claim.

## Architecture

Single Next.js app (App Router), in-memory data layer, Recharts for
sparklines — one thing to run, one thing to deploy. No database, no auth: both
explicitly out of scope for a 5-day prototype per the problem statement's
allowance for simulated data.

```
generator.ts        seeded synthetic facilities/medicines/consumption history
forecast.ts          weighted moving average -> days-to-stockout + confidence
clustering.ts        groups by geography + medicine -> isolated / watch / regional
redistribution.ts    surplus -> at-risk matching, ranked by urgency
store.ts             in-memory world state + time-slider projection
```

## Demo script (see VIDEO_SCRIPT.md)

North Region: 3 facilities trending toward an Amoxicillin stockout within days
of each other → flagged regional. East Region: 1 facility low on Insulin, alone
→ flagged isolated, correctly not escalated. A nearby facility with Amoxicillin
surplus gets matched to the at-risk ones, with distance/urgency/reasoning shown.
