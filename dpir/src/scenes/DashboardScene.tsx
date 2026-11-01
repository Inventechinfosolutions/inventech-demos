import { motion } from "motion/react";
import type { ReactNode } from "react";
import { AppShell, Laptop, type NavItem } from "@/components/AmtApp";
import { FeatureStrip, type Feature } from "@/components/FeatureStrip";
import { Count } from "@/scenes/MonitorScene";
import {
  Broadcast,
  CalendarBlank,
  CalendarCheck,
  Camera,
  CaretDown,
  ChartBar,
  ChartPieSlice,
  CheckCircle,
  CurrencyInr,
  Hourglass,
  House,
  Image,
  ListChecks,
  MapPin,
  Megaphone,
  Monitor,
  Newspaper,
  Play,
  SealCheck,
  Storefront,
  Trophy,
  Wallet,
  X,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV: NavItem[] = [
  { label: "Dashboard", icon: House },
  { label: "Campaigns", icon: Megaphone },
  { label: "Execution", icon: Broadcast },
  { label: "Assets", icon: Image },
  { label: "Vendors", icon: Storefront },
  { label: "Proof-of-Display", icon: Camera },
  { label: "Verification", icon: SealCheck },
  { label: "Reports", icon: ChartBar },
];

const FEATURES: Feature[] = [
  { title: "Campaign Status", icon: ChartPieSlice, color: "#2563eb", items: ["Active, completed, under approval and upcoming campaigns."] },
  { title: "Expenditure", icon: CurrencyInr, color: "#7c3aed", items: ["Allocated budget, expenditure and budget utilization.", "Expenditure by media channel."] },
  { title: "Execution", icon: ListChecks, color: "#16a34a", items: ["Completed, in progress and pending activities."] },
  { title: "Proof-of-Display", icon: Camera, color: "#ea580c", items: ["Verified, pending verification and rejected evidence."] },
  { title: "Media-wise Execution", icon: ChartBar, color: "#0891b2", items: ["Planned, completed and pending activities by channel."] },
  { title: "Top Campaign KPIs", icon: Trophy, color: "#db2777", items: ["Expenditure, execution and PoD verification by campaign."] },
];

const KPIS: { label: string; value: number; icon: CessIcon; color: string }[] = [
  { label: "Total Campaigns", value: 132, icon: Megaphone, color: "#1d4fc4" },
  { label: "Active Campaigns", value: 48, icon: Play, color: "#16a34a" },
  { label: "Completed Campaigns", value: 62, icon: CheckCircle, color: "#7c3aed" },
  { label: "Under Approval", value: 12, icon: Hourglass, color: "#d97706" },
  { label: "Upcoming Campaigns", value: 10, icon: CalendarCheck, color: "#2563eb" },
];

export type Seg = { label: string; n: string; pct: number; color: string };

const CAMPAIGN_STATUS: Seg[] = [
  { label: "Active", n: "48", pct: 36, color: "#22c55e" },
  { label: "Completed", n: "62", pct: 47, color: "#60a5fa" },
  { label: "Under Approval", n: "12", pct: 9, color: "#facc15" },
  { label: "Upcoming", n: "10", pct: 8, color: "#a78bfa" },
];

const EXECUTION: Seg[] = [
  { label: "Completed", n: "960", pct: 76.9, color: "#22c55e" },
  { label: "In Progress", n: "168", pct: 13.5, color: "#60a5fa" },
  { label: "Pending", n: "120", pct: 9.6, color: "#facc15" },
];

const SPEND: { name: string; icon: CessIcon; cr: string; pct: number; color: string }[] = [
  { name: "Print", icon: Newspaper, cr: "8.20", pct: 44, color: "#3b82f6" },
  { name: "Digital", icon: Monitor, cr: "5.40", pct: 29, color: "#8b5cf6" },
  { name: "Outdoor", icon: MapPin, cr: "5.00", pct: 27, color: "#22c55e" },
];

const MEDIA: { name: string; icon: CessIcon; planned: number; done: number; pend: number }[] = [
  { name: "Print", icon: Newspaper, planned: 420, done: 352, pend: 68 },
  { name: "Digital", icon: Monitor, planned: 380, done: 296, pend: 84 },
  { name: "Outdoor", icon: MapPin, planned: 448, done: 312, pend: 136 },
];

const TOP: { name: string; cr: string; exec: string; pod: string }[] = [
  { name: "Clean Karnataka Campaign", cr: "6.20", exec: "280 / 300", pod: "96.4%" },
  { name: "Health Awareness Drive", cr: "4.80", exec: "240 / 260", pod: "92.3%" },
  { name: "Water Conservation", cr: "3.40", exec: "180 / 200", pod: "90.0%" },
  { name: "Digital Citizen Services", cr: "2.70", exec: "140 / 160", pod: "87.5%" },
  { name: "Road Safety Awareness", cr: "1.50", exec: "120 / 140", pod: "85.7%" },
];

/** Feature tile and dashboard panel highlighted on each beat. */
const FEATURE_AT = [-1, 0, 1, 2, 3, 4, 5, 6];

/**
 * Beats: 0 campaign KPIs, 1 campaign status, 2 expenditure, 3 execution, 4 proof-of-display,
 * 5 media-wise execution, 6 top campaign KPIs, 7 expected outcome.
 */
export function DashboardScene({ beat }: { beat: number }) {
  const focus = FEATURE_AT[beat] ?? -1;
  return (
    <div className="flex h-full flex-col gap-[clamp(6px,1vh,12px)] text-ink">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="font-display shrink-0 text-center text-[length:clamp(16px,2.4vh,23px)] font-bold text-navy"
      >
        A unified operational view for <span className="text-[#1d4fc4]">DIPR officials and management.</span>
      </motion.p>

      <div className="grid min-h-0 flex-1 px-[1.5%]">
        <Laptop>
          <AppShell nav={NAV} active="Dashboard">
            <Dashboard beat={beat} focus={focus} />
          </AppShell>
        </Laptop>
      </div>

      <FeatureStrip
        features={FEATURES}
        active={focus}
        outcomeShown={beat >= 7}
        outcome={
          <>
            <span className="font-display font-bold text-[#15803d]">A consolidated view</span> of campaign operations: progress, expenditure and verification status.
          </>
        }
      />
    </div>
  );
}

function Panel({ title, on, color, className, children }: { title: string; on: boolean; color: string; className?: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, boxShadow: on ? `0 0 0 2px ${color}, 0 16px 30px -20px ${color}` : "0 0 0 0px rgba(0,0,0,0)" }}
      transition={{ duration: 0.45 }}
      className={cn("flex min-h-0 min-w-0 flex-col gap-1 rounded-lg border bg-white p-[clamp(5px,0.6vw,9px)]", className)}
    >
      <span className="font-display shrink-0 font-bold text-navy">{title}</span>
      {children}
    </motion.div>
  );
}

