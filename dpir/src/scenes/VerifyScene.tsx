import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { AppShell, Laptop, type NavItem } from "@/components/AmtApp";
import { FeatureStrip, type Feature } from "@/components/FeatureStrip";
import { FlowBar } from "@/scenes/VendorScene";
import { Billboard } from "@/scenes/FieldScene";
import { CAMPAIGN } from "@/scenes/CampaignScene";
import {
  ArrowsClockwise,
  Broadcast,
  CalendarBlank,
  Camera,
  CaretLeft,
  CaretRight,
  ChartBar,
  Check,
  CheckCircle,
  CloudArrowUp,
  Database,
  DeviceMobile,
  Funnel,
  GpsFix,
  Lock,
  MagnifyingGlass,
  MapPin,
  Megaphone,
  Plus,
  SealCheck,
  ShieldCheck,
  SquaresFour,
  Storefront,
  UserGear,
  X,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import imgCity from "@/assets/title-bg.webp";
import imgOutdoor from "@/assets/photos/media-outdoor.webp";

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV: NavItem[] = [
  { label: "Dashboard", icon: SquaresFour },
  { label: "Campaigns", icon: Megaphone },
  { label: "Media Execution", icon: Broadcast },
  { label: "Proof of Display", icon: Camera },
  { label: "Verification", icon: SealCheck },
  { label: "Reports", icon: ChartBar },
  { label: "Agencies", icon: Storefront },
  { label: "Users & Roles", icon: UserGear },
];

const STEPS: { label: string; icon: CessIcon; color: string }[] = [
  { label: "Evidence Submitted", icon: CloudArrowUp, color: "#2563eb" },
  { label: "Under Verification", icon: MagnifyingGlass, color: "#ea580c" },
  { label: "Review Photo, GPS & Details", icon: Camera, color: "#7c3aed" },
  { label: "Verified / Rejected", icon: SealCheck, color: "#16a34a" },
  { label: "Closed", icon: Lock, color: "#475569" },
];

const FEATURES: Feature[] = [
  { title: "Photo and Video Capture", icon: Camera, color: "#4f46e5", items: ["Capture clear evidence of advertisement display."] },
  { title: "GPS and Timestamp", icon: MapPin, color: "#16a34a", items: ["Record location and time information."] },
  { title: "Device Metadata", icon: DeviceMobile, color: "#e11d48", items: ["Capture device and application details."] },
  { title: "Evidence Management", icon: Database, color: "#ea580c", items: ["Upload and organize evidence by campaign."] },
  { title: "Verification Workflow", icon: MagnifyingGlass, color: "#2563eb", items: ["Review and approve submitted evidence."] },
  { title: "Trusted Verification", icon: ShieldCheck, color: "#0d9488", items: ["Manual and third-party verification support."] },
];

/** Flow step and feature tile highlighted on each beat. */
const STEP_AT = [0, 1, 2, 2, 2, 3, 4, 5];
const FEATURE_AT = [-1, 0, 1, 2, 3, 4, 5, 6];

type Status = "Submitted" | "Under Verification" | "Verified" | "Rejected" | "Closed";
const TONE: Record<Status, string> = {
  Submitted: "#16a34a",
  "Under Verification": "#ea580c",
  Verified: "#15803d",
  Rejected: "#e11d48",
  Closed: "#475569",
};

const EVIDENCE: { name: string; when: string; status: Status }[] = [
  { name: "Majestic Circle Billboard", when: "12 Aug 2026, 10:24 AM", status: "Submitted" },
  { name: "Mysuru Road Hoarding", when: "12 Aug 2026, 11:05 AM", status: "Under Verification" },
  { name: "Hebbal Flyover Hoarding", when: "12 Aug 2026, 11:28 AM", status: "Verified" },
  { name: "KR Puram Transit Media", when: "12 Aug 2026, 02:15 PM", status: "Submitted" },
  { name: "Vijayanagar Billboard", when: "12 Aug 2026, 03:40 PM", status: "Rejected" },
];

const statusAt = (beat: number): Status => (beat >= 6 ? "Closed" : beat >= 5 ? "Verified" : beat >= 1 ? "Under Verification" : "Submitted");

/**
 * Beats: 0 evidence submitted, 1 under verification (photo), 2 GPS and timestamp, 3 device metadata,
 * 4 evidence management, 5 verified, 6 closed, 7 expected outcome.
 */
export function VerifyScene({ beat }: { beat: number }) {
  return (
    <div className="flex h-full flex-col gap-[clamp(6px,1vh,12px)] text-ink">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="font-display shrink-0 text-center text-[length:clamp(16px,2.4vh,23px)] font-bold text-navy"
      >
        Capturing and reviewing <span className="text-[#7c3aed]">proof of actual advertisement execution.</span>
      </motion.p>

      <FlowBar step={STEP_AT[beat] ?? 0} steps={STEPS} />

      <div className="grid min-h-0 flex-1 px-[1.5%]">
        <Laptop>
          <AppShell nav={NAV} active="Proof of Display">
            <EvidenceDetails beat={beat} />
          </AppShell>
        </Laptop>
      </div>

      <FeatureStrip
        features={FEATURES}
        active={FEATURE_AT[beat] ?? -1}
        outcomeShown={beat >= 7}
        outcome={
          <>
            <span className="font-display font-bold text-[#15803d]">Verifiable evidence</span> for every advertisement display claim.
          </>
        }
      />
    </div>
  );
}

function Hot({ on, color, className, children }: { on: boolean; color: string; className?: string; children: ReactNode }) {
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

function EvidenceDetails({ beat }: { beat: number }) {
  const status = statusAt(beat);
  return (
    <div className="flex h-full flex-col gap-[clamp(4px,0.7vh,8px)]">
      <Toolbar beat={beat} />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,0.85fr)] gap-[clamp(5px,0.6vw,10px)]">
        <EvidenceList beat={beat} status={status} />
        <EvidenceView beat={beat} />
        <DetailsPanel beat={beat} />
        <WorkflowPanel beat={beat} status={status} />
      </div>
    </div>
  );
}

