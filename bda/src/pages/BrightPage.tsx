import { BrightHero, ExploreMap, FeaturedInitiatives, HelplineCard, SearchAndQuick } from "@/components/bright/BrightSections";
import { Assets } from "@/components/civic/CivicSections";
import { ImportantLinks, LatestUpdates } from "@/components/dashboard/DashSections";
import { SitemapCallout } from "@/components/portal/SitemapCallout";

const ROW = "grid grid-cols-[minmax(0,1fr)] gap-5";

export function BrightPage() {
  return (
    <div className="flex flex-col gap-5 pb-8">
      <BrightHero />
      <SearchAndQuick />
      <SitemapCallout className="max-w-none px-4 pt-0 md:px-8 md:pt-0 lg:px-8" />
      <div className="flex flex-col gap-5 px-4 md:px-8">
        <div className={`${ROW} xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]`}>
          <ExploreMap />
          <FeaturedInitiatives />
        </div>
        <div className={`${ROW} xl:grid-cols-[minmax(0,1fr)_340px]`}>
          <LatestUpdates />
          <HelplineCard />
        </div>
        <div className={`${ROW} xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]`}>
          <Assets />
          <ImportantLinks />
        </div>
      </div>
    </div>
  );
}
