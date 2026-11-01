import { animate, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell, Laptop, type NavItem } from "@/components/AmtApp";
import { FeatureStrip, type Feature } from "@/components/FeatureStrip";
import {
  Broadcast,
  CalendarBlank,
  Camera,
  CaretDown,
  ChartBar,
  CheckCircle,
  ClipboardText,
  Clock,
  House,
  Image,
  MagnifyingGlass,
  MapPin,
  Megaphone,
  Monitor,
  Newspaper,
  SealCheck,
  ShieldCheck,
  Warning,
  WarningCircle,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV: NavItem[] = [
  { label: "Dashboard", icon: House },
  { label: "Campaigns", icon: Megaphone },
  { label: "Execution", icon: Broadcast },
  { label: "Proof-of-Display", icon: Camera },
  { label: "Verification", icon: SealCheck },
  { label: "Compliance", icon: Warning },
  { label: "Reports", icon: ChartBar },
];

const FEATURES: Feature[] = [
  {
    title: "Execution Monitoring",
    icon: ClipboardText,
    color: "#2563eb",
    items: ["Monitor planned versus actual activities.", "Review media-wise execution status.", "Identify pending and delayed activities."],
  },
  {
    title: "Evidence Monitoring",
    icon: Image,
    color: "#7c3aed",
    items: ["Identify activities with missing evidence.", "Monitor pending PoD submissions.", "Review evidence verification status."],
  },
  {
    title: "Compliance Review",
    icon: ShieldCheck,
    color: "#0d9488",
    items: [
      "Review campaign execution information.",
      "Examine supporting evidence.",
      "Track unresolved verification cases.",
      "Maintain audit records of actions and decisions.",
    ],
  },
];

/** Feature tile highlighted on each beat. */
const FEATURE_AT = [-1, 0, 1, 2, 3, 3];

type Kpi = { label: string; value: number; pct?: string; icon: CessIcon; color: string; focus: number };
const KPIS: Kpi[] = [
  { label: "Total Activities", value: 248, icon: ClipboardText, color: "#1d4fc4", focus: 0 },
  { label: "Completed", value: 186, pct: "75%", icon: CheckCircle, color: "#16a34a", focus: 1 },
  { label: "Pending", value: 24, pct: "10%", icon: WarningCircle, color: "#e11d48", focus: 1 },
  { label: "Delayed", value: 12, pct: "5%", icon: Clock, color: "#d97706", focus: 1 },
  { label: "Evidence Pending", value: 16, pct: "6%", icon: Image, color: "#2563eb", focus: 2 },
  { label: "Verification Pending", value: 10, pct: "4%", icon: MagnifyingGlass, color: "#7c3aed", focus: 2 },
];

const CHANNELS: { name: string; icon: CessIcon; done: number; prog: number; pend: number }[] = [
  { name: "Print", icon: Newspaper, done: 82, prog: 8, pend: 10 },
  { name: "Digital", icon: Monitor, done: 72, prog: 14, pend: 14 },
  { name: "Outdoor", icon: MapPin, done: 68, prog: 12, pend: 20 },
];

const VERIFY: { label: string; n: number; pct: number; color: string }[] = [
  { label: "Verified", n: 178, pct: 72, color: "#16a34a" },
  { label: "Under Verification", n: 10, pct: 4, color: "#facc15" },
  { label: "Rejected", n: 6, pct: 2, color: "#e11d48" },
  { label: "Evidence Pending", n: 16, pct: 6, color: "#94a3b8" },
  { label: "Not Submitted", n: 38, pct: 16, color: "#7dd3fc" },
];

type Issue = "not-displayed" | "no-evidence" | "no-gps" | "verify" | "delayed";
const ISSUES: Record<Issue, { label: string; need: string; icon: CessIcon; color: string }> = {
  "not-displayed": { label: "Advertisement not displayed", need: "Review execution status", icon: Warning, color: "#e11d48" },
  "no-evidence": { label: "Evidence not submitted", need: "Identify pending PoD", icon: Image, color: "#7c3aed" },
  "no-gps": { label: "GPS information missing", need: "Review evidence completeness", icon: MapPin, color: "#2563eb" },
  verify: { label: "Verification pending", need: "Track verification status", icon: MagnifyingGlass, color: "#1d4fc4" },
  delayed: { label: "Execution delayed", need: "Review scheduled versus actual dates", icon: Clock, color: "#d97706" },
};

type QStatus = "Pending" | "Verification" | "Under Review" | "Delayed";
const Q_TONE: Record<QStatus, string> = { Pending: "#e11d48", Verification: "#ca8a04", "Under Review": "#2563eb", Delayed: "#d97706" };

const QUEUE: { campaign: string; activity: string; media: string; issue: Issue; due: string; status: QStatus }[] = [
  { campaign: "Clean Karnataka Campaign", activity: "Outdoor – Location B", media: "Outdoor", issue: "not-displayed", due: "05 Aug 2026", status: "Pending" },
  { campaign: "Health Awareness Drive", activity: "Newspaper Advertisement", media: "Print", issue: "no-evidence", due: "06 Aug 2026", status: "Pending" },
  { campaign: "Water Conservation", activity: "Hoarding – Location A", media: "Outdoor", issue: "no-gps", due: "05 Aug 2026", status: "Verification" },
  { campaign: "Digital Citizen Services", activity: "Online Banner (Portal)", media: "Digital", issue: "verify", due: "04 Aug 2026", status: "Under Review" },
  { campaign: "Road Safety Awareness", activity: "Outdoor – Location C", media: "Outdoor", issue: "delayed", due: "02 Aug 2026", status: "Delayed" },
];

/**
 * Beats: 0 dashboard, 1 execution monitoring, 2 evidence monitoring, 3 compliance queue,
 * 4 illustrative monitoring scenarios, 5 expected outcome.
 */
export function MonitorScene({ beat }: { beat: number }) {
  const [hover, setHover] = useState<Issue | null>(null);
  return (
    <div className="flex h-full flex-col gap-[clamp(6px,1vh,12px)] text-ink">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="font-display shrink-0 text-center text-[length:clamp(16px,2.4vh,23px)] font-bold text-navy"
      >
        Visibility into <span className="text-[#e11d48]">pending activities, incomplete evidence</span> and verification outcomes.
      </motion.p>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,clamp(260px,24%,380px))] gap-[clamp(8px,1vw,18px)] px-[1%]">
        <Laptop>
          <AppShell nav={NAV} active="Compliance">
            <Dashboard beat={beat} hover={hover} onHover={setHover} />
          </AppShell>
        </Laptop>
        <Scenarios beat={beat} hover={hover} onHover={setHover} />
      </div>

      <FeatureStrip
        features={FEATURES}
        active={FEATURE_AT[beat] ?? -1}
        outcomeShown={beat >= 5}
        outcome={
          <>
            <span className="font-display font-bold text-[#15803d]">Improved visibility</span> into execution progress, outstanding activities and verification records.
          </>
        }
      />
    </div>
  );
}

