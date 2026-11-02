import { motion } from "motion/react";
import { FitBox } from "@/components/FitBox";
import { Checks, EASE, Outcome, Panel } from "@/components/SimpleKit";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  Code,
  GearSix,
  Headset,
  ListChecks,
  MagnifyingGlass,
  Monitor,
  SealCheck,
  UsersThree,
  Warning,
  WarningCircle,
  type CessIcon,
} from "@/lib/icons";

const PHASES: { name: string; weeks: string; desc: string; icon: CessIcon; color: string; span: number }[] = [
  { name: "Requirements & Prototype", weeks: "Weeks 1 – 3", desc: "Requirements, UI/UX and prototype", icon: MagnifyingGlass, color: "#1d4fc4", span: 3 },
  { name: "Development & Integration", weeks: "Weeks 4 – 7", desc: "Core modules and integrations", icon: Code, color: "#7c3aed", span: 4 },
  { name: "Testing & UAT", weeks: "Weeks 8 – 11", desc: "System testing and UAT", icon: ListChecks, color: "#16a34a", span: 4 },
  { name: "Deployment & Handover", weeks: "Weeks 12 – 16", desc: "Production, training and handover", icon: GearSix, color: "#ea7a0b", span: 5 },
  { name: "Support & Stabilization", weeks: "Weeks 17 – 18", desc: "Go-live confirmation", icon: Headset, color: "#0e7490", span: 2 },
];

const GATES = [
  "Functional and integration testing",
  "Security testing (VAPT by CERT-In empanelled auditor)",
  "User acceptance testing and sign-off",
  "Production release",
];

const HANDOVER = ["DIPR administrator and end-user training", "User manuals and technical documentation", "Knowledge transfer", "System handover"];

const SLA: { param: string; commitment: string; icon: CessIcon; color: string }[] = [
  { param: "System uptime", commitment: "99.5% monthly", icon: Monitor, color: "#1d4fc4" },
  { param: "Severity 1 – Critical", commitment: "4 hours", icon: Warning, color: "#dc2626" },
  { param: "Severity 2 – High", commitment: "8 working hours", icon: WarningCircle, color: "#ea7a0b" },
  { param: "Severity 3 – Medium", commitment: "2 working days", icon: Clock, color: "#2563eb" },
  { param: "Severity 4 – Low", commitment: "5 working days", icon: CheckCircle, color: "#16a34a" },
];

/** Beats: 0 five-phase timeline, 1 quality gates, 2 training and handover, 3 support SLA, 4 expected outcome. */
export function DeliveryScene({ beat }: { beat: number }) {
  return (
    <FitBox w={1440} h={744}>
      <div className="flex size-full flex-col gap-4 text-ink">
        <section className="flex min-h-0 flex-1 flex-col gap-3 rounded-2xl border border-[#c9d8ee] bg-white/95 p-4 shadow-[0_14px_28px_-24px_rgba(7,20,51,0.6)]">
          <h3 className="font-display text-[22px] font-bold text-navy">18-Week Implementation Timeline</h3>
          <div className="flex min-h-0 flex-1 gap-1.5">
            {PHASES.map((p, i) => {
              const I = p.icon;
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.12, duration: 0.45, ease: EASE }}
                  className="flex min-w-0 flex-col gap-2.5"
                  style={{ flex: `${p.span + 2} 1 0` }}
                >
                  <div
                    className="flex flex-1 flex-col justify-center gap-1.5 py-3 pr-8 pl-7 text-white [clip-path:polygon(0_0,calc(100%-22px)_0,100%_50%,calc(100%-22px)_100%,0_100%,18px_50%)] first:pl-4"
                    style={{ background: `linear-gradient(180deg, ${p.color}d8, ${p.color})` }}
                  >
                    <span className="flex items-center gap-2">
                      <I weight="duotone" className="size-[28px] shrink-0" />
                      <span className="font-display text-[16px] font-bold tracking-wide uppercase opacity-90">Phase {i + 1}</span>
                    </span>
                    <span className="font-display text-[19px] leading-tight font-bold">{p.name}</span>
                    <span className="w-fit rounded-full bg-white px-2.5 py-0.5 text-[15px] font-bold" style={{ color: p.color }}>
                      {p.weeks}
                    </span>
                  </div>
                  <div className="rounded-lg border border-[#d3def2] bg-[#f5f8fd] px-3 py-2 text-center text-[16px] leading-tight font-semibold text-navy">{p.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
          <Panel title="Quality Gates" icon={SealCheck} color="#16a34a" shown={beat >= 1} focus={beat === 1}>
            <Checks items={GATES} focus={beat === 1} className="gap-2.5 p-4 text-[18px]" />
          </Panel>
          <Panel title="Training and Handover" icon={UsersThree} color="#ea7a0b" shown={beat >= 2} focus={beat === 2}>
            <Checks items={HANDOVER} focus={beat === 2} className="gap-2.5 p-4 text-[18px]" />
          </Panel>
          <Panel title="Support as per RFP SLA" icon={Headset} color="#1d4fc4" shown={beat >= 3} focus={beat === 3}>
            <div className="grid min-h-0 flex-1 auto-rows-fr px-4 py-2">
              {SLA.map((r, i) => {
                const I = r.icon;
                return (
                  <div key={r.param} className={cn("flex items-center gap-2.5 text-[17px] leading-tight", i > 0 && "border-t border-[#d6dfeb]")}>
                    <I weight={r.icon === Warning || r.icon === WarningCircle ? "fill" : "bold"} className="size-[24px] shrink-0" style={{ color: r.color }} />
                    <span className="flex-1 font-semibold text-navy">{r.param}</span>
                    <span className="font-display text-right font-bold text-navy">{r.commitment}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <Outcome shown={beat >= 4}>A tested, deployed and supported Advertisement Monitoring Tool within the prescribed 18-week period.</Outcome>
      </div>
    </FitBox>
  );
}
