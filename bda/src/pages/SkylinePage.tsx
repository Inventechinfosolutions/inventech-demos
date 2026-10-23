import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/components/home/shared";
import { AnnouncementsCard, DepartmentsCard, InfoColumn, JurisdictionMap, OnlineServicesCard, PhotoTiles, PlannerHero } from "@/components/planner/PlannerSections";
import { asset } from "@/lib/utils";

export function SkylinePage() {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl shadow-[0_24px_50px_-34px_rgba(60,45,20,0.6)]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <motion.img
            src={asset("images/skyline-hero.webp")}
            alt=""
            initial={{ opacity: 0, scale: 1.08 }}
            animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [1.02, 1.07, 1.02] }}
            transition={reduce ? { duration: 1 } : { opacity: { duration: 1.2, ease: EASE }, scale: { duration: 30, repeat: Infinity, ease: "easeInOut" } }}
            className="size-full object-cover object-[62%_55%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--pl-page1)_0%,color-mix(in_srgb,var(--pl-page1)_88%,transparent)_26%,color-mix(in_srgb,var(--pl-page1)_35%,transparent)_46%,transparent_62%)]" />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[color-mix(in_srgb,var(--pl-page1)_55%,transparent)] to-transparent" />
        </div>
        <div className="relative grid grid-cols-[minmax(0,1fr)] gap-3 p-2 sm:p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,450px)]">
          <PlannerHero />
          <JurisdictionMap />
        </div>
      </div>
      <PhotoTiles />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2 xl:flex-1 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)_minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <AnnouncementsCard />
        <DepartmentsCard />
        <OnlineServicesCard />
        <InfoColumn />
      </div>
      <p className="-mt-1 text-right text-[9.5px] text-muted/80">Tile photos: Unsplash</p>
    </div>
  );
}