export function Count({ to, decimals = 0, locale }: { to: number; decimals?: number; locale?: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.2, ease: EASE, onUpdate: setV });
    return () => c.stop();
  }, [to]);
  const s = v.toFixed(decimals);
  return <>{locale ? Number(s).toLocaleString("en-IN", { minimumFractionDigits: decimals }) : s}</>;
}

function Card({ on, color, className, children }: { on: boolean; color: string; className?: string; children: ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ boxShadow: on ? `0 0 0 2px ${color}, 0 16px 30px -20px ${color}` : "0 0 0 0px rgba(0,0,0,0)" }}
      transition={{ duration: 0.4 }}
      className={cn("rounded-lg border bg-white p-[clamp(5px,0.6vw,9px)]", className)}
    >
      {children}
    </motion.div>
  );
}

function Dashboard({ beat, hover, onHover }: { beat: number; hover: Issue | null; onHover: (i: Issue | null) => void }) {
  return (
    <div className="flex h-full flex-col gap-[clamp(4px,0.7vh,8px)]">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="font-display min-w-0 flex-1 text-[length:clamp(14.5px,1.95vh,17px)] leading-tight font-bold text-navy">
          Campaign Execution – Compliance & Exception Monitoring
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-md border bg-white px-2 py-0.5 text-navy">
          All Campaigns <CaretDown className="size-[0.9em]" />
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-md border bg-white px-2 py-0.5 text-navy">
          <CalendarBlank className="size-[1em]" /> 01 Aug – 30 Sep 2026
        </span>
      </div>

      <div className="grid shrink-0 grid-cols-6 gap-[clamp(4px,0.5vw,8px)]">
        {KPIS.map((k, i) => {
          const I = k.icon;
          const on = beat > 0 && beat === k.focus;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, boxShadow: on ? `0 0 0 2px ${k.color}, 0 14px 26px -18px ${k.color}` : "0 0 0 0px rgba(0,0,0,0)" }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.45 }}
              className="flex min-w-0 items-center gap-1.5 rounded-lg border px-1.5 py-[clamp(3px,0.6vh,7px)]"
              style={{ background: `${k.color}0f`, borderColor: `${k.color}33` }}
            >
              <I weight="duotone" className="size-[clamp(20px,3vh,28px)] shrink-0" style={{ color: k.color }} />
              <span className="min-w-0 leading-tight">
                <span className="block font-semibold text-navy/80">{k.label}</span>
                <span className="font-display text-[length:clamp(15px,2.2vh,20px)] font-bold" style={{ color: k.color }}>
                  <Count to={k.value} />
                </span>
                {k.pct && <span className="ml-1 text-ink/65">({k.pct})</span>}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="grid shrink-0 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-[clamp(4px,0.6vw,10px)]">
        <ChannelChart beat={beat} />
        <VerifyDonut beat={beat} />
      </div>

      <Queue beat={beat} hover={hover} onHover={onHover} />
    </div>
  );
}

