import { AnnouncementsCard, DepartmentsCard, InfoColumn, JurisdictionMap, OnlineServicesCard, PlannerHero, ServiceTiles } from "@/components/planner/PlannerSections";

export function PlannerPage() {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,410px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,430px)]">
        <PlannerHero />
        <JurisdictionMap />
      </div>
      <ServiceTiles />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 xl:flex-1 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)_minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <AnnouncementsCard />
        <DepartmentsCard />
        <OnlineServicesCard />
        <InfoColumn />
      </div>
    </div>
  );
}
