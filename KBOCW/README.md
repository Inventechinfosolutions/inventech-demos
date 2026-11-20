# KBOCW Integrated Intelligence Portal

Illustrative dashboards for the Karnataka Building and Other Construction Workers Welfare Board. The figures are synthetic and are not connected to government systems.

## Run

```bash
cd KBOCW
npm install
npm run dev
```

Open the local Vite address. The Secretary overview is the home page. The Labour Commissionerate dashboard is at `/departments/labour-commissionerate`. The KBOCW Welfare Board dashboard is at `/departments/kbocw-welfare-board`. The Factories & Boilers dashboard is at `/departments/factories-boilers`. The Gig Workers Welfare Board Executive Overview is at `/departments/gig-workers-welfare-board`. The Unorganised Workers Social Security Board Executive Overview is at `/departments/ksuwssb`. The Cross-Department Intelligence dashboard is at `/intelligence/cross-analytics`. The Interactive Analytics workspace is at `/analytics`. Other navigation entries are placeholders for later dashboards.

Regenerate the illustrative dataset with:

```bash
npm run data
```

## Gig Workers Welfare Board: Executive Overview

A static-first proof of concept at `/departments/gig-workers-welfare-board`. Every figure is labelled **Illustrative POC Data**. Nothing is connected to the Board, to aggregators or to PWFVS. The only public figure is the benchmark (The New Indian Express, 29 April 2026: 23 aggregators, 12.19 lakh records). It is shown separately, with its source and date, and is never used as a count of unique workers.

What the page has: eight KPI cards with a period comparison, a definition and a freshness marker; a nine-figure strip; charts for registrations, sectors, aggregators, payouts, welfare fee, fund, schemes, grievances and safety; a district map; an aggregator reporting table; priority exceptions; data source freshness; and metric definitions. Every figure and chart opens a detail drawer with its reference, source, period, data-received time and validation status. Registers of grievances and accidents show up to 25 rows, with worker identity masked.

Filters live in the address (`?districtId=mysuru&aggregatorId=platform-a`), so a view can be shared. Apply and Reset work, active filters show as removable chips, and a figure that a filter does not apply to says so ("Not affected by: District"). The fund ledger covers the whole Board and ignores filters.

How the data hangs together:

- `scripts/generate-gig-data.mjs` writes `src/data/gig-workers.json` from a fixed seed. It holds 7,000 worker cohorts, each standing for 70 to 118 workers, plus applications, grievances, accidents, returns and fund inputs. Months run October 2025 to September 2026, with a reporting date of 6 October 2026.
- Unique workers, platform engagements and source records all come from the same cohorts. A worker on several platforms counts once as a unique worker and once per platform.
- `src/services/gigEngine.ts` works every figure out from those cohorts with integer rounding at the finest grain, so any filter slice adds up to the whole. `gigOverview.ts` builds the page, `gigDetails.ts` builds the drill-downs and `gigMetrics.ts` holds the metric definitions.
- `src/services/gigService.ts` is the API seam. Set `VITE_API_BASE_URL` to call `/api/gig-workers/...` instead of the local engine. `GIG_ENDPOINTS` lists the endpoint names from the specification.
- Fee rates, grievance and claim targets, and exception thresholds are placeholders in the data file. They are not notified values.

Run the reconciliation checks with `npm run check:gig`. They confirm that totals match across districts, genders, age groups, aggregators, sectors, schemes and grievance categories, that the fund ledger balances, that filters which do not apply leave figures unchanged, and that every drill-down builds.

## Unorganised Workers Social Security Board: Executive Overview

A static-first proof of concept at `/departments/ksuwssb`. It covers this Board only. Every figure is labelled **Illustrative POC Data**, the page is filled on first load, and nothing is connected to a Board system. Phases 5 and 6 of the specification (live integration and validation) have not been started.

What the page has: eight KPI cards with a period comparison; a supporting strip; charts for registrations, occupations, demographics, districts, schemes, the application funnel, benefits, finance and Karmika Seva Kendra facilitation; a district map; scheme and district tables; a priority attention table; published reference figures kept apart from the synthetic data; data source freshness; and metric and dataset definitions. Figures and charts open a detail drawer, and the summary can be exported as CSV. Filters live in the address, and a figure that a filter does not apply to says so.

How the data hangs together:

