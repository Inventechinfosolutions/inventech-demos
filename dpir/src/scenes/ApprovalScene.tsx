import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell, Laptop, type NavItem } from "@/components/AmtApp";
import { FeatureStrip, type Feature } from "@/components/FeatureStrip";
import { CAMPAIGN } from "@/scenes/CampaignScene";
import {
  ArrowLeft,
  CalendarBlank,
  CalendarCheck,
  ChartBar,
  Check,
  CheckCircle,
  ClipboardText,
  Clock,
  Coins,
  CurrencyInr,
  FileText,
  MagnifyingGlass,
  MapPin,
  Megaphone,
  Newspaper,
  Receipt,
  SealCheck,
  SquaresFour,
  Television,
  UploadSimple,
  Wallet,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import imgCampaign from "@/assets/title-bg.webp";
import imgReviewer from "@/assets/photos/sol-web.webp";

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV: NavItem[] = [
  { label: "Dashboard", icon: SquaresFour },
  { label: "Campaigns", icon: Megaphone },
  { label: "Planning", icon: ClipboardText },
  { label: "Budget", icon: CurrencyInr },
  { label: "Approvals", icon: SealCheck },
  { label: "Calendar", icon: CalendarBlank },
  { label: "Reports", icon: ChartBar },
];

const STAGES: { label: string; icon: CessIcon; color: string; when: string; detail: string }[] = [
  { label: "Draft", icon: FileText, color: "#64748b", when: "01-07-2026 10:30 AM", detail: "Created by Campaign Officer" },
  { label: "Submitted", icon: UploadSimple, color: "#2563eb", when: "02-07-2026 11:15 AM", detail: "Submitted for review" },
  { label: "Under Review", icon: MagnifyingGlass, color: "#ea580c", when: "03-07-2026 02:20 PM", detail: "With Joint Director (Advt.)" },
  { label: "Approved", icon: CheckCircle, color: "#16a34a", when: "05-07-2026 04:10 PM", detail: "Media plan and budget approved" },
  { label: "Scheduled", icon: CalendarCheck, color: "#7c3aed", when: "06-07-2026 09:00 AM", detail: "Ready for execution" },
];

type Tab = "Media Plan" | "Budget" | "History" | "Schedule";
const TABS: Tab[] = ["Media Plan", "Budget", "History", "Schedule"];

const PLAN: { channel: string; icon: CessIcon; color: string; details: string; qty: string; cost: string; lakh: number; weeks: [number, number] }[] = [
  { channel: "Print", icon: Newspaper, color: "#ea580c", details: "Major newspapers (English and Kannada)", qty: "25 insertions", cost: "12,00,000", lakh: 12, weeks: [1, 4] },
  { channel: "Digital", icon: Television, color: "#7c3aed", details: "News portals and social media", qty: "3 platforms", cost: "8,00,000", lakh: 8, weeks: [2, 6] },
  { channel: "Outdoor", icon: MapPin, color: "#16a34a", details: "Hoardings and bus shelters", qty: "12 locations", cost: "15,00,000", lakh: 15, weeks: [2, 7] },
];

const HISTORY = [
  { v: "v3", what: "Approved by Director", who: "05-07-2026", tone: "#16a34a" },
  { v: "v2", what: "Outdoor locations revised in media plan", who: "04-07-2026 · Campaign Officer", tone: "#ea580c" },
  { v: "v1", what: "Campaign created and submitted", who: "02-07-2026 · Campaign Officer", tone: "#2563eb" },
];

const CHECKS = ["Review campaign details", "Verify media plan and schedules", "Check budget information", "Approve or request changes"];
const CHECK_AT = [1, 1, 2, 3];

const FEATURES: Feature[] = [
  {
    title: "Campaign Planning",
    icon: ClipboardText,
    color: "#7c3aed",
    items: ["Prepare campaign-wise media plans.", "Define proposed publication and display schedules.", "Organize activities across multiple media channels.", "Associate advertising requirements with the campaign."],
  },
  {
    title: "Budget Management",
    icon: CurrencyInr,
    color: "#0d9488",
    items: ["Record campaign budgets.", "Maintain allocated budget information.", "Track campaign-wise expenditure.", "Provide visibility into planned and actual expenditure."],
  },
  {
    title: "Approval Management",
    icon: SealCheck,
    color: "#ea580c",
    items: ["Submit campaigns for review.", "Support approval workflows.", "Maintain campaign approval status.", "Record approval-related information.", "Maintain changes and version history."],
  },
  {
    title: "Scheduling",
    icon: CalendarCheck,
    color: "#2563eb",
    items: ["Maintain campaign calendars.", "View upcoming campaign activities.", "Track scheduled and ongoing campaigns.", "Monitor activities against planned dates."],
  },
];

const stageAt = (beat: number) => (beat >= 4 ? 4 : beat >= 3 ? 3 : beat >= 1 ? 2 : 1);
const tabAt = (beat: number): Tab => (beat >= 4 ? "Schedule" : beat >= 3 ? "History" : beat >= 2 ? "Budget" : "Media Plan");

/**
 * Beats: 0 submitted campaign, 1 campaign planning (under review), 2 budget management,
 * 3 approval management (approved), 4 scheduling (scheduled), 5 expected outcome.
 */
export function ApprovalScene({ beat }: { beat: number }) {
  const stage = stageAt(beat);
  const [tab, setTab] = useState<Tab>(tabAt(beat));
  useEffect(() => setTab(tabAt(beat)), [beat]);

  return (
    <div className="flex h-full flex-col gap-[clamp(6px,1vh,12px)] text-ink">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="font-display shrink-0 text-center text-[length:clamp(16px,2.4vh,23px)] font-bold text-navy"
      >
        Structured planning, <span className="text-[#0d9488]">budget tracking</span> and <span className="text-[#16a34a]">controlled approvals.</span>
      </motion.p>

      <WorkflowBar stage={stage} />

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)] gap-[clamp(10px,1.2vw,20px)]">
        <Laptop>
          <AppShell nav={NAV} active="Approvals">
            <CampaignDetail beat={beat} stage={stage} tab={tab} setTab={setTab} />
          </AppShell>
        </Laptop>
        <ReviewCard beat={beat} />
      </div>

      <FeatureStrip
        features={FEATURES}
        active={beat - 1}
        outcomeShown={beat >= 5}
        outcome={
          <>
            <span className="font-display font-bold text-[#15803d]">An approved campaign</span> with clearly defined media requirements, budget information and execution schedules.
          </>
        }
      />
    </div>
  );
}

