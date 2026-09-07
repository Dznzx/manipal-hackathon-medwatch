# MedWatch — 3-Minute Demo Video Script

Live URL: https://manipal-hackathon-medwatch.vercel.app
Reset the simulation (button, top right) before recording so you start at Day 0.

---

### 0:00–0:20 — The problem (talk over the dashboard, don't click yet)

> "A health facility running low on a medicine looks like routine inventory
> noise — until you notice two or three *nearby* facilities running low on the
> *same* medicine, at the *same* time. That's not noise, that's an early signal
> of a regional shortage. MedWatch is built to catch that signal before it
> becomes a crisis."

Screen: full dashboard, day 0, sitting on the home view.

---

### 0:20–0:50 — Per-facility forecasting + confidence

Click **Udupi PHC** in the facility list to open the detail drawer.

> "Every facility tracks its own consumption history. For Amoxicillin here,
> we're projecting 14 days to stockout — and instead of pretending that's
> exact, we show a confidence score."

Click **Why?** next to "High confidence" / "confidence" pill on the Amoxicillin card.

> "The reasoning is always visible — how much history backs the number, and how
> consistent consumption has been. This is a judged criterion, not a footnote."

Close the drawer.

---

### 0:50–1:30 — Isolated vs. Regional (the core insight)

Point at the **Regional Risk Alerts** panel.

> "Here's the core idea. Three facilities in the North Region — Udupi, Kaup,
> Brahmavar — are all trending toward an Amoxicillin stockout within days of
> each other. MedWatch flags that as a **Regional Risk**."

Click **Why?** on the Regional Risk card — let the reasoning text show.

> "Compare that to the East Region: one facility, Karkala, is low on Insulin —
> but nothing nearby corroborates it. MedWatch calls that an **Isolated Event**,
> explicitly, so we never cry wolf over an ordinary local stock dip."

Point at the isolated-event card.

---

### 1:30–2:10 — Redistribution recommendations

Point at the **Redistribution Suggestions** panel.

> "Once a shortage is flagged, the next question is: is there surplus somewhere
> nearby that could help? MedWatch matches at-risk facilities to the nearest
> facility with confirmed surplus."

Click **Why?** on the top suggestion.

> "Every recommendation shows its reasoning — how urgent the recipient is, how
> much of the gap this shipment actually closes, and distance. Nothing is a
> black box."

---

### 2:10–2:45 — Watching it spread (the "wow" moment)

Drag the **Simulate Forward** slider from Day 0 to around Day 10.

> "And because this is time-aware, you can watch a shortage develop. As we move
> forward, consumption continues, replenishments arrive or don't, and you can
> see the regional pattern strengthen — or new ones emerge — in real time."

Optionally nudge the **Consumption spike** slider up briefly to show reactivity.

> "We can also stress-test it — simulate a demand spike or a delayed shipment —
> and watch the system react immediately."

Reset the spike slider back to 1.0x before the next beat (keeps the screen calm).

---

### 2:45–3:00 — Close

> "MedWatch doesn't need a trained model or real-time GPS data to do this — a
> transparent, explainable heuristic is enough, and it's one a health official
> can actually trust because they can see the reasoning behind every number.
> That's the system: detect early, explain clearly, and point at where the
> surplus already is."

End on the full dashboard view, Day 0 (reset before ending if you moved the slider far).

---

## Recording tips

- **Reset the simulation before you hit record** — this guarantees the clean
  Day-0 baseline (1 regional risk, 1 critical stock) shown in the script above.
- Keep the slider moves in the **Day 0–10 range**. Past ~day 15–20, enough of
  the 55 simulated facility/medicine pairs cross their own routine reorder
  points by chance that extra "regional" flags appear — realistic for a
  heuristic system running on noisy simulated data, but busier than you want
  on screen for a 3-minute cut.
- If a "Why?" popover doesn't close between clicks, click anywhere blank on the
  panel first — it's a click-outside-to-close toggle.
- Full screen the browser (hide the URL bar) for a cleaner recording.