- `src/services/ksuData.ts` builds 130,000 synthetic workers in the browser from a fixed seed (20260405), with their enrolments and cases, April 2025 to September 2026. There is no data file and no script.
- Status on any date comes from event dates, so records, workers, applications, approvals and payments reconcile. Enrolments are never shown as unique workers, and payment initiated is never counted as disbursed.
- `src/services/ksuEngine.ts` works out the figures, `ksuOverview.ts` builds the page, `ksuDetails.ts` builds the drill-downs and `ksuMetrics.ts` holds the definitions.
- `src/services/ksuService.ts` is the API seam. Set `VITE_API_BASE_URL` to call `/api/ksuwssb/...` instead of the local engine.
- Districts, occupations, benefit amounts, the 30-day service target and the ledger are placeholders to be confirmed with the Board. The e-Shram figure is an external reference and is never counted as a Board registration.

Run the checks with `npm run check:ksu`. They confirm that totals match across every breakdown, that the ledger agrees with the KPIs, that filters which do not apply leave figures unchanged, and that every drill-down builds.

## Department dashboard layout

Each department dashboard (Labour Commissionerate, KBOCW Welfare Board, Factories & Boilers, Gig Workers Welfare Board, Unorganised Workers Board) has two parts. The **Overview** at the top holds the cards and charts. It always shows the default scope and does not change with the filters, and its drill-downs use that same scope. Below it, the **Filters** band holds the filter bar, a short "Figures for the current filters" strip, and the filter-driven map, tables and registers. The overview is loaded once with `useBaseline`. Filters stay in the address, so a filtered view can still be shared.

## Secretary dashboard

The Secretary dashboard is a roll-up of the five department dashboards. For each board or office it shows four headline figures, the first items needing attention and one chart, all taken from that dashboard's own default period, with a link to the full dashboard. It has no filters, and figures are not added across boards.

## Themes

The header has a theme switch: **Bordeaux** (default), **Carbon** (dark) and **Light** (blue palette). The choice is saved in the browser under `kbocw.theme`.

- Colours live in `src/theme/tokens.css`. Components use `var(--c-<role>-<hex>)` tokens, so both themes follow one source.
- ECharts cannot read CSS variables. Chart and map options go through `setThemedOption` in `src/theme/chartTheme.ts`, which resolves the tokens and re-applies them on a theme change.
- PDF exports always use Bordeaux on white paper.

## Interactive Analytics

The workspace at `/analytics` lets a user choose a dataset, build a report, combine reports into a dashboard, and export the result. Everything runs in the browser. Every dataset is built only from the figures on the five department dashboards: Labour Commissionerate, KBOCW Welfare Board, Factories & Boilers, Gig Workers Welfare Board and Unorganised Workers Social Security Board. A total here therefore matches the same total on the dashboard it came from. The boards are never added together.

| Area | Route |
| --- | --- |
| Analytics Home | `/analytics` |
| Build Report | `/analytics/build-report` |
| Build Dashboard | `/analytics/build-dashboard` |
| Dataset Explorer | `/analytics/datasets` |
| Saved Reports | `/analytics/reports` |
| Saved Dashboards | `/analytics/dashboards` |
| Recent Analysis | `/analytics/recent` |
| Report Templates | `/analytics/templates` |

Code layout, all under `src/analytics`:

- `catalog.ts` holds the 12 datasets (monthly, district, scheme, category and aggregator views of the five boards), their fields and the governed metrics. A metric states which aggregations are allowed, so a financial amount cannot be averaged, a count of distinct workers cannot be added across months or years, and stages such as approved and disbursed cannot be stacked.
- `seedData.ts` builds the rows from the same services and data files the dashboards use.
- `types.ts` defines the report definition. A report is plain JSON: dataset, dimensions, measures, a nested AND/OR filter tree, sorting and a visualization config. Definition, execution, visualization and dashboard layout stay separate.
- `engine.ts` validates and runs a definition. It never builds SQL.
- `access.ts` and `users.ts` apply role-based dataset access, district and department scope, and masking of personal details.
- `store.ts` keeps the `analytics_*` tables in `localStorage` under `kbocw.analytics.db.v1` (the stored copy is replaced when the seed version changes): reports, report fields, filters, visualizations, dashboards, dashboard widgets, saved views, permissions, execution history and the audit log. Use Reset demo data on the Recent Analysis page to restore the seed.
- `api.ts` is the mock API seam. `executeQuery` is asynchronous and delayed so loading states are real. Replace its body with a `fetch` to a service when one exists.
- `exporters.ts` writes Excel, CSV and PDF. The PDF carries the title, applied filters, reporting period, generation date, data source, chart, table and metric definitions.
- `nlq.ts` answers a fixed set of question patterns and shows how each question was interpreted.

Use the Viewing as selector in the analytics header to switch between eight synthetic roles (the Secretary, one per board, a district office and an analyst) and see dataset access and district scope change.
