export interface ChartSeries {
  name: string
  color: string
  values: number[]
}

export interface ChartModel {
  id: string
  title: string
  description: string
  kind: "line" | "grouped" | "stacked-line" | "horizontal"
  categories: string[]
  series: ChartSeries[]
  unit: "count" | "crore" | "lakh"
  line?: ChartSeries
  lineUnit?: "lakh"
  emptyLabel?: string
  stack?: boolean
  height?: number
}

export interface DistrictMetric {
  id: string
  name: string
  projects: number
  workers: number
  cessAssessed: number
  cessCollected: number
  cessRemitted: number
  cessCredited: number
  beneficiaries: number
  disbursement: number
  pendingApplications: number
}

export interface DetailColumn {
  key: string
  label: string
  align?: "left" | "right"
  kind?: "text" | "status" | "priority"
}

export interface DetailModel {
  title: string
  summary: string
  note: string
  columns: DetailColumn[]
  rows: Record<string, string>[]
}
