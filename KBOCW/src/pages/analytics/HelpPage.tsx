import { Link } from "react-router-dom"
import { Button, eyebrowClass } from "@/analytics/components/ui"

const STEPS = [
  { title: "Choose a dataset", text: "Open Dataset Explorer to see each dataset's fields, freshness and access. Or start from a template." },
  { title: "Build a report", text: "Pick fields to group by and measures to calculate. Add filters, then choose a chart or table in the Visualization panel." },
  { title: "Save and share", text: "Save the report, then open, edit, duplicate, share or export it from Saved Reports." },
  { title: "Combine into a dashboard", text: "Add report, KPI, chart, table or map widgets to a dashboard and set global filters for all of them." },
]

const TOPICS: { title: string; points: string[] }[] = [
  {
    title: "Fields, measures and aggregation",
    points: [
      "Dimensions group the figures, such as district or financial year. Measures are the values to calculate.",
      "Choose Count, Sum, Average, Minimum, Maximum or Distinct. Governed metrics offer only the calculations that are valid for them.",
      "Sort the result and set the number of rows to show.",
    ],
  },
  {
    title: "Filters and grouping",
    points: [
      "Add conditions and groups. Join them with AND or OR.",
      "Operators include equals, not equals, contains, greater than, less than, between, in list and date range.",
      "The Financial year, From, To, District and Department controls apply across the whole report.",
    ],
  },
  {
    title: "Charts and tables",
    points: [
      "Choose from 15 visualisation types, including column, bar, line, pie, funnel, heatmap, KPI, table, pivot and district map.",
      "Switching the chart type keeps your fields and filters.",
      "Turn on Show data to read the figures behind a chart.",
    ],
  },
  {
    title: "Click to explore",
    points: [
      "Click a bar, slice or row to open its options.",
      "Drill down to the next level, filter other widgets to that value, or filter only the widget you clicked.",
      "Active filters appear above the results. Remove one with its × or use Clear all.",
    ],
  },
  {
    title: "Compare two financial years",
    points: [
      "Turn on Compare two years to set two financial years side by side.",
      "KPI cards show the change between the two years.",
      "Stages stay separate. Cess assessed and collected, assistance approved and disbursed, and fee payable and deposited are shown side by side, never added together.",
      "Counts taken at a point in time, such as registered workers on the Gig and Unorganised Workers boards, need one month in scope. A total across months would count the same worker more than once.",
    ],
  },
  {
    title: "Export",
    points: [
      "Export a report or a widget as Excel, CSV or PDF.",
      "Excel includes a sheet for the definitions. PDFs include the title, applied filters, reporting period, generation date, data source, chart, table and metric definitions.",
    ],
  },
  {
    title: "Dashboards",
    points: [
      "In Build Dashboard, choose Add widget. Drag a widget by its handle to move it. Drag the bottom-right corner to resize it.",
      "Global filters apply to every widget that has the field. Each widget can also have its own filters.",
      "Preview the dashboard, then save it. Use Set as default in the header to open it first.",
    ],
  },
  {
    title: "Ask in plain words",
    points: [
      "On Analytics Home, type a question such as \u201cShow district-wise cess collection for FY 2025-26\u201d.",
      "The panel shows how the question was read, the filters applied, the metric definitions and the result.",
      "Questions use fixed patterns. SQL is rejected.",
    ],
  },
  {
    title: "Access and privacy",
    points: [
      "Use Viewing as in the header to see the portal as another role. Each role sees the datasets and districts it is allowed.",
      "Personal details are masked. Groups with fewer than five records are hidden.",
      "Every creation, run, export and share is recorded in Recent Analysis.",
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="max-w-5xl">
      <p className={eyebrowClass}>Help</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--c-text-461220)]">How to use the analytics workspace</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--c-text-663a46)]">Build a report from a dataset, read it as a chart or table, then save it or combine reports into a dashboard.</p>

      <section aria-labelledby="help-start" className="mt-6 rounded-2xl border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] p-5 shadow-[0_10px_32px_rgb(var(--c-shadow-rgb)/0.05)]">
        <h3 id="help-start" className="text-base font-semibold text-[color:var(--c-text-461220)]">Start in four steps</h3>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--c-bg-461220)] text-xs font-semibold text-[color:var(--c-text-ffeee7)]">{index + 1}</span>
              <div>
                <p className="text-sm font-semibold text-[color:var(--c-text-461220)]">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--c-text-663a46)]">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {TOPICS.map((topic) => (
          <section key={topic.title} aria-labelledby={`help-${topic.title.replace(/\W+/g, "-").toLowerCase()}`} className="rounded-2xl border border-[color:var(--c-border-fed4c1)] bg-[color:var(--c-bg-ffffff)] p-5 shadow-[0_10px_32px_rgb(var(--c-shadow-rgb)/0.05)]">
            <h3 id={`help-${topic.title.replace(/\W+/g, "-").toLowerCase()}`} className="text-sm font-semibold text-[color:var(--c-text-461220)]">
              {topic.title}
            </h3>
            <ul className="mt-3 space-y-2">
              {topic.points.map((point) => (
                <li key={point} className="flex gap-2 text-sm leading-6 text-[color:var(--c-text-663a46)]">
                  <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--c-bg-b23a48)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link to="/analytics">
          <Button variant="primary">Go to Analytics Home</Button>
        </Link>
        <Link to="/analytics/build-report">
          <Button>Build a report</Button>
        </Link>
      </div>
    </div>
  )
}