function Toolbar({ beat }: { beat: number }) {
  const decided = beat >= 5;
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="flex min-w-0 flex-1 items-center gap-1.5 font-semibold whitespace-nowrap text-navy">
        <CaretLeft weight="bold" className="size-[1em] shrink-0" />
        <span className="truncate">
          Proof of Display <span className="text-navy/40">›</span> <span className="font-display font-bold">Evidence Details</span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-md border bg-white px-2 py-0.5 text-navy max-[1300px]:hidden">
        <CaretLeft className="size-[0.9em]" /> Previous
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-md border bg-white px-2 py-0.5 text-navy max-[1300px]:hidden">
        Next <CaretRight className="size-[0.9em]" />
      </span>
      <motion.span
        initial={false}
        animate={beat === 5 ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: 0.7 }}
        className="flex shrink-0 items-center gap-1 rounded-md bg-[#16a34a] px-2.5 py-0.5 font-semibold text-white"
        style={{ boxShadow: beat === 5 ? "0 0 0 4px #16a34a33" : undefined }}
      >
        <CheckCircle weight="fill" className="size-[1em]" /> {decided ? "Approved" : "Approve"}
      </motion.span>
      <motion.span initial={false} animate={{ opacity: decided ? 0.4 : 1 }} className="flex shrink-0 items-center gap-1 rounded-md bg-[#e11d48] px-2.5 py-0.5 font-semibold text-white">
        <X weight="bold" className="size-[1em]" /> Reject
      </motion.span>
      <motion.span initial={false} animate={{ opacity: decided ? 0.4 : 1 }} className="flex shrink-0 items-center gap-1 rounded-md bg-[#1d4fc4] px-2.5 py-0.5 font-semibold whitespace-nowrap text-white">
        <ArrowsClockwise weight="bold" className="size-[1em]" /> Request Revisit
      </motion.span>
    </div>
  );
}

function StatusChip({ status }: { status: Status }) {
  return (
    <motion.span
      key={status}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex shrink-0 rounded-md px-1.5 font-semibold whitespace-nowrap"
      style={{ color: TONE[status], background: `${TONE[status]}17` }}
    >
      {status}
    </motion.span>
  );
}