function Dashboard({ beat, focus }: { beat: number; focus: number }) {
  return (
    <div className="flex h-full flex-col gap-[clamp(4px,0.7vh,8px)]">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="font-display min-w-0 flex-1 text-[length:clamp(14.5px,1.95vh,17px)] leading-tight font-bold text-navy">
          Management Dashboard – Campaigns, Expenditure, Execution & Verification
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-md border bg-white px-2 py-0.5 text-navy">
          All Campaigns <CaretDown className="size-[0.9em]" />
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-md border bg-white px-2 py-0.5 text-navy">
          <CalendarBlank className="size-[1em]" /> 01 Apr – 30 Sep 2026
        </span>
      </div>

      <div className="grid shrink-0 grid-cols-5 gap-[clamp(4px,0.5vw,8px)]">
        {KPIS.map((k, i) => {
          const I = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, boxShadow: beat === 0 ? `0 0 0 2px ${k.color}55` : "0 0 0 0px rgba(0,0,0,0)" }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.45 }}
              className="flex min-w-0 items-center gap-2 rounded-lg border px-2 py-[clamp(3px,0.6vh,7px)]"
              style={{ background: `${k.color}10`, borderColor: `${k.color}33` }}
            >
              <span className="grid size-[clamp(26px,4vh,38px)] shrink-0 place-items-center rounded-lg" style={{ background: `${k.color}1f`, color: k.color }}>
                <I weight="duotone" className="size-[62%]" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block font-semibold text-navy/80">{k.label}</span>
                <span className="font-display text-[length:clamp(16px,2.5vh,24px)] font-bold text-navy">
                  <Count to={k.value} />
                </span>
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-[clamp(4px,0.6vw,10px)]">
        <Panel title="Campaign Status Overview" on={focus === 0} color="#2563eb">
          <DonutBlock segs={CAMPAIGN_STATUS} total={132} unit="Campaigns" shown={beat >= 1} />
        </Panel>
        <Panel title="Expenditure Overview" on={focus === 1} color="#7c3aed">
          <Expenditure shown={beat >= 2} />
        </Panel>
        <Panel title="Execution Overview" on={focus === 2} color="#16a34a">
          <DonutBlock segs={EXECUTION} total={1248} unit="Activities" shown={beat >= 3} />
        </Panel>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] gap-[clamp(4px,0.6vw,10px)]">
        <Panel title="Proof-of-Display (PoD) Overview" on={focus === 3} color="#ea580c">
          <PodOverview shown={beat >= 4} />
        </Panel>
        <Panel title="Media-wise Execution Status" on={focus === 4} color="#0891b2">
          <MediaChart shown={beat >= 5} />
        </Panel>
        <Panel title="Top Campaigns – Key KPIs" on={focus === 5} color="#db2777">
          <TopCampaigns shown={beat >= 6} />
        </Panel>
      </div>
    </div>
  );
}

