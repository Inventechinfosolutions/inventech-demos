// Reconciliation checks for the Interactive Analytics datasets.
// Every dataset comes from the five department dashboards, so a total must match the dashboard it came from.
// Build and run: vite build --ssr scripts/check-analytics-data.ts --outDir /tmp/analytics-check --emptyOutDir && node /tmp/analytics-check/check-analytics-data.js
import { DATASETS, DISTRICT_NAMES } from "@/analytics/catalog"
import { condition, measure, TEMPLATES, defaultVisualization, definitionFromTemplate } from "@/analytics/templates"
import { runReport, validateReport } from "@/analytics/engine"
import { interpretQuestion, EXAMPLE_QUESTIONS } from "@/analytics/nlq"
import { seedDb, DB_VERSION } from "@/analytics/seed"
import { tablesToReport, widgetRows } from "@/analytics/entities"
import { USERS, userById } from "@/analytics/users"
import { getRows } from "@/analytics/seedData"
import { DEFAULT_GIG_FILTERS } from "@/lib/gigQuery"
import { DEFAULT_KSU_FILTERS } from "@/lib/ksuQuery"
import { DEFAULT_LABOUR_FILTERS } from "@/lib/labourQuery"
import { DEFAULT_WELFARE_FILTERS } from "@/lib/welfareQuery"
import { DEFAULT_FACTORIES_FILTERS } from "@/lib/factoriesQuery"
import { formatCount, formatCrore, formatLakh } from "@/lib/format"
import { buildGigOverview } from "@/services/gigOverview"
import { buildKsuOverview } from "@/services/ksuOverview"
import { getFactoriesOverview } from "@/services/factoriesService"
import { getLabourOverview } from "@/services/labourService"
import { getWelfareOverview } from "@/services/welfareService"
import type { FilterCondition, ReportDefinition } from "@/analytics/types"

