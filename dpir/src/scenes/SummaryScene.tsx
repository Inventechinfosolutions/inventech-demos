import { motion, type MotionProps } from "motion/react";
import { useState, type ReactNode } from "react";
import { AmtDevices } from "@/components/AmtDevices";
import { FitBox } from "@/components/FitBox";
import {
  CalendarCheck,
  Camera,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  ClipboardText,
  Coins,
  CurrencyInr,
  FileText,
  FolderSimple,
  Gauge,
  Image,
  Images,
  MagnifyingGlass,
  MapPin,
  Megaphone,
  SealCheck,
  ShieldCheck,
  SquaresFour,
  Stack,
  Target,
  UsersThree,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Rect = { x: number; y: number; w: number; h: number };
type Pillar = {
  no: string;
  title: string;
  desc: string;
  color: string;
  chips: { label: string; icon: CessIcon }[];
  art: () => ReactNode;
  at: Rect;
  wire: string;
  dot: [number, number];
};

/** Diagram layout in design-canvas pixels (1440 x 556). */
const PILLARS: Pillar[] = [
  {
    no: "01",
    title: "Centralized Campaign Management",
    desc: "Manage advertising campaigns, budgets, schedules, approvals and agencies through one platform.",
    color: "#1d4fc4",
    chips: [
      { label: "Campaigns", icon: Target },
      { label: "Budgets & Schedules", icon: Coins },
      { label: "Approvals & Workflows", icon: CheckCircle },
      { label: "Agencies & Execution", icon: UsersThree },
    ],
    art: CampaignArt,
    at: { x: 0, y: 302, w: 470, h: 188 },
    wire: "M 472 390 C 515 390 515 362 570 362",
    dot: [472, 390],
  },
  {
    no: "02",
    title: "Unified Asset Inventory",
    desc: "Maintain centralized advertising creatives, metadata, versions and geo-tagged assets.",
    color: "#16a34a",
    chips: [
      { label: "Creatives & Media", icon: Image },
      { label: "Metadata & Versions", icon: Stack },
      { label: "Geo-tagged Assets", icon: MapPin },
      { label: "Central Repository", icon: FolderSimple },
    ],
    art: AssetArt,
    at: { x: 0, y: 96, w: 462, h: 184 },
    wire: "M 464 190 C 520 190 520 250 570 250",
    dot: [464, 190],
  },
  {
    no: "03",
    title: "Verified Advertising Execution",
    desc: "Capture photographs, videos, GPS coordinates and timestamps to support Proof-of-Display verification.",
    color: "#6d28d9",
    chips: [
      { label: "Photos & Videos", icon: Camera },
      { label: "GPS Location", icon: MapPin },
      { label: "Timestamp", icon: CalendarCheck },
      { label: "PoD Verification", icon: SealCheck },
    ],
    art: ExecutionArt,
    at: { x: 478, y: 0, w: 484, h: 168 },
    wire: "M 720 170 V 200",
    dot: [720, 170],
  },
  {
    no: "04",
    title: "Operational Transparency",
    desc: "Monitor campaign progress, expenditure, compliance information and user activities.",
    color: "#ea7a0b",
    chips: [
      { label: "Execution Progress", icon: ChartBar },
      { label: "Expenditure Tracking", icon: CurrencyInr },
      { label: "Compliance Monitoring", icon: ShieldCheck },
      { label: "User Activity & Audit", icon: UsersThree },
    ],
    art: TransparencyArt,
    at: { x: 978, y: 96, w: 462, h: 184 },
    wire: "M 976 190 C 920 190 920 250 870 250",
    dot: [976, 190],
  },
  {
    no: "05",
    title: "Management Intelligence",
    desc: "Generate consolidated dashboards, reports and campaign KPIs to support informed administrative decisions.",
    color: "#6d28d9",
    chips: [
      { label: "Management Dashboards", icon: SquaresFour },
      { label: "Consolidated Reports", icon: FileText },
      { label: "Campaign KPIs", icon: Gauge },
      { label: "Trend & Performance Analysis", icon: ChartLineUp },
    ],
    art: IntelligenceArt,
    at: { x: 970, y: 302, w: 470, h: 188 },
    wire: "M 968 390 C 925 390 925 362 870 362",
    dot: [968, 390],
  },
];

const HUB: Rect = { x: 552, y: 196, w: 336, h: 236 };

const CAPABILITIES: { label: string; icon: CessIcon }[] = [
  { label: "Plan Campaigns", icon: Target },
  { label: "Manage Assets", icon: Stack },
  { label: "Monitor Execution", icon: MapPin },
  { label: "Verify Evidence", icon: ShieldCheck },
  { label: "Track Expenditure", icon: ChartBar },
  { label: "Ensure Compliance", icon: FileText },
  { label: "Analyze Performance", icon: ChartLineUp },
];

/**
 * Beats: 0 monitoring tool, 1-5 pillars 01-05, 6 lifecycle capabilities, 7 closing statement.
 */
export function SummaryScene({ beat }: { beat: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const live = (i: number) => beat >= i + 1 || hover === i;
  const focus = (i: number) => beat === i + 1 || hover === i;

  return (
    <FitBox w={1440} h={744}>
      <div className="flex size-full flex-col gap-2.5 text-[14px] text-ink">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex h-[48px] shrink-0 items-center overflow-hidden rounded-xl border border-[#c9d8ee] bg-linear-to-r from-[#e8f0fd] via-white to-[#e8f0fd]"
        >
          <span className="flex h-full w-[70px] shrink-0 items-center justify-center rounded-r-full bg-linear-to-r from-navy to-[#1d4fc4] text-white">
            <motion.span animate={{ rotate: [0, -10, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <Megaphone weight="fill" className="size-[26px]" />
            </motion.span>
          </span>
          <p className="font-display flex-1 text-center text-[19px] font-semibold text-navy">
            <span className="font-bold text-[#1d4fc4]">The proposed Advertisement Monitoring Tool</span> brings the complete advertising lifecycle into one
            integrated platform.
          </p>
        </motion.div>

        <div className="relative h-[530px] shrink-0">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c7bdf5]/60 bg-[radial-gradient(circle,rgba(124,58,237,0.12),rgba(124,58,237,0.06)_50%,rgba(29,79,196,0.03)_68%,transparent_71%)]"
            style={{ left: 720, top: 320 }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox="0 0 1440 530">
            {PILLARS.map((p, i) => (
              <Wire key={p.no} d={p.wire} dot={p.dot} color={p.color} on={live(i)} fast={focus(i)} />
            ))}
          </svg>

          <div className="absolute flex flex-col items-center" style={{ left: HUB.x, top: HUB.y, width: HUB.w }}>
            <Hub focus={beat === 0} />
            <motion.span
              initial={false}
              animate={{ scale: beat === 0 ? 1.05 : 1 }}
              className="font-display mt-3 flex items-center gap-2.5 rounded-xl bg-linear-to-r from-navy to-[#1d4fc4] px-5 py-2 text-[17px] font-bold text-white shadow-lg ring-2 ring-white"
            >
              <Megaphone weight="fill" className="size-[22px]" /> Advertisement Monitoring Tool
            </motion.span>
          </div>

          {PILLARS.map((p, i) => (
            <PillarCard key={p.no} pillar={p} live={live(i)} focus={focus(i)} onHover={(on) => setHover(on ? i : null)} />
          ))}
        </div>

        <Capabilities on={beat >= 6} focus={beat === 6} />
        <Closing shown={beat >= 7} />
      </div>
    </FitBox>
  );
}

function Wire({ d, dot, color, on, fast }: { d: string; dot: [number, number]; color: string; on: boolean; fast: boolean }) {
  return (
    <motion.g initial={false} animate={{ opacity: on ? 1 : 0.25 }} transition={{ duration: 0.4 }}>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={8} />
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} />
      {on && (
        <>
          <motion.path
            d={d}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="2 12"
            animate={{ strokeDashoffset: [0, -28] }}
            transition={{ duration: fast ? 0.5 : 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle
            r={4.5}
            fill={color}
            stroke="#fff"
            strokeWidth={1.5}
            style={{ offsetPath: `path("${d}")` }}
            animate={{ offsetDistance: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: fast ? 1.1 : 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
      <circle cx={dot[0]} cy={dot[1]} r={6.5} fill="#ffffff" stroke={color} strokeWidth={3} />
    </motion.g>
  );
}

function PillarCard({ pillar: p, live, focus, onHover }: { pillar: Pillar; live: boolean; focus: boolean; onHover: (on: boolean) => void }) {
  const Art = p.art;
  return (
    <motion.section
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: live ? 1 : 0.4,
        y: focus ? -3 : 0,
        boxShadow: focus ? `0 0 0 2.5px ${p.color}, 0 24px 40px -24px ${p.color}` : "0 14px 28px -24px rgba(7,20,51,0.6)",
      }}
      transition={{ duration: 0.45, ease: EASE }}
      className="absolute flex flex-col overflow-hidden rounded-xl border bg-white/97"
      style={{ left: p.at.x, top: p.at.y, width: p.at.w, height: p.at.h, borderColor: `${p.color}55`, background: `linear-gradient(180deg, ${p.color}0d, #ffffff 40%)` }}
    >
      <div className="flex shrink-0 items-center gap-2.5 px-2.5 pt-2.5">
        <span
          className="font-display flex items-center gap-2.5 rounded-full py-1 pr-5 pl-1 text-[17px] font-bold text-white shadow-sm"
          style={{ background: `linear-gradient(90deg, ${p.color}, ${p.color}d0)` }}
        >
          <span className="grid size-[28px] place-items-center rounded-full bg-white text-[14px]" style={{ color: p.color }}>
            {p.no}
          </span>
          {p.title}
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[88px_minmax(0,1fr)_198px] items-center gap-2.5 px-2.5 pb-2">
        <div className="flex items-center justify-center">
          <Art />
        </div>
        <p className="leading-snug text-navy">{p.desc}</p>
        <div className="grid gap-1">
          {p.chips.map((c, j) => {
            const I = c.icon;
            return (
              <motion.span
                key={c.label}
                initial={false}
                animate={{ x: focus ? [10, 0] : 0, opacity: 1 }}
                transition={{ delay: focus ? 0.1 + j * 0.07 : 0, duration: 0.35 }}
                className="flex items-center gap-2 rounded-md border border-[#dbe4f0] bg-white px-2 py-[3px] text-[13px] leading-tight font-medium text-navy"
              >
                <I weight="duotone" className="size-[17px] shrink-0" style={{ color: p.color }} />
                {c.label}
              </motion.span>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

function Hub({ focus }: { focus: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: focus ? 1.03 : 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative w-full overflow-hidden"
    >
      <AmtDevices focus={null} color="#1d4fc4" />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute top-[8%] h-[70%] w-[24%] -skew-x-12 bg-linear-to-r from-transparent via-white/40 to-transparent"
        animate={{ left: ["-30%", "130%"] }}
        transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

function ArtIcon({ icon: I, color, motionProps }: { icon: CessIcon; color: string; motionProps: MotionProps }) {
  return (
    <motion.span className="grid size-[80px] place-items-center rounded-2xl text-white shadow-[0_14px_26px_-14px_rgba(7,20,51,0.6)]" style={{ background: color }} {...motionProps}>
      <I weight="duotone" className="size-[46px]" />
    </motion.span>
  );
}

const float = (y: number, duration: number): MotionProps => ({
  animate: { y: [0, -y, 0] },
  transition: { duration, repeat: Infinity, ease: "easeInOut" },
});

function CampaignArt() {
  return <ArtIcon icon={ClipboardText} color="#1d4fc4" motionProps={{ animate: { rotate: [0, -3, 0] }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }} />;
}

function AssetArt() {
  return <ArtIcon icon={Images} color="#7c3aed" motionProps={float(3, 2)} />;
}

function ExecutionArt() {
  return <ArtIcon icon={MapPin} color="#16a34a" motionProps={float(4, 1.8)} />;
}

function TransparencyArt() {
  return <ArtIcon icon={MagnifyingGlass} color="#ea580c" motionProps={{ animate: { scale: [1, 1.05, 1] }, transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }} />;
}

function IntelligenceArt() {
  return <ArtIcon icon={ChartLineUp} color="#0d9488" motionProps={float(3, 2.4)} />;
}

function Capabilities({ on, focus }: { on: boolean; focus: boolean }) {
  return (
    <motion.section
      initial={false}
      animate={{
        opacity: on ? 1 : 0.45,
        boxShadow: focus ? "0 0 0 2px #1d4fc4, 0 20px 36px -22px #1d4fc4" : "0 14px 28px -24px rgba(7,20,51,0.55)",
      }}
      transition={{ duration: 0.5 }}
      className="grid h-[60px] shrink-0 grid-cols-7 rounded-xl border border-[#c9d8ee] bg-linear-to-r from-[#f2f6fd] via-white to-[#f2f6fd]"
    >
      {CAPABILITIES.map((c, i) => {
        const I = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={false}
            animate={{ y: focus ? [8, 0] : 0, opacity: on ? 1 : 0.7 }}
            transition={{ delay: focus ? 0.08 + i * 0.07 : 0, duration: 0.35 }}
            className={cn("font-display flex items-center justify-center gap-2.5 px-2 text-[16px] font-bold text-navy", i > 0 && "border-l border-[#d6dfeb]")}
          >
            <I weight="duotone" className="size-[30px] shrink-0 text-[#1d4fc4]" />
            {c.label}
          </motion.div>
        );
      })}
    </motion.section>
  );
}

function Closing({ shown }: { shown: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.99 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex h-[52px] shrink-0 items-center gap-5 overflow-hidden rounded-2xl border border-[#7c3aed]/25 bg-[linear-gradient(90deg,#ede9fe,#f8f6ff_45%,#ede9fe)] pr-5 shadow-[0_14px_30px_-24px_rgba(7,20,51,0.7)]"
    >
      <span className="flex h-full w-[100px] shrink-0 items-center justify-center bg-linear-to-r from-[#5b21b6] to-[#7c3aed] pr-3 text-white [clip-path:polygon(0_0,calc(100%-18px)_0,100%_50%,calc(100%-18px)_100%,0_100%)]">
        <motion.span animate={shown ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 1.6, repeat: Infinity }}>
          <CheckCircle weight="duotone" className="size-[30px]" />
        </motion.span>
      </span>
      <p className="font-display flex-1 text-center text-[23px] font-bold text-navy">
        One Campaign. Multiple Channels. Verified Execution. Complete Visibility.
      </p>
    </motion.div>
  );
}