export function DonutBlock({ segs, total, unit, shown, size = "size-[clamp(80px,15.5vh,150px)]" }: { segs: Seg[]; total: number; unit: string; shown: boolean; size?: string }) {
  const offsets = segs.map((_, i) => segs.slice(0, i).reduce((s, v) => s + v.pct, 0));
  return (
    <div className="flex min-h-0 flex-1 items-center gap-3">
      <div className={cn("relative shrink-0", size)}>
        <svg viewBox="0 0 36 36" className="size-full -rotate-90">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#eef2f7" strokeWidth="5" />
          {segs.map((s, i) => (
            <motion.circle
              key={s.label}
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke={s.color}
              strokeWidth="5"
              initial={false}
              animate={{ strokeDasharray: shown ? `${s.pct} ${100 - s.pct}` : "0 100", strokeDashoffset: -offsets[i] }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.12, ease: EASE }}
            />
          ))}
        </svg>
        <span className="absolute inset-0 grid place-items-center text-center leading-none">
          <span>
            <span className="font-display block text-[length:clamp(15px,2.4vh,22px)] font-bold text-navy">{total.toLocaleString("en-IN")}</span>
            <span className="text-ink/65">{unit}</span>
          </span>
        </span>
      </div>
      <ul className="grid min-w-0 gap-0.5 leading-tight">
        {segs.map((s, i) => (
          <motion.li key={s.label} initial={false} animate={{ opacity: shown ? 1 : 0.35 }} transition={{ delay: shown ? 0.2 + i * 0.1 : 0 }} className="flex items-start gap-1.5">
            <span className="mt-[0.25em] size-[0.75em] shrink-0 rounded-sm" style={{ background: s.color }} />
            <span>
              <span className="text-ink/80">{s.label}</span> <span className="font-semibold whitespace-nowrap text-navy">{s.n} ({s.pct}%)</span>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function Expenditure({ shown }: { shown: boolean }) {
  const tiles: { label: string; value: ReactNode; icon: CessIcon; color: string }[] = [
    { label: "Allocated", value: <>₹ <Count to={24} decimals={2} /> Cr</>, icon: Wallet, color: "#2563eb" },
    { label: "Expenditure", value: <>₹ <Count to={18.6} decimals={2} /> Cr</>, icon: CurrencyInr, color: "#7c3aed" },
    { label: "Utilization", value: <><Count to={77.5} decimals={1} />%</>, icon: ChartPieSlice, color: "#16a34a" },
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-around gap-1">
      <div className="grid shrink-0 grid-cols-3 gap-1">
        {tiles.map((t) => {
          const I = t.icon;
          return (
            <div key={t.label} className="min-w-0 rounded-md border px-1.5 py-0.5 leading-tight" style={{ background: `${t.color}0d`, borderColor: `${t.color}30` }}>
              <span className="flex items-center gap-1 text-ink/70">
                <I weight="duotone" className="size-[1em] shrink-0" style={{ color: t.color }} />
                {t.label}
              </span>
              <span className="font-display block font-bold whitespace-nowrap text-navy">{t.value}</span>
            </div>
          );
        })}
      </div>
      <div className="grid gap-[clamp(2px,0.5vh,5px)]">
        {SPEND.map((s, i) => {
          const I = s.icon;
          return (
            <div key={s.name} className="grid grid-cols-[clamp(64px,5.4vw,84px)_minmax(0,1fr)_auto] items-center gap-2">
              <span className="flex items-center gap-1.5 font-medium text-navy">
                <I weight="duotone" className="size-[1.15em] shrink-0" />
                {s.name}
              </span>
              <span className="h-[clamp(10px,1.7vh,16px)] overflow-hidden rounded-full bg-slate-100">
                <motion.span
                  initial={false}
                  animate={{ width: shown ? `${s.pct * 2}%` : "0%" }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: EASE }}
                  className="block h-full rounded-full"
                  style={{ background: s.color }}
                />
              </span>
              <span className="font-semibold whitespace-nowrap text-navy">
                ₹ {s.cr} Cr <span className="font-normal text-ink/65">({s.pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PodOverview({ shown }: { shown: boolean }) {
  const tiles: { label: string; n: number; pct?: string; icon: CessIcon; color: string }[] = [
    { label: "Total", n: 1186, icon: Image, color: "#1d4fc4" },
    { label: "Verified", n: 921, pct: "77.7%", icon: CheckCircle, color: "#16a34a" },
    { label: "Pending", n: 172, pct: "14.5%", icon: Hourglass, color: "#d97706" },
    { label: "Rejected", n: 93, pct: "7.8%", icon: X, color: "#e11d48" },
  ];
  const bar = [
    { pct: 77.7, color: "#22c55e", tx: "text-white" },
    { pct: 14.5, color: "#facc15", tx: "text-ink" },
    { pct: 7.8, color: "#f87171", tx: "text-white" },
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between gap-1">
      <div className="grid shrink-0 grid-cols-4 gap-1">
        {tiles.map((t) => {
          const I = t.icon;
          return (
            <div key={t.label} className="min-w-0 rounded-md border px-1 py-0.5 text-center leading-tight" style={{ background: `${t.color}0d`, borderColor: `${t.color}30` }}>
              <span className="flex items-center justify-center gap-1 text-ink/70">
                <I weight="duotone" className="size-[1.1em] shrink-0" style={{ color: t.color }} />
                {t.label}
              </span>
              <span className="font-display block font-bold text-navy">{t.n.toLocaleString("en-IN")}</span>
              {t.pct && <span className="block" style={{ color: t.color }}>({t.pct})</span>}
            </div>
          );
        })}
      </div>
      <div className="shrink-0">
        <span className="font-semibold text-navy/80">Evidence Submission Status</span>
        <div className="mt-0.5 flex h-[clamp(14px,2.2vh,20px)] overflow-hidden rounded bg-slate-100 font-semibold">
          {bar.map((b, i) => (
            <motion.span
              key={i}
              initial={false}
              animate={{ width: shown ? `${b.pct}%` : "0%" }}
              transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: EASE }}
              className={cn("grid place-items-center overflow-hidden text-[13px] leading-none whitespace-nowrap", b.tx)}
              style={{ background: b.color }}
            >
              {b.pct >= 10 && `${b.pct}%`}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MediaChart({ shown }: { shown: boolean }) {
  const series = [
    { key: "planned", label: "Planned", color: "#22c55e" },
    { key: "done", label: "Completed", color: "#60a5fa" },
    { key: "pend", label: "Pending", color: "#facc15" },
  ] as const;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="flex shrink-0 flex-wrap justify-center gap-x-3 text-ink/70">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1 whitespace-nowrap">
            <span className="size-[0.75em] rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 border-b border-slate-200">
        {MEDIA.map((m, i) => (
          <div key={m.name} className="flex min-h-0 items-end justify-center gap-[6%]">
            {series.map((s, j) => {
              const v = m[s.key];
              return (
                <div key={s.key} className="flex h-full w-[24%] flex-col justify-end">
                  <motion.span initial={false} animate={{ opacity: shown ? 1 : 0 }} transition={{ delay: shown ? 0.6 + i * 0.1 : 0 }} className="text-center text-[13px] leading-tight font-semibold text-navy">
                    {v}
                  </motion.span>
                  <motion.span
                    initial={false}
                    animate={{ height: shown ? `${(v / 500) * 82}%` : "0%" }}
                    transition={{ duration: 0.8, delay: 0.1 + i * 0.12 + j * 0.06, ease: EASE }}
                    className="block rounded-t"
                    style={{ background: s.color }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-2">
        {MEDIA.map((m) => {
          const I = m.icon;
          return (
            <span key={m.name} className="flex items-center justify-center gap-1 font-medium text-navy">
              <I weight="duotone" className="size-[1.1em] shrink-0" />
              {m.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TopCampaigns({ shown }: { shown: boolean }) {
  const cols = "grid grid-cols-[minmax(0,2.2fr)_auto_auto_auto] items-center gap-2";
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
      <div className={cn(cols, "shrink-0 bg-slate-50 px-1.5 py-0.5 leading-tight font-semibold text-navy/70")}>
        <span>Campaign</span>
        <span className="text-right">₹ Cr</span>
        <span className="text-center">Execution</span>
        <span className="text-center">PoD</span>
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-fr">
        {TOP.map((t, i) => (
          <motion.div
            key={t.name}
            initial={false}
            animate={{ opacity: shown ? 1 : 0.4, x: shown ? 0 : 8 }}
            transition={{ delay: shown ? 0.1 + i * 0.1 : 0, duration: 0.4 }}
            className={cn(cols, "min-h-0 border-t border-slate-100 px-1.5 leading-tight")}
          >
            <span className="font-medium text-navy">{t.name}</span>
            <span className="text-right text-ink/80">{t.cr}</span>
            <span className="text-center whitespace-nowrap text-ink/80">{t.exec}</span>
            <span className="text-center">
              <span className="inline-block rounded-full bg-[#16a34a]/12 px-1.5 font-semibold text-[#15803d]">{t.pod}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