function WorkflowBar({ stage }: { stage: number }) {
  return (
    <ol className="mx-auto flex w-full max-w-[1120px] shrink-0 items-center justify-between gap-1">
      {STAGES.map((s, i) => {
        const I = s.icon;
        const done = i < stage;
        const on = i === stage;
        return (
          <li key={s.label} className="contents">
            {i > 0 && (
              <motion.span
                initial={false}
                animate={{ opacity: i <= stage ? 1 : 0.3 }}
                className="h-[3px] min-w-4 flex-1 rounded"
                style={{ background: i <= stage ? `linear-gradient(90deg, ${STAGES[i - 1].color}, ${s.color})` : "#cbd5e1" }}
              />
            )}
            <motion.span
              initial={false}
              animate={{ scale: on ? 1.06 : 1, opacity: done || on ? 1 : 0.45 }}
              transition={{ duration: 0.4 }}
              className="flex shrink-0 items-center gap-2 rounded-full border-2 bg-white py-1 pr-4 pl-1"
              style={{ borderColor: done || on ? s.color : "#e2e8f0", boxShadow: on ? `0 0 0 5px ${s.color}22, 0 12px 24px -14px ${s.color}` : undefined }}
            >
              <span className="grid size-[clamp(28px,4.2vh,38px)] place-items-center rounded-full text-white" style={{ background: done || on ? s.color : "#cbd5e1" }}>
                {done ? <Check weight="bold" className="size-1/2" /> : <I weight="bold" className="size-1/2" />}
              </span>
              <span className="font-display text-[length:clamp(14px,2vh,18px)] font-bold" style={{ color: done || on ? s.color : "#64748b" }}>
                {i + 1}. {s.label}
              </span>
            </motion.span>
          </li>
        );
      })}
    </ol>
  );
}

