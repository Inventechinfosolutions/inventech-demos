import { motion } from "motion/react";
import { BDA_HERO, HeroSlides } from "@/components/home/HeroSlides";
import { EASE } from "@/components/home/shared";
import { AnnouncementsCard, DepartmentsCard, InfoColumn, JurisdictionMap, OnlineServicesCard, PhotoTiles, PlannerHero } from "@/components/planner/PlannerSections";

const SLIDES = ["images/skyline-hero.webp", ...BDA_HERO];

export function SkylinePage() {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl shadow-[0_24px_50px_-34px_rgba(60,45,20,0.6)]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease: EASE }}>
            <HeroSlides images={SLIDES} imgClassName="object-[62%_55%]" />
          </motion.div>
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
      <p className="-mt-1 text-right text-[9.5px] text-muted/80">Aerial photos: BDA. Tile photos: Unsplash</p>
    </div>
  );
}
