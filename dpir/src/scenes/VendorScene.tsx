import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AppShell, Laptop, type NavItem } from "@/components/AmtApp";
import { FeatureStrip, type Feature } from "@/components/FeatureStrip";
import { CAMPAIGN } from "@/scenes/CampaignScene";
import {
  Broadcast,
  CalendarCheck,
  Camera,
  CaretDown,
  ChartBar,
  Check,
  ClipboardText,
  Eye,
  FileText,
  ListChecks,
  MagnifyingGlass,
  MapPin,
  Megaphone,
  Monitor,
  Newspaper,
  Plus,
  SealCheck,
  SquaresFour,
  Storefront,
  UsersThree,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import imgCampaign from "@/assets/title-bg.webp";
import imgPrint from "@/assets/photos/media-print.webp";
import imgDigital from "@/assets/photos/media-digital.webp";
import imgOutdoor from "@/assets/photos/media-outdoor.webp";

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV: NavItem[] = [
  { label: "Dashboard", icon: SquaresFour },
  { label: "Campaigns", icon: Megaphone },
  { label: "Execution", icon: Broadcast },
  { label: "Agencies", icon: Storefront },
  { label: "Assignments", icon: ListChecks },
  { label: "Proofs", icon: Camera },
  { label: "Reports", icon: ChartBar },
];

const STEPS: { label: string; icon: CessIcon; color: string }[] = [
  { label: "Media Plan Finalized", icon: ClipboardText, color: "#2563eb" },
  { label: "Assign to Agencies", icon: UsersThree, color: "#4f46e5" },
  { label: "Schedule Execution", icon: CalendarCheck, color: "#ea580c" },
  { label: "Track Progress", icon: ListChecks, color: "#7c3aed" },
  { label: "Verify Evidence", icon: SealCheck, color: "#16a34a" },
];

type Ch = "Print" | "Digital" | "Outdoor";
const CH: Record<Ch, { icon: CessIcon; color: string }> = {
  Print: { icon: Newspaper, color: "#ea580c" },
  Digital: { icon: Monitor, color: "#7c3aed" },
  Outdoor: { icon: MapPin, color: "#16a34a" },
};

type Status = "Not Started" | "Assigned" | "Scheduled" | "Published" | "In Progress" | "Completed" | "Pending Verification";
const TONE: Record<Status, string> = {
  "Not Started": "#64748b",
  Assigned: "#4f46e5",
  Scheduled: "#0891b2",
  Published: "#16a34a",
  "In Progress": "#2563eb",
  Completed: "#16a34a",
  "Pending Verification": "#ea580c",
};

const VENDORS: { name: string; role: string; ch: Ch; done: number; total: number }[] = [
  { name: "Sri Chamundi Advertisers", role: "Empanelled print agency", ch: "Print", done: 21, total: 25 },
  { name: "Kaveri Digital Media Pvt. Ltd.", role: "Empanelled digital agency", ch: "Digital", done: 2, total: 3 },
  { name: "Nandi Outdoor Media", role: "Empanelled outdoor agency", ch: "Outdoor", done: 8, total: 12 },
];

type Row = { ch: Ch; act: string; sub: string; vendor: number; date: string; status: Status; proof: { label: string; img: string; when: string; note: string } };

const ROWS: Row[] = [
  { ch: "Print", act: "The Hindu (Bengaluru Edition)", sub: "Half page advertisement", vendor: 0, date: "05-08-2026", status: "Published", proof: { label: "Tear sheet", img: imgPrint, when: "05-08-2026", note: "Page 7, Bengaluru edition" } },
  { ch: "Print", act: "Vijayavani (State Edition)", sub: "Quarter page advertisement", vendor: 0, date: "08-08-2026", status: "Published", proof: { label: "Tear sheet", img: imgPrint, when: "08-08-2026", note: "Page 5, state edition" } },
  { ch: "Digital", act: "News Portals", sub: "Banner campaign", vendor: 1, date: "01-08 to 30-09-2026", status: "In Progress", proof: { label: "Screenshot", img: imgDigital, when: "12-08-2026", note: "Banner live on 3 portals" } },
  { ch: "Digital", act: "Social Media", sub: "Sponsored posts", vendor: 1, date: "15-08 to 30-09-2026", status: "In Progress", proof: { label: "Screenshot", img: imgDigital, when: "16-08-2026", note: "Posts live on Facebook" } },
  { ch: "Outdoor", act: "Majestic Circle, Hoarding", sub: "Location A", vendor: 2, date: "01-08 to 30-09-2026", status: "Completed", proof: { label: "Geo-tagged photo", img: imgOutdoor, when: "02-08-2026", note: "12.9767° N, 77.5713° E" } },
  { ch: "Outdoor", act: "Mysuru Road, Billboard", sub: "Location B", vendor: 2, date: "10-08 to 30-09-2026", status: "Pending Verification", proof: { label: "Geo-tagged photo", img: imgOutdoor, when: "11-08-2026", note: "12.9512° N, 77.5205° E" } },
];

const statusAt = (r: Row, beat: number): Status => (beat >= 3 ? r.status : beat >= 2 ? "Scheduled" : beat >= 1 ? "Assigned" : "Not Started");

const FEATURES: Feature[] = [
  { title: "Agency Assignment", icon: UsersThree, color: "#4f46e5", items: ["Maintain agency-related campaign information.", "Associate agencies with advertising activities."] },
  { title: "Execution Scheduling", icon: CalendarCheck, color: "#2563eb", items: ["Maintain schedules and execution status."] },
  { title: "Progress Tracking", icon: ListChecks, color: "#ea580c", items: ["Track assigned campaign activities.", "Record publication and display details."] },
  { title: "Evidence Association", icon: FileText, color: "#16a34a", items: ["Associate submitted evidence with campaign activities."] },
  { title: "Consolidated Visibility", icon: Eye, color: "#db2777", items: ["Review execution progress.", "Maintain campaign-wise agency records."] },
];

/**
 * Beats: 0 media plan finalized, 1 vendors assigned, 2 execution scheduled, 3 progress tracked,
 * 4 evidence associated, 5 consolidated visibility, 6 expected outcome.
 */
export function VendorScene({ beat }: { beat: number }) {
  return (
    <div className="flex h-full flex-col gap-[clamp(6px,1vh,12px)] text-ink">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="font-display shrink-0 text-center text-[length:clamp(16px,2.4vh,23px)] font-bold text-navy"
      >
        Track assigned advertising activities <span className="text-[#4f46e5]">and their progress.</span>
      </motion.p>

      <FlowBar step={Math.min(beat, 5)} />

      <div className="grid min-h-0 flex-1 px-[1.5%]">
        <Laptop>
          <AppShell nav={NAV} active="Execution">
            <Assignments beat={beat} />
          </AppShell>
        </Laptop>
      </div>

      <FeatureStrip
        features={FEATURES}
        active={beat - 1}
        outcomeShown={beat >= 6}
        outcome={
          <>
            <span className="font-display font-bold text-[#15803d]">A centralized view</span> of assigned advertising activities and their execution status.
          </>
        }
      />
    </div>
  );
}

export function FlowBar({ step, steps = STEPS }: { step: number; steps?: { label: string; icon: CessIcon; color: string }[] }) {
  return (
    <ol className="mx-auto flex w-full max-w-[1440px] shrink-0 items-center justify-between gap-1">
      {steps.map((s, i) => {
        const I = s.icon;
        const done = i < step;
        const on = i === step;
        return (
          <li key={s.label} className="contents">
            {i > 0 && (
              <motion.span
                initial={false}
                animate={{ opacity: i <= step ? 1 : 0.3 }}
                className="h-[3px] min-w-4 flex-1 rounded"
                style={{ background: i <= step ? `linear-gradient(90deg, ${steps[i - 1].color}, ${s.color})` : "#cbd5e1" }}
              />
            )}
            <motion.span
              initial={false}
              animate={{ scale: on ? 1.06 : 1, opacity: done || on ? 1 : 0.45 }}
              transition={{ duration: 0.4 }}
              className="flex min-w-0 items-center gap-2 rounded-full border-2 bg-white py-1 pr-4 pl-1"
              style={{ borderColor: done || on ? s.color : "#e2e8f0", boxShadow: on ? `0 0 0 5px ${s.color}22, 0 12px 24px -14px ${s.color}` : undefined }}
            >
              <span className="grid size-[clamp(28px,4.2vh,38px)] shrink-0 place-items-center rounded-full text-white" style={{ background: done || on ? s.color : "#cbd5e1" }}>
                {done ? <Check weight="bold" className="size-1/2" /> : <I weight="bold" className="size-1/2" />}
              </span>
              <span className="font-display min-w-0 text-[length:clamp(14px,2vh,18px)] leading-tight font-bold text-balance" style={{ color: done || on ? s.color : "#64748b" }}>
                {i + 1}.{"\u00a0"}{s.label}
              </span>
            </motion.span>
          </li>
        );
      })}
    </ol>
  );
}

type Tab = "All Activities" | Ch;
const TABS: Tab[] = ["All Activities", "Print", "Digital", "Outdoor"];

function Assignments({ beat }: { beat: number }) {
  const [tab, setTab] = useState<Tab>("All Activities");
  const [sel, setSel] = useState(4);
  const [hoverVendor, setHoverVendor] = useState<number | null>(null);
  const rows = ROWS.map((r, i) => ({ r, i })).filter(({ r }) => tab === "All Activities" || r.ch === tab);
  const proofOn = beat >= 4;
  const cols = "grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.65fr)_minmax(0,1.3fr)_minmax(0,0.5fr)_minmax(0,1.05fr)_minmax(0,1.55fr)_auto] items-center gap-2";

  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,clamp(240px,27%,340px))] gap-[clamp(6px,0.7vw,12px)]">
      <div className="flex min-h-0 flex-col gap-[clamp(4px,0.7vh,8px)]">
        <Header beat={beat} />

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex gap-1 border-b border-slate-200">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTab(t);
                }}
                className={cn("relative px-2.5 py-1 font-semibold whitespace-nowrap", tab === t ? "text-[#1d4fc4]" : "text-navy/60 hover:text-navy")}
              >
                {t}
                {tab === t && <motion.span layoutId="vnd-tab" className="absolute inset-x-1 -bottom-px h-[3px] rounded bg-[#1d4fc4]" />}
              </button>
            ))}
          </div>
          <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border bg-white px-2 py-0.5 text-ink/60">
            <MagnifyingGlass className="size-[1.1em] shrink-0" />
            <span className="truncate">Search by activity, agency or location</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 rounded-md border bg-white px-2 py-0.5 text-navy">
            All Agencies <CaretDown className="size-[0.9em]" />
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-white">
          <div className={cn(cols, "shrink-0 bg-slate-50 px-2 py-1 font-semibold text-navy/70")}>
            <span>Channel</span>
            <span>Activity / Location</span>
            <span>Agency</span>
            <span>Creative</span>
            <span>Scheduled Date</span>
            <span>Status</span>
            <span className="w-[3.4em]">Actions</span>
          </div>
          <div className="grid min-h-0 flex-1 auto-rows-fr">
            {rows.map(({ r, i }, k) => {
              const c = CH[r.ch];
              const CI = c.icon;
              const st = statusAt(r, beat);
              const v = VENDORS[r.vendor];
              const picked = proofOn && sel === i;
              const vendorHot = hoverVendor === r.vendor;
              return (
                <motion.div
                  key={i}
                  layout
                  onClick={(e) => {
                    if (!proofOn) return;
                    e.stopPropagation();
                    setSel(i);
                  }}
                  className={cn(cols, "min-h-0 border-b border-slate-100 px-2 transition-colors", proofOn && "cursor-pointer", picked ? "bg-[#eff4ff]" : vendorHot ? "bg-amber-50" : "bg-white")}
                  style={{ boxShadow: picked ? "inset 3px 0 0 #1d4fc4" : undefined }}
                >
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: c.color }}>
                    <CI weight="duotone" className="size-[1.3em] shrink-0" />
                    {r.ch}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate font-semibold text-navy">{r.act}</span>
                    <span className="block truncate text-ink/65">{r.sub}</span>
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    {beat >= 1 ? (
                      <motion.span key="v" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + k * 0.12 }} className="min-w-0 leading-tight font-medium text-navy">
                        {v.name}
                      </motion.span>
                    ) : (
                      <motion.span key="n" exit={{ opacity: 0 }} className="text-ink/45 italic">
                        Not assigned
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="relative h-[clamp(22px,3.4vh,34px)] overflow-hidden rounded border" style={{ borderColor: `${c.color}55` }}>
                    <img src={imgCampaign} alt="" className="absolute inset-0 size-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: c.color }} />
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    {beat >= 2 ? (
                      <motion.span key="d" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + k * 0.1 }} className="leading-tight text-navy">
                        {r.date}
                      </motion.span>
                    ) : (
                      <motion.span key="n" exit={{ opacity: 0 }} className="text-ink/45">
                        To be scheduled
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="min-w-0 leading-tight">
                    <motion.span
                      key={st}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + k * 0.1 }}
                      className="flex items-center gap-1.5 font-semibold whitespace-nowrap"
                      style={{ color: TONE[st] }}
                    >
                      <span className="size-[0.6em] shrink-0 rounded-full" style={{ background: TONE[st] }} />
                      {st}
                    </motion.span>
                    <motion.span initial={false} animate={{ opacity: proofOn ? 1 : 0 }} className="block pl-[1.1em] font-medium text-[#1d4fc4] underline-offset-2 hover:underline">
                      View proof
                    </motion.span>
                  </span>
                  <span className="flex w-[3.4em] items-center gap-1.5 text-navy/55">
                    <Eye className="size-[1.25em]" />
                    <FileText weight={proofOn ? "fill" : "regular"} className="size-[1.25em]" style={{ color: proofOn ? "#16a34a" : undefined }} />
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-[clamp(4px,0.7vh,8px)]">
        <VendorPanel beat={beat} onHover={setHoverVendor} hover={hoverVendor} />
        <ProofCard row={ROWS[sel]} shown={proofOn} />
      </div>
    </div>
  );
}

