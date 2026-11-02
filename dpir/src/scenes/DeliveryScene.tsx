import { motion } from "motion/react";
import { FitBox } from "@/components/FitBox";
import { EASE, Outcome } from "@/components/SimpleKit";
import {
  CaretRight,
  Code,
  GearSix,
  Headset,
  ListChecks,
  MagnifyingGlass,
  PlugsConnected,
  RocketLaunch,
  SealCheck,
  ShieldCheck,
  UsersThree,
  type CessIcon,
} from "@/lib/icons";

const PHASES: { name: string; weeks: string; desc: string; icon: CessIcon; color: string; span: number }[] = [
  { name: "Requirements & Prototype", weeks: "Weeks 1 – 3", desc: "Requirements, UI/UX and prototype", icon: MagnifyingGlass, color: "#1d4fc4", span: 3 },
  { name: "Development & Integration", weeks: "Weeks 4 – 7", desc: "Core modules and integrations", icon: Code, color: "#7c3aed", span: 4 },
  { name: "Testing & UAT", weeks: "Weeks 8 – 11", desc: "System testing and UAT", icon: ListChecks, color: "#16a34a", span: 4 },
  { name: "Deployment & Handover", weeks: "Weeks 12 – 16", desc: "Production, training and handover", icon: GearSix, color: "#ea7a0b", span: 5 },
  { name: "Support & Stabilization", weeks: "Weeks 17 – 18", desc: "Go-live confirmation", icon: Headset, color: "#0e7490", span: 2 },
];

const GATES: { name: string; when: string; icon: CessIcon; color: string }[] = [
  { name: "Functional Testing", when: "Weeks 8 – 11", icon: ListChecks, color: "#7c3aed" },
  { name: "Integration Testing", when: "Weeks 8 – 11", icon: PlugsConnected, color: "#16a34a" },
  { name: "Security Testing (VAPT by CERT-In empanelled auditor)", when: "Weeks 8 – 11", icon: ShieldCheck, color: "#ea7a0b" },
  { name: "User Acceptance Testing and Sign-off", when: "Week 11", icon: UsersThree, color: "#1d4fc4" },
  { name: "Production Release", when: "Weeks 12 – 16", icon: RocketLaunch, color: "#0e7490" },
];

/** Beats: 0 five-phase timeline, 1 quality gates, 2 expected outcome. */
export function DeliveryScene({ beat }: { beat: number }) {
  return (
    <FitBox w={1440} h={744}>
      <div className="flex size-full flex-col gap-4 text-ink">
        <section className="flex min-h-0 flex-[1.15] flex-col gap-3 rounded-2xl border border-[#c9d8ee] bg-white/95 p-4 shadow-[0_14px_28px_-24px_rgba(7,20,51,0.6)]">
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

        <motion.section
          initial={false}
          animate={{
            opacity: beat >= 1 ? 1 : 0.3,
            boxShadow: beat === 1 ? "0 0 0 2.5px #16a34a, 0 24px 40px -24px #16a34a" : "0 14px 28px -24px rgba(7,20,51,0.6)",
          }}
          transition={{ duration: 0.45, ease: EASE }}
          className="flex min-h-0 flex-1 items-stretch gap-3 rounded-2xl border border-[#c9d8ee] bg-white/95 p-3"
        >
          <div className="font-display flex w-[200px] shrink-0 items-center gap-3 rounded-xl bg-linear-to-r from-[#15803d] to-[#16a34a] px-4 text-[21px] leading-tight font-bold text-white">
            <SealCheck weight="duotone" className="size-[34px] shrink-0" />
            Quality Gates
          </div>
          {GATES.map((g, i) => {
            const I = g.icon;
            return (
              <div key={g.name} className="contents">
                {i > 0 && <CaretRight weight="bold" className="size-[20px] shrink-0 self-center text-navy/50" />}
                <motion.div
                  initial={false}
                  animate={{ y: beat === 1 ? [10, 0] : 0 }}
                  transition={{ delay: beat === 1 ? 0.1 + i * 0.1 : 0, duration: 0.4 }}
                  className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-[#d3def2] bg-linear-to-b from-white to-[#f2f6fd] px-2 text-center"
                >
                  <span className="grid size-[50px] place-items-center rounded-full" style={{ background: `${g.color}18`, color: g.color }}>
                    <I weight="duotone" className="size-[28px]" />
                  </span>
                  <span className="font-display text-[17px] leading-tight font-bold text-navy">{g.name}</span>
                  <span className="rounded-full px-2.5 py-0.5 text-[15px] font-bold" style={{ background: `${g.color}14`, color: g.color }}>
                    {g.when}
                  </span>
                </motion.div>
              </div>
            );
          })}
        </motion.section>

        <Outcome shown={beat >= 2}>A fully deployed and tested Advertisement Monitoring Tool within the prescribed 18-week period.</Outcome>
      </div>
    </FitBox>
  );
}
