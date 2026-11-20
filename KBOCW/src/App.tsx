import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AnalyticsLayout } from "@/analytics/components/AnalyticsLayout"
import { AppShell } from "@/components/layout/AppShell"
import { FactoriesDashboard } from "@/pages/FactoriesDashboard"
import { IntelligenceDashboard } from "@/pages/IntelligenceDashboard"
import { LabourDashboard } from "@/pages/LabourDashboard"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { SecretaryDashboard } from "@/pages/SecretaryDashboard"
import { WelfareDashboard } from "@/pages/WelfareDashboard"

// The analytics workspace carries ECharts configuration, exporters and the mock engine. Each screen loads on demand.
const AnalyticsHomePage = lazy(() => import("@/pages/analytics/AnalyticsHomePage"))
const ReportBuilderPage = lazy(() => import("@/pages/analytics/ReportBuilderPage"))
const ReportViewPage = lazy(() => import("@/pages/analytics/ReportViewPage"))
const DashboardBuilderPage = lazy(() => import("@/pages/analytics/DashboardBuilderPage"))
const DashboardViewPage = lazy(() => import("@/pages/analytics/DashboardViewPage"))
const DatasetExplorerPage = lazy(() => import("@/pages/analytics/DatasetExplorerPage"))
const SavedReportsPage = lazy(() => import("@/pages/analytics/SavedReportsPage"))
const SavedDashboardsPage = lazy(() => import("@/pages/analytics/SavedDashboardsPage"))
const RecentAnalysisPage = lazy(() => import("@/pages/analytics/RecentAnalysisPage"))
const TemplatesPage = lazy(() => import("@/pages/analytics/TemplatesPage"))
const HelpPage = lazy(() => import("@/pages/analytics/HelpPage"))

// The gig workers extract is the largest data file in the portal, so its dashboard loads on demand.
const GigWorkersDashboard = lazy(() => import("@/pages/GigWorkersDashboard").then((module) => ({ default: module.GigWorkersDashboard })))

const KsuwssbDashboard = lazy(() => import("@/pages/KsuwssbDashboard").then((module) => ({ default: module.KsuwssbDashboard })))

const basename = import.meta.env.BASE_URL.replace(/\/$/, "")

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<SecretaryDashboard />} />
          <Route path="departments/labour-commissionerate" element={<LabourDashboard />} />
          <Route path="departments/kbocw-welfare-board" element={<WelfareDashboard />} />
          <Route path="departments/factories-boilers" element={<FactoriesDashboard />} />
          <Route
            path="departments/gig-workers-welfare-board"
            element={
              <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-[color:var(--c-bg-fedfd1)]" aria-label="Loading" />}>
                <GigWorkersDashboard />
              </Suspense>
            }
          />
          <Route
            path="departments/ksuwssb"
            element={
              <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-[color:var(--c-bg-fedfd1)]" aria-label="Loading" />}>
                <KsuwssbDashboard />
              </Suspense>
            }
          />
          <Route path="departments/:slug" element={<PlaceholderPage />} />
          <Route path="intelligence/cross-analytics" element={<IntelligenceDashboard />} />
          <Route path="intelligence/:slug" element={<PlaceholderPage />} />
          <Route path="analytics" element={<AnalyticsLayout />}>
            <Route index element={<AnalyticsHomePage />} />
            <Route path="build-report" element={<ReportBuilderPage />} />
            <Route path="build-report/:reportId" element={<ReportBuilderPage />} />
            <Route path="build-dashboard" element={<DashboardBuilderPage />} />
            <Route path="build-dashboard/:id" element={<DashboardBuilderPage />} />
            <Route path="datasets" element={<DatasetExplorerPage />} />
            <Route path="reports" element={<SavedReportsPage />} />
            <Route path="reports/:id" element={<ReportViewPage />} />
            <Route path="dashboards" element={<SavedDashboardsPage />} />
            <Route path="dashboards/:id" element={<DashboardViewPage />} />
            <Route path="recent" element={<RecentAnalysisPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="help" element={<HelpPage />} />
          </Route>
          <Route path="integration" element={<PlaceholderPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