function CampaignDetail({ beat, stage, tab, setTab }: { beat: number; stage: number; tab: Tab; setTab: (t: Tab) => void }) {
  const s = STAGES[stage];
  return (
    <div className="grid h-full grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] gap-[clamp(6px,0.7vw,12px)]">
      <div className="flex min-h-0 flex-col gap-[clamp(4px,0.7vh,8px)]">
        <div className="flex shrink-0 items-center gap-3 rounded-lg border bg-white p-[clamp(5px,0.6vw,8px)]">
          <div className="relative h-[clamp(46px,7vh,70px)] w-[clamp(70px,7vw,110px)] shrink-0 overflow-hidden rounded-md">
            <img src={imgCampaign} alt="" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-0 bg-linear-to-t from-[#14532d]/85 to-transparent" />
            <span className="font-display absolute inset-x-1 bottom-0.5 text-center text-[13px] leading-tight font-black text-white uppercase">Swachh</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ArrowLeft className="size-[1.1em] shrink-0 text-navy/60" />
              <span className="font-display min-w-0 text-[length:clamp(14.5px,1.95vh,17px)] leading-tight font-bold text-navy">{CAMPAIGN.name}</span>

            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-4 text-ink/75">
                <AnimatePresence mode="wait">
                <motion.span
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  className="shrink-0 rounded-full px-2 font-semibold whitespace-nowrap"
                  style={{ color: s.color, background: `${s.color}18` }}
                >
                  {s.label}
                </motion.span>
              </AnimatePresence>
              <span className="font-mono font-semibold text-[#1d4fc4]">{CAMPAIGN.id}</span>
              <span>{CAMPAIGN.category}</span>
              <span>
                {CAMPAIGN.start} to {CAMPAIGN.end}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTab(t);
              }}
              className={cn("relative px-3 py-1 font-semibold", tab === t ? "text-[#1d4fc4]" : "text-navy/60 hover:text-navy")}
            >
              {t}
              {tab === t && <motion.span layoutId="apv-tab" className="absolute inset-x-1 -bottom-px h-[3px] rounded bg-[#1d4fc4]" />}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-white p-[clamp(5px,0.6vw,9px)]">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="h-full">
              {tab === "Media Plan" && <MediaPlan />}
              {tab === "Budget" && <Budget />}
              {tab === "History" && <History />}
              {tab === "Schedule" && <Schedule scheduled={beat >= 4} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex min-h-0 flex-col rounded-lg border bg-white p-[clamp(5px,0.6vw,9px)]">
        <div className="mb-1 flex shrink-0 items-center justify-between">
          <span className="font-display font-bold text-navy">Approval Workflow</span>
          <span className="flex items-center gap-1 font-semibold text-[#1d4fc4]">
            <Clock className="size-[1em]" /> History
          </span>
        </div>
        <ol className="relative grid min-h-0 flex-1 content-evenly">
          <span className="absolute top-3 bottom-3 left-[clamp(13px,1.9vh,17px)] w-0.5 bg-slate-200" aria-hidden />
          {STAGES.map((st, i) => {
            const I = st.icon;
            const done = i < stage;
            const on = i === stage;
            return (
              <motion.li key={st.label} initial={false} animate={{ opacity: done || on ? 1 : 0.4 }} className="relative flex items-start gap-2">
                <span
                  className="relative grid size-[clamp(26px,3.8vh,34px)] shrink-0 place-items-center rounded-full border-2 bg-white"
                  style={{ borderColor: done || on ? st.color : "#cbd5e1", color: done || on ? st.color : "#94a3b8" }}
                >
                  {on && <motion.span className="absolute inset-0 rounded-full" style={{ background: st.color }} animate={{ scale: [1, 1.6], opacity: [0.35, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />}
                  {done ? <Check weight="bold" className="size-1/2" /> : <I weight="bold" className="size-1/2" />}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block font-bold" style={{ color: done || on ? st.color : "#64748b" }}>
                    {st.label}
                  </span>
                  <span className="block text-ink/70">{done || on ? st.when : "Pending"}</span>
                  {on && <span className="block font-medium text-navy">{st.detail}</span>}
                </span>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function MediaPlan() {
  const cols = "grid grid-cols-[0.9fr_2fr_1.05fr_0.95fr] items-center gap-2";
  return (
    <div className="flex h-full flex-col">
      <div className="font-display mb-1 shrink-0 font-bold text-navy">Proposed Media Plan</div>
      <div className={cn(cols, "shrink-0 rounded-md bg-slate-50 px-2 py-1 font-semibold text-navy/70")}>
        <span>Channel</span>
        <span>Details</span>
        <span>Quantity</span>
        <span className="text-right">Cost (₹)</span>
      </div>
      <div className="grid min-h-0 flex-1 content-evenly">
        {PLAN.map((p, i) => {
          const I = p.icon;
          return (
            <motion.div key={p.channel} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.12 }} className={cn(cols, "border-b border-slate-100 px-2 py-1")}>
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: p.color }}>
                <I weight="duotone" className="size-[1.3em] shrink-0" />
                {p.channel}
              </span>
              <span className="leading-snug">{p.details}</span>
              <span>{p.qty}</span>
              <span className="text-right font-semibold text-navy">{p.cost}</span>
            </motion.div>
          );
        })}
      </div>
      <div className={cn(cols, "shrink-0 rounded-md bg-[#eff4ff] px-2 py-1 font-bold text-navy")}>
        <span className="col-span-3">Planned total, 1 Aug to 30 Sep 2026</span>
        <span className="text-right">35,00,000</span>
      </div>
    </div>
  );
}

function Budget() {
  const tiles: { label: string; value: string; icon: CessIcon; color: string }[] = [
    { label: "Total Budget", value: `₹ ${CAMPAIGN.budget}`, icon: Coins, color: "#d97706" },
    { label: "Allocated", value: "₹ 35,00,000", icon: Wallet, color: "#16a34a" },
    { label: "Actual Expenditure", value: "₹ 0", icon: Receipt, color: "#ea580c" },
  ];
  return (
    <div className="flex h-full flex-col gap-[clamp(4px,0.8vh,10px)]">
      <div className="grid shrink-0 grid-cols-3 gap-2">
        {tiles.map((t, i) => {
          const I = t.icon;
          return (
            <motion.div key={t.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="flex items-center gap-2 rounded-lg border p-1.5" style={{ background: `${t.color}0f`, borderColor: `${t.color}35` }}>
              <I weight="duotone" className="size-[clamp(24px,3.4vh,32px)] shrink-0" style={{ color: t.color }} />
              <span className="min-w-0">
                <span className="block text-ink/70">{t.label}</span>
                <span className="font-display block text-[length:clamp(14px,2vh,18px)] font-bold text-navy">{t.value}</span>
              </span>
            </motion.div>
          );
        })}
      </div>
      <div className="flex shrink-0 items-center justify-between font-semibold text-navy">
        <span>Planned and actual expenditure by channel</span>
        <span className="flex items-center gap-3 text-ink/70">
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-sm bg-[#1d4fc4]" /> Planned
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-sm bg-[#ea580c]" /> Actual
          </span>
        </span>
      </div>
      <div className="grid min-h-0 flex-1 content-evenly gap-1">
        {PLAN.map((p, i) => (
          <div key={p.channel} className="grid grid-cols-[70px_minmax(0,1fr)_96px] items-center gap-2">
            <span className="font-semibold" style={{ color: p.color }}>
              {p.channel}
            </span>
            <span className="grid gap-0.5">
              <motion.span initial={{ width: 0 }} animate={{ width: `${(p.lakh / 15) * 100}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.12, ease: EASE }} className="h-[clamp(8px,1.3vh,12px)] rounded bg-[#1d4fc4]" />
              <span className="h-[clamp(8px,1.3vh,12px)] w-1 rounded bg-[#ea580c]" />
            </span>
            <span className="text-right font-semibold text-navy">₹ {p.cost}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function History() {
  return (
    <div className="flex h-full flex-col">
      <div className="font-display mb-1 shrink-0 font-bold text-navy">Changes and Version History</div>
      <ol className="grid min-h-0 flex-1 content-evenly gap-1">
        {HISTORY.map((h, i) => (
          <motion.li key={h.v} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.15 }} className="flex items-center gap-3 rounded-lg border px-2 py-1.5" style={{ borderColor: `${h.tone}40`, background: `${h.tone}0a` }}>
            <span className="font-display grid size-[clamp(28px,4vh,36px)] shrink-0 place-items-center rounded-full font-bold text-white" style={{ background: h.tone }}>
              {h.v}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-navy">{h.what}</span>
              <span className="block text-ink/70">{h.who}</span>
            </span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function Schedule({ scheduled }: { scheduled: boolean }) {
  const weeks = ["W1", "W2", "W3", "W4", "W1", "W2", "W3", "W4"];
  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 flex shrink-0 items-center justify-between">
        <span className="font-display font-bold text-navy">Campaign Calendar</span>
        <span className="rounded-full px-2 font-semibold" style={{ color: scheduled ? "#7c3aed" : "#64748b", background: scheduled ? "#7c3aed18" : "#64748b18" }}>
          {scheduled ? "Scheduled" : "Proposed"}
        </span>
      </div>
      <div className="grid shrink-0 grid-cols-[80px_repeat(8,minmax(0,1fr))] text-center font-semibold text-navy/70">
        <span />
        <span className="col-span-4 border-b">Aug 2026</span>
        <span className="col-span-4 border-b border-l">Sep 2026</span>
        <span />
        {weeks.map((w, i) => (
          <span key={i} className={cn(i === 4 && "border-l")}>
            {w}
          </span>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 content-evenly">
        {PLAN.map((p, i) => (
          <div key={p.channel} className="grid grid-cols-[80px_repeat(8,minmax(0,1fr))] items-center">
            <span className="font-semibold" style={{ color: p.color }}>
              {p.channel}
            </span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.15, ease: EASE }}
              className="h-[clamp(14px,2.2vh,20px)] origin-left rounded-full"
              style={{ gridColumn: `${p.weeks[0] + 1} / ${p.weeks[1] + 2}`, background: `linear-gradient(90deg, ${p.color}, ${p.color}aa)` }}
            />
          </div>
        ))}
      </div>
      <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-0.5 border-t pt-1 text-navy">
        <span className="font-semibold text-navy/70">Upcoming:</span>
        <span>Print release, 08-08-2026</span>
        <span>Outdoor and digital launch, 15-08-2026</span>
      </div>
    </div>
  );
}

function ReviewCard({ beat }: { beat: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
      className="flex min-h-0 flex-col gap-[clamp(5px,0.9vh,10px)] rounded-2xl border border-[#1d4fc4]/20 bg-white/95 p-[clamp(8px,0.9vw,14px)] shadow-[0_24px_50px_-30px_rgba(7,20,51,0.7)]"
    >
      <div className="flex shrink-0 items-center gap-2">
        <SealCheck weight="fill" className="size-[clamp(22px,3.2vh,30px)] text-[#d97706]" />
        <span className="font-display text-[length:clamp(15px,2.15vh,20px)] font-bold text-navy">Review and Approve</span>
      </div>
      <div className="relative min-h-[clamp(50px,9vh,150px)] flex-1 overflow-hidden rounded-xl">
        <img src={imgReviewer} alt="" className="absolute inset-0 size-full object-cover object-[50%_30%]" />
        <AnimatePresence>
          {beat >= 3 && (
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ delay: 1.1, type: "spring", stiffness: 260, damping: 16 }}
              className="absolute right-2 bottom-2 grid size-[clamp(40px,6vh,56px)] place-items-center rounded-full bg-[#16a34a] text-white shadow-lg ring-4 ring-white"
            >
              <Check weight="bold" className="size-1/2" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <ul className="grid shrink-0 gap-[clamp(3px,0.6vh,7px)]">
        {CHECKS.map((c, i) => {
          const on = beat >= CHECK_AT[i];
          return (
            <motion.li key={c} initial={false} animate={{ opacity: on ? 1 : 0.5 }} className="flex items-start gap-2 text-[length:clamp(13px,1.8vh,16px)] leading-snug font-medium text-ink">
              <motion.span
                initial={false}
                animate={{ backgroundColor: on ? "#16a34a" : "#ffffff", borderColor: on ? "#16a34a" : "#cbd5e1" }}
                transition={{ delay: on ? 0.3 + i * 0.2 : 0 }}
                className="mt-[0.1em] grid size-[1.2em] shrink-0 place-items-center rounded-full border-2 text-white"
              >
                {on && <Check weight="bold" className="size-[0.75em]" />}
              </motion.span>
              {c}
            </motion.li>
          );
        })}
      </ul>
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <Btn tone="#ea580c" outline>
          Request Changes
        </Btn>
        <Btn tone="#16a34a" pressed={beat >= 3}>
          {beat >= 3 ? "Approved" : "Approve"}
        </Btn>
      </div>
      <p className="shrink-0 border-t pt-1.5 text-[13px] leading-snug text-ink/70 italic">
        Illustrative workflow; final approval stages will be configured according to DIPR's administrative requirements.
      </p>
    </motion.div>
  );
}

function Btn({ tone, outline, pressed, children }: { tone: string; outline?: boolean; pressed?: boolean; children: ReactNode }) {
  return (
    <motion.span
      animate={pressed ? { scale: [1, 0.94, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, delay: 0.9 }}
      className="grid place-items-center rounded-lg border-2 px-2 py-[clamp(3px,0.7vh,7px)] text-center text-[length:clamp(13px,1.7vh,15px)] font-bold"
      style={outline ? { borderColor: tone, color: tone } : { borderColor: tone, background: tone, color: "#fff" }}
    >
      {children}
    </motion.span>
  );
}