function EvidenceList({ beat, status }: { beat: number; status: Status }) {
  return (
    <Hot on={beat === 4} color="#ea580c" className="flex min-h-0 flex-col gap-1 p-[clamp(5px,0.6vw,8px)]">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span className="font-display truncate font-bold text-navy">Submitted Evidence (12)</span>
        <Funnel weight="bold" className="size-[1.05em] shrink-0 text-[#1d4fc4]" />
      </div>
      <span className="flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-ink/55">
        <MagnifyingGlass className="size-[1em] shrink-0" />
        <span className="truncate">Search by location, agency…</span>
      </span>
      <div className="grid min-h-0 flex-1 auto-rows-fr gap-1">
        {EVIDENCE.map((e, i) => {
          const sel = i === 0;
          return (
            <motion.div
              key={e.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className={cn("flex min-h-0 items-center gap-1.5 overflow-hidden rounded-md border px-1", sel ? "border-[#1d4fc4]/40 bg-[#eff4ff]" : "border-slate-100")}
              style={{ boxShadow: sel ? "inset 3px 0 0 #1d4fc4" : undefined }}
            >
              {i === 3 ? (
                <img src={imgOutdoor} alt="" className="aspect-[4/3] h-[min(80%,44px)] shrink-0 rounded object-cover" />
              ) : (
                <Billboard className="aspect-[4/3] h-[min(80%,44px)] shrink-0 rounded" />
              )}
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate font-semibold text-navy">{e.name}</span>
                <StatusChip status={sel ? status : e.status} />
              </span>
            </motion.div>
          );
        })}
      </div>
    </Hot>
  );
}

const TABS = ["Photo", "Video", "Location Map"] as const;

function EvidenceView({ beat }: { beat: number }) {
  const [pick, setPick] = useState<(typeof TABS)[number] | null>(null);
  const [thumb, setThumb] = useState(0);
  const tab = pick ?? (beat === 2 ? "Location Map" : "Photo");
  return (
    <Hot on={beat === 1} color="#4f46e5" className="flex min-h-0 flex-col gap-1 p-[clamp(5px,0.6vw,8px)]">
      <span className="font-display shrink-0 font-bold text-navy">Evidence View</span>
      <div className="flex shrink-0 gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPick(t);
            }}
            className={cn("flex-auto rounded-md px-1.5 py-0.5 font-semibold whitespace-nowrap", tab === t ? "bg-[#1d4fc4] text-white" : "bg-slate-100 text-navy/70")}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-md">
        <AnimatePresence mode="wait" initial={false}>
          {tab === "Location Map" ? (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <MapView />
            </motion.div>
          ) : (
            <motion.div key={`${tab}-${thumb}`} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0">
              <Hoarding variant={thumb} />
              {tab === "Video" && (
                <span className="absolute inset-0 grid place-items-center bg-black/25">
                  <span className="grid size-12 place-items-center rounded-full bg-white/90 text-navy">
                    <CaretRight weight="fill" className="size-6" />
                  </span>
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <span className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 font-semibold text-white">{thumb + 1} / 4</span>
      </div>
      <div className="grid shrink-0 grid-cols-4 gap-1">
        {[0, 1, 2].map((v) => (
          <button
            key={v}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setThumb(v);
            }}
            className={cn("aspect-[4/3] overflow-hidden rounded", thumb === v ? "ring-2 ring-[#1d4fc4]" : "opacity-80")}
          >
            <Hoarding variant={v} />
          </button>
        ))}
        <span className="grid aspect-[4/3] place-items-center rounded border-2 border-dashed border-slate-300 text-navy/50">
          <Plus weight="bold" className="size-[1.2em]" />
        </span>
      </div>
    </Hot>
  );
}

/** The hoarding photographed on site; variants are different angles. */
function Hoarding({ variant }: { variant: number }) {
  const pos = ["50% 70%", "20% 80%", "80% 75%"][variant] ?? "50% 70%";
  const size = ["68%", "56%", "60%"][variant] ?? "68%";
  return (
    <div className="relative size-full overflow-hidden bg-linear-to-b from-[#7cb7e8] to-[#d8ecfb]">
      <img src={imgCity} alt="" className="absolute inset-x-0 bottom-0 h-[55%] w-full object-cover opacity-80" style={{ objectPosition: pos }} />
      <div className="absolute top-[14%]" style={{ width: size, left: variant === 1 ? "8%" : variant === 2 ? "34%" : "16%" }}>
        <Billboard slogan className="aspect-[16/8] w-full rounded-sm ring-[3px] ring-[#334155]" />
        <div className="mx-auto flex w-[55%] justify-between">
          <span className="h-[3vh] w-[6%] bg-[#475569]" />
          <span className="h-[3vh] w-[6%] bg-[#475569]" />
        </div>
      </div>
    </div>
  );
}

function MapView() {
  return (
    <div className="relative size-full overflow-hidden bg-[#eef3ea]">
      <span className="absolute inset-y-0 left-[30%] w-[7%] bg-white" />
      <span className="absolute inset-x-0 top-[55%] h-[7%] bg-white" />
      <span className="absolute inset-y-0 left-[70%] w-[4%] rotate-12 bg-white" />
      <span className="absolute top-[10%] left-[45%] size-[22%] rounded-lg bg-[#cfe8c4]" />
      <span className="absolute right-[6%] bottom-[8%] h-[24%] w-[18%] rounded-lg bg-[#cfe3f5]" />
      <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.6, 1] }} transition={{ duration: 0.8 }} className="absolute top-[38%] left-[33%] -translate-x-1/2 -translate-y-full">
        <MapPin weight="fill" className="size-9 text-[#e11d48] drop-shadow" />
      </motion.span>
      <span className="absolute inset-x-2 bottom-2 rounded-md bg-white/95 px-2 py-1 font-semibold text-navy shadow">Majestic Circle, Bengaluru</span>
    </div>
  );
}

