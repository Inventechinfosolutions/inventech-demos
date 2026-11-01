import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { AppShell, Laptop, type NavItem } from "@/components/AmtApp";
import { FeatureStrip, type Feature } from "@/components/FeatureStrip";
import { DonutBlock, type Seg } from "@/scenes/DashboardScene";
import {
  Broadcast,
  CalendarBlank,
  CalendarCheck,
  Camera,
  CaretDown,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  ClipboardText,
  Coins,
  CurrencyInr,
  DownloadSimple,
  FileCsv,
  FilePdf,
  Funnel,
  GearSix,
  House,
  Image,
  LockKey,
  MagnifyingGlass,
  MapPin,
  Megaphone,
  Monitor,
  Newspaper,
  SealCheck,
  ShieldCheck,
  Stack,
  Storefront,
  UsersThree,
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
  { label: "Administration", icon: GearSix },
];

const FEATURES: Feature[] = [
  { title: "Search and Filter", icon: MagnifyingGlass, color: "#2563eb", items: ["Search and filter campaign records."] },
  { title: "Report Categories", icon: Stack, color: "#7c3aed", items: ["View campaign, financial, compliance and vendor reports."] },
  { title: "PDF and CSV Export", icon: DownloadSimple, color: "#e11d48", items: ["Export reports in PDF and CSV formats."] },
  { title: "Scheduled Reports", icon: CalendarCheck, color: "#ea580c", items: ["Schedule periodic reports (e.g., daily, weekly, monthly)."] },
  { title: "Role-based Access", icon: LockKey, color: "#0d9488", items: ["Role-based access to reports and analytics."] },
];

const TABS: { label: string; icon: CessIcon }[] = [
  { label: "Campaign Reports", icon: ClipboardText },
  { label: "Financial Reports", icon: Coins },
  { label: "Compliance Reports", icon: ShieldCheck },
  { label: "Vendor & Media Reports", icon: UsersThree },
  { label: "Analytics", icon: ChartLineUp },
];

const REPORTS: { label: string; icon: CessIcon }[] = [
  { label: "Campaign-wise Status Report", icon: ClipboardText },
  { label: "Execution Report", icon: ChartBar },
  { label: "Schedule Report", icon: CalendarBlank },
  { label: "Expenditure Report", icon: Coins },
  { label: "Budget Utilization Report", icon: CurrencyInr },
  { label: "Proof-of-Display (PoD) Report", icon: Image },
  { label: "Verification & Compliance Report", icon: ShieldCheck },
  { label: "Vendor-wise Activity Report", icon: UsersThree },
  { label: "Media Channel-wise Report", icon: Monitor },
];

const EXECUTION: Seg[] = [
  { label: "Completed", n: "960", pct: 76.9, color: "#22c55e" },
  { label: "In Progress", n: "168", pct: 13.5, color: "#60a5fa" },
  { label: "Pending", n: "120", pct: 9.6, color: "#facc15" },
];

const POD: Seg[] = [
  { label: "Verified", n: "921", pct: 77.7, color: "#22c55e" },
  { label: "Pending", n: "172", pct: 14.5, color: "#facc15" },
  { label: "Rejected", n: "93", pct: 7.8, color: "#f87171" },
];

const SPEND: { name: string; icon: CessIcon; cr: number }[] = [
  { name: "Print", icon: Newspaper, cr: 8.2 },
  { name: "Digital", icon: Monitor, cr: 5.4 },
  { name: "Outdoor", icon: MapPin, cr: 5.0 },
];

type Ch = "print" | "digital" | "outdoor";
const CH_ICON: Record<Ch, CessIcon> = { print: Newspaper, digital: Monitor, outdoor: MapPin };

const ROWS: { name: string; ch: Ch[]; planned: number; done: number; pend: number; cr: string; budget: string; util: number; pod: number }[] = [
  { name: "Clean Karnataka Campaign", ch: ["print", "digital", "outdoor"], planned: 300, done: 280, pend: 20, cr: "6.20", budget: "6.50", util: 95.4, pod: 96.4 },
  { name: "Health Awareness Drive", ch: ["print", "digital"], planned: 200, done: 184, pend: 16, cr: "4.80", budget: "5.00", util: 96.0, pod: 92.3 },
  { name: "Water Conservation", ch: ["digital", "outdoor"], planned: 200, done: 180, pend: 20, cr: "3.40", budget: "4.00", util: 85.0, pod: 90.0 },
  { name: "Digital Citizen Services", ch: ["digital"], planned: 160, done: 140, pend: 20, cr: "2.70", budget: "3.00", util: 90.0, pod: 87.5 },
  { name: "Road Safety Awareness", ch: ["print", "digital"], planned: 140, done: 120, pend: 20, cr: "1.50", budget: "2.00", util: 75.0, pod: 85.7 },
];

