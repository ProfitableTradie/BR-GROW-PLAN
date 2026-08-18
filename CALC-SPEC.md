# Boardroom Growth Plan — Calculation Specification

**Describes v2.8.** Everything the application computes, written so it can be ported to Excel or a server-side web app without reading the JavaScript.

Every rule here is pinned by a case in the app's own self-test suite — 122 golden cases with hand-calculated answers, runnable from the Setup tab or by loading the app with `?selftest=1`. Where a rule exists because something upstream got it wrong, the defect is named, so nobody re-introduces it in good faith.

All money is **excluding GST**. All rates are stored as decimals (0.35), displayed as percentages (35.0%). `—` is rendered wherever a value cannot be computed; the code never produces `NaN`, `Infinity`, `undefined` or `#DIV/0!`.

**Guarded division** is used everywhere: `div(a,b)` returns `null` unless both operands are finite and `b ≠ 0`.

---

## 1. Baseline normalisation

A month counts as *entered* if revenue, jobs, quotes or leads is greater than zero. Only entered months are used; `n` is how many there are.

**Gross profit is entered, cost of sales is derived** (changed in v2.3, inverting the original convention). A member reads gross profit straight off their P&L; asking them to compute cost of sales first was an invitation to get it wrong.

```
GrossProfit(month) = the figure entered
CostOfSales(month) = Revenue(month) − GrossProfit(month)      DERIVED — never typed
```

Gross profit entered as an explicit `0` is honoured as zero, not treated as blank. Only `null`, `undefined` and `''` count as unentered.

**Reading a file saved before v2.3.** Those months stored cost of sales and carry no `gp`, so the engine falls back to `Revenue − CostOfSales` per month and nothing is lost. The fallback is per-month, not per-file, so a part-migrated plan still totals correctly. (`mgp()` / `mcos()`; self-test 10b.)

```
Revenue        = Σ monthly revenue
GrossProfit    = Σ monthly gross profit                   (entered, or the fallback above)
CostOfSales    = Revenue − GrossProfit
GP%            = GrossProfit / Revenue                    [guard]
FixedCosts     = Σ (fixed costs + company overhead)
NetProfit      = GrossProfit − FixedCosts                 DERIVED — never typed
Jobs           = Σ monthly jobs
AvgJobValue    = Revenue / Jobs                           [guard]
Quotes         = Σ monthly quotes
QuoteWin%      = Jobs / Quotes                            [guard]
Leads          = Σ monthly leads
LeadQuote%     = Quotes / Leads                           [guard]
OwnerHours     = mean of entered months
OnTools        = value in the LATEST entered month
Office         = value in the LATEST entered month
Monthly figure = corresponding total / n
```

**GP% is a period ratio, not the average of the monthly ratios.** The monthly spread (min / median / max) is shown separately so volatility is visible without distorting the baseline.

