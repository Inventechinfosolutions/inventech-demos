import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { FitBox } from "@/components/FitBox";
import { Count } from "@/scenes/MonitorScene";
import trainingScene from "@/assets/photos/training-scene.jpg";
import {
  BookOpen,
  CalendarCheck,
  CaretRight,
  CheckCircle,
  Clock,
  Code,
  FileText,
  GearSix,
  Megaphone,
  Info,
  Monitor,
  RocketLaunch,
  Stack,
  Target,
  TreeStructure,
  UsersThree,
  Warning,
  WarningCircle,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const STAGES: { title: string; sub: string; art: () => ReactNode; color: string; light?: boolean }[] = [
  { title: "Development", sub: "(Build & Configure)", art: DevIcon, color: "#cfe0fb", light: true },
  { title: "Testing", sub: "(Validate & Ensure Readiness)", art: TestIcon, color: "#7c3aed" },
  { title: "Production", sub: "(Go-Live & Operate)", art: ServerIcon, color: "#16a34a" },
  { title: "Training", sub: "(Onboard & Handhold)", art: TrainIcon, color: "#ea7a0b" },
  { title: "Support", sub: "(Maintain & Ensure Continuity)", art: SupportIcon, color: "#1d4fc4" },
];

const ICON = { width: 34, height: 34, viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function DevIcon() {
  return (
    <svg {...ICON}>
      <rect x="7" y="9" width="34" height="23" rx="2.5" fill="currentColor" fillOpacity="0.12" />
      <path d="M3 37h42l-2.5 3.5h-37z" fill="currentColor" fillOpacity="0.25" />
      <path d="M19 16l-5 4.5 5 4.5M29 16l5 4.5-5 4.5M26 14.5l-4 12" />
    </svg>
  );
}

function TestIcon() {
  return (
    <svg {...ICON}>
      <rect x="10" y="7" width="28" height="36" rx="3" fill="currentColor" fillOpacity="0.15" />
      <rect x="18" y="4" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.35" />
      <path d="M15 18l2.5 2.5 4-4.5M15 27l2.5 2.5 4-4.5M15 36l2.5 2.5 4-4.5M25 19h8M25 28h8M25 37h6" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg {...ICON}>
      {[5, 18, 31].map((y) => (
        <g key={y}>
          <rect x="7" y={y} width="34" height="11" rx="2.5" fill="currentColor" fillOpacity="0.15" />
          <circle cx="13" cy={y + 5.5} r="1.4" fill="currentColor" />
          <path d={`M22 ${y + 5.5}h13`} />
        </g>
      ))}
    </svg>
  );
}

function TrainIcon() {
  return (
    <svg {...ICON}>
      <rect x="18" y="6" width="26" height="20" rx="2" fill="currentColor" fillOpacity="0.15" />
      <path d="M23 21l5-5 4 3 7-7M35 12h4v4" />
      <circle cx="10" cy="15" r="4" fill="currentColor" fillOpacity="0.3" />
      <path d="M3 42v-12a6 6 0 016-6h4l7-4" />
      <path d="M13 42V31" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg {...ICON}>
      <path d="M9 27v-4a15 15 0 0130 0v4" />
      <rect x="5" y="25" width="8" height="12" rx="3" fill="currentColor" fillOpacity="0.3" />
      <rect x="35" y="25" width="8" height="12" rx="3" fill="currentColor" fillOpacity="0.3" />
      <path d="M39 37v1a6 6 0 01-6 6h-6" />
      <rect x="21" y="41" width="7" height="5" rx="2" fill="currentColor" />
    </svg>
  );
}

type Item = [string, string?];

const DEPLOYMENT: Item[] = [
  ["Production deployment."],
  ["Hosting configuration or Government hosting handover."],
  ["Application configuration."],
  ["Database and media storage setup."],
  ["Production readiness validation", "(e.g., performance, security, availability)."],
  ["System handover."],
];

const DOCUMENTATION: Item[] = [
  ["System architecture document", "(application, integration and deployment)."],
  ["Technical documentation", "(design, configuration and operations)."],
  ["User manuals", "(role-wise and process-wise)."],
  ["Administrator guides", "(user management, configuration and monitoring)."],
  ["API documentation", "(endpoints, data exchange and security)."],
  ["Deployment and maintenance documentation", "(installation, backup, support and DR)."],
];

const DOC_TILES: { label: string; icon: CessIcon }[] = [
  { label: "Architecture Document", icon: TreeStructure },
  { label: "User Manual", icon: BookOpen },
  { label: "API Guide", icon: Code },
  { label: "Maintenance Guide", icon: GearSix },
];

const TRAINING: Item[] = [
  ["DIPR administrator training", "(system administration, user management, configuration and monitoring)."],
  ["End-user training", "(campaign management, execution tracking, PoD capture and verification, reporting)."],
  ["Application usage demonstrations", "(realistic, role-based scenarios)."],
  ["Knowledge transfer", "(technical and operational aspects)."],
  ["Operational handover", "(readiness for independent operations)."],
];

const SLA: { param: string; icon: CessIcon; color: string; commitment: ReactNode }[] = [
  {
    param: "System availability",
    icon: Monitor,
    color: "#1d4fc4",
    commitment: (
      <>
        <Count to={99.5} decimals={1} />% uptime, excluding scheduled maintenance
      </>
    ),
  },
  { param: "Critical bug fix", icon: Warning, color: "#dc2626", commitment: "Response within 4 hours" },
  { param: "High-priority issues", icon: WarningCircle, color: "#ea7a0b", commitment: "Response within 8 business hours" },
  { param: "Medium-priority issues", icon: Clock, color: "#2563eb", commitment: "Response within 2 business days" },
  { param: "Low-priority issues", icon: CheckCircle, color: "#16a34a", commitment: "Response within 5 business days" },
];

/** Lifecycle stage reached on each beat. */
const STAGE_AT = [1, 2, 2, 3, 4, 4];

/**
 * Beats: 0 delivery lifecycle, 1 deployment and handover, 2 documentation, 3 training and knowledge transfer,
 * 4 maintenance and support (SLA), 5 expected outcome.
 */
export function SupportScene({ beat }: { beat: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const stage = STAGE_AT[beat] ?? 4;
  const focus = (i: number) => hover === i || beat === i + 1;
  const seen = (i: number) => beat >= i + 1 || hover === i;
  const card = (i: number) => ({ index: i, focus: focus(i), seen: seen(i), onHover: setHover });

  return (
    <FitBox w={1440} h={744}>
      <div className="flex size-full flex-col gap-3 text-[14px] text-ink">
        <Lifecycle stage={stage} />
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.22fr)] gap-3">
          <Card title="Deployment and Handover" icon={RocketLaunch} {...card(0)}>
            <Bullets items={DEPLOYMENT} focus={focus(0)} plain />
            <div className="mt-auto flex h-[180px] shrink-0 items-center justify-center">
              <DeployArt />
            </div>
          </Card>
          <Card title="Documentation" icon={FileText} {...card(1)}>
            <Bullets items={DOCUMENTATION} focus={focus(1)} />
            <div className="mt-auto grid shrink-0 grid-cols-4 gap-1 px-2 pb-2.5">
              {DOC_TILES.map((t, i) => {
                const I = t.icon;
                return (
                  <motion.div
                    key={t.label}
                    initial={false}
                    animate={{ y: focus(1) ? [8, 0] : 0 }}
                    transition={{ delay: focus(1) ? 0.4 + i * 0.08 : 0, duration: 0.35 }}
                    className="flex flex-col items-center gap-1 rounded-lg border border-[#d3def2] bg-linear-to-b from-white to-[#eef4fd] px-0.5 py-1.5 text-center text-[13px] leading-tight font-medium tracking-tight text-navy"
                  >
                    <I weight="duotone" className="size-[28px] text-[#1d4fc4]" />
                    {t.label}
                  </motion.div>
                );
              })}
            </div>
          </Card>
          <Card title="Training and Knowledge Transfer" icon={UsersThree} {...card(2)}>
            <Bullets items={TRAINING} focus={focus(2)} />
            <div className="mt-auto flex h-[196px] shrink-0 items-end justify-center pb-1">
              <TrainingArt />
            </div>
          </Card>
          <Card title="Maintenance and Support (SLA)" icon={GearSix} {...card(3)}>
            <SlaBody focus={focus(3)} />
          </Card>
        </div>
        <Outcome shown={beat >= 5} />
      </div>
    </FitBox>
  );
}

function Lifecycle({ stage }: { stage: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#c9d8ee] bg-white/95 p-2.5 shadow-[0_14px_28px_-24px_rgba(7,20,51,0.6)]"
    >
      <div className="font-display flex h-[88px] w-[300px] shrink-0 items-center gap-3 rounded-l-xl whitespace-nowrap bg-linear-to-r from-navy to-[#1d4fc4] pr-8 pl-4 text-white [clip-path:polygon(0_0,calc(100%-22px)_0,100%_50%,calc(100%-22px)_100%,0_100%)]">
        <Stack weight="duotone" className="size-[34px] shrink-0" />
        <span className="text-[17px] leading-tight font-bold">
          Solution Delivery Lifecycle
          <span className="block text-[14px] font-medium text-white/85">(End-to-End)</span>
        </span>
      </div>
      {STAGES.map((s, i) => {
        const Art = s.art;
        const reached = i <= stage;
        const current = i === stage;
        return (
          <div key={s.title} className="contents">
            <motion.span initial={false} animate={{ opacity: reached ? 1 : 0.3, x: current ? [0, 3, 0] : 0 }} transition={{ duration: 0.9, repeat: current ? Infinity : 0 }}>
              <CaretRight weight="bold" className="size-[18px] shrink-0 text-navy" />
            </motion.span>
            <motion.div
              initial={false}
              animate={{ opacity: reached ? 1 : 0.35, scale: current ? 1.03 : 1 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "relative flex h-[88px] min-w-0 flex-1 flex-col items-center justify-center overflow-hidden pr-5 pl-6 text-center leading-tight [clip-path:polygon(0_0,calc(100%-20px)_0,100%_50%,calc(100%-20px)_100%,0_100%,18px_50%)]",
                s.light ? "text-navy" : "text-white",
              )}
              style={{ background: s.light ? `linear-gradient(180deg, #eef5ff, ${s.color})` : `linear-gradient(180deg, ${s.color}d8, ${s.color})` }}
            >
              <span className={cn("mb-0.5", s.light && "text-[#1d4fc4]")}>
                <Art />
              </span>
              <span className="font-display text-[17px] font-bold">{s.title}</span>
              <span className={cn("text-[13px]", s.light ? "text-navy/80" : "text-white/90")}>{s.sub}</span>
              {current && (
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 w-16 -skew-x-12 bg-linear-to-r from-transparent via-white/40 to-transparent"
                  animate={{ left: ["-20%", "120%"] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </motion.div>
          </div>
        );
      })}
    </motion.section>
  );
}

function Card({
  title,
  icon: H,
  index,
  focus,
  seen,
  onHover,
  children,
}: {
  title: string;
  icon: CessIcon;
  index: number;
  focus: boolean;
  seen: boolean;
  onHover: (i: number | null) => void;
  children: ReactNode;
}) {
  return (
    <motion.section
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      initial={{ opacity: 0, y: 14 }}
      animate={{
        opacity: seen ? 1 : 0.45,
        y: focus ? -4 : 0,
        boxShadow: focus ? "0 0 0 2.5px #1d4fc4, 0 24px 40px -24px #1d4fc4" : "0 14px 28px -24px rgba(7,20,51,0.6)",
      }}
      transition={{ duration: 0.45, ease: EASE }}
      className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#c9d8ee] bg-white/95"
    >
      <div className="font-display flex shrink-0 items-center gap-2.5 bg-linear-to-r from-navy to-[#1d4fc4] px-3 py-2.5 text-[17px] leading-tight font-bold text-white">
        <H weight="duotone" className="size-[26px] shrink-0" />
        {title}
      </div>
      {children}
    </motion.section>
  );
}

function Bullets({ items, focus, plain }: { items: Item[]; focus: boolean; plain?: boolean }) {
  return (
    <ul className="grid gap-2.5 px-3 pt-3.5 text-[15px] leading-tight">
      {items.map(([main, note], j) => (
        <motion.li
          key={main}
          initial={false}
          animate={{ x: focus ? [10, 0] : 0 }}
          transition={{ delay: focus ? 0.08 + j * 0.07 : 0, duration: 0.35 }}
          className="flex items-start gap-2"
        >
          <motion.span initial={false} animate={{ scale: focus ? [0.4, 1.15, 1] : 1 }} transition={{ delay: focus ? 0.12 + j * 0.07 : 0, duration: 0.4 }}>
            <CheckCircle weight="fill" className="mt-px size-[18px] shrink-0 text-[#16a34a]" />
          </motion.span>
          <span className="text-navy">
            <span className={cn(note && !plain && "font-semibold")}>{main}</span>
            {note && <span className="block text-[13.5px] text-ink/75">{note}</span>}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

function Blob({ className }: { className?: string }) {
  return <span aria-hidden className={cn("absolute rounded-[50%] bg-[radial-gradient(ellipse,#dbe8fc_0%,#e9f1fd_55%,transparent_72%)]", className)} />;
}

function DeployArt() {
  return (
    <div className="relative">
      <Blob className="-inset-x-6 -inset-y-3" />
      <svg width="270" height="150" viewBox="0 0 270 150" className="relative overflow-visible">
        <rect x="28" y="38" width="160" height="92" rx="7" fill="#1d4fc4" />
        <rect x="35" y="45" width="146" height="78" rx="3" fill="#e3eefd" />
        <path d="M35 105 q18 -16 36 -4 q14 -14 32 -2 q18 -14 36 0 q16 -10 42 4 v20 h-146 z" fill="#ffffff" />
        <circle cx="70" cy="106" r="11" fill="#fff" />
        <circle cx="146" cy="106" r="12" fill="#fff" />
        <path d="M12 130 h204 l-10 10 a6 6 0 0 1 -5 2 h-174 a6 6 0 0 1 -5 -2 z" fill="#9db8e6" />
        <rect x="92" y="130" width="44" height="4" rx="2" fill="#6f90c9" />

        <motion.g animate={{ y: [4, -8, 4] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
          <motion.path
            d="M101 92 q7 22 7 30 q0 -8 7 -30 z"
            fill="#f59e0b"
            animate={{ scaleY: [1, 1.35, 1], opacity: [0.9, 1, 0.9] }}
            style={{ transformOrigin: "108px 92px" }}
            transition={{ duration: 0.35, repeat: Infinity }}
          />
          <path d="M104 92 q4 12 4 16 q0 -4 4 -16 z" fill="#fde68a" />
          <path d="M108 8 q-16 18 -16 52 v26 h32 v-26 q0 -34 -16 -52 z" fill="#ffffff" stroke="#c7d6ee" strokeWidth="1.5" />
          <path d="M108 8 q-9 10 -13 24 h26 q-4 -14 -13 -24 z" fill="#ef4444" />
          <circle cx="108" cy="50" r="8" fill="#1d4fc4" stroke="#c7d6ee" strokeWidth="2.5" />
          <path d="M92 66 l-12 18 v8 l12 -6 z" fill="#ef4444" />
          <path d="M124 66 l12 18 v8 l-12 -6 z" fill="#ef4444" />
          <rect x="99" y="86" width="18" height="6" rx="2" fill="#94a3b8" />
        </motion.g>

        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(204 ${52 + i * 26})`}>
            <rect width="58" height="22" rx="4" fill="#1d4fc4" />
            <rect x="2" y="2" width="54" height="18" rx="3" fill="#2a5fd1" />
            <rect x="24" y="9" width="26" height="3" rx="1.5" fill="#9db8e6" />
            <motion.circle cx="10" cy="11" r="3" fill="#4ade80" animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1, delay: i * 0.3, repeat: Infinity }} />
            <circle cx="18" cy="11" r="2" fill="#93c5fd" />
          </g>
        ))}

        <motion.g animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ transformOrigin: "176px 128px" }}>
          <circle cx="176" cy="128" r="17" fill="#16a34a" stroke="#ffffff" strokeWidth="4" />
          <path d="M168 128 l6 6 l11 -12" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      </svg>
    </div>
  );
}

function TrainingArt() {
  return (
    <div className="relative h-[189px] w-[252px]">
      <img src={trainingScene} alt="" className="size-full object-contain mix-blend-multiply" draggable={false} />
      <div className="absolute top-[12.5%] left-[37%] flex h-[42.5%] w-[53%] items-center justify-center gap-2">
        <motion.span animate={{ rotate: [0, -10, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <Megaphone weight="fill" className="size-[26px] text-[#1d4fc4]" />
        </motion.span>
        <span className="font-display text-[13px] leading-tight font-bold text-navy">
          DIPR
          <br />
          Application
          <br />
          Training
        </span>
      </div>
    </div>
  );
}

function SlaBody({ focus }: { focus: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2.5 rounded-lg border border-[#d3def2] bg-[#f5f8fd] px-3 py-2 leading-tight text-navy">
        <CalendarCheck weight="duotone" className="size-[30px] shrink-0 text-[#1d4fc4]" />
        <span>
          Service-level commitments as specified in the tender
          <span className="block text-[13px] text-ink/75">(Resolution timelines will be as agreed in the contract/SLA).</span>
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#cfd9e8]">
        <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] border-b border-[#cfd9e8] bg-[#eef2f8] font-bold text-navy [&>*]:px-3 [&>*]:py-1.5 [&>*+*]:border-l [&>*+*]:border-[#d6dfeb]">
          <span className="text-center">SLA Parameter</span>
          <span className="text-center">Commitment</span>
        </div>
        <div className="grid min-h-0 flex-1 auto-rows-fr">
          {SLA.map((r, i) => {
            const I = r.icon;
            return (
              <motion.div
                key={r.param}
                initial={false}
                animate={{ x: focus ? [12, 0] : 0, backgroundColor: focus ? ["#ffffff", `${r.color}12`, "#ffffff"] : "#ffffff" }}
                transition={{ delay: focus ? 0.15 + i * 0.12 : 0, duration: 0.6 }}
                className={cn(
                  "grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] leading-tight [&>*]:flex [&>*]:items-center [&>*]:px-3 [&>*+*]:border-l [&>*+*]:border-[#d6dfeb]",
                  i > 0 && "border-t border-[#d6dfeb]",
                )}
              >
                <span className="gap-2.5 font-semibold text-navy">
                  <I weight={r.icon === Warning || r.icon === WarningCircle ? "fill" : "bold"} className="size-[26px] shrink-0" style={{ color: r.color }} />
                  {r.param}
                </span>
                <span className="text-navy">{r.commitment}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2.5 rounded-lg border border-[#c4b5fd] bg-[#f3efff] px-3 py-2.5 leading-tight font-semibold text-navy">
        <Info weight="fill" className="size-[26px] shrink-0 text-[#7c3aed]" />
        Resolution timelines will be as agreed in the contract/SLA.
      </div>
    </div>
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
        <Target weight="duotone" className="size-[26px]" /> Expected Outcome
      </span>
      <span className="h-8 w-px shrink-0 bg-navy/25" />
      <p className="font-display flex-1 text-center text-[18px] leading-snug font-bold text-navy">
        A deployed, documented and maintainable platform supported by trained users and an agreed service-level framework.
      </p>
    </motion.div>
  );
}