const toneFor = (v: number) => (v >= 90 ? "#15803d" : v >= 80 ? "#a16207" : "#be123c");

/** Feature tile highlighted on each beat. */
const FEATURE_AT = [-1, 0, 1, 2, 3, 4, 5];

/**
 * Beats: 0 reports module, 1 search and filter, 2 report categories, 3 PDF and CSV export,
 * 4 scheduled reports, 5 role-based access, 6 expected outcome.
 */
export function ReportsScene({ beat }: { beat: number }) {
  const [report, setReport] = useState(0);
  return (
    <div className="flex h-full flex-col gap-[clamp(6px,1vh,12px)] text-ink">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="font-display shrink-0 text-center text-[length:clamp(16px,2.4vh,23px)] font-bold text-navy"
      >
        Structured reporting for <span className="text-[#7c3aed]">monitoring, review and decision-making.</span>
      </motion.p>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,clamp(240px,22%,340px))] gap-[clamp(8px,1vw,18px)] px-[1%]">
        <Laptop>
          <AppShell nav={NAV} active="Reports">
            <ReportsApp beat={beat} report={report} />
          </AppShell>
        </Laptop>
        <AvailableReports beat={beat} active={report} onPick={setReport} />
      </div>

      <FeatureStrip
        features={FEATURES}
        active={FEATURE_AT[beat] ?? -1}
        outcomeShown={beat >= 6}
        outcome={
          <>
            <span className="font-display font-bold text-[#15803d]">A structured reporting environment</span> for campaign reviews, administrative monitoring and management decisions.
          </>
        }
      />
    </div>
  );
}

function Box({ on, color, className, children }: { on: boolean; color: string; className?: string; children: ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ boxShadow: on ? `0 0 0 2px ${color}, 0 16px 30px -20px ${color}` : "0 0 0 0px rgba(0,0,0,0)" }}
      transition={{ duration: 0.4 }}
      className={cn("rounded-lg border bg-white", className)}
    >
      {children}
    </motion.div>
  );
}