function Header({ beat }: { beat: number }) {
  const tracked = beat >= 3;
  const legend = [
    { label: "Completed", n: tracked ? 31 : 0, color: "#16a34a" },
    { label: "In Progress", n: tracked ? 5 : 0, color: "#2563eb" },
    { label: "Pending", n: tracked ? 4 : 0, color: "#ea580c" },
    { label: "Not Started", n: tracked ? 0 : 40, color: "#cbd5e1" },
  ];
  let offset = 0;
  return (
    <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border bg-white p-[clamp(5px,0.6vw,8px)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-[clamp(46px,7.4vh,76px)] w-[clamp(72px,7.6vw,120px)] shrink-0 overflow-hidden rounded-md">
          <img src={imgCampaign} alt="" className="absolute inset-0 size-full object-cover" />
          <span className="absolute inset-0 bg-linear-to-t from-[#14532d]/85 to-transparent" />
          <span className="font-display absolute inset-x-1 bottom-0.5 text-center text-[13px] leading-tight font-black text-white uppercase">Swachh</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display truncate text-[length:clamp(14.5px,1.95vh,17px)] leading-tight font-bold text-navy">{CAMPAIGN.name}</span>
            <span className="shrink-0 rounded-full bg-[#16a34a]/12 px-2 font-semibold text-[#15803d]">Approved</span>
          </div>
          <div className="mt-0.5 grid grid-cols-[auto_auto] gap-x-5 text-ink/75 [@media(min-width:1500px)]:grid-cols-[auto_auto_auto_auto]">
            <span>
              ID <span className="font-mono font-semibold text-[#1d4fc4]">{CAMPAIGN.id}</span>
            </span>
            <span>{CAMPAIGN.category}</span>
            <span>
              {CAMPAIGN.start} to {CAMPAIGN.end}
            </span>
            <span className="font-semibold text-navy">₹ {CAMPAIGN.budget}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 border-l pl-3">
        <div className="relative size-[clamp(50px,7.6vh,76px)]">
          <svg viewBox="0 0 36 36" className="size-full -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#eef2f7" strokeWidth="4" />
            {legend.map((l) => {
              const pct = (l.n / 40) * 100;
              const seg = (
                <motion.circle
                  key={l.label}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={l.color}
                  strokeWidth="4"
                  initial={false}
                  animate={{ strokeDasharray: `${pct} ${100 - pct}`, strokeDashoffset: -offset }}
                  transition={{ duration: 0.9, ease: EASE }}
                />
              );
              offset += pct;
              return seg;
            })}
          </svg>
          <motion.span key={tracked ? "t" : "n"} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display absolute inset-0 grid place-items-center text-[length:clamp(14px,2vh,18px)] font-bold text-navy">
            {tracked ? "78%" : "0%"}
          </motion.span>
        </div>
        <div className="grid grid-cols-[auto_auto] gap-x-3 leading-tight">
          {legend.map((l) => (
            <span key={l.label} className="contents">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="size-[0.6em] rounded-full" style={{ background: l.color }} />
                {l.label}
              </span>
              <motion.span key={l.n} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-right font-bold text-navy">
                {l.n}
              </motion.span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function VendorPanel({ beat, hover, onHover }: { beat: number; hover: number | null; onHover: (i: number | null) => void }) {
  const showBars = beat >= 5;
  return (
    <motion.div
      initial={false}
      animate={{ boxShadow: showBars ? "0 0 0 2px #db2777, 0 16px 30px -20px #db2777" : "0 0 0 0px transparent" }}
      className="flex shrink-0 flex-col gap-[clamp(3px,0.6vh,6px)] rounded-lg border bg-white p-[clamp(5px,0.6vw,9px)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display font-bold whitespace-nowrap text-navy">Empanelled Agencies</span>
        <motion.span
          animate={beat === 1 ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 1.2, repeat: beat === 1 ? Infinity : 0 }}
          className="flex items-center gap-1 rounded-md bg-[#1d4fc4] px-2 py-0.5 font-semibold whitespace-nowrap text-white"
        >
          <Plus weight="bold" className="size-[0.95em]" /> Assign Agency
        </motion.span>
      </div>
      {VENDORS.map((v, i) => {
        const c = CH[v.ch];
        const CI = c.icon;
        const pct = Math.round((v.done / v.total) * 100);
        return (
          <motion.div
            key={v.name}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            initial={false}
            animate={{ opacity: beat >= 1 ? 1 : 0.12, x: beat >= 1 ? 0 : 10 }}
            transition={{ delay: beat >= 1 ? 0.15 + i * 0.15 : 0, duration: 0.45 }}
            className={cn("rounded-md border px-1.5 py-1", hover === i ? "border-amber-300 bg-amber-50" : "border-slate-200")}
          >
            <div className="flex items-center gap-2">
              <span className="grid size-[clamp(26px,3.6vh,32px)] shrink-0 place-items-center rounded-md text-white" style={{ background: c.color }}>
                <CI weight="fill" className="size-1/2" />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate font-semibold text-navy">{v.name}</span>
                <span className="block truncate text-ink/65">{v.role}</span>
              </span>
              {showBars ? (
                <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="shrink-0 font-bold text-navy">
                  {v.done}/{v.total}
                </motion.span>
              ) : (
                <span className="shrink-0 rounded-full bg-[#16a34a]/12 px-2 font-semibold text-[#15803d]">Active</span>
              )}
            </div>
            <motion.div initial={false} animate={{ height: showBars ? 6 : 0, marginTop: showBars ? 4 : 0 }} className="overflow-hidden rounded-full bg-slate-100">
              <motion.div initial={false} animate={{ width: showBars ? `${pct}%` : 0 }} transition={{ duration: 0.8, delay: 0.2 + i * 0.12, ease: EASE }} className="h-full rounded-full" style={{ background: c.color }} />
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function ProofCard({ row, shown }: { row: Row; shown: boolean }) {
  const verified = row.status === "Published" || row.status === "Completed";
  const tone = verified ? "#16a34a" : "#ea580c";
  return (
    <motion.div
      initial={false}
      animate={{ opacity: shown ? 1 : 0.12, y: shown ? 0 : 8 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex min-h-0 flex-1 flex-col gap-1 rounded-lg border bg-white p-[clamp(5px,0.6vw,9px)]"
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span className="font-display font-bold whitespace-nowrap text-navy">Proof of Display</span>
        <span className="flex min-w-0 items-center gap-1 rounded-full bg-[#1d4fc4]/10 px-2 font-semibold whitespace-nowrap text-[#1d4fc4]">
          <Camera weight="fill" className="size-[1em] shrink-0" /> <span className="truncate">{row.proof.label}</span>
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={row.act} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex min-h-0 flex-1 flex-col gap-1">
          <div className="relative min-h-[40px] flex-1 overflow-hidden rounded-md">
            <img src={row.proof.img} alt="" className="absolute inset-0 size-full object-cover" />
            <span className="absolute right-1.5 bottom-1.5 flex items-center gap-1 rounded-full bg-white/95 px-2 font-semibold shadow" style={{ color: tone }}>
              {verified ? <SealCheck weight="fill" className="size-[1em]" /> : <MagnifyingGlass weight="bold" className="size-[1em]" />}
              {verified ? "Verified" : "Under review"}
            </span>
          </div>
          <div className="shrink-0 leading-tight">
            <div className="truncate font-semibold text-navy">{row.act}</div>
            <div className="truncate text-ink/70">
              {VENDORS[row.vendor].name}, {row.proof.when}
            </div>
            <div className="truncate text-ink/70">{row.proof.note}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
