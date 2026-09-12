# MedWatch — 2-Minute Team Demo Script

**Live app:** https://manipal-hackathon-medwatch.vercel.app

One person drives the screen while the others narrate. Read this aloud once with a stopwatch before recording — everyone speaks at a slightly different pace, so treat the times below as targets, not a strict metronome.

**Target speaking time:** Priyal ~40s · Dinesh ~20s · Allwin ~20s · Tanvi ~40s. Total ≈ 2:00.

Reset the simulation (top-right button) before recording so you start at Day 0.

---

## 0:00 – 0:40 — Priyal (opening + the core insight)

Screen: full dashboard, Day 0.

> "A health facility running low on one medicine can look like routine noise — a bad week, nothing more. But when two or three *nearby* facilities start running low on the *same* medicine, in the *same* window, that's not noise anymore. MedWatch is built to catch that signal before it becomes a real crisis.
>
> Every facility forecasts its own stockout date with a confidence score, never overstating certainty. Right now, three real facilities in Kundapura Taluk — Kundapur Government Hospital, PHC Hattiangadi, and a nearby government hospital — are all trending toward the *same* Amoxicillin stockout within days of each other. That's a **Regional Risk**. One facility alone in Udupi Taluk, low on Insulin, with nothing nearby confirming it? Just an **Isolated Event**. It even reads *why* the regional pattern is happening — a demand spike, or a supply delay — because those two causes call for completely different responses."

---

## 0:40 – 1:00 — Dinesh

Screen: point at the facility map / facility list.

> "And none of this runs on a fake map. These are 11 real government PHCs, CHCs, and hospitals across three real taluks in Udupi district, Karnataka — Kundapura, Udupi, and Karkala — with real names and GPS coordinates pulled from OpenStreetMap. Every distance in this dashboard, like '17 kilometres away,' is real."

---

## 1:00 – 1:20 — Allwin

Screen: point at the Projected Risk Trend chart, then toward the Redistribution panel.

> "And it doesn't stop at 'here's the problem today.' This chart projects that same signal forward twenty days if nobody acts — showing how one local shortage could snowball into a wider one. So the next question is obvious: is there surplus sitting nearby that could actually fix this?"

---

## 1:20 – 2:00 — Tanvi (redistribution + AI + close)

Screen: point at the Redistribution Suggestions panel and the map's arrows.

> "That's exactly what MedWatch answers next. It finds the nearest facility with confirmed surplus and recommends a real transfer — real distance, exact quantity, and a concrete before-and-after: without this, stockout in 11 days; with it, pushed to 18. Every ranking is explainable — fifty percent recipient urgency, thirty percent how much of the gap it closes, twenty percent proximity. Nothing here is a black box.
>
> There's a real AI layer on top too — Ask MedWatch. Type a question in plain English, and it answers using only the numbers this engine already computed. It can't invent a fact that isn't there. Speed of AI, without losing the trust of a transparent system underneath it.
>
> Real facilities. Real geography. A transparent engine. And AI that explains it, not replaces it. That's MedWatch."

End on the full dashboard, Day 0.

---

## Notes for whoever's driving the screen

- Keep any slider moves in the Day 0–10 range — past ~day 15, extra noise appears from simulated data, not worth it in a short cut.
- If a "Why?" popover doesn't close between clicks, click any blank space first.
- Full-screen the browser (hide the URL bar / bookmarks) before recording.
- Rehearse the three handoffs (Priyal→Dinesh, Dinesh→Allwin, Allwin→Tanvi) out loud at least twice each.