function ReportsApp({ beat, report }: { beat: number; report: number }) {
  const [tab, setTab] = useState(0);
  const shown = beat >= 1;
  return (
    <div className="flex h-full flex-col gap-[clamp(4px,0.7vh,8px)]">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="font-display min-w-0 flex-1 text-[length:clamp(14.5px,1.95vh,17px)] leading-tight font-bold text-navy">
          Reports & Analytics – Campaign Performance and Compliance
        </span>
        <motion.span
          initial={false}
          animate={{ scale: beat === 5 ? [1, 1.08, 1] : 1, boxShadow: beat === 5 ? "0 0 0 3px #0d948855" : "0 0 0 0px transparent" }}
          transition={{ duration: 0.8 }}
          className="flex shrink-0 items-center gap-1 rounded-full bg-[#0d9488]/12 px-2 py-0.5 font-semibold text-[#0f766e]"
        >
          <LockKey weight="fill" className="size-[1em]" /> DIPR Official
        </motion.span>
      </div>

      <Box on={beat === 2} color="#7c3aed" className="flex shrink-0 flex-wrap gap-1 border-transparent bg-transparent">
        {TABS.map((t, i) => {
          const I = t.icon;
          const on = tab === i;
          return (
            <button
              key={t.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTab(i);
              }}
              className={cn("flex flex-auto items-center justify-center gap-1.5 rounded-md border px-2 py-[clamp(2px,0.5vh,5px)] font-semibold whitespace-nowrap", on ? "border-[#1d4fc4] bg-[#1d4fc4] text-white" : "bg-white text-navy")}
            >
              <I weight={on ? "fill" : "regular"} className="size-[1.1em] shrink-0" />
              {t.label}
            </button>
          );
        })}
      </Box>

      <Box on={beat === 1} color="#2563eb" className="flex shrink-0 flex-wrap items-end gap-x-2 gap-y-1 px-2 py-1">
        <span className="flex items-center gap-1 self-center font-display font-bold text-navy">
          <Funnel weight="bold" className="size-[1.05em]" /> Report Filters
        </span>
        {[
          ["Campaign", "All Campaigns"],
          ["Media Channel", "All Media Channels"],
          ["Status", "All Statuses"],
        ].map(([k, v]) => (
          <span key={k} className="min-w-0 leading-tight">
            <span className="block font-semibold text-navy/70">{k}</span>
            <span className="flex items-center gap-1 rounded-md border px-1.5 whitespace-nowrap text-navy">
              {v} <CaretDown className="size-[0.85em]" />
            </span>
          </span>
        ))}
        <span className="min-w-0 leading-tight">
          <span className="block font-semibold text-navy/70">Date Range</span>
          <span className="flex items-center gap-1 rounded-md border px-1.5 whitespace-nowrap text-navy">
            <CalendarBlank className="size-[1em]" /> 01 Apr – 30 Sep 2026
          </span>
        </span>
        <motion.span
          initial={false}
          animate={beat === 1 ? { scale: [1, 0.92, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="ml-auto flex items-center gap-1 rounded-md bg-[#1d4fc4] px-2 py-0.5 font-semibold whitespace-nowrap text-white"
        >
          <ChartBar weight="bold" className="size-[1em]" /> Generate Report
        </motion.span>
      </Box>

      <div className="grid min-h-0 flex-[0.9] grid-cols-3 gap-[clamp(4px,0.6vw,10px)]">
        <Box on={false} color="#16a34a" className="flex min-h-0 min-w-0 flex-col gap-1 p-[clamp(5px,0.6vw,9px)]">
          <span className="font-display shrink-0 font-bold text-navy">Campaign Execution Overview</span>
          <DonutBlock segs={EXECUTION} total={1248} unit="Activities" shown={shown} size="size-[clamp(72px,11.5vh,120px)]" />
        </Box>
        <Box on={false} color="#2563eb" className="flex min-h-0 min-w-0 flex-col gap-1 p-[clamp(5px,0.6vw,9px)]">
          <span className="font-display shrink-0 font-bold text-navy">Expenditure by Media Channel</span>
          <SpendChart shown={shown} />
        </Box>
        <Box on={false} color="#ea580c" className="flex min-h-0 min-w-0 flex-col gap-1 p-[clamp(5px,0.6vw,9px)]">
          <span className="font-display shrink-0 font-bold text-navy">Proof-of-Display (PoD) Status</span>
          <DonutBlock segs={POD} total={1186} unit="Evidence" shown={shown} size="size-[clamp(72px,11.5vh,120px)]" />
        </Box>
      </div>

      <Summary beat={beat} title={REPORTS[report].label} shown={shown} />
    </div>
  );
}

function SpendChart({ shown }: { shown: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-[10%] border-b border-slate-200 px-[6%]">
        {SPEND.map((s, i) => (
          <div key={s.name} className="flex min-h-0 flex-col justify-end">
            <motion.span initial={false} animate={{ opacity: shown ? 1 : 0 }} transition={{ delay: shown ? 0.6 + i * 0.1 : 0 }} className="text-center font-semibold whitespace-nowrap text-navy">
              ₹ {s.cr.toFixed(2)} Cr
            </motion.span>
            <motion.span
              initial={false}
              animate={{ height: shown ? `${(s.cr / 10) * 80}%` : "0%" }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.12, ease: EASE }}
              className="block rounded-t bg-linear-to-b from-[#60a5fa] to-[#2563eb]"
            />
          </div>
        ))}
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-[10%] px-[6%]">
        {SPEND.map((s) => {
          const I = s.icon;
          return (
            <span key={s.name} className="flex items-center justify-center gap-1 font-medium text-navy">
              <I weight="duotone" className="size-[1.1em] shrink-0" />
              {s.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Summary({ beat, title, shown }: { beat: number; title: string; shown: boolean }) {
  const exported = beat === 3;
  const cols = "grid grid-cols-[minmax(0,2fr)_auto_repeat(5,minmax(0,0.7fr))_auto_auto] items-center gap-x-2";
  return (
    <Box on={false} color="#e11d48" className="relative flex min-h-0 flex-1 flex-col gap-1 p-[clamp(5px,0.6vw,9px)]">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={title} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-display min-w-0 flex-1 font-bold text-navy">
            {title} – Summary
          </motion.span>
        </AnimatePresence>
        <span className="font-semibold text-navy/70">Export:</span>
        <motion.span
          initial={false}
          animate={{ boxShadow: exported ? "0 0 0 2px #e11d48" : "0 0 0 0px transparent", scale: exported ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-1 rounded-md border px-1.5 font-semibold text-[#e11d48]"
        >
          <FilePdf weight="fill" className="size-[1.1em]" /> PDF
        </motion.span>
        <motion.span
          initial={false}
          animate={{ boxShadow: exported ? "0 0 0 2px #16a34a" : "0 0 0 0px transparent", scale: exported ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center gap-1 rounded-md border px-1.5 font-semibold text-[#16a34a]"
        >
          <FileCsv weight="fill" className="size-[1.1em]" /> CSV
        </motion.span>
        <motion.span
          initial={false}
          animate={{ boxShadow: beat === 4 ? "0 0 0 2px #ea580c" : "0 0 0 0px transparent", scale: beat === 4 ? [1, 1.08, 1] : 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center gap-1 rounded-md border px-1.5 font-semibold whitespace-nowrap text-navy"
        >
          <CalendarCheck weight="bold" className="size-[1.1em] text-[#ea580c]" /> Schedule Report
          <AnimatePresence>
            {beat === 4 && (
              <motion.span
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: 0.4 }}
                className="absolute top-[calc(100%+6px)] right-0 z-20 flex gap-1 rounded-lg border bg-white p-1.5 shadow-lg"
              >
                {["Daily", "Weekly", "Monthly"].map((f) => (
                  <span key={f} className={cn("rounded-md px-2 font-semibold", f === "Weekly" ? "bg-[#ea580c] text-white" : "bg-slate-100 text-navy")}>
                    {f}
                  </span>
                ))}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
        <div className={cn(cols, "shrink-0 bg-slate-50 px-1.5 py-0.5 leading-tight font-semibold text-navy/70")}>
          <span>Campaign Name</span>
          <span className="w-[4.2em]">Media</span>
          <span className="text-right">Planned</span>
          <span className="text-right">Completed</span>
          <span className="text-right">Pending</span>
          <span className="text-right">₹ Cr</span>
          <span className="text-right">Budget</span>
          <span className="w-[4.4em] text-center">Utilization</span>
          <span className="w-[4.4em] text-center">PoD</span>
        </div>
        <div className="grid min-h-0 flex-1 auto-rows-fr">
          {ROWS.map((r, i) => (
            <motion.div
              key={r.name}
              initial={false}
              animate={{ opacity: shown ? 1 : 0.35, x: shown ? 0 : 8 }}
              transition={{ delay: shown ? 0.2 + i * 0.08 : 0, duration: 0.4 }}
              className={cn(cols, "min-h-0 border-t border-slate-100 px-1.5 leading-tight")}
            >
              <span className="font-medium text-navy">{r.name}</span>
              <span className="flex w-[4.2em] gap-1 text-navy/70">
                {r.ch.map((c) => {
                  const I = CH_ICON[c];
                  return <I key={c} weight="duotone" className="size-[1.15em]" />;
                })}
              </span>
              <span className="text-right text-ink/80">{r.planned}</span>
              <span className="text-right text-ink/80">{r.done}</span>
              <span className="text-right text-ink/80">{r.pend}</span>
              <span className="text-right text-ink/80">{r.cr}</span>
              <span className="text-right text-ink/80">{r.budget}</span>
              <span className="w-[4.4em] text-center">
                <span className="inline-block rounded-full px-1.5 font-semibold" style={{ color: toneFor(r.util), background: `${toneFor(r.util)}17` }}>
                  {r.util.toFixed(1)}%
                </span>
              </span>
              <span className="w-[4.4em] text-center">
                <span className="inline-block rounded-full px-1.5 font-semibold" style={{ color: toneFor(r.pod), background: `${toneFor(r.pod)}17` }}>
                  {r.pod.toFixed(1)}%
                </span>
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {exported && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ delay: 0.7 }}
            className="absolute right-3 bottom-3 z-20 flex items-center gap-2 rounded-lg bg-navy px-3 py-1.5 font-semibold text-white shadow-lg"
          >
            <CheckCircle weight="fill" className="size-[1.2em] text-[#4ade80]" /> Report exported as PDF and CSV
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

function AvailableReports({ beat, active, onPick }: { beat: number; active: number; onPick: (i: number) => void }) {
  const on = beat === 2;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{
        opacity: 1,
        x: 0,
        boxShadow: on ? "0 0 0 2px #7c3aed, 0 20px 36px -22px #7c3aed" : "0 18px 32px -26px rgba(7,20,51,0.6)",
      }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex min-h-0 flex-col self-center rounded-2xl border bg-white/95 p-[clamp(8px,0.9vw,14px)] text-[length:clamp(13px,1.7vh,15px)]"
    >
      <span className="font-display mb-2 flex shrink-0 items-center gap-2 text-[length:clamp(15px,2.1vh,19px)] font-bold text-navy">
        <ClipboardText weight="duotone" className="size-[1.3em] text-[#1d4fc4]" /> Available Reports
      </span>
      {REPORTS.map((r, i) => {
        const I = r.icon;
        const sel = active === i;
        return (
          <motion.button
            key={r.label}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPick(i);
            }}
            initial={false}
            animate={{ x: on ? [0, 4, 0] : 0 }}
            transition={{ delay: on ? i * 0.06 : 0, duration: 0.4 }}
            className={cn(
              "flex items-center gap-2 rounded-md border-b border-slate-100 px-2 py-[clamp(3px,0.65vh,7px)] text-left leading-tight font-medium",
              sel ? "bg-[#1d4fc4] text-white" : "text-navy hover:bg-slate-50",
            )}
          >
            <I weight={sel ? "fill" : "duotone"} className={cn("size-[1.25em] shrink-0", !sel && "text-[#1d4fc4]")} />
            {r.label}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
