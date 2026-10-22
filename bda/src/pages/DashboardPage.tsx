import { Assets } from "@/components/civic/CivicSections";
import { CurrentInitiatives, DashHero, ExploreBengaluru, ImportantLinks, LatestUpdates, ServiceStrip } from "@/components/dashboard/DashSections";
import { SitemapCallout } from "@/components/portal/SitemapCallout";

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-5 pb-8">
      <DashHero />
      <ServiceStrip />
      <SitemapCallout className="max-w-none px-4 pt-0 md:px-7 md:pt-0 lg:px-7" />
      <div className="flex flex-col gap-5 px-4 md:px-7">
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <ExploreBengaluru />
          <CurrentInitiatives />
        </div>
        <LatestUpdates />
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <Assets />
          <ImportantLinks />
        </div>
      </div>
    </div>
  );
}
