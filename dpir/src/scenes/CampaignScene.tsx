import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { AppShell, Laptop } from "@/components/AmtApp";
import { useTyped } from "@/hooks/useTyped";
import { LifecycleStepper } from "@/components/LifecycleStepper";
import {
  CalendarBlank,
  CaretDown,
  ChartBar,
  CheckCircle,
  Check,
  ClipboardText,
  Clock,
  CurrencyInr,
  Database,
  FilePdf,
  Flag,
  Funnel,
  GpsFix,
  Handshake,
  Images,
  LockKey,
  MagnifyingGlass,
  MapPin,
  Newspaper,
  PencilSimple,
  Plus,
  SquaresFour,
  Tag,
  Target,
  Television,
  UploadSimple,
  UsersThree,
  Megaphone,
  Gear,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import imgDigital from "@/assets/photos/media-digital.webp";
import imgOutdoor from "@/assets/photos/media-outdoor.webp";
import imgPrint from "@/assets/photos/media-print.webp";
import imgCampaign from "@/assets/title-bg.webp";

const EASE = [0.22, 1, 0.36, 1] as const;
const BLUE = "#1d4fc4";

type MediaKey = "print" | "digital" | "outdoor";
type Focus = "reg" | "media" | "info" | null;

const MEDIA: { key: MediaKey; label: string; icon: CessIcon; color: string; photo: string; count: string }[] = [
  { key: "print", label: "Print Media", icon: Newspaper, color: "#ea580c", photo: imgPrint, count: "5 Publications" },
  { key: "digital", label: "Digital Media", icon: Television, color: "#7c3aed", photo: imgDigital, count: "3 Platforms" },
  { key: "outdoor", label: "Outdoor Media", icon: MapPin, color: "#16a34a", photo: imgOutdoor, count: "12 Locations" },
];

const NAV: { label: string; icon: CessIcon }[] = [
  { label: "Dashboard", icon: SquaresFour },
  { label: "Campaigns", icon: Megaphone },
  { label: "Media Library", icon: Images },
  { label: "Vendors", icon: Handshake },
  { label: "Field Monitoring", icon: GpsFix },
  { label: "Reports", icon: ChartBar },
  { label: "Master Data", icon: Database },
  { label: "Users & Roles", icon: UsersThree },
];

export const CAMPAIGN = {
  id: "DIPR-CAM-2026-0087",
  name: "Swachh Karnataka – Clean and Green",
  description: "A public awareness campaign to promote clean and green environments across Karnataka.",
  objectives: "Create awareness on cleanliness, waste management and citizen participation.",
  category: "Public Awareness",
  start: "01-08-2026",
  end: "30-09-2026",
  schedule: "Weekly",
  budget: "50,00,000",
};

type Row = { id: string; name: string; media: MediaKey[]; start: string; status: "Active" | "Draft" | "Completed"; isNew?: boolean };
const ROWS: Row[] = [
  { id: CAMPAIGN.id, name: CAMPAIGN.name, media: ["print", "digital", "outdoor"], start: CAMPAIGN.start, status: "Active", isNew: true },
  { id: "DIPR-CAM-2026-0086", name: "Road Safety Awareness", media: ["print", "outdoor"], start: "15-07-2026", status: "Active" },
  { id: "DIPR-CAM-2026-0085", name: "Digital Literacy Drive", media: ["digital"], start: "01-07-2026", status: "Draft" },
  { id: "DIPR-CAM-2026-0084", name: "Monsoon Health Advisory", media: ["print", "digital"], start: "10-06-2026", status: "Completed" },
];
const STATUS_TONE: Record<Row["status"], string> = { Active: "#16a34a", Draft: "#d97706", Completed: "#64748b" };
const FLOW: { label: string; icon: CessIcon; color: string }[] = [
  { label: "Planning", icon: ClipboardText, color: "#2563eb" },
  { label: "Execution", icon: Gear, color: "#ea580c" },
  { label: "Monitoring", icon: MapPin, color: "#16a34a" },
  { label: "Reporting", icon: ChartBar, color: "#7c3aed" },
];

/**
 * Beats: 0 empty form, 1 campaign registration, 2 media selection, 3 campaign information,
 * 4 campaign registered, 5 campaign administration, 6 expected outcome.
 */
export function CampaignScene({ beat }: { beat: number }) {
  const [media, setMedia] = useState<Record<MediaKey, boolean>>({ print: true, digital: true, outdoor: true });
  const [focus, setFocus] = useState<Focus>(null);
  const registered = beat >= 4;
  const admin = beat >= 5;
  const stepper = beat >= 3 ? 2 : beat >= 2 ? 1 : 0;

  return (
    <div className="flex h-full flex-col gap-[clamp(6px,1.1vh,14px)] text-ink">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="font-display shrink-0 text-center text-[length:clamp(16px,2.4vh,23px)] font-bold text-navy"
      >
        Create a campaign once and manage all associated activities through <span className="text-[#1d4fc4]">a common record.</span>
      </motion.p>

      <div className="shrink-0">
        <LifecycleStepper active={stepper} />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.95fr)_auto_minmax(0,1fr)] items-stretch gap-[clamp(10px,1.2vw,20px)]">
        <Laptop>
          <AppShell nav={NAV} active="Campaigns">
            <AnimatePresence mode="wait">
              {admin ? (
                <motion.div key="admin" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.45, ease: EASE }} className="h-full">
                  <AdminView />
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.4 }} className="h-full">
                  <CreateForm beat={beat} media={media} setMedia={setMedia} focus={focus} setFocus={setFocus} />
                </motion.div>
              )}
            </AnimatePresence>
          </AppShell>
        </Laptop>

        <motion.div
          initial={false}
          animate={{ opacity: registered ? 1 : 0.12, x: registered ? 0 : -10 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <motion.svg
            viewBox="0 0 60 80"
            className="w-[clamp(34px,3.4vw,56px)] drop-shadow-[0_8px_16px_rgba(29,79,196,0.45)]"
            animate={registered ? { x: [0, 6, 0] } : undefined}
            transition={{ duration: 1.4, repeat: Infinity }}
            aria-hidden
          >
            <defs>
              <linearGradient id="cmp-arrow" x1="0" x2="1">
                <stop offset="0" stopColor="#93c5fd" />
                <stop offset="1" stopColor="#1d4fc4" />
              </linearGradient>
            </defs>
            <path d="M0 22 H30 V4 L60 40 L30 76 V58 H0 Z" fill="url(#cmp-arrow)" />
          </motion.svg>
        </motion.div>

        <SummaryCard shown={registered} media={media} focus={focus} />
      </div>

      <motion.div
        initial={false}
        animate={beat >= 6 ? { opacity: 1, y: 0 } : { opacity: 0.12, y: 10 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="flex shrink-0 items-center gap-4 rounded-2xl border border-[#16a34a]/25 bg-[linear-gradient(90deg,#ecfdf3,#f8fafc_70%)] px-[clamp(12px,1.4vw,22px)] py-[clamp(6px,1.1vh,12px)] shadow-[0_18px_40px_-30px_rgba(7,20,51,0.6)]"
      >
        <motion.span
          animate={beat >= 6 ? { scale: [1, 1.1, 1] } : undefined}
          transition={{ duration: 1.6, repeat: beat >= 6 ? Infinity : 0, repeatDelay: 1 }}
          className="grid size-[clamp(38px,5.4vh,52px)] shrink-0 place-items-center rounded-full bg-[#16a34a] text-white shadow-md"
        >
          <Target weight="fill" className="size-1/2" />
        </motion.span>
        <p className="min-w-0 flex-1 text-[length:clamp(15px,2.1vh,19px)] leading-snug text-ink">
          <span className="font-display font-bold text-[#15803d]">A unique digital campaign record</span> that becomes the central reference for planning, execution, monitoring and reporting.
        </p>
        <div className="flex shrink-0 items-center gap-[clamp(6px,0.8vw,14px)]">
          {FLOW.map((f, i) => {
            const I = f.icon;
            return (
              <div key={f.label} className="flex items-center gap-[clamp(6px,0.8vw,14px)]">
                {i > 0 && <span className="text-[length:clamp(16px,2.2vh,20px)] font-bold text-slate-400">→</span>}
                <motion.span
                  initial={false}
                  animate={beat >= 6 ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.9 }}
                  transition={{ delay: beat >= 6 ? 0.3 + i * 0.15 : 0 }}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span className="grid size-[clamp(32px,4.6vh,44px)] place-items-center rounded-full text-white shadow" style={{ background: f.color }}>
                    <I weight="fill" className="size-1/2" />
                  </span>
                  <span className="text-[length:clamp(13px,1.6vh,14.5px)] font-bold text-navy">{f.label}</span>
                </motion.span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, value, on, delay, icon: I, select, lines = 1 }: { label: string; value: string; on: boolean; delay?: number; icon?: CessIcon; select?: boolean; lines?: number }) {
  const typed = useTyped(value, on, delay);
  return (
    <label className="flex min-w-0 flex-col gap-0.5">
      <span className="font-semibold text-navy/80">{label}</span>
      <span
        className={cn(
          "flex items-start gap-2 rounded-md border bg-white px-2 py-[clamp(2px,0.5vh,5px)] leading-snug text-ink transition-colors",
          on ? "border-[#1d4fc4]/40" : "border-slate-200",
        )}
        style={{ minHeight: `calc(${lines} * 1.35em + 2 * clamp(2px,0.5vh,5px) + 2px)` }}
      >
        <span className="min-w-0 flex-1">{typed || <span className="text-slate-300">—</span>}</span>
        {I && <I className="mt-[0.15em] size-[1.1em] shrink-0 text-slate-400" />}
        {select && <CaretDown className="mt-[0.15em] size-[1em] shrink-0 text-slate-400" />}
      </span>
    </label>
  );
}

function Section({ n, title, on, focusKey, focus, setFocus, children, className }: { n: number; title: string; on: boolean; focusKey: Exclude<Focus, null>; focus: Focus; setFocus: (f: Focus) => void; children: ReactNode; className?: string }) {
  return (
    <motion.section
      onMouseEnter={() => setFocus(focusKey)}
      onMouseLeave={() => setFocus(null)}
      initial={false}
      animate={{ opacity: on ? 1 : 0.45 }}
      className={cn("flex min-h-0 flex-col gap-[clamp(3px,0.6vh,7px)] rounded-lg border bg-white p-[clamp(5px,0.7vw,10px)] transition-shadow", className)}
      style={{ borderColor: on ? `${BLUE}55` : "#e2e8f0", boxShadow: focus === focusKey ? `0 0 0 2px ${BLUE}` : on ? `0 10px 24px -18px ${BLUE}` : undefined }}
    >
      <h4 className="font-display flex items-center gap-2 text-[length:clamp(13.5px,1.75vh,15.5px)] font-bold text-navy">
        <span className="grid size-[1.45em] place-items-center rounded-full text-white" style={{ background: on ? BLUE : "#94a3b8" }}>
          {n}
        </span>
        {title}
      </h4>
      {children}
    </motion.section>
  );
}

function CreateForm({
  beat,
  media,
  setMedia,
  focus,
  setFocus,
}: {
  beat: number;
  media: Record<MediaKey, boolean>;
  setMedia: (fn: (m: Record<MediaKey, boolean>) => Record<MediaKey, boolean>) => void;
  focus: Focus;
  setFocus: (f: Focus) => void;
}) {
  const reg = beat >= 1;
  const sel = beat >= 2;
  const info = beat >= 3;
  const submitted = beat >= 4;
  return (
    <div className="flex h-full flex-col gap-[clamp(4px,0.7vh,8px)]">
      <div className="flex shrink-0 items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="font-display text-[length:clamp(15px,2vh,18px)] font-bold text-navy">Create New Campaign</span>
          {reg && (
            <span className={cn("rounded-full px-2 font-semibold", submitted ? "bg-[#16a34a]/12 text-[#15803d]" : "bg-amber-100 text-amber-700")}>
              Status: {submitted ? "Submitted" : "Draft"}
            </span>
          )}
        </span>
        <span className="flex gap-2">
          <span className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-navy">Save Draft</span>
          <motion.span
            animate={info && !submitted ? { scale: [1, 1.07, 1] } : { scale: 1 }}
            transition={{ duration: 1.1, repeat: info && !submitted ? Infinity : 0 }}
            className={cn("rounded-md px-2.5 py-1 font-semibold text-white", submitted ? "bg-[#16a34a]" : "bg-[#1d4fc4]")}
          >
            {submitted ? "Submitted" : "Submit for Approval"}
          </motion.span>
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] gap-[clamp(5px,0.6vw,10px)]">
        <Section n={1} title="Campaign Registration" on={reg} focusKey="reg" focus={focus} setFocus={setFocus} className="overflow-hidden">
          <Field label="Campaign Name" value={CAMPAIGN.name} on={reg} />
          <Field label="Description" value={CAMPAIGN.description} on={reg} delay={500} lines={2} />
          <Field label="Campaign Objectives" value={CAMPAIGN.objectives} on={reg} delay={1300} lines={2} />
          <div className="grid grid-cols-2 gap-2">
          <Field label="Campaign Category" value={CAMPAIGN.category} on={reg} delay={2000} select />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-semibold text-navy/80">Supporting Documents</span>
            <div className="flex flex-col items-start gap-1">
              {["Brief.pdf", "Guidelines.pdf"].map((f, i) => (
                <motion.span
                  key={f}
                  initial={false}
                  animate={reg ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                  transition={{ delay: reg ? 2.3 + i * 0.25 : 0 }}
                  className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 font-medium text-ink"
                >
                  <FilePdf weight="fill" className="size-[1.1em] text-red-600" />
                  {f}
                </motion.span>
              ))}
              {!reg && (
                <span className="flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-1.5 py-0.5 text-slate-400">
                  <UploadSimple className="size-[1.1em]" /> Upload
                </span>
              )}
            </div>
          </div>
          </div>
        </Section>

        <div className="flex min-h-0 flex-col gap-[clamp(5px,0.6vw,10px)]">
          <Section n={2} title="Media Selection" on={sel} focusKey="media" focus={focus} setFocus={setFocus}>
            <div className="grid grid-cols-3 gap-1.5">
            {MEDIA.map((m, i) => {
              const checked = sel && media[m.key];
              return (
                <button
                  key={m.key}
                  type="button"
                  aria-disabled={!sel}
                  onClick={(e) => {
                    if (!sel) return;
                    e.stopPropagation();
                    setMedia((s) => ({ ...s, [m.key]: !s[m.key] }));
                  }}
                  className={cn("flex min-w-0 items-center gap-1 rounded-md border px-1 py-[clamp(3px,0.7vh,7px)] text-left", sel ? "cursor-pointer" : "cursor-default", checked ? "border-[#1d4fc4]/40 bg-[#eff4ff]" : "border-slate-200 bg-white")}
                >
                  <motion.span
                    initial={false}
                    animate={{ backgroundColor: checked ? BLUE : "#ffffff", borderColor: checked ? BLUE : "#cbd5e1" }}
                    transition={{ delay: sel ? i * 0.25 : 0 }}
                    className="grid size-[1.05em] shrink-0 place-items-center rounded border-2 text-white"
                  >
                    {checked && <Check weight="bold" className="size-[0.8em]" />}
                  </motion.span>
                  <span className="truncate font-semibold" style={{ color: m.color }}>{m.label.replace(" Media", "")}</span>
                </button>
              );
            })}
            </div>
          </Section>
          <Section n={3} title="Campaign Information" on={info} focusKey="info" focus={focus} setFocus={setFocus} className="flex-1">
            <div className="grid grid-cols-2 gap-x-2 gap-y-[clamp(3px,0.6vh,7px)]">
              <Field label="Start Date" value={CAMPAIGN.start} on={info} icon={CalendarBlank} />
              <Field label="End Date" value={CAMPAIGN.end} on={info} delay={250} icon={CalendarBlank} />
              <Field label="Publication Schedule" value={CAMPAIGN.schedule} on={info} delay={500} select />
              <Field label="Proposed Budget (₹)" value={CAMPAIGN.budget} on={info} delay={800} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function AdminView() {
  const [filter, setFilter] = useState<"All" | Row["status"]>("All");
  const rows = ROWS.filter((r) => filter === "All" || r.status === filter);
  return (
    <div className="flex h-full flex-col gap-[clamp(4px,0.8vh,10px)]">
      <div className="flex shrink-0 items-center justify-between">
        <span className="font-display text-[length:clamp(15px,2vh,18px)] font-bold text-navy">Campaign Administration</span>
        <span className="flex items-center gap-1 rounded-md bg-[#1d4fc4] px-2.5 py-1 font-semibold text-white">
          <Plus weight="bold" className="size-[1em]" /> New Campaign
        </span>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="flex min-w-[40%] flex-1 items-center gap-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-500">
          <MagnifyingGlass className="size-[1.1em]" /> Search campaigns
        </span>
        <Funnel weight="duotone" className="size-[1.3em] text-navy/70" />
        {(["All", "Active", "Draft", "Completed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFilter(f);
            }}
            className={cn("rounded-full border px-2.5 py-0.5 font-semibold", filter === f ? "border-[#1d4fc4] bg-[#1d4fc4] text-white" : "border-slate-300 bg-white text-navy")}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-white">
        <div className="grid grid-cols-[1.25fr_1.9fr_0.9fr_0.9fr_0.85fr_0.6fr] gap-2 border-b bg-slate-50 px-3 py-1.5 font-semibold text-navy/70">
          <span>Campaign ID</span>
          <span>Campaign</span>
          <span>Channels</span>
          <span>Start</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        <AnimatePresence initial={false}>
          {rows.map((r, i) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className={cn("grid grid-cols-[1.25fr_1.9fr_0.9fr_0.9fr_0.85fr_0.6fr] items-center gap-2 border-b px-3 py-[clamp(4px,0.9vh,9px)]", r.isNew && "bg-[#eff4ff]")}
            >
              <span className="font-mono font-semibold text-[#1d4fc4]">{r.id.replace("DIPR-CAM-", "")}</span>
              <span className="flex min-w-0 items-center gap-1.5 font-semibold text-navy">
                <span className="truncate">{r.name}</span>
                {r.isNew && <span className="shrink-0 rounded-full bg-[#16a34a] px-1.5 text-[12.5px] font-bold text-white">New</span>}
              </span>
              <span className="flex gap-1">
                {r.media.map((k) => {
                  const m = MEDIA.find((x) => x.key === k)!;
                  const I = m.icon;
                  return <I key={k} weight="duotone" className="size-[1.3em]" style={{ color: m.color }} />;
                })}
              </span>
              <span>{r.start}</span>
              <span className="w-fit rounded-full px-2 font-semibold" style={{ color: STATUS_TONE[r.status], background: `${STATUS_TONE[r.status]}18` }}>
                {r.status}
              </span>
              <span className="flex gap-1.5 text-navy/70">
                {r.status === "Completed" ? <LockKey weight="duotone" className="size-[1.2em]" /> : <PencilSimple weight="duotone" className="size-[1.2em]" />}
                <Clock weight="duotone" className="size-[1.2em]" />
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SummaryCard({ shown, media, focus }: { shown: boolean; media: Record<MediaKey, boolean>; focus: Focus }) {
  const ring = (k: Exclude<Focus, null>) => (shown && focus === k ? `0 0 0 2px ${BLUE}` : undefined);
  const info: { label: string; value: string; icon: CessIcon; k: Exclude<Focus, null> }[] = [
    { label: "Campaign ID", value: CAMPAIGN.id, icon: Tag, k: "reg" },
    { label: "Total Budget (₹)", value: CAMPAIGN.budget, icon: CurrencyInr, k: "info" },
    { label: "Category", value: CAMPAIGN.category, icon: ClipboardText, k: "reg" },
    { label: "End Date", value: CAMPAIGN.end, icon: CalendarBlank, k: "info" },
    { label: "Start Date", value: CAMPAIGN.start, icon: CalendarBlank, k: "info" },
    { label: "Status", value: "Active", icon: Flag, k: "info" },
  ];
  return (
    <motion.div
      initial={false}
      animate={shown ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0.12, x: 20, scale: 0.98 }}
      transition={{ duration: 0.7, ease: EASE, delay: shown ? 0.3 : 0 }}
      className="flex min-h-0 flex-col gap-[clamp(5px,0.9vh,10px)] rounded-2xl border border-[#1d4fc4]/20 bg-white/95 p-[clamp(10px,1vw,16px)] shadow-[0_24px_50px_-30px_rgba(7,20,51,0.7)] backdrop-blur"
    >
      <div className="flex shrink-0 items-center gap-2">
        <motion.span animate={shown ? { scale: [0.6, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.6, delay: 0.8 }}>
          <CheckCircle weight="fill" className="size-[clamp(24px,3.4vh,32px)] text-[#16a34a]" />
        </motion.span>
        <span className="font-display min-w-0 flex-1 text-[length:clamp(15px,2.15vh,20px)] leading-tight font-bold text-navy">Campaign Registered Successfully</span>
        <span className="rounded-full bg-[#16a34a]/12 px-2.5 py-0.5 text-[length:clamp(13px,1.6vh,14.5px)] font-bold text-[#15803d]">Active</span>
      </div>

      <div className="flex shrink-0 gap-3 rounded-xl transition-shadow" style={{ boxShadow: ring("reg") }}>
        <div className="relative w-[30%] shrink-0 overflow-hidden rounded-lg">
          <img src={imgCampaign} alt="" className="absolute inset-0 size-full object-cover" />
          <span className="absolute inset-0 bg-linear-to-t from-[#14532d]/85 to-transparent" />
          <span className="font-display absolute inset-x-1 bottom-1 text-center text-[length:clamp(13px,1.7vh,15px)] leading-tight font-black text-white uppercase">Swachh Karnataka</span>
        </div>
        <div className="min-w-0 py-0.5">
          <div className="font-display text-[length:clamp(15px,2.05vh,19px)] leading-tight font-bold text-[#1d4fc4]">{CAMPAIGN.name}</div>
          <p className="mt-1 text-[length:clamp(13px,1.65vh,15px)] leading-snug text-ink/85">{CAMPAIGN.description}</p>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-x-3 gap-y-[clamp(4px,0.8vh,9px)] border-y border-slate-200 py-[clamp(5px,0.9vh,10px)]">
        {info.map((r, i) => {
          const I = r.icon;
          return (
            <motion.div
              key={r.label}
              initial={false}
              animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              transition={{ delay: shown ? 0.6 + i * 0.07 : 0 }}
              className="flex items-center gap-2 rounded-md transition-shadow"
              style={{ boxShadow: ring(r.k) }}
            >
              <I weight="duotone" className="size-[clamp(20px,2.8vh,26px)] shrink-0 text-[#1d4fc4]" />
              <span className="min-w-0">
                <span className="block text-[length:clamp(13px,1.55vh,14px)] leading-tight text-ink/65">{r.label}</span>
                <span className={cn("block text-[length:clamp(13.5px,1.8vh,16px)] leading-tight font-bold", r.label === "Status" ? "text-[#16a34a]" : "text-navy")}>{r.value}</span>
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[clamp(3px,0.6vh,7px)] rounded-xl transition-shadow" style={{ boxShadow: ring("media") }}>
        <span className="font-display shrink-0 text-[length:clamp(14px,1.9vh,17px)] font-bold text-navy">Selected Media Channels</span>
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
          {MEDIA.map((m, i) => {
            const on = media[m.key];
            return (
              <motion.div
                key={m.key}
                initial={false}
                animate={shown ? { opacity: on ? 1 : 0.3, y: 0, filter: on ? "grayscale(0)" : "grayscale(1)" } : { opacity: 0, y: 8 }}
                transition={{ delay: shown ? 0.9 + i * 0.12 : 0 }}
                className="flex min-h-0 flex-col overflow-hidden rounded-xl border"
                style={{ borderColor: `${m.color}45`, background: `${m.color}0d` }}
              >
                <div className="relative min-h-0 flex-1">
                  <img src={m.photo} alt="" className="absolute inset-0 size-full object-cover" />
                </div>
                <div className="shrink-0 px-2 py-1">
                  <div className="font-display text-[length:clamp(13.5px,1.75vh,15.5px)] leading-tight font-bold text-navy">{m.label}</div>
                  <span className="mt-1 inline-block rounded-full px-1.5 text-[13px] font-bold whitespace-nowrap" style={{ color: m.color, background: `${m.color}1c` }}>
                    {m.count}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