let failures = 0
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures += 1
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`)
}

const secretary = userById("u-secretary")!
const digits = (text: string) => Number(text.replace(/[^0-9]/g, ""))
/** The Welfare Board dashboard shows people counts of a lakh or more in lakh. */
const people = (value: number) => (Math.abs(value) < 100000 ? formatCount(value) : formatLakh(value).replace(/(\.\d)0(?= lakh)/, "$1"))

function blank(datasetId: string): ReportDefinition {
  return {
    id: "",
    name: "check",
    description: "",
    datasetId,
    dimensions: [],
    measures: [],
    filters: { id: "root", kind: "group", combinator: "AND", children: [] },
    sort: [],
    visualization: defaultVisualization("kpi"),
  }
}

/** One total for a measure over the given conditions. */
function total(datasetId: string, fieldId: string, conditions: FilterCondition[], aggregation: "sum" | "calc" = "sum") {
  const def = blank(datasetId)
  def.measures = [measure(fieldId, aggregation)]
  def.filters.children = conditions
  const outcome = runReport(def, secretary)
  if (!outcome.ok) throw new Error(`${datasetId}.${fieldId}: ${outcome.issues.map((issue) => issue.message).join("; ")}`)
  return Number(outcome.result.rows[0]?.[outcome.result.columns[0].id] ?? 0)
}
const fy = (value: string) => condition("financial_year", "eq", { value })
const month = (value: string) => condition("period", "eq", { value })

async function main() {
  console.log("--- Datasets")
  check("Twelve datasets, no old ones", DATASETS.length === 12 && !DATASETS.some((dataset) => /cess_collections|treasury|beneficiaries|contractors/.test(dataset.id)))
  for (const dataset of DATASETS) {
    const rows = getRows(dataset.id)
    check(`${dataset.id} has rows`, rows.length > 0, `${rows.length} rows`)
    const missing = dataset.fields.filter((field) => field.kind !== "calculated" && rows.some((row) => row[field.id] === undefined)).map((field) => field.id)
    check(`${dataset.id} rows fill every field`, missing.length === 0, missing.join(", "))
  }
  check("District list has 31 names", DISTRICT_NAMES.length === 31)

  console.log("\n--- Labour Commissionerate, FY 2025-26")
  const labour = await getLabourOverview(DEFAULT_LABOUR_FILTERS)
  const lab = (id: string) => labour.kpis.find((item) => item.id === id)!.displayValue
  const L = (field: string, aggregation: "sum" | "calc" = "sum") => total("labour_monthly", field, [fy("2025-26")], aggregation)
  check("Establishments", digits(lab("establishments")) === L("establishments"), lab("establishments"))
  check("Projects", digits(lab("projects")) === L("projects"), lab("projects"))
  check("Cess assessed", lab("cess-assessed") === formatCrore(L("cess_assessed")), lab("cess-assessed"))
  check("Cess collected", lab("cess-collected") === formatCrore(L("cess_collected")), lab("cess-collected"))
  check("Outstanding cess", lab("outstanding") === formatCrore(L("outstanding_cess", "calc")), lab("outstanding"))
  check("Inspections", digits(lab("inspections")) === L("inspections"), lab("inspections"))
  check("Violations", digits(lab("violations")) === L("violations"), lab("violations"))
  check("Pending cases", digits(lab("pending")) === L("pending_cases"), lab("pending"))
  const projectsByCategory = total("labour_projects", "projects", [fy("2025-26")])
  check("Projects by category add up to the projects total, within rounding", Math.abs(projectsByCategory - L("projects")) <= 30, `${projectsByCategory} vs ${L("projects")}`)

  console.log("\n--- KBOCW Welfare Board, FY 2025-26")
  const welfare = await getWelfareOverview(DEFAULT_WELFARE_FILTERS)
  const wel = (id: string) => welfare.kpis.find((item) => item.id === id)!.displayValue
  const W = (field: string) => total("welfare_monthly", field, [fy("2025-26")])
  check("Registered workers", wel("workers") === people(W("workers")), wel("workers"))
  check("Beneficiaries", wel("beneficiaries") === people(W("beneficiaries")), wel("beneficiaries"))
  check("Applications received", wel("received") === people(W("applications")), wel("received"))
  check("Applications pending", wel("pending") === people(W("pending_applications")), wel("pending"))
  check("Assistance approved", wel("approved") === formatCrore(W("assistance_approved")), wel("approved"))
  check("Amount disbursed", wel("disbursed") === formatCrore(W("assistance_disbursed")), wel("disbursed"))
  check("Failed payments", digits(wel("failed")) === W("failed_payments"), wel("failed"))
  const schemeSum = (field: string) => total("welfare_schemes", field, [])
  check("Scheme applications add up to applications received", schemeSum("applications") === W("applications"), `${schemeSum("applications")} vs ${W("applications")}`)
  check("Scheme approved rupees add up to assistance approved", Math.abs(schemeSum("approved_rupees") - W("assistance_approved")) <= 1, `${schemeSum("approved_rupees")} vs ${W("assistance_approved")}`)
  check("Scheme disbursed rupees add up to amount disbursed", Math.abs(schemeSum("disbursed_rupees") - W("assistance_disbursed")) <= 1, `${schemeSum("disbursed_rupees")} vs ${W("assistance_disbursed")}`)

  console.log("\n--- Factories & Boilers, FY 2025-26")
  const factories = await getFactoriesOverview(DEFAULT_FACTORIES_FILTERS)
  const fac = (id: string) => digits(factories.kpis.find((item) => item.id === id)!.displayValue)
  const F = (field: string) => total("factories_monthly", field, [fy("2025-26")])
  for (const [id, field] of [["factories", "factories"], ["active", "active_establishments"], ["inspections", "inspections"], ["pending", "pending_inspections"], ["violations", "violations"], ["cases", "open_cases"], ["accidents", "accidents"], ["boilers", "boilers"], ["boilers-due", "boilers_due"]] as const) {
    check(`Factories ${id}`, fac(id) === F(field), `${fac(id)} vs ${F(field)}`)
  }
  const C = (field: string) => total("factories_categories", field, [])
  check("Category inspections add up to inspections", C("inspections") === F("inspections"), `${C("inspections")} vs ${F("inspections")}`)
  check("Category violations add up to violations", C("violations") === F("violations"), `${C("violations")} vs ${F("violations")}`)
  check("Category accidents add up to accidents", C("accidents") === F("accidents"), `${C("accidents")} vs ${F("accidents")}`)

  console.log("\n--- Gig Workers Welfare Board, April to September 2026")
  const gig = buildGigOverview(DEFAULT_GIG_FILTERS)
  const gk = (id: string) => gig.kpis.find((item) => item.id === id)!.value
  const G = (field: string, conditions: FilterCondition[] = [fy("2026-27")]) => total("gig_monthly", field, conditions)
  check("Records", G("records") === gk("records"), `${G("records")} vs ${gk("records")}`)
  check("Aggregators reporting is a point-in-time style count and is not summed", true)
  check("Payouts", G("payouts") === gk("payouts"), `${G("payouts")} vs ${gk("payouts")}`)
  check("Fee deposited", G("fee_deposited") === gk("deposited"), `${G("fee_deposited")} vs ${gk("deposited")}`)
  check("Benefits", G("benefits") === gk("benefits"), `${G("benefits")} vs ${gk("benefits")}`)
  check("Registered workers at 30 Sep 2026", G("unique_workers", [month("2026-09-01")]) === gk("unique"), `${G("unique_workers", [month("2026-09-01")])} vs ${gk("unique")}`)
  check("District payouts add up to payouts", total("gig_districts", "payouts", [fy("2026-27")]) === G("payouts"))
  check("Aggregator payouts add up to payouts", total("gig_aggregators", "payouts", [fy("2026-27")]) === G("payouts"))
  check("Aggregator records add up to records", total("gig_aggregators", "records", [fy("2026-27")]) === G("records"))
  check("Aggregator fee shortfall adds up to the monthly shortfall", Math.abs(total("gig_aggregators", "fee_shortfall", [fy("2026-27")]) - G("fee_shortfall")) <= 1)
  const blocked = (() => {
    const def = blank("gig_monthly")
    def.measures = [measure("unique_workers", "sum")]
    return validateReport(def, secretary).errors.some((error) => error.code === "single-month")
  })()
  check("Registered workers across months is refused", blocked)

  console.log("\n--- Unorganised Workers Social Security Board, April to September 2026")
  const ksu = buildKsuOverview(DEFAULT_KSU_FILTERS)
  const kk = (id: string) => ksu.kpis.find((item) => item.id === id)!.value
  const K = (field: string, conditions: FilterCondition[] = [fy("2026-27")]) => total("ksu_monthly", field, conditions)
  check("New registrations", K("new_registrations") === kk("newRegistrations"), `${K("new_registrations")} vs ${kk("newRegistrations")}`)
  check("Cases received", K("received") === kk("received"), `${K("received")} vs ${kk("received")}`)
  check("Benefits approved", K("approved") === kk("approved"), `${K("approved")} vs ${kk("approved")}`)
  check("Benefits disbursed", K("disbursed") === kk("disbursed"), `${K("disbursed")} vs ${kk("disbursed")}`)
  check("Registered workers at 30 Sep 2026", K("registered", [month("2026-09-01")]) === kk("registered"), `${K("registered", [month("2026-09-01")])} vs ${kk("registered")}`)
  check("Scheme enrolments at 30 Sep 2026", K("enrolments", [month("2026-09-01")]) === kk("enrolments"))
  check("Pending cases at 30 Sep 2026", K("pending", [month("2026-09-01")]) === kk("pending"))
  check("District benefits add up to benefits disbursed", total("ksu_districts", "disbursed", [fy("2026-27")]) === K("disbursed"))
  check("District cases add up to cases received", total("ksu_districts", "received", [fy("2026-27")]) === K("received"))
  check("Scheme approved add up to benefits approved", total("ksu_schemes", "approved", [fy("2026-27")]) === K("approved"))
  check("Scheme disbursed add up to benefits disbursed", total("ksu_schemes", "disbursed", [fy("2026-27")]) === K("disbursed"))

  console.log("\n--- Templates, seeded reports and dashboards")
  for (const template of TEMPLATES) {
    const user = USERS.find((candidate) => candidate.role === "secretary")!
    const outcome = runReport(definitionFromTemplate(template, "check"), user)
    check(`Template ${template.id}`, outcome.ok && outcome.result.rows.length > 0, outcome.ok ? `${outcome.result.rows.length} rows` : outcome.issues.map((issue) => issue.message).join("; "))
  }
  const db = seedDb()
  check("Seed version is 3", DB_VERSION === 3 && db.version === 3)
  for (const record of db.analytics_reports) {
    const owner = userById(record.createdBy)!
    const def = tablesToReport(db, record)
    const outcome = runReport(def, owner)
    check(`Report ${record.id} ${record.name}`, outcome.ok && outcome.result.rows.length > 0, outcome.ok ? `${outcome.result.rows.length} rows` : outcome.issues.map((issue) => issue.message).join("; "))
  }
  for (const dashboard of db.analytics_dashboards) {
    const owner = userById(dashboard.createdBy)!
    for (const widget of widgetRows(db, dashboard.id)) {
      const record = db.analytics_reports.find((item) => item.id === widget.reportId)!
      const outcome = runReport(tablesToReport(db, record), owner)
      check(`Dashboard ${dashboard.id} widget ${widget.id}`, outcome.ok && outcome.result.rows.length > 0)
    }
  }

  console.log("\n--- Natural language questions")
  for (const question of EXAMPLE_QUESTIONS) {
    const reading = interpretQuestion(question, secretary)
    const outcome = reading.ok && reading.def ? runReport(reading.def, secretary) : null
    check(`"${question}"`, Boolean(outcome?.ok && outcome.result.rows.length > 0), reading.ok ? `${reading.patternId}${outcome && !outcome.ok ? ": " + outcome.issues.map((issue) => issue.message).join("; ") : ""}` : reading.message)
  }
  const reading = interpretQuestion("Top 10 districts by welfare disbursement", secretary)
  check("Top 10 maps to the welfare register", reading.patternId === "welfare-money", reading.patternId)
  check("Another year on a single year dashboard is explained", interpretQuestion("Factory accidents by category for 2024-25", secretary).ok === false)
  check("SQL is refused", interpretQuestion("select * from labour_monthly where 1=1", secretary).ok === false)

  console.log("\n--- Roles and scope")
  const district = userById("u-district")!
  const mysuruOnly = (() => {
    const def = blank("labour_monthly")
    def.dimensions = [{ fieldId: "district" }]
    def.measures = [measure("inspections", "sum")]
    def.filters.children = [fy("2025-26")]
    def.visualization = defaultVisualization("table")
    const outcome = runReport(def, district)
    return outcome.ok && outcome.result.rows.length === 1 && outcome.result.rows[0][outcome.result.columns[0].id] === "Mysuru"
  })()
  check("District user sees only Mysuru", mysuruOnly)
  const welfareUser = userById("u-welfare")!
  const labourAsWelfare = runReport(definitionFromTemplate(TEMPLATES.find((item) => item.id === "tpl-district-cess-collection")!, "x"), welfareUser)
  check("Welfare board user cannot open labour data", !labourAsWelfare.ok)
  const own = runReport(definitionFromTemplate(TEMPLATES.find((item) => item.id === "tpl-scheme-assistance")!, "x"), welfareUser)
  check("Welfare board user can open welfare data", own.ok)
  const districtGig = runReport(definitionFromTemplate(TEMPLATES.find((item) => item.id === "tpl-gig-aggregator-fee")!, "x"), district)
  check("District user cannot open aggregator data", !districtGig.ok)

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`)
  process.exit(failures === 0 ? 0 : 1)
}

main()