function ChannelChart({ beat }: { beat: number }) {
  const shown = beat >= 1;
  return (
    <Card on={beat === 1} color="#2563eb" className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <span className="font-display font-bold text-navy">Execution Status by Media Channel</span>
        <span className="flex gap-2 text-ink/70">
          {[
            ["Completed", "#22c55e"],
            ["In Progress", "#facc15"],
            ["Pending", "#f87171"],
          ].map(([l, c]) => (
            <span key={l} className="flex items-center gap-1 whitespace-nowrap">
              <span className="size-[0.7em] rounded-sm" style={{ background: c }} />
              {l}
            </span>
          ))}
        </span>
      </div>
      {CHANNELS.map((c, i) => {
        const I = c.icon;
        return (
          <div key={c.name} className="grid grid-cols-[clamp(70px,6vw,92px)_minmax(0,1fr)] items-center gap-2">
            <span className="flex items-center gap-1.5 font-medium text-navy">
              <I weight="duotone" className="size-[1.2em] shrink-0" />
              {c.name}
            </span>
            <div className="flex h-[clamp(14px,2.2vh,20px)] overflow-hidden rounded bg-slate-100 font-semibold">
              {[
                [c.done, "#22c55e", "text-white"],
                [c.prog, "#facc15", "text-ink"],
                [c.pend, "#f87171", "text-white"],
              ].map(([v, bg, tx], j) => (
                <motion.span
                  key={j}
                  initial={false}
                  animate={{ width: shown ? `${v}%` : "0%" }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.12 + j * 0.1, ease: EASE }}
                  className={cn("grid place-items-center overflow-hidden text-[13px] leading-none whitespace-nowrap", tx as string)}
                  style={{ background: bg as string }}
                >
                  {v}%
                </motion.span>
              ))}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function VerifyDonut({ beat }: { beat: number }) {
  const shown = beat >= 2;
  const offsets = VERIFY.map((_, i) => VERIFY.slice(0, i).reduce((s, v) => s + v.pct, 0));
  return (
    <Card on={beat === 2} color="#7c3aed" className="flex flex-col gap-1">
      <span className="font-display font-bold text-navy">Evidence Verification Status</span>
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative size-[clamp(70px,11vh,110px)] shrink-0">
          <svg viewBox="0 0 36 36" className="size-full -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#eef2f7" strokeWidth="5" />
            {VERIFY.map((v, i) => (
              <motion.circle
                key={v.label}
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke={v.color}
                strokeWidth="5"
                initial={false}
                animate={{ strokeDasharray: shown ? `${v.pct} ${100 - v.pct}` : "0 100", strokeDashoffset: -offsets[i] }}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.12, ease: EASE }}
              />
            ))}
          </svg>
          <span className="absolute inset-0 grid place-items-center text-center leading-none">
            <span>
              <span className="font-display block text-[length:clamp(15px,2.3vh,21px)] font-bold text-navy">248</span>
              <span className="text-ink/65">Activities</span>
            </span>
          </span>
        </div>
        <ul className="grid min-w-0 gap-px leading-tight">
          {VERIFY.map((v) => (
            <li key={v.label} className="flex items-center gap-1.5">
              <span className="size-[0.7em] shrink-0 rounded-sm" style={{ background: v.color }} />
              <span className="text-ink/80">{v.label}</span>
              <span className="font-semibold text-navy">
                {v.n} ({v.pct}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function Queue({ beat, hover, onHover }: { beat: number; hover: Issue | null; onHover: (i: Issue | null) => void }) {
  const shown = beat >= 3;
  const cols = "grid grid-cols-[minmax(0,1.25fr)_minmax(0,1.15fr)_minmax(0,0.6fr)_minmax(0,1.5fr)_minmax(0,0.85fr)_minmax(0,0.9fr)_auto] items-center gap-2";
  return (
    <Card on={beat === 3} color="#0d9488" className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="flex shrink-0 items-center justify-between">
        <span className="font-display font-bold text-navy">Exception / Compliance Queue</span>
        <span className="font-semibold text-[#1d4fc4]">View All →</span>
      </div>
      <div className={cn(cols, "shrink-0 rounded bg-slate-50 px-1.5 py-0.5 font-semibold text-navy/70")}>
        <span>Campaign</span>
        <span>Activity</span>
        <span>Media</span>
        <span>Issue / Exception</span>
        <span>Due Date</span>
        <span>Status</span>
        <span className="w-[4.2em]">Action</span>
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-fr">
        {QUEUE.map((q, i) => {
          const iss = ISSUES[q.issue];
          const I = iss.icon;
          const hot = hover === q.issue;
          return (
            <motion.div
              key={q.campaign}
              onMouseEnter={() => onHover(q.issue)}
              onMouseLeave={() => onHover(null)}
              initial={false}
              animate={{ opacity: shown ? 1 : 0.25, x: shown ? 0 : 10 }}
              transition={{ delay: shown ? 0.1 + i * 0.1 : 0, duration: 0.4 }}
              className={cn(cols, "min-h-0 border-b border-slate-100 px-1.5 leading-tight", hot ? "bg-amber-50" : "bg-white")}
            >
              <span className="font-medium text-navy">{q.campaign}</span>
              <span className="text-ink/80">{q.activity}</span>
              <span className="text-ink/80">{q.media}</span>
              <span className="flex items-center gap-1.5 text-navy">
                <I weight="duotone" className="size-[1.2em] shrink-0" style={{ color: iss.color }} />
                {iss.label}
              </span>
              <span className="text-ink/80">{q.due}</span>
              <span>
                <span className="inline-block rounded-full px-2 font-semibold whitespace-nowrap" style={{ color: Q_TONE[q.status], background: `${Q_TONE[q.status]}17` }}>
                  {q.status}
                </span>
              </span>
              <span className="w-[4.2em] rounded-md border border-[#1d4fc4]/40 text-center font-semibold text-[#1d4fc4]">Review</span>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

function Scenarios({ beat, hover, onHover }: { beat: number; hover: Issue | null; onHover: (i: Issue | null) => void }) {
  const on = beat === 4;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{
        opacity: beat >= 4 ? 1 : 0.35,
        x: 0,
        boxShadow: on ? "0 0 0 2px #db2777, 0 20px 36px -22px #db2777" : "0 18px 32px -26px rgba(7,20,51,0.6)",
      }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex min-h-0 flex-col self-center rounded-2xl border bg-white/95 p-[clamp(8px,0.9vw,14px)] text-[length:clamp(13px,1.7vh,15px)]"
    >
      <span className="font-display mb-2 shrink-0 text-[length:clamp(15px,2.1vh,19px)] font-bold text-navy">Illustrative Monitoring Scenarios</span>
      <div className="grid shrink-0 grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-2 rounded-md bg-[#eef3fb] px-2 py-1 font-display font-bold text-navy">
        <span>Scenario</span>
        <span>Monitoring Requirement</span>
      </div>
      {(Object.keys(ISSUES) as Issue[]).map((k, i) => {
        const s = ISSUES[k];
        const I = s.icon;
        const hot = hover === k;
        return (
          <motion.div
            key={k}
            onMouseEnter={() => onHover(k)}
            onMouseLeave={() => onHover(null)}
            initial={false}
            animate={{ opacity: beat >= 4 ? 1 : 0.6, x: beat >= 4 ? 0 : 8, backgroundColor: hot ? "#fffbeb" : "rgba(255,255,255,0)" }}
            transition={{ delay: on ? 0.15 + i * 0.12 : 0, duration: 0.4 }}
            className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center gap-2 border-b border-slate-100 px-2 py-[clamp(4px,0.8vh,8px)] leading-tight"
          >
            <span className="flex items-center gap-2 font-medium text-navy">
              <I weight="duotone" className="size-[1.3em] shrink-0" style={{ color: s.color }} />
              {s.label}
            </span>
            <span className="text-ink/80">{s.need}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
