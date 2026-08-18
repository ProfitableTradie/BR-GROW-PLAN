# Test Results — Boardroom Growth Plan

**v2.6.** Run the suite in the app: **Setup → Run the self-test**, or open the file with `?selftest=1`.

## Golden test cases

```
124 passed · 0 failed
```

Every case carries a hand-calculated expected answer. The suite is self-policing: `SELFTEST_COUNT` in `03-core.js` records how many checks there should be, and if the number that actually run disagrees, the suite fails itself rather than quietly reporting a smaller green run.

| Group | Checks | Area |
|---|---|---|
| 1 | 5 | Clean 12-month baseline |
| 2 | 3 | Partial baseline |
| 3 | 2 | Zero revenue |
| 4 | 1 | Zero jobs |
| 5 | 12 | Target funnel, capacity, spans of control |
| 6 | 2 | Macro-only projection |
| 7 | 3 | Strategy levers, ramps, confidence |
| 8 | 5 | Divisions roll-up |
| 8b | 13 | Consolidated view on budget |
| 8c | 17 | **Thrive Index scoring** |
| 9 | 4 | Freedom Score |
| 10 | 1 | Fuzzed inputs |
| 10b | 13 | **Gross profit entered, cost of sales derived** |
| 10c | 15 | **Single P&L split into departments** |
| 10d | 10 | **Energising / draining split** |
| 10e | 5 | **Chart render and re-entrancy guard** |
| 11 | 4 | **One plan: parked strategies** |
| 12 | 7 | **v2.1 → one-plan migration** |
| | **122** | |

## What each group proves

| Group | Proves |
|---|---|
| 1 | Totals, period-ratio gross margin, derived net profit, average job value |
| 2 | A 4-month baseline uses only entered months and does not average empty ones in |
| 3 | Zero revenue produces `null`, not `NaN`, `Infinity` or `#DIV/0!` |
| 4 | Zero jobs produces `null` for average job value |
| 5 | 100% conversion collapses leads to jobs; the funnel back-checks to the profit asked for; capacity rounding, the hiring rule, spans of control and pricing hours are all correct |
| 6 | A plan with no strategies moves only by the macro assumptions, and compounds year on year |
| 7 | Two strategies on one driver sum; confidence weights the lever; a lever starting in month 7 affects only half of year 1 |
| 8 | Only active divisions roll up; revenue sums; spans of control are **not** summed; revenue per head is revenue-weighted; five inactive divisions holding $999,999 a month contribute nothing |
| 8b | Desired sales and profit add across departments; consolidated gross margin is re-derived from the totals (42.9%) and is *not* the mean of the two department margins (45%); average job value and win rate are re-derived; pricing minutes of 300 and 60 weight to 208.8 and are *not* summed to 360; workforce headcount **does** add up; switching a department off removes it from the budget |
| 8c | TIS is the sum of the nine current scores over 90 and lands in the right band; the desired score is computed the same way; points-to-next-level is correct; the biggest gap is found; **all nine capability rows are counted** and the header is not summed as a value; the capability band is right; energy is read from the value, not the header; a cleared score drops out of the count and the index re-scores on what is left; **a blank scorecard scores nothing — not zero — and has no band** |
| 9 | The Freedom Score scores upward in both directions, guards target = baseline, and clamps out-of-range values |
| 10 | A fuzzed state (alternating $0 and $1e12 revenue, negative cost of sales, negative target profit) produces no non-finite number anywhere in the five-year model |
| 10b | Gross profit is read from what was entered and cost of sales is derived, never typed; margin is total GP over total revenue; net profit nets off fixed costs and overhead; **a pre-v2.3 file falls back to cost of sales and its margin still lands**; gross profit typed as zero is honoured as zero; monthly revenue averages over months *entered*, not over twelve; a heading is derived when left blank, taken from the member when typed, and whitespace is not a heading |
| 10c | Splitting a single P&L moves the twelve months into the first department and leaves the second genuinely empty, not a copy; consolidated revenue is unchanged by the split; an empty department does not halve the owner week; existing departments are kept and the single P&L set aside rather than copied on top; consolidated monthly revenue, gross profit and headcount add, while **owner hours do not**, and the consolidated grid agrees with the roll-up |
| 10d | Draining is the balance of the week and the two always make one week; zero energising is honoured, not treated as blank; over 100 clamps and the balance never goes negative; nothing entered stays nothing; the target pair balances too; **a stored draining figure that disagrees is ignored, not shown** |
| 10e | Every chart is drawn after a full render, a partial render, and three renders in a row; `render()` refuses to re-enter itself and the guard resets afterwards |
| 11 | A strategy in the plan moves the forecast; a parked one moves nothing and is excluded from the stack; unparking puts it straight back |
| 12 | The plan the member was last on becomes *the* plan and its macro comes with it; the old scenario block and active-plan pointer are gone; strategies in that plan stay, strategies outside it are **parked, not deleted**; no strategy is left carrying a scenario list |

