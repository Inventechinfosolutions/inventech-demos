import { motion } from "motion/react";
import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { BrightShell } from "@/components/bright/BrightShell";
import { DashboardShell } from "@/components/dashboard/DashShell";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { DesignSwitcher } from "@/components/layout/DesignSwitcher";
import { MainNav } from "@/components/layout/MainNav";
import { QuickStrip } from "@/components/layout/QuickStrip";
import { BackToTop, ScrollProgress } from "@/components/layout/ScrollExtras";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopBar } from "@/components/layout/TopBar";
import { PlannerShell } from "@/components/planner/PlannerShell";
import { PortalNav } from "@/components/portal/PortalNav";
import { DESIGNS, DesignProvider } from "@/lib/design";
import { useVisibility } from "@/lib/visibility";
import { CivicPage } from "@/pages/CivicPage";
import { BrightPage } from "@/pages/BrightPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { GardenPage } from "@/pages/GardenPage";
import { GalleryPage } from "@/pages/GalleryPage";
import { GeometricPage } from "@/pages/GeometricPage";
import { HomePage } from "@/pages/HomePage";
import { HorizonPage } from "@/pages/HorizonPage";
import { ModernPage } from "@/pages/ModernPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { OrbitPage } from "@/pages/OrbitPage";
import { PlannerPage } from "@/pages/PlannerPage";
import { SkylinePage } from "@/pages/SkylinePage";
import { PortalPage } from "@/pages/PortalPage";
import { SitemapPage } from "@/pages/SitemapPage";
import { ShowcasePage } from "@/pages/ShowcasePage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Site() {
  const { pathname } = useLocation();
  const { ready, admin, isHidden } = useVisibility();
  const match = DESIGNS.find((d) => d.path === pathname)?.id;
  const design = match ?? (pathname === "/sitemap" ? "portal" : "photo");
  if (ready && !admin && match && isHidden(match)) return <Navigate to="/" replace />;
  if (design === "dashboard")
    return (
      <DesignProvider value={design}>
        <DashboardShell>
          <motion.main key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flex-1">
            <Outlet />
          </motion.main>
          <SiteFooter />
          <DesignSwitcher />
          <ScrollProgress />
          <BackToTop />
        </DashboardShell>
      </DesignProvider>
    );
  if (design === "bright")
    return (
      <DesignProvider value={design}>
        <BrightShell>
          <motion.main key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="flex-1">
            <Outlet />
          </motion.main>
          <SiteFooter />
          <DesignSwitcher />
          <ScrollProgress />
          <BackToTop />
        </BrightShell>
      </DesignProvider>
    );
  if (design === "planner" || design === "skyline")
    return (
      <DesignProvider value={design}>
        <PlannerShell variant={design}>
          <motion.main key={pathname} className="flex flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Outlet />
          </motion.main>
        </PlannerShell>
        <DesignSwitcher />
        <ScrollProgress />
        <BackToTop />
      </DesignProvider>
    );
  return (
    <DesignProvider value={design}>
      <div className="flex min-h-svh flex-col">
        <TopBar />
        {design !== "garden" && design !== "horizon" && <BrandHeader />}
        {design === "portal" || design === "civic" || design === "garden" || design === "horizon" ? <PortalNav /> : <MainNav />}
        <QuickStrip />
        <motion.main
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-1"
        >
          <Outlet />
        </motion.main>
        <SiteFooter />
        <DesignSwitcher />
        <ScrollProgress />
        <BackToTop />
      </div>
    </DesignProvider>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<GalleryPage />} />
        <Route element={<Site />}>
          <Route path="/design-1" element={<HomePage />} />
          <Route path="/design-2" element={<HomePage />} />
          <Route path="/design-3" element={<ShowcasePage />} />
          <Route path="/design-4" element={<ModernPage />} />
          <Route path="/design-5" element={<GeometricPage />} />
          <Route path="/design-6" element={<OrbitPage />} />
          <Route path="/design-7" element={<PortalPage />} />
          <Route path="/design-8" element={<CivicPage />} />
          <Route path="/design-9" element={<GardenPage />} />
          <Route path="/design-10" element={<DashboardPage />} />
          <Route path="/design-11" element={<BrightPage />} />
          <Route path="/design-12" element={<HorizonPage />} />
          <Route path="/design-13" element={<PlannerPage />} />
          <Route path="/design-14" element={<SkylinePage />} />
          <Route path="/sitemap" element={<SitemapPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