function Row({ k, v, hot }: { k: string; v: ReactNode; hot?: boolean }) {
  return (
    <div className={cn("grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] gap-2 rounded px-1", hot && "bg-amber-50")}>
      <span className="text-ink/60">{k}</span>
      <span className="font-medium break-words text-navy">{v}</span>
    </div>
  );
}

function InfoItem({ icon: I, title, hot, color, children }: { icon: CessIcon; title: string; hot: boolean; color: string; children: ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ backgroundColor: hot ? `${color}12` : "rgba(255,255,255,0)" }}
      className="flex min-w-0 gap-2 rounded-md px-1 py-0.5"
      style={{ boxShadow: hot ? `inset 3px 0 0 ${color}` : undefined }}
    >
      <I weight="duotone" className="mt-[0.1em] size-[1.3em] shrink-0" style={{ color }} />
      <div className="min-w-0 leading-tight">
        <div className="font-semibold text-navy">{title}</div>
        {children}
      </div>
    </motion.div>
  );
}

function DetailsPanel({ beat }: { beat: number }) {
  return (
    <div className="flex min-h-0 flex-col gap-[clamp(4px,0.7vh,8px)]">
      <Hot on={beat === 4} color="#ea580c" className="shrink-0 p-[clamp(5px,0.6vw,8px)]">
        <span className="font-display mb-0.5 block font-bold text-navy">Details</span>
        <div className="grid gap-px leading-tight">
          <Row k="Campaign" v={CAMPAIGN.name} />
          <Row k="Campaign ID" v={<span className="font-mono text-[#1d4fc4]">{CAMPAIGN.id}</span>} />
          <Row k="Media Channel" v="Outdoor" />
          <Row k="Location" v="Majestic Circle, Bengaluru" />
          <Row k="Agency" v="Nandi Outdoor Media" />
          <Row k="Asset" v={<span className="break-all">SK_Clean_Green_Hoarding_v2.jpg</span>} hot={beat === 4} />
        </div>
      </Hot>
      <Hot on={beat === 2 || beat === 3} color={beat === 3 ? "#e11d48" : "#16a34a"} className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden p-[clamp(5px,0.6vw,8px)]">
        <span className="font-display block shrink-0 font-bold text-navy">Capture Information</span>
        <InfoItem icon={CalendarBlank} title="Date & Time" hot={beat === 2} color="#2563eb">
          <span className="block truncate text-ink/75">12 Aug 2026, 10:24 AM</span>
        </InfoItem>
        <InfoItem icon={GpsFix} title="GPS Coordinates" hot={beat === 2} color="#16a34a">
          <span className="block truncate text-ink/75">12.9716° N, 77.5946° E</span>
        </InfoItem>
        <InfoItem icon={DeviceMobile} title="Device Information" hot={beat === 3} color="#e11d48">
          <span className="block truncate text-ink/75">Samsung Galaxy M34 · App v1.2.3</span>
          <span className="block truncate text-ink/75">ID 8F2D-9K1A · 4G</span>
          <span className="block truncate text-ink/75">Captured Offline: No</span>
        </InfoItem>
      </Hot>
    </div>
  );
}