## The fourteen defects in `BR Growth Plan Calculator.xlsx`

| # | Defect | How it is fixed |
|---|---|---|
| 1 | `Consolidated` **SUMs assumptions** across departments — five departments each with a span of control of 6 consolidated to a span of 30. Same for revenue per head, pricing hours and pricing minutes. | Assumptions are never summed. `weightedAssumptions()` returns a revenue-weighted average and the weighting basis is printed on screen. Self-test 8 asserts span of control stays at 6 across two divisions. |
| 2 | `Consolidated!Q30` points at `'Dept D'!D42` where every other cell in that column points at Dept E — a silent wrong number. | There are no hand-written cross-references. One state object, derived views. Nothing can drift. |
| 3 | The funnel roll-up aggregates only Projects + Dept A–D. **Dept E, F and G are silently excluded** from every consolidated funnel figure. | `business()` iterates every active division. Self-test 8 fills five inactive divisions with $999,999 a month and asserts the total does not move. |
| 4 | `F43`/`F44` "Hire Needed" flags test `MOD(A1,1)` and `MOD(A2,1)` — empty cells. They can only ever return "Has Capacity". | `hires = max(0, ceil(needed) − current)`. Self-test 5 asserts 8.57 needed against 6 current gives 3 hires. |
| 5 | `IF(MOD(x,1)<>0,"Hire Needed","")` is wrong logic: any fraction flags a hire even with spare capacity, and an exact integer above current headcount flags nothing. | Requirement, rounded plan and utilisation % are three separate figures, all displayed. |
| 6 | Every ratio row is unguarded — `=SUM(C8/C7)` with zero revenue returns `#DIV/0!`. The workbook ships showing errors. | Guarded division throughout; `null` renders as `—`. Self-tests 3, 4 and 10 assert no `NaN` or `Infinity` survives a fuzzed state. |
| 7 | Rows labelled **"Enter Your Fixed Costs (Incl. Your Salary)"** contain a formula, not an input. The label lies about the cell. | Inputs and derived values are visually distinct and never mislabelled. Derived rows carry a tint and cannot be typed into. |
| 8 | `Projects!D19` (Desired Profit) is empty while the whole chain below depends on it. | A completeness panel names every missing input and what breaks without it. |
| 9 | Months run C, D, E, **G** — column F is an unlabelled gap sitting inside `AVERAGE(C7:G7)`. Only four months are captured. | Twelve contiguous, calendar-labelled months. |
| 10 | Baseline GP% is `AVERAGE(monthly GP%)` — an average of ratios, not the business's actual margin. | `GP% = ΣGP / ΣRevenue`. The monthly spread is reported separately. Self-test 1 asserts this to 1e-9. |
| 11 | Two pricing-hours formulas on one sheet: `D42` monthly and `F42` using a `12/44` weekly factor, compared against a monthly capacity figure. | One formula, `quotes × minutes ÷ 60`, units stated on screen. |
| 12 | Net Profit is a typed input that can contradict Revenue − GP − Fixed Costs above it. | Net profit is always derived. A reported figure can be entered and is shown as a variance. Self-test 1 asserts the derived value. |
| 13 | Pricing workload is driven off **leads**, not quotes. Not every lead gets priced. | Explicit three-stage funnel: leads → quotes → jobs. Pricing time applies to quotes. Self-test 5 asserts pricing hours come from quotes. |
| 14 | `=SUM(D6)-G6`, `=SUM(C8/C7)`, `=+I10` — SUM wrapped around single cells throughout. | Clean expressions, documented in CALC-SPEC.md. |

## The three defects in `Thrive_Index_Professional.xlsx`

Introduced with the Thrive Index in v2.4. All three are pinned by group 8c so they cannot come back.

