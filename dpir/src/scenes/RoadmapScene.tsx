import { motion } from "motion/react";
import { useState } from "react";
import { FitBox } from "@/components/FitBox";
import {
  CalendarDots,
  CheckCircle,
  CheckSquare,
  Code,
  FileMagnifyingGlass,
  GearSix,
  GraduationCap,
  Headset,
  ListChecks,
  Monitor,
  RocketLaunch,
  Target,
  TreeStructure,
  UsersThree,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const PHASES: { name: string; weeks: string; desc: string; icon: CessIcon; color: string; activities: [string, string] }[] = [
  {
    name: "Requirements & Prototype",
    weeks: "Weeks 1 – 3",
    desc: "Requirements finalization, UI/UX and prototype development",
    icon: FileMagnifyingGlass,
    color: "#1d4fc4",
    activities: ["Requirements finalization and validation with DIPR.", "UI/UX design and prototype development."],
  },
  {
    name: "Development & Integration",
    weeks: "Weeks 4 – 7",
    desc: "Development of core modules and integration",
    icon: Code,
    color: "#7c3aed",
    activities: ["Development of core modules (campaign, assets, execution, PoD, reporting).", "Integration with required DIPR systems and external services."],
  },
  {
    name: "Testing & UAT",
    weeks: "Weeks 8 – 11",
    desc: "System testing, bug fixes and UAT",
    icon: ListChecks,
    color: "#16a34a",
    activities: ["System and integration testing.", "Bug fixing, performance checks and User Acceptance Testing (UAT)."],
  },
  {
    name: "Deployment & Handover",
    weeks: "Weeks 12 – 16",
    desc: "Deployment, production setup and handover",
    icon: GearSix,
    color: "#ea7a0b",
    activities: ["Production deployment and environment setup.", "Data configuration, user setup, training, knowledge transfer and handover."],
  },
  {
    name: "Support & Stabilization",
    weeks: "Weeks 17 – 18",
    desc: "Post-deployment support and stabilization",
    icon: Headset,
    color: "#1e6fd9",
    activities: ["Post-deployment support and issue resolution.", "Stabilization, performance monitoring and go-live confirmation."],
  },
];

const WEEK_MARKS = ["Week 1", "Week 4", "Week 8", "Week 12", "Week 17"];

/** Phase during which each delivery step is carried out. */
const APPROACH: { text: string; icon: CessIcon; phase: number }[] = [
  { text: "Requirement analysis and validation.", icon: UsersThree, phase: 0 },
  { text: "Prototype and UI/UX finalization.", icon: Monitor, phase: 0 },
  { text: "Iterative module development.", icon: Code, phase: 1 },
  { text: "Integration and testing.", icon: TreeStructure, phase: 1 },
  { text: "User acceptance and sign-off.", icon: CheckSquare, phase: 2 },
  { text: "Production deployment.", icon: RocketLaunch, phase: 3 },
  { text: "Knowledge transfer and handover.", icon: GraduationCap, phase: 3 },
  { text: "Stabilization and post-deployment support.", icon: Headset, phase: 4 },
];

/**
 * Beats 0-4 walk the five phases along the timeline, beat 5 project delivery approach, beat 6 expected outcome.
 */
export function RoadmapScene({ beat }: { beat: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const reached = Math.min(beat, 4);
  const active = hover ?? (beat <= 4 ? beat : null);

  return (
    <FitBox w={1440} h={744}>
      <div className="flex size-full flex-col gap-3 text-[14px] text-ink">
        <Timeline reached={reached} active={active} onHover={setHover} />
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_470px] gap-3">
          <PlanTable reached={reached} active={active} onHover={setHover} />
          <Approach reached={reached} focus={beat === 5} active={active} />
        </div>
        <Outcome shown={beat >= 6} />
      </div>
    </FitBox>
  );
}

type PhaseProps = { reached: number; active: number | null; onHover: (i: number | null) => void };

function SectionHead({ icon: I, children }: { icon: CessIcon; children: string }) {
  return (
    <div className="font-display flex shrink-0 items-center gap-2.5 bg-linear-to-r from-navy to-[#1d4fc4] px-4 py-2 text-[18px] font-bold text-white">
      <I weight="duotone" className="size-[24px]" />
      {children}
    </div>
  );
}

function Timeline({ reached, active, onHover }: PhaseProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="shrink-0 overflow-hidden rounded-xl border border-[#c9d8ee] bg-white/95 shadow-[0_14px_28px_-24px_rgba(7,20,51,0.6)]"
    >
      <SectionHead icon={CalendarDots}>Implementation Timeline – 18 Weeks (5 Phases)</SectionHead>
      <div className="px-3 pt-3">
        <div className="grid grid-cols-5 gap-1.5">
          {PHASES.map((p, i) => {
            const I = p.icon;
            const on = i <= reached;
            const focus = active === i;
            return (
              <motion.div
                key={p.name}
                onMouseEnter={() => onHover(i)}
                onMouseLeave={() => onHover(null)}
                initial={false}
                animate={{ opacity: on || focus ? 1 : 0.35, y: focus ? -3 : 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-2"
              >
                <div
                  className={cn(
                    "relative flex h-[84px] items-center gap-3 overflow-hidden pr-7 pl-4 text-white",
                    i === 0
                      ? "rounded-l-xl [clip-path:polygon(0_0,calc(100%-22px)_0,100%_50%,calc(100%-22px)_100%,0_100%)]"
                      : "pl-8 [clip-path:polygon(0_0,calc(100%-22px)_0,100%_50%,calc(100%-22px)_100%,0_100%,22px_50%)]",
                  )}
                  style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}d0)` }}
                >
                  <span className="grid size-[50px] shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/35">
                    <I weight="duotone" className="size-[32px]" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col items-center leading-tight">
                    <span className="font-display text-[19px] font-bold">Phase {i + 1}</span>
                    <span className="text-center text-[14px] font-semibold text-white/95">{p.name}</span>
                    <span className="mt-1 rounded-full bg-white px-3 py-0.5 text-[13.5px] font-bold" style={{ color: p.color }}>
                      {p.weeks}
                    </span>
                  </span>
                  {focus && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-y-0 w-16 -skew-x-12 bg-linear-to-r from-transparent via-white/40 to-transparent"
                      animate={{ left: ["-20%", "120%"] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>
                <div
                  className="mx-1 flex h-[48px] items-center justify-center rounded-lg border px-3 text-center leading-tight text-navy"
                  style={{ borderColor: `${p.color}55`, background: `${p.color}10` }}
                >
                  {p.desc}
                </div>
              </motion.div>
            );
          })}
        </div>
        <Axis reached={reached} />
      </div>
    </motion.section>
  );
}

function Axis({ reached }: { reached: number }) {
  const progress = (reached + 1) / 5;
  return (
    <div className="relative mx-3 mt-3 h-[42px]">
      <span className="absolute top-[9px] right-0 left-0 h-[4px] rounded-full bg-[#dbe4f0]" />
      <motion.span
        className="absolute top-[9px] right-0 left-0 h-[4px] rounded-full"
        style={{ background: `linear-gradient(90deg, ${PHASES.map((p) => p.color).join(", ")})` }}
        initial={false}
        animate={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0 round 4px)` }}
        transition={{ duration: 0.8, ease: EASE }}
      />
      <motion.span
        className="absolute top-[3px] size-[16px] -translate-x-1/2 rounded-full bg-white"
        initial={false}
        animate={{ left: `${progress * 100}%`, boxShadow: `0 0 0 4px ${PHASES[reached].color}, 0 0 0 9px ${PHASES[reached].color}33` }}
        transition={{ duration: 0.8, ease: EASE }}
      />
      <svg className="absolute top-[3px] -right-2 size-[16px]" viewBox="0 0 16 16">
        <path d="M2 2 L14 8 L2 14 z" fill={reached >= 4 ? PHASES[4].color : "#c3cfe0"} />
      </svg>
      {WEEK_MARKS.map((w, i) => (
        <Mark key={w} label={w} left={`${(i / 5) * 100}%`} color={PHASES[i].color} on={i <= reached} first={i === 0} />
      ))}
      <Mark label="Week 18" left="100%" color={PHASES[4].color} on={reached >= 4} end />
    </div>
  );
}

function Mark({ label, left, color, on, end, first }: { label: string; left: string; color: string; on: boolean; end?: boolean; first?: boolean }) {
  return (
    <div
      className={cn("absolute top-0 flex flex-col whitespace-nowrap", end ? "-translate-x-full items-end" : first ? "-ml-[11px] items-start" : "-translate-x-1/2 items-center")}
      style={{ left }}
    >
      {end ? (
        <span className="h-[22px]" />
      ) : (
        <motion.span
          initial={false}
          animate={{ backgroundColor: on ? color : "#ffffff", borderColor: on ? color : "#c3cfe0" }}
          className="size-[22px] rounded-full border-[3px] bg-white"
        />
      )}
      <span className="font-display text-[15px] leading-tight font-bold text-navy">{label}</span>
    </div>
  );
}

function PlanTable({ reached, active, onHover }: PhaseProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#c9d8ee] bg-white/95 shadow-[0_14px_28px_-24px_rgba(7,20,51,0.6)]"
    >
      <SectionHead icon={Target}>Implementation Plan – Phase-wise Overview</SectionHead>
      <div className="m-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#cfd9e8]">
        <div className="grid shrink-0 grid-cols-[130px_130px_minmax(0,1fr)] border-b border-[#cfd9e8] bg-[#eef2f8] font-bold text-navy [&>*]:px-3 [&>*]:py-1.5 [&>*+*]:border-l [&>*+*]:border-[#d6dfeb]">
          <span className="text-center">Phase</span>
          <span className="text-center">Timeline</span>
          <span>Key Activities</span>
        </div>
        <div className="grid min-h-0 flex-1 auto-rows-fr">
          {PHASES.map((p, i) => {
            const on = i <= reached;
            const focus = active === i;
            return (
              <motion.div
                key={p.name}
                onMouseEnter={() => onHover(i)}
                onMouseLeave={() => onHover(null)}
                initial={false}
                animate={{ opacity: on || focus ? 1 : 0.35, backgroundColor: focus ? `${p.color}10` : "rgba(255,255,255,0)" }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "grid min-h-0 grid-cols-[130px_130px_minmax(0,1fr)] [&>*]:flex [&>*]:items-center [&>*]:px-3 [&>*+*]:border-l [&>*+*]:border-[#d6dfeb]",
                  i > 0 && "border-t border-[#d6dfeb]",
                )}
              >
                <span className="justify-center">
                  <motion.span
                    animate={{ scale: focus ? 1.06 : 1 }}
                    className="font-display w-full rounded-lg py-1.5 text-center text-[16px] font-bold text-white shadow-sm"
                    style={{ background: `linear-gradient(180deg, ${p.color}d8, ${p.color})` }}
                  >
                    Phase {i + 1}
                  </motion.span>
                </span>
                <span className="font-display justify-center text-[16px] font-bold whitespace-nowrap text-navy">{p.weeks}</span>
                <ul className="flex-col !items-start justify-center gap-0.5 leading-tight text-navy">
                  {p.activities.map((a, j) => (
                    <motion.li
                      key={a}
                      initial={false}
                      animate={{ x: focus ? [8, 0] : 0 }}
                      transition={{ delay: focus ? 0.1 + j * 0.1 : 0, duration: 0.35 }}
                      className="flex items-start gap-2"
                    >
                      <span className="mt-[6px] size-[6px] shrink-0 rounded-full" style={{ background: p.color }} />
                      {a}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

function Approach({ reached, focus, active }: { reached: number; focus: boolean; active: number | null }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 12 }}
      animate={{
        opacity: 1,
        x: 0,
        boxShadow: focus ? "0 0 0 2.5px #1d4fc4, 0 22px 40px -24px #1d4fc4" : "0 14px 28px -24px rgba(7,20,51,0.6)",
      }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#c9d8ee] bg-white/95"
    >
      <SectionHead icon={GearSix}>Project Delivery Approach</SectionHead>
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-1 p-2">
        {APPROACH.map((a, i) => {
          const I = a.icon;
          const color = PHASES[a.phase].color;
          const on = a.phase <= reached || focus;
          const hot = active === a.phase || focus;
          return (
            <motion.div
              key={a.text}
              initial={false}
              animate={{
                opacity: on ? 1 : 0.4,
                x: hot ? 3 : 0,
                borderColor: hot ? `${color}88` : "#dbe4f0",
                backgroundColor: hot ? `${color}10` : "#f6f9fd",
              }}
              transition={{ duration: 0.35, delay: focus ? i * 0.05 : 0 }}
              className="flex min-h-0 flex-1 items-center gap-3 rounded-lg border px-3"
            >
              <I weight="duotone" className="size-[26px] shrink-0" style={{ color }} />
              <span className="flex-1 text-[14.5px] text-navy">{a.text}</span>
              <motion.span initial={false} animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ type: "spring", stiffness: 320, damping: 18 }}>
                <CheckCircle weight="fill" className="size-[18px] text-[#16a34a]" />
              </motion.span>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

function Outcome({ shown }: { shown: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.99 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex h-[54px] shrink-0 items-center gap-5 overflow-hidden rounded-2xl border border-[#7c3aed]/25 bg-[linear-gradient(90deg,#f5f3ff,#ffffff_60%,#f5f3ff)] pr-5 shadow-[0_14px_30px_-24px_rgba(7,20,51,0.7)]"
    >
      <span className="font-display flex h-full shrink-0 items-center gap-2.5 bg-linear-to-r from-[#5b21b6] to-[#7c3aed] pr-8 pl-4 text-[19px] font-bold text-white [clip-path:polygon(0_0,calc(100%-18px)_0,100%_50%,calc(100%-18px)_100%,0_100%)]">
        <CheckCircle weight="duotone" className="size-[26px]" /> Expected Outcome
      </span>
      <span className="h-8 w-px shrink-0 bg-navy/25" />
      <p className="font-display flex-1 text-center text-[18px] leading-snug font-bold text-navy">
        A fully deployed and tested Advertisement Monitoring Tool within the prescribed 18-week implementation period.
      </p>
    </motion.div>
  );
}