**Reported net profit** (optional, from the member's accountant) is stored separately and shown as a variance against the derived figure. It never overwrites it.

**Implied leads.** If no leads are recorded but jobs are, the tool back-fills `Leads = Jobs / QuoteWin% / LeadQuote%` and labels the figure *implied* on screen.

---

## 2. Two-tier structure

- Default: one division, `Whole of Business`.
- Divisions on: up to 8 renameable divisions, each with its own 12 months and its own capacity assumptions.
- Whole-of-business revenue, cost of sales, fixed costs, jobs, quotes, leads and headcount = **sum of ACTIVE divisions only**. Inactive divisions contribute nothing to any total, chart or org chart.
- **Assumptions are never summed.** Consolidated assumptions are revenue-weighted:

```
weighted(k) = Σ (assumption_k(i) × revenue(i)) / Σ revenue(i)
```

If no revenue is entered the fallback is a simple average, and the basis is stated on screen.

---

## 2b. Consolidated view on budget

Each department carries its own **desired numbers** (`division.t`), its own **assumptions** (`division.a`) and its own 12-month baseline. The consolidation rule is three-way:

| Quantity | Rule |
|---|---|
| Money — desired profit, fixed costs, required gross profit, required sales | **Add** across active departments |
| Volume — jobs, quotes, leads | **Add** across active departments |
| Ratios — gross margin, average job value, win rate, lead-to-quote rate | **Re-derive from the totals**, never average |
| Assumptions — revenue per head, spans of control, pricing minutes, pricing capacity | **Revenue-weighted average**, never add |
| Workforce — on tools, team leaders, ops managers, estimators, office | **Add** across active departments |

```
revenue      = Σ department required revenue
requiredGP   = Σ department required gross profit
gpPct        = requiredGP / revenue          ← not the mean of department margins
jobs         = Σ department required jobs
avgJobValue  = revenue / jobs
quotes       = Σ department required quotes
quoteWin     = jobs / quotes
leads        = Σ department required leads
leadQuote    = quotes / leads
```

Worked example (self-test 8b). Projects wants $20,000 profit on $30,000 fixed costs at 40% margin → $125,000 of sales. Service wants $10,000 on $15,000 at 50% → $50,000. Consolidated sales are $175,000 and consolidated margin is $75,000 ÷ $175,000 = **42.9%** — not the 45% you would get by averaging 40% and 50%. Pricing minutes of 300 (Projects) and 60 (Service) consolidate to **208.8**, weighted by revenue — not 360.

### Input or calculated — the original convention

The department sheets said it plainly at the top: *"Enter Your Numbers into the Yellow Boxes, and the Black Boxes will Calculate Your Results."* The app keeps that convention. On the Budget & Workforce tab an **amber cell is a field you type into** and a **dark cell is calculated**. No cell is ever labelled as an input while holding a formula — which is defect #7 in the original workbook, where every row headed *"Enter Your Fixed Costs"* actually contained `=D19/C19*C20`.

The Assumptions block reproduces the sheet's layout directly: the seven figures you set, a rule, then the seven the engine derives from them, each with its Hire Needed / Has Capacity flag.

### Margin ideals

The left-hand column of the Desired vs Actuals block, reproducing `C6 = D6/D10` from the original workbook: every money line expressed as a share of required monthly sales. It shows the *shape* of the business being aimed at — profit %, fixed cost %, gross margin % — independent of its size.

### Delta

`Delta = Desired − Current actual` — what has to change. On lines where more is better a positive delta is a **gap**; on the fixed-costs line a positive delta means the budget allows more than is currently spent, so it reads **ahead**.

---

## 3. The target funnel — backwards from the profit you want

```
RequiredGrossProfit = TargetNetProfit + FixedCosts
RequiredRevenue     = RequiredGrossProfit / TargetGP%      [guard]
RequiredJobs        = RequiredRevenue / TargetAvgJobValue  [guard]
RequiredQuotes      = RequiredJobs / TargetQuoteWin%       [guard]
RequiredLeads       = RequiredQuotes / TargetLeadQuote%    [guard]
```

Set `TargetLeadQuote% = 100%` if only one conversion rate is tracked; the leads line then collapses into quotes.

---

## 4. Capacity and human capital

`ceil(x)` is `Math.ceil(x − 1e-9)` so 8.0000001 rounds to 8, not 9.

```
OnToolsNeeded  = RequiredRevenue / RevenuePerOnToolsMember   [guard]
OnToolsTarget  = ceil(OnToolsNeeded)
OnToolsHires   = max(0, OnToolsTarget − OnToolsCurrent)
OnToolsUtil%   = OnToolsNeeded / OnToolsTarget

TeamLeaders    = ceil(OnToolsTarget / SpanOfControl_TL)
OpsManagers    = TeamLeaders < OpsManagerThreshold ? 0
                 : ceil(TeamLeaders / SpanOfControl_OM)

PricingHours   = RequiredQuotes × AvgPricingMinutes / 60     ← QUOTES, not leads
Estimators     = ceil(PricingHours / PricingHoursPerEstimator)
EstimatorUtil% = PricingHours / (Estimators × PricingHoursPerEstimator)

OfficeStaff    = ceil(OnToolsTarget / TradesmenPerOfficePerson)
TotalTeam      = OnToolsTarget + TeamLeaders + OpsManagers + Estimators + OfficeStaff
```

The exact fractional requirement is always displayed alongside the rounded figure (`8.6 needed → 9 on tools, 95% utilised`).

Below `OpsManagerThreshold` the ops-manager role is covered by the owner or a team leader — which is flagged as owner-dependence, not hidden.

### Defaults (Profitable Tradie benchmarks, all editable)

| Assumption | Default |
|---|---|
| Revenue per on-tools member | $25,000 / month |
| Span of control — team leader | 6 |
| Span of control — ops manager | 4 |
| Team leaders before an ops manager | 2 |
| Pricing hours per estimator | 118 / month |
| Pricing minutes per job | 60 (service) · 300 (projects) |
| Tradesmen per extra office person | 5 |

---

## 5. Forward projection — 60 months, drivers first

**Revenue is never projected directly.** The drivers are projected and revenue falls out of them. That is what makes the forecast deterministic rather than aspirational.

For each month `m = 1…60`, with `y = ceil(m/12)`:

**Step 1 — macro**, compounded over years 1…y:

```
mktFactor   = Π (1 + MarketGrowth%(k))      k = 1…y
priceFactor = Π (1 + PriceIncrease%(k))
ovhFactor   = Π (1 + OverheadGrowth%(k))

leads      = BaselineLeadsPerMonth × mktFactor
avgJobValue= BaselineAvgJobValue   × priceFactor
fixedCosts = BaselineFixedCosts    × ovhFactor
revPerHead = BaselineRevPerHead    × priceFactor
```

**One plan, not three** (changed in v2.4). There is a single plan with a single set of macro assumptions and a single multiple. A strategy is either **in the plan** or **parked**. Parked strategies are excluded from the stack entirely — they move nothing — but they are kept, not deleted, so a lever can be shelved and brought back without being retyped. `planStrategies()` is the only source of levers the projection sees. (Self-test 11.)

**Step 2 — strategy levers.** For each strategy in the plan:

```
rampFactor(m) = 0                          m < startMonth
                1                          m ≥ fullEffectMonth
                t                          linear ramp, t = (m−start)/(full−start)
                0.5 − 0.5·cos(π·t)         S-curve ramp

weight = rampFactor(m) × confidence / 100
```

Levers are applied by driver:

| Driver | Unit | Applied as |
|---|---|---|
| Leads per month | count | `leads += value × weight` |
| Lead → quote rate | pp | `leadQuote += (value/100) × weight` |
| Quote → win rate | pp | `quoteWin += (value/100) × weight` |
| Average job value | $ | `avgJobValue += value × weight` |
| Gross margin | pp | `gpPct += (value/100) × weight` |
| Fixed costs per month | $ | `fixedCosts += value × weight` |
| Revenue per on-tools member | $ | `revPerHead += value × weight` |
| Owner hours per week | hours | `ownerHours += value × weight` |

Multiple strategies on the same driver **sum**. Strategy `costPerMonth` is added to fixed costs from the start month.

**Step 3 — clamps.** `gpPct → [0, 0.90]`, `leadQuote → [0, 1]`, `quoteWin → [0, 1]`, `leads ≥ 0`, `avgJobValue ≥ 0`, `ownerHours ≥ 0`, `revPerHead ≥ 1`.

**Step 4 — seasonality then the funnel forward:**

Seasonality is stored as an **index per month**: `1.00` is an average month, `1.20` is 20% busier, `0.80` is 20% quieter. The twelve indexes always average 1.00, and the engine renormalises whatever is stored so a member can type freely without breaking the model. (Files written before this change stored twelve percentage shares adding to 100; they are converted on load.)

```
seasonIndex(i) = weight(i) / Σweights × 12          (normalises to a mean of 1.00)
shareOfYear(i) = seasonIndex(i) / 12                (the same thing as a % of the year)

leadsThisMonth = leads × seasonIndex
quotes         = leadsThisMonth × leadQuote
jobs           = quotes × quoteWin
revenue        = jobs × avgJobValue
grossProfit    = revenue × gpPct
netProfit      = grossProfit − fixedCosts − strategyCosts
```

**Annual aggregation.** Years sum the twelve monthly rows; `GP% = ΣGP / ΣRevenue`. The end-of-year run rate (month 12, 24, …, de-seasonalised) drives capacity and headcount. Year 0 is the baseline annualised.

---

## 6. Cash

```
ΔWorkingCapital = (ΔRevenue / 365) × (DebtorDays + WIPDays)
                − (ΔCostOfSales / 365) × CreditorDays
Tax             = max(0, NetProfit) × TaxRate
Capex           = Revenue × CapexPercent
CashGenerated   = EBITDA − Tax − Capex − ΔWorkingCapital
                − DebtRepayments − DrawingsAboveSalary
CumulativeCash  = running total from Year 1
```

Defaults: debtor days 45, WIP days 20, creditor days 30, capex 1.5% of revenue, tax 28% (NZ company rate). All editable.

Any year where cumulative cash is negative raises an **unfunded growth** alert stating the amount required.

---

## 6c. The Thrive Index

Ported from `Thrive_Index_Professional.xlsx`. This is the life the business is meant to fund, and it is scored before any of the numbers above are touched. Code: `§6c THRIVE INDEX SCORING`, `thriveScores()`.

### The index itself

Nine life categories, each scored 1–10 twice — where you are **today** and where you want to **be**.

```
MAX   = 9 categories × 10 = 90
TIS       = Σ (today scores)  / 90 × 100        null until at least one is entered
TISwanted = Σ (wanted scores) / 90 × 100
Lift      = TISwanted − TIS                     [null if either side is null]
Gap(row)  = wanted − today                      [null unless BOTH are entered]
```

Only entered scores are summed, and the divisor stays **90 regardless** — a part-filled scorecard reads as genuinely lower, not flatteringly rescaled. `counted` reports how many of the nine were scored so the screen can say so.

| TIS | Band | Points to the next band |
|---|---|---|
| < 40 | Surviving | 40 − TIS |
| < 60 | Stable | 60 − TIS |
| < 80 | Comfortable | 80 − TIS |
| < 90 | Thriving | 90 − TIS |
| ≥ 90 | Optimal | 0 — already at the top |

`biggest` is the entered rows with a positive gap, sorted widest first; the three largest are called out, because a five-year plan that does not move them is the wrong plan.

### Owner and director capability

Nine capability dimensions, scored 1–10, **summed not averaged** (max 90).

| Total | Band |
|---|---|
| < 40 | Emerging operator |
| < 60 | Capable manager |
| < 80 | Growth leader |
| ≥ 80 | Director-ready |

The ninth row — stepping back from day-to-day operations — is the one that decides whether the business is an asset or a job.

### Time and energy

```
Energising        = entered, clamped to [0,100]
Draining          = 100 − Energising            DERIVED — never typed
TargetEnergising  = entered, clamped to [0,100]  (benchmark 70%)
TargetDraining    = 100 − TargetEnergising       (benchmark 30%)
EnergyGap         = Energising − TargetEnergising
```

Draining is never stored as an input, so the two halves of a week cannot fail to add up. A stored draining figure that disagrees with `100 − energising` is **ignored, not displayed** (self-test 10d). Zero energising is honoured as zero, not treated as blank.

Rule of thumb stated on screen: every ten points of energising is worth roughly five points of Thrive Index.

### Three defects in the source workbook, corrected here

The spreadsheet this replaces got three things wrong. They are fixed, and the self-tests pin the corrections so they cannot come back:

1. **`Calculations!G3` read `Owner_Capability!B1` — the column header, not the first score.** Every capability score was shifted by one row, the text header was summed as if it were a value, and the ninth dimension was never read at all. (Self-tests: *all nine capability rows are counted*, *the workbook dropped the ninth row and summed the header*.)
2. **`Calculations!K2` read `Time_Energy!B1`** — the same off-by-one, on the energy split. Energy is now read from the value, not the header.
3. **A blank scorecard scored 0.0% and reported "Surviving".** `SUM()` over empty cells returns `0`, never `""`, so the sheet's `IF` guard could never fire. Here nothing is scored until something is entered: a blank scorecard has no score and **no band**, which is different from scoring zero. Clearing a score drops it out of the count and the index re-scores on what is left.

### What each lifestyle level costs

The bridge from the life to the numbers: a monthly income figure per level (Current, Comfortable, Thriving, Optimal) and the key shifts required. Whatever *Thriving* costs a month is what the business has to pay the owner — that figure is what belongs in desired net profit and personal income, and the rest of the plan works backwards from it. This is the only join between this section and the financial model; nothing here feeds the forecast automatically.

---

## 7. Asset value

```
NormalisedEBITDA = NetProfit(annual)
                 + OwnerSalaryInsideFixedCosts
                 − MarketRateSalaryToReplaceTheOwner
                 + OneOffAddbacks

EnterpriseValue  = NormalisedEBITDA × Multiple
EquityValue      = EnterpriseValue + SurplusCash − Debt
```

The multiple is **set by the member** (default 3.0×). Every screen showing a value also states that the multiple is an assumption, not a valuation, and that a real valuation needs an adviser.

Also reported: **value created per hour of owner time released** = ΔEquityValue ÷ (Δowner hours per week × 48).

---

## 8. Freedom Score (0–100)

```
component = (target = baseline) ? 100
          : clamp(0, 100, 100 × (actual − baseline) / (target − baseline))
```

`baseline` is the member's own starting figure; `target` is their own year-5 figure. The formula handles "lower is better" components without a special case because `target < baseline` flips both signs. The degenerate case (target equals baseline) scores 100 rather than dividing by zero.

| Component | Weight |
|---|---|
| Owner hours per week (lower better) | 25% |
| Weeks the business runs without the owner | 20% |
| Personal income drawn | 15% |
| Hours *on* the business as % of total | 10% |
| Weeks of holiday taken | 10% |
| Weekends worked per month (lower better) | 10% |
| Evenings home per week | 10% |

**Owner hours come from the model** (the projected value for that year). The other six interpolate linearly from baseline to year-5 target; this is stated under the chart. Exercise and sleep are tracked but not scored.

---

## 9. Guardrails

| Guardrail | Trigger |
|---|---|
| Hiring rate | On-tools additions in a year exceed `maxHiresPerQuarter × 4` |
| Margin jump | Gross margin improves more than 3pp in one year |
| Fixed cost per head falls | Fixed cost ÷ total team drops more than 3% year on year |
| Unfunded growth | Cumulative cash is negative in any year |
| **Plan/life contradiction** | Year-3 owner hours are below 85% of baseline while the owner still holds a role with no handover planned. If that role is Estimator, the message names the pricing hours that have nowhere to go. |

Guardrails warn; they never block.

---

## 9b. Budget, forecast and actual

The One Year tab runs three lines side by side for every month of Year 1:

| Line | Where it comes from | Does it grow through the year? |
|---|---|---|
| **Budget** | The consolidated monthly run rate from the department budgets × `seasonIndex(month)` | No — it is a flat run rate, only reshaped by seasonality |
| **Forecast** | The plan, month by month from the projection engine | Yes — the strategy stack ramps |
| **Actual** | Entered by the member each month | — |

Variance is reported against **budget**, because that is what the room committed to.

---

## 10. Org chart

Generated from the capacity engine at Today / Year 1 / Year 3 / Year 5. Roles appear as spans of control are exceeded.

Cost buckets (this is what makes reconciliation meaningful):

| Role | Default annual cost | Bucket |
|---|---|---|
| Owner / CEO | owner salary setting | Fixed costs |
| Operations Manager | $110,000 | Fixed costs |
| Estimator | $95,000 | Fixed costs |
| Office / Admin | $70,000 | Fixed costs |
| Team Leader | $100,000 | Cost of sales |
| On-tools member | $85,000 | Cost of sales |

Reconciliation is reported separately for each bucket: office and leadership salaries against forecast fixed costs, on-tools and team-leader wages against forecast cost of sales. Differences are shown, never hidden.

A role is tagged **owner-occupied** when the member has ticked it and either no handover year is set or the handover year is later than the year being viewed.

---

## 11. Display and rounding

- Money ≥ $1,000,000 → `$1.28m`; ≥ $10,000 → `$284k`; below → whole dollars with separators.
- Percentages to 1 decimal place. Percentage-point movements labelled `pp`.
- Headcount: 1 decimal for a requirement, integer for a plan.
- **Rounding happens only at display.** No intermediate value is ever rounded.
- Missing input renders `—`.

---

## 12. Persistence

State is a single JSON object held in memory. `localStorage` is not used — nothing is stored in the browser, so the file the member saves is the only copy and it is theirs. Saving writes the JSON via the File System Access API where available (Chrome, Edge) and falls back to a download elsewhere. Loading accepts a file picker or drag-and-drop and merges into a fresh default state, so files saved by older versions still open.

### Migrations on load

Every migration is one-way and additive: an older file is upgraded on open, nothing is discarded, and the member is never asked to convert anything by hand.

| Written by | What it stored | How it is read now |
|---|---|---|
| before v2.2 | Twelve seasonality **percentage shares** adding to 100 | Converted to an index averaging 1.00 |
| **v2.1** | Three scenarios (Plan A/B/C) plus an active-scenario pointer | The scenario the member was last on **becomes** the plan, and its macro assumptions come with it. Strategies that were in that scenario stay in the plan; strategies that were not are **parked, not deleted**. The old scenario block and the active pointer are removed, and no strategy is left carrying a scenario list. (Self-test 12.) |
| before v2.3 | Monthly **cost of sales**, no gross profit | Gross profit falls back to `Revenue − CostOfSales` per month (§1) |

A single P&L being split into departments is handled the same way: the twelve months move into the first department, the second is left genuinely empty rather than a copy, and consolidated revenue is unchanged by the split. If departments already exist, they are kept and the single P&L is set aside rather than copied on top of them. (Self-test 10c.)