function WorkflowPanel({ beat, status }: { beat: number; status: Status }) {
  const stages: { label: string; when: string; done: boolean; on: boolean; tone: string }[] = [
    { label: "Submitted", when: "10:24 AM · Nandi Outdoor Media", done: true, on: false, tone: "#16a34a" },
    { label: "Under Verification", when: beat >= 1 ? "11:15 AM · Shri Prakash N." : "Pending", done: beat >= 5, on: beat >= 1 && beat < 5, tone: "#ea580c" },
    { label: "Verified", when: beat >= 5 ? "11:42 AM · Shri Prakash N." : "Pending", done: beat >= 5, on: false, tone: "#16a34a" },
    { label: "Closed", when: beat >= 6 ? "11:45 AM" : "Pending", done: beat >= 6, on: false, tone: "#475569" },
  ];
  return (
    <Hot on={beat === 5 || beat === 6} color={beat === 6 ? "#0d9488" : "#2563eb"} className="flex min-h-0 flex-col gap-1 p-[clamp(5px,0.6vw,8px)]">
      <span className="font-display shrink-0 font-bold text-navy">Verification</span>
      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <span className="text-ink/60">Status</span>
        <StatusChip status={status} />
      </div>
      <ol className="grid min-h-0 flex-1 auto-rows-fr">
        {stages.map((s, i) => (
          <li key={s.label} className="relative flex min-h-0 gap-2">
            {i < stages.length - 1 && <span className="absolute top-[1.4em] bottom-0 left-[0.6em] w-[2px] -translate-x-1/2" style={{ background: s.done ? s.tone : "#e2e8f0" }} />}
            <motion.span
              initial={false}
              animate={{ backgroundColor: s.done ? s.tone : s.on ? "#ffffff" : "#e2e8f0", borderColor: s.done || s.on ? s.tone : "#cbd5e1", scale: s.on ? [1, 1.15, 1] : 1 }}
              transition={s.on ? { scale: { duration: 1.4, repeat: Infinity } } : { duration: 0.4 }}
              className="relative z-10 mt-[0.1em] grid size-[1.2em] shrink-0 place-items-center rounded-full border-2 text-white"
            >
              {s.done && <Check weight="bold" className="size-[0.75em]" />}
            </motion.span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-semibold" style={{ color: s.done || s.on ? s.tone : "#64748b" }}>
                {s.label}
              </span>
              <motion.span key={s.when} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="block truncate text-ink/65">
                {s.when}
              </motion.span>
            </span>
          </li>
        ))}
      </ol>
      <div className="shrink-0">
        <span className="font-semibold text-navy">Verification Remarks</span>
        <div className="mt-0.5 min-h-[2.6em] rounded-md border px-1.5 py-0.5 leading-tight text-ink/80">
          <AnimatePresence mode="wait" initial={false}>
            {beat >= 5 ? (
              <motion.span key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                Displayed as per approved design.
              </motion.span>
            ) : (
              <motion.span key="p" exit={{ opacity: 0 }} className="text-ink/40">
                Enter remarks…
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Hot>
  );
}
