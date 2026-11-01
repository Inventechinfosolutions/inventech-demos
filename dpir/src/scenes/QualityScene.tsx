import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { FitBox } from "@/components/FitBox";
import {
  ArrowsClockwise,
  ArrowsLeftRight,
  Bug,
  CalendarCheck,
  Camera,
  CaretRight,
  CheckCircle,
  ClipboardText,
  Code,
  DeviceMobile,
  FileText,
  GearSix,
  LinkSimple,
  ListChecks,
  Lock,
  MapPin,
  Megaphone,
  PencilSimple,
  RocketLaunch,
  SealCheck,
  ShieldCheck,
  Stack,
  Target,
  TreeStructure,
  UsersThree,
  WifiHigh,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const STAGES: { label: string; icon: CessIcon; color: string; light?: boolean }[] = [
  { label: "Development", icon: Code, color: "#dbeafe", light: true },
  { label: "Functional Testing", icon: GearSix, color: "#7c3aed" },
  { label: "Integration Testing", icon: TreeStructure, color: "#16a34a" },
  { label: "Security Testing", icon: ShieldCheck, color: "#e59a0b" },
  { label: "User Acceptance Testing (UAT)", icon: UsersThree, color: "#bfdbfe", light: true },
  { label: "Production Release", icon: RocketLaunch, color: "#1d4fc4" },
];

type Card = { title: string; icon: CessIcon; items: [string, string?][]; art: () => ReactNode };

const CARDS: Card[] = [
  {
    title: "Functional Testing",
    icon: GearSix,
    items: [
      ["Campaign creation and management."],
      ["Approval and scheduling workflows."],
      ["Asset upload and retrieval."],
      ["Vendor assignment."],
      ["Proof-of-Display capture and verification."],
      ["Dashboard and reporting functions."],
    ],
    art: FunctionalArt,
  },
  {
    title: "Integration Testing",
    icon: LinkSimple,
    items: [
      ["Web and mobile application integration."],
      ["API testing."],
      ["External service integration", "(e.g., verification services)."],
      ["Data synchronization", "(e.g., campaign, evidence and status information)."],
    ],
    art: IntegrationArt,
  },
  {
    title: "Mobile Testing",
    icon: DeviceMobile,
    items: [
      ["Android and iOS compatibility", "(as applicable)."],
      ["Camera and media capture", "(photos and videos)."],
      ["GPS coordinate capture", "(location recording)."],
      ["Offline data collection", "(without active connectivity)."],
      ["Synchronization after network restoration", "(automatic or manual)."],
    ],
    art: MobileArt,
  },
  {
    title: "Security Testing",
    icon: ShieldCheck,
    items: [
      ["Authentication and authorization."],
      ["Role-based access validation", "(RBAC)."],
      ["API security", "(e.g., access control, input validation)."],
      ["Encryption validation", "(data in transit and at rest)."],
      ["Vulnerability assessment", "(e.g., security scanning and remediation)."],
    ],
    art: SecurityArt,
  },
  {
    title: "User Acceptance Testing (UAT)",
    icon: UsersThree,
    items: [
      ["Department-level validation", "(with DIPR users)."],
      ["Test case execution", "(based on agreed scenarios)."],
      ["Defect identification and logging."],
      ["Defect resolution and retesting", "(verification of fixes)."],
      ["UAT sign-off", "(confirming production readiness)."],
    ],
    art: UatArt,
  },
];

const DELIVERABLES: { title: string; note: string; icon: CessIcon }[] = [
  { title: "Test Strategy", note: "(overall approach and scope)", icon: ClipboardText },
  { title: "Test Plans", note: "(testing activities, schedule and resources)", icon: CalendarCheck },
  { title: "Test Cases", note: "(detailed test scenarios and expected results)", icon: Stack },
  { title: "Defect Tracking Records", note: "(defects, status and resolution)", icon: Bug },
  { title: "UAT Documentation", note: "(test results, observations and sign-off)", icon: FileText },
  { title: "Release Readiness Report", note: "(overall testing status and deployment recommendation)", icon: SealCheck },
];

/** Pipeline stage reached on each beat (mobile testing runs alongside integration testing). */
const STAGE_AT = [0, 1, 2, 2, 3, 4, 5, 5];
/** Testing card in focus on each beat. */
const CARD_AT = [-1, 0, 1, 2, 3, 4, -1, -1];

/**
 * Beats: 0 development, 1 functional, 2 integration, 3 mobile, 4 security, 5 UAT,
 * 6 production release and deliverables, 7 expected outcome.
 */
export function QualityScene({ beat }: { beat: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const stage = STAGE_AT[beat] ?? 5;
  const focusCard = hover ?? CARD_AT[beat] ?? -1;

  return (
    <FitBox w={1440} h={744}>
      <div className="flex size-full flex-col gap-3 text-[14px] text-ink">
        <Pipeline stage={stage} />
        <div className="grid min-h-0 flex-1 grid-cols-5 gap-3">
          {CARDS.map((c, i) => (
            <TestCard key={c.title} card={c} index={i} seen={CARD_AT[beat] >= i || beat >= 6} focus={focusCard === i} onHover={setHover} />
          ))}
        </div>
        <Deliverables on={beat >= 6} focus={beat === 6} />
        <Outcome shown={beat >= 7} />
      </div>
    </FitBox>
  );
}

function Pipeline({ stage }: { stage: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="shrink-0 overflow-hidden rounded-xl border border-[#c9d8ee] bg-white/95 shadow-[0_14px_28px_-24px_rgba(7,20,51,0.6)]"
    >
      <div className="font-display flex items-center gap-2.5 bg-linear-to-r from-navy to-[#1d4fc4] px-4 py-1.5 text-[17px] font-bold text-white">
        <Megaphone weight="fill" className="size-[22px]" />
        DIPR – Advertisement Monitoring Tool
      </div>
      <div className="flex items-center gap-1 px-3 py-2.5">
        {STAGES.map((s, i) => {
          const I = s.icon;
          const reached = i <= stage;
          const current = i === stage;
          return (
            <div key={s.label} className="contents">
              {i > 0 && (
                <motion.span initial={false} animate={{ opacity: reached ? 1 : 0.3, x: current ? [0, 3, 0] : 0 }} transition={{ duration: 0.9, repeat: current ? Infinity : 0 }}>
                  <CaretRight weight="bold" className="size-[18px] shrink-0 text-[#1d4fc4]" />
                </motion.span>
              )}
              <motion.div
                initial={false}
                animate={{
                  opacity: reached ? 1 : 0.35,
                  scale: current ? 1.03 : 1,
                }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "font-display relative flex h-[50px] min-w-0 flex-1 overflow-hidden items-center justify-center gap-2.5 px-4 text-[16px] leading-tight font-bold [clip-path:polygon(0_0,calc(100%-16px)_0,100%_50%,calc(100%-16px)_100%,0_100%,14px_50%)]",
                  i === 0 && "[clip-path:polygon(0_0,calc(100%-16px)_0,100%_50%,calc(100%-16px)_100%,0_100%)] rounded-l-lg",
                  s.light ? "text-navy" : "text-white",
                )}
                style={{ background: s.light ? `linear-gradient(180deg, #eff6ff, ${s.color})` : `linear-gradient(180deg, ${s.color}e0, ${s.color})` }}
              >
                <I weight="duotone" className={cn("size-[26px] shrink-0", s.light && "text-[#1d4fc4]")} />
                <span className="min-w-0">{s.label}</span>
                {current && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-y-0 w-16 -skew-x-12 bg-linear-to-r from-transparent via-white/45 to-transparent"
                    animate={{ left: ["-20%", "120%"] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

function TestCard({ card, index, seen, focus, onHover }: { card: Card; index: number; seen: boolean; focus: boolean; onHover: (i: number | null) => void }) {
  const H = card.icon;
  const Art = card.art;
  return (
    <motion.section
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      initial={{ opacity: 0, y: 14 }}
      animate={{
        opacity: seen || focus ? 1 : 0.45,
        y: focus ? -4 : 0,
        boxShadow: focus ? "0 0 0 2.5px #1d4fc4, 0 24px 40px -24px #1d4fc4" : "0 14px 28px -24px rgba(7,20,51,0.6)",
      }}
      transition={{ duration: 0.45, ease: EASE }}
      className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#c9d8ee] bg-white/95"
    >
      <div className="font-display flex shrink-0 items-center gap-2 bg-linear-to-r from-navy to-[#1d4fc4] px-3 py-2 text-[16px] leading-tight font-bold text-white">
        <H weight="duotone" className="size-[24px] shrink-0" />
        {card.title}
      </div>
      <ul className="grid gap-2 px-3 pt-3 text-[15px] leading-tight">
        {card.items.map(([main, note], j) => (
          <motion.li
            key={main}
            initial={false}
            animate={{ x: focus ? [10, 0] : 0, opacity: 1 }}
            transition={{ delay: focus ? 0.08 + j * 0.07 : 0, duration: 0.35 }}
            className="flex items-start gap-2"
          >
            <motion.span initial={false} animate={{ scale: focus ? [0.4, 1.15, 1] : 1 }} transition={{ delay: focus ? 0.12 + j * 0.07 : 0, duration: 0.4 }}>
              <CheckCircle weight="fill" className="mt-px size-[18px] shrink-0 text-[#16a34a]" />
            </motion.span>
            <span className="text-navy">
              {main}
              {note && <span className="block text-[13.5px] text-ink/75">{note}</span>}
            </span>
          </motion.li>
        ))}
      </ul>
      <div className="mt-auto flex h-[112px] shrink-0 items-center justify-center px-3">
        <Art />
      </div>
    </motion.section>
  );
}

function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn("flex items-center justify-center gap-2 rounded-t-md border-[3px] border-[#1d4fc4] bg-[#eef4fd]", className)}>{children}</div>
      <span className="h-[6px] w-[calc(100%+20px)] rounded-b-md bg-linear-to-b from-[#93c5fd] to-[#1d4fc4]" />
    </div>
  );
}

function CheckLines({ n = 3 }: { n?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="flex items-center gap-1">
          <CheckCircle weight="fill" className="size-[11px] text-[#1d4fc4]" />
          <span className="h-[4px] w-[38px] rounded-full bg-[#93c5fd]" />
        </span>
      ))}
    </div>
  );
}

function FunctionalArt() {
  return (
    <Screen className="h-[78px] w-[150px]">
      <motion.span animate={{ rotate: [0, -8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
        <Megaphone weight="fill" className="size-[36px] text-[#1d4fc4]" />
      </motion.span>
      <CheckLines n={4} />
    </Screen>
  );
}

function IntegrationArt() {
  return (
    <div className="flex items-center gap-2">
      <Screen className="h-[58px] w-[78px]">
        <Megaphone weight="fill" className="size-[28px] text-[#1d4fc4]" />
      </Screen>
      <motion.span animate={{ x: [-3, 3, -3] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
        <ArrowsLeftRight weight="bold" className="size-[26px] text-[#1d4fc4]" />
      </motion.span>
      <Screen className="h-[58px] w-[78px]">
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
          <GearSix weight="fill" className="size-[28px] text-[#1d4fc4]" />
        </motion.span>
      </Screen>
    </div>
  );
}

function MobileArt() {
  const icons = [
    { I: Camera, c: "#2563eb" },
    { I: MapPin, c: "#db2777" },
    { I: WifiHigh, c: "#ea580c" },
    { I: ArrowsClockwise, c: "#16a34a" },
  ];
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-[100px] w-[56px] items-center justify-center rounded-[10px] border-[3px] border-navy bg-linear-to-b from-[#2563eb] to-[#1d4fc4]">
        <span className="absolute top-[4px] h-[3px] w-[16px] rounded-full bg-navy/60" />
        <span className="font-display text-[13px] font-bold text-white">DIPR</span>
      </span>
      <div className="flex gap-1 rounded-lg border border-[#d6e0ee] bg-white px-1.5 py-1 shadow-sm">
        {icons.map(({ I, c }, i) => (
          <motion.span key={i} animate={{ y: [0, -3, 0] }} transition={{ duration: 1.6, delay: i * 0.2, repeat: Infinity }}>
            <I weight="fill" className="size-[20px]" style={{ color: c }} />
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function SecurityArt() {
  return (
    <div className="relative">
      <Screen className="h-[78px] w-[140px]">
        <Lock weight="fill" className="size-[38px] text-navy" />
      </Screen>
      <motion.span
        className="absolute -right-4 -bottom-1"
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        <ShieldCheck weight="fill" className="size-[40px] text-[#16a34a] drop-shadow" />
      </motion.span>
    </div>
  );
}

function UatArt() {
  return (
    <div className="flex items-end gap-4">
      <span className="relative">
        <UsersThree weight="fill" className="size-[68px] text-[#1d4fc4]" />
        <CheckCircle weight="fill" className="absolute -bottom-1 left-1/2 size-[24px] -translate-x-1/2 rounded-full bg-white text-[#16a34a]" />
      </span>
      <span className="relative flex h-[76px] w-[60px] items-center justify-center rounded-md border-[3px] border-[#1d4fc4] bg-white">
        <ListChecks weight="bold" className="size-[34px] text-[#1d4fc4]" />
        <motion.span className="absolute -right-3 -bottom-2" animate={{ rotate: [0, -10, 0], x: [0, -2, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
          <PencilSimple weight="fill" className="size-[26px] text-navy" />
        </motion.span>
      </span>
    </div>
  );
}

function Deliverables({ on, focus }: { on: boolean; focus: boolean }) {
  return (
    <motion.section
      initial={false}
      animate={{
        opacity: on ? 1 : 0.45,
        boxShadow: focus ? "0 0 0 2px #1d4fc4, 0 20px 36px -22px #1d4fc4" : "0 14px 28px -24px rgba(7,20,51,0.55)",
      }}
      transition={{ duration: 0.5 }}
      className="flex h-[84px] shrink-0 overflow-hidden rounded-xl border border-[#c9d8ee] bg-white/95"
    >
      <span className="font-display flex shrink-0 items-center gap-2.5 bg-linear-to-r from-navy to-[#1d4fc4] pr-9 pl-4 text-[19px] font-bold text-white [clip-path:polygon(0_0,calc(100%-20px)_0,100%_50%,calc(100%-20px)_100%,0_100%)]">
        <FileText weight="duotone" className="size-[28px]" /> Deliverables
      </span>
      <div className="grid min-w-0 flex-1 grid-cols-6">
        {DELIVERABLES.map((d, i) => {
          const I = d.icon;
          return (
            <motion.div
              key={d.title}
              initial={false}
              animate={{ opacity: on ? 1 : 0.6, y: focus ? [8, 0] : 0 }}
              transition={{ delay: focus ? 0.1 + i * 0.08 : 0, duration: 0.4 }}
              className={cn("flex min-w-0 items-center gap-2 px-2.5 leading-tight", i > 0 && "border-l border-[#d6dfeb]")}
            >
              <I weight="duotone" className="size-[30px] shrink-0 text-[#1d4fc4]" />
              <span className="min-w-0">
                <span className="font-display block text-[14.5px] font-bold text-navy">{d.title}</span>
                <span className="block text-[13px] leading-[1.15] text-ink/75">{d.note}</span>
              </span>
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
        <Target weight="duotone" className="size-[26px]" /> Expected Outcome
      </span>
      <span className="h-8 w-px shrink-0 bg-navy/25" />
      <p className="font-display flex-1 text-center text-[18px] leading-snug font-bold text-navy">
        A thoroughly tested and validated application, ready for secure and reliable production deployment.
      </p>
    </motion.div>
  );
}
