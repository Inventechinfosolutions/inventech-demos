# KBOCW Integrated Intelligence Portal

Illustrative Secretary dashboard for the Karnataka Building and Other Construction Workers Welfare Board. The figures are synthetic and are not connected to government systems.

## Run

```bash
cd KBOCW
npm install
npm run dev
```

Open the local Vite address. The Secretary overview is the home page. The Labour Commissionerate dashboard is at `/departments/labour-commissionerate`. The KBOCW Welfare Board dashboard is at `/departments/kbocw-welfare-board`. The Factories & Boilers dashboard is at `/departments/factories-boilers`. The Cross-Department Intelligence dashboard is at `/intelligence/cross-analytics`. The Interactive Analytics workspace is at `/analytics`. Other navigation entries are placeholders for later dashboards.

Regenerate the illustrative dataset with:

```bash
npm run data
```

## Themes

The header has a theme switch: **Bordeaux** (default), **Carbon** (dark) and **Light** (blue palette). The choice is saved in the browser under `kbocw.theme`.

- Colours live in `src/theme/tokens.css`. Components use `var(--c-<role>-<hex>)` tokens, so both themes follow one source.
- ECharts cannot read CSS variables. Chart and map options go through `setThemedOption` in `src/theme/chartTheme.ts`, which resolves the tokens and re-applies them on a theme change.
- PDF exports always use Bordeaux on white paper.

## Interactive Analytics

The workspace at `/analytics` lets a user choose a dataset, build a report, combine reports into a dashboard, and export the result. Everything runs in the browser on synthetic data.

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

- `catalog.ts` holds the 13 datasets, their fields and the governed metrics. A metric states which aggregations are allowed, so a financial amount cannot be averaged and beneficiary counts cannot be added across years.
- `types.ts` defines the report definition. A report is plain JSON: dataset, dimensions, measures, a nested AND/OR filter tree, sorting and a visualization config. Definition, execution, visualization and dashboard layout stay separate.
- `engine.ts` validates and runs a definition. It never builds SQL.
- `access.ts` and `users.ts` apply role-based dataset access, district and department scope, and masking of personal details.
- `store.ts` keeps the `analytics_*` tables in `localStorage` under `kbocw.analytics.db.v1`: reports, report fields, filters, visualizations, dashboards, dashboard widgets, saved views, permissions, execution history and the audit log. Use Reset demo data on the Recent Analysis page to restore the seed.
- `api.ts` is the mock API seam. `executeQuery` is asynchronous and delayed so loading states are real. Replace its body with a `fetch` to a service when one exists.
- `exporters.ts` writes Excel, CSV and PDF. The PDF carries the title, applied filters, reporting period, generation date, data source, chart, table and metric definitions.
- `nlq.ts` answers a fixed set of question patterns and shows how each question was interpreted.

Use the Viewing as selector in the analytics header to switch between six synthetic roles and see dataset access and district scope change.