| # | Defect | How it is fixed |
|---|---|---|
| 1 | `Calculations!G3` reads `Owner_Capability!B1` — the column **header**, not the first score. Every capability score was shifted by a row, the text header was summed as if it were a value, and **the ninth dimension was never read at all**. | Scores are read from the values. Self-tests assert all nine rows are counted, and that the total is not the workbook's header-plus-shift figure. |
| 2 | `Calculations!K2` reads `Time_Energy!B1` — the same off-by-one, on the energising figure. | Energy is read from the value, not the header. |
| 3 | A blank scorecard scored **0.0% and reported "Surviving"**, because `SUM()` over empty cells returns `0`, never `""`, so the sheet's `IF` guard could never fire. | Nothing is scored until something is entered. A blank scorecard has no score and **no band** — which is different from scoring zero. |

## Other checks

- **Bad tokens** — no `NaN`, `Infinity`, `undefined` or `#DIV` appears in the rendered text of any tab with the example business loaded.
- **Reconciliation** — org chart people cost is split into the cost-of-sales bucket (on tools, team leaders) and the fixed-cost bucket (owner, ops managers, estimators, office), each reconciled against the matching forecast line rather than comparing the whole wage bill to fixed costs.
- **Duplicate tween keys** — every `data-tw` key in the document is unique. The Thrive Index score block used to be drawn twice on tab 02 and needed suffixed keys to stop the second copy sitting un-animated; v2.6 draws it once, under the radar, so the collision is now structurally impossible rather than merely avoided.

- **Vision category keys** — `VISION_DREAM` in `05-tabs.js` and `S.vision.dream` in `03-core.js` are two lists in two files that must stay identical. A key present in one and misspelt in the other points a textarea at a field nothing reads, so the member’s writing is discarded silently and nothing else in the app would notice. Two cases pin the key sets together and confirm all nine are distinct.

## Deployment verification

The table below was exercised at v2.5 against `npm run dev` (which runs `build.sh` then `server.js`). `server.js` is unchanged since, so the path-traversal and health rows still describe the shipping build:

| Step | Result |
|---|---|
| `sh ./build.sh` | builds `public/index.html`, 254,571 bytes, and copies it to `BR-Grow-Plan.html` |
| `node server.js` on `process.env.PORT` | listening, no dependencies installed |
| `GET /?selftest=1` over HTTP | **122 passed · 0 failed** |
| `GET /healthz` | `200` `{"status":"ok"}` |
| `GET /some/deep/path` | `200` — serves the app (rewrite fallback) |
| `GET /../server.js` | **403 Forbidden** |
| `GET /%2e%2e/server.js` | **403 Forbidden** |
| `GET /..%2f..%2fetc%2fpasswd` | **403 Forbidden** |
| `GET /../../package.json` | **403 Forbidden** |
| Console errors during the run | none |

No file outside `public/` is reachable. Static-site deploys skip `server.js` entirely; `render.yaml` sets `buildCommand: sh ./build.sh` and `staticPublishPath: ./public`, which is the same build the table above exercises.

**Re-verified at v2.6:** `sh ./build.sh` (259,768 bytes), `GET /?selftest=1` over HTTP on the dev server — **124 passed · 0 failed** — and the same URL over HTTPS on the deployed site at `boardroom-growth-plan.onrender.com`, also **124 passed · 0 failed**.

**Not re-verified at v2.6:** horizontal overflow at 1440/1024/820 px (last checked at v2.1). The **A4 print pack needs a fresh look** — v2.6 adds nine textareas to tab 01, the largest change to that tab’s printed length since the pack was last checked, and long member answers will page-break somewhere the old layout never had to.

## Known limitations in this build

1. Six of the seven Freedom Score components interpolate linearly from baseline to the year-5 target; only owner hours are modelled from the strategy stack. Per-year wellness targets are the obvious next addition.
2. Department budgets set the monthly run rate; the five-year engine still projects the business as a whole rather than department by department. Per-department five-year forecasting is the next structural step.
3. Completed years do not yet lock as actuals — the rolling window is built but the year-end roll-forward is manual.
4. Role costs in the org chart are single figures per role, not per named person.
5. Nothing in the Thrive Index feeds the financial model automatically. The lifestyle-cost table is the intended join, and it is copied across by hand on purpose, so the owner has to make the decision rather than have it made for them.
