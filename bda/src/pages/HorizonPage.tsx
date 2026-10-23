import { HorizonHero, HorizonInitiatives, PropertyLand, QuickCitizenServices, UpdatesAndLinks } from "@/components/horizon/HorizonSections";

export function HorizonPage() {
  return (
    <div className="relative isolate space-y-10 overflow-x-clip bg-[linear-gradient(180deg,#fbf8f1_0%,#eef6fb_30%,#f3f9f1_60%,#f6f8fb_100%)] pb-12">
      <HorizonHero />
      <QuickCitizenServices />
      <HorizonInitiatives />
      <PropertyLand />
      <UpdatesAndLinks />
    </div>
  );
}
