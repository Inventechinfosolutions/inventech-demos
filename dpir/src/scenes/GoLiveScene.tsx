import { motion } from "motion/react";
import { FitBox } from "@/components/FitBox";
import { Checks, Outcome, Panel } from "@/components/SimpleKit";
import trainingScene from "@/assets/photos/training.webp";
import { BookOpen, CheckCircle, Clock, Code, GearSix, Headset, Monitor, RocketLaunch, TreeStructure, UsersThree, Warning, WarningCircle, type CessIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const DEPLOYMENT = [
  "Production deployment",
  "Hosting at Karnataka State Data Centre or MeitY-empanelled cloud",
  "Production readiness validation",
  "System handover",
];

const TRAINING = ["DIPR administrator training", "End-user training", "Knowledge transfer"];

const DOCS: { label: string; icon: CessIcon }[] = [
  { label: "Architecture Document", icon: TreeStructure },
  { label: "User Manual", icon: BookOpen },
  { label: "API Guide", icon: Code },
  { label: "Maintenance Guide", icon: GearSix },
];

const SLA: { param: string; commitment: string; icon: CessIcon; color: string }[] = [
  { param: "System uptime", commitment: "99.5% monthly", icon: Monitor, color: "#1d4fc4" },
  { param: "Severity 1 – Critical", commitment: "Within 4 hours", icon: Warning, color: "#dc2626" },
  { param: "Severity 2 – High", commitment: "Within 8 working hours", icon: WarningCircle, color: "#ea7a0b" },
  { param: "Severity 3 – Medium", commitment: "Within 2 working days", icon: Clock, color: "#2563eb" },
  { param: "Severity 4 – Low", commitment: "Within 5 working days", icon: CheckCircle, color: "#16a34a" },
];

/** Beats: 0 deployment and handover, 1 training and documentation, 2 support SLA, 3 expected outcome. */
export function GoLiveScene({ beat }: { beat: number }) {
  return (
    <FitBox w={1440} h={744}>
      <div className="flex size-full flex-col gap-4 text-ink">
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.15fr)] gap-4">
          <Panel title="Deployment and Handover" icon={RocketLaunch} color="#16a34a" shown={beat >= 0} focus={beat === 0}>
            <Checks items={DEPLOYMENT} focus={beat === 0} spread className="p-4 text-[19px]" />
          </Panel>

          <Panel title="Training and Documentation" icon={UsersThree} color="#ea7a0b" shown={beat >= 1} focus={beat === 1}>
            <Checks items={TRAINING} focus={beat === 1} className="shrink-0 gap-3 px-4 pt-4 pb-2 text-[19px]" />
            <img src={trainingScene} alt="" draggable={false} className="mx-4 min-h-0 flex-1 rounded-xl object-cover shadow-[0_14px_28px_-18px_rgba(7,20,51,0.7)]" />
            <div className="grid shrink-0 grid-cols-4 gap-2 p-4">
              {DOCS.map((d) => {
                const I = d.icon;
                return (
                  <div key={d.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-[#d3def2] bg-linear-to-b from-white to-[#eef4fd] px-1 py-2.5 text-center text-[15px] leading-tight font-bold text-navy">
                    <I weight="duotone" className="size-[30px] text-[#ea7a0b]" />
                    {d.label}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Support as per RFP SLA" icon={Headset} color="#1d4fc4" shown={beat >= 2} focus={beat === 2}>
            <div className="grid min-h-0 flex-1 auto-rows-fr p-4">
              {SLA.map((r, i) => {
                const I = r.icon;
                return (
                  <motion.div
                    key={r.param}
                    initial={false}
                    animate={{ x: beat === 2 ? [12, 0] : 0 }}
                    transition={{ delay: beat === 2 ? 0.1 + i * 0.08 : 0, duration: 0.4 }}
                    className={cn("flex items-center gap-3 text-[18px] leading-tight", i > 0 && "border-t border-[#d6dfeb]")}
                  >
                    <I weight={r.icon === Warning || r.icon === WarningCircle ? "fill" : "bold"} className="size-[28px] shrink-0" style={{ color: r.color }} />
                    <span className="flex-1 font-semibold text-navy">{r.param}</span>
                    <span className="font-display text-right font-bold text-navy">{r.commitment}</span>
                  </motion.div>
                );
              })}
            </div>
          </Panel>
        </div>

        <Outcome shown={beat >= 3}>A deployed, documented and maintainable platform supported by trained users and an agreed SLA.</Outcome>
      </div>
    </FitBox>
  );
}
