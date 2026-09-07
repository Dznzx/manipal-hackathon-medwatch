# MedWatch — 3-Minute Demo Video Script

Live URL: https://manipal-hackathon-medwatch.vercel.app
Reset the simulation (button, top right) before recording so you start at Day 0.

Facilities are real government PHCs/CHCs/hospitals in Udupi district,
Karnataka (real names, real GPS coordinates) — worth saying once in the video,
it's a stronger claim than "simulated facilities."

---

### 0:00–0:20 — The problem (talk over the dashboard, don't click yet)

> "A health facility running low on a medicine looks like routine inventory
> noise — until you notice two or three *nearby* facilities running low on the
> *same* medicine, at the *same* time. That's not noise, that's an early signal
> of a regional shortage. MedWatch is built to catch that signal before it
> becomes a crisis — using real facilities from Udupi district, Karnataka."

Screen: full dashboard, day 0, sitting on the home view.

---

### 0:20–0:35 — The Risk Trend chart (new headline visual — lead with this)

Point at the **Projected Risk Trend** chart right under the sliders.

> "This curve is the whole idea in one picture — it projects how today's
> regional risk count would develop over the next 20 days if nothing is done.
> A local signal doesn't stay local; it can compound. That's what this system
> is built to catch early."

---

### 0:35–0:50 — Priority Action Queue

Point at the **Priority Action Queue** panel near the top.

> "At the top, MedWatch gives decision-makers one ranked list — regional alerts
> and redistribution moves together, sorted by urgency. This is the 'what do I
> act on today' view."

---

### 0:50–1:10 — Per-facility forecasting + confidence

Click **Kundapur Government Hospital** in the facility list to open the detail drawer.

> "Every facility tracks its own consumption history. For Amoxicillin here,
> we're projecting stockout in about a week — and instead of pretending that's
> exact, we show the uncertainty directly on the chart."

Point at the shaded band on the forecast chart, then click **Why?** on the confidence line.

> "That shaded band is the uncertainty range based on how variable consumption
> has been. The reasoning behind the confidence score is always one click away
> — this is a judged criterion, not a footnote."

Close the drawer.

---

### 1:10–1:40 — Isolated vs. Regional, and why it's happening

Point at the **Regional Risk Alerts** panel and the map's dashed red region.

> "Here's the core idea. Two real facilities in Kundapura Taluk — PHC
> Hattiangadi and the Basroor government hospital — are trending toward an
> Amoxicillin stockout within days of each other. MedWatch flags that as a
> **Regional Risk**."

Click **Why?** on the Regional Risk card — let the reasoning text show, including the demand-vs-supply line.

> "It doesn't stop at 'these look correlated' — it also reads whether this is
> demand-driven, like a seasonal illness surge, or supply-side, like
> chronically thin buffers. That distinction changes what a health official
> should actually do about it."

Point at the isolated-event card (Udupi Taluk / Insulin).

> "Compare that to Udupi Taluk: one facility, low on Insulin, alone — nothing
> nearby corroborates it. MedWatch calls that an **Isolated Event**, so we
> never cry wolf over an ordinary local stock dip."

---

### 1:40–2:15 — Redistribution recommendations, visualized

Point at the **Redistribution Suggestions** panel, then at the blue dashed
arrows connecting facilities on the map.

> "Once a shortage is flagged, MedWatch matches at-risk facilities to the
> nearest facility with confirmed surplus — and you can see the actual routes
> on the map, with real distances between real locations."

Click **Why?** on the top suggestion.

> "Every recommendation shows its impact: without this transfer, stockout in
> about ten days; with it, pushed out to thirty. Nothing here is a black box."

---

### 2:15–2:40 — Watching it spread + exporting a report

Drag the **Simulate Forward** slider from Day 0 to around Day 8.

> "Because this is time-aware, you can watch a shortage develop, or stress-test
> it with a consumption spike or a delayed shipment and see the system react
> immediately."

Reset the slider back to Day 0. Click **Situation report** in the header.

> "And because a dashboard alone isn't a deliverable a health official can act
> on, one click exports a real situation report they could forward or print."

---

### 2:40–3:00 — Close

> "MedWatch doesn't need a trained model to do this — a transparent, explainable
> heuristic running on real facility locations is enough, and it's one a health
> official can actually trust because they can see the reasoning behind every
> number. Detect early, explain clearly, and point at where the surplus already
> is."

End on the full dashboard view, Day 0.

---

## Recording tips

- **Reset the simulation before you hit record** — this guarantees the clean
  Day-0 baseline (1 regional risk in Kundapura Taluk) shown in the script above.
- Keep the slider moves in the **Day 0–10 range**. Past ~day 15–20, enough of
  the 55 simulated facility/medicine pairs cross their own routine reorder
  points by chance that extra "regional" flags appear — realistic for a
  heuristic system running on noisy simulated data, but busier than you want
  on screen for a 3-minute cut.
- If a "Why?" popover doesn't close between clicks, click anywhere blank on the
  panel first — it's a click-outside-to-close toggle.
- Full screen the browser (hide the URL bar) for a cleaner recording.
- If judges ask "is this real data?" in Q&A: facility names, types, and GPS
  locations are real (Udupi district, Karnataka, sourced from OpenStreetMap).
  Stock levels and consumption are simulated, because no public dataset
  publishes real per-facility inventory — say this plainly, it's more credible
  than overclaiming.
