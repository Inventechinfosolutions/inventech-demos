import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { FitBox } from "@/components/FitBox";
import { CAMPAIGN } from "@/scenes/CampaignScene";
import {
  ArrowLeft,
  ArrowsClockwise,
  CalendarBlank,
  Camera,
  CellSignalFull,
  CheckCircle,
  ClipboardText,
  CloudArrowUp,
  Fingerprint,
  GpsFix,
  House,
  Lightning,
  ListChecks,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  ShieldCheck,
  User,
  WifiHigh,
  WifiSlash,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import imgCampaign from "@/assets/title-bg.webp";
import imgField from "@/assets/photos/act-field.webp";

const EASE = [0.22, 1, 0.36, 1] as const;

type Step = { label: string; icon: CessIcon; color: string };

const STEPS: Step[] = [
  { label: "View Assigned Task", icon: ClipboardText, color: "#2563eb" },
  { label: "Capture Photo / Video", icon: Camera, color: "#0891b2" },
  { label: "Record GPS & Details", icon: MapPin, color: "#16a34a" },
  { label: "Save Offline", icon: WifiSlash, color: "#e11d48" },
  { label: "Sync when Online", icon: CloudArrowUp, color: "#059669" },
];

const FEATURES: { title: string; text: string; icon: CessIcon; color: string }[] = [
  { title: "Secure Mobile Access", text: "Authenticate and access assigned tasks.", icon: ShieldCheck, color: "#2563eb" },
  { title: "Field Task Management", text: "View and manage assigned activities.", icon: ListChecks, color: "#16a34a" },
  { title: "Photo and Video Capture", text: "Capture and attach evidence.", icon: Camera, color: "#ea580c" },
  { title: "GPS and Timestamp", text: "Record location and device information.", icon: MapPin, color: "#7c3aed" },
  { title: "Offline Capability", text: "Save data without network and sync later.", icon: WifiSlash, color: "#e11d48" },
];

/** Capability highlighted on each beat (-1 = all). */
const FEATURE_AT = [0, 1, 2, 3, 4, 4, -1];

type TaskStatus = "Pending" | "In Progress" | "Not Started";
const TASK_TONE: Record<TaskStatus, string> = { Pending: "#ea580c", "In Progress": "#2563eb", "Not Started": "#64748b" };

const TASKS: { name: string; status: TaskStatus }[] = [
  { name: "Majestic Circle Hoarding", status: "Pending" },
  { name: "Mysuru Road Billboard", status: "In Progress" },
  { name: "Hebbal Flyover Hoarding", status: "Pending" },
  { name: "KR Puram Transit Media", status: "Not Started" },
];

const RECORDS = [
  { name: "Majestic Circle", kind: "Photo", time: "10:24 AM" },
  { name: "Mysuru Road", kind: "Video", time: "11:05 AM" },
  { name: "Hebbal Flyover", kind: "Photo", time: "11:28 AM" },
];

const GPS = "12.9716° N, 77.5946° E";

/** True once `ms` has passed since `on` became true. */
function useAfter(on: boolean, ms: number) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => setDone(true), ms);
    return () => {
      clearTimeout(t);
      setDone(false);
    };
  }, [on, ms]);
  return on && done;
}

/** Track geometry in design pixels: the active slot widens to hold the phone. */
const TRACK_W = 858;
const MAIN_H = 608;
const SLOT_GAP = 12;
const ACTIVE_FLEX = 2.6;
const SLOT_Y = 66;
const SLOT_H = 488;
const TRAIL_Y = 582;
const PHONE_W = 236;
const PHONE_H = 480;

function slotRects(active: number) {
  const unit = (TRACK_W - SLOT_GAP * (STEPS.length - 1)) / (STEPS.length - 1 + ACTIVE_FLEX);
  let x = 0;
  return STEPS.map((_, i) => {
    const w = i === active ? unit * ACTIVE_FLEX : unit;
    const r = { x, w, cx: x + w / 2 };
    x += w + SLOT_GAP;
    return r;
  });
}

/**
 * Beats: 0 intro, 1 assigned task, 2 capture evidence, 3 location and details,
 * 4 offline mode, 5 sync to server, 6 expected outcome.
 */
export function FieldScene({ beat }: { beat: number }) {
  const active = Math.min(Math.max(beat - 1, 0), STEPS.length - 1);
  const finished = beat >= 6;
  const rects = slotRects(active);

  return (
    <FitBox w={1440} h={724}>
      <div className="flex size-full flex-col gap-3 text-[14px] text-ink">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="font-display h-[36px] shrink-0 text-center text-[23px] leading-[36px] font-bold text-navy"
        >
          A companion mobile application for <span className="text-[#0891b2]">field-level monitoring and evidence capture.</span>
        </motion.p>

        <div className="flex shrink-0 gap-4" style={{ height: MAIN_H }}>
          <OfficerColumn captured={beat >= 2} located={beat >= 3} />
          <div className="relative shrink-0 overflow-hidden rounded-[22px] border border-white bg-white/40 shadow-[0_20px_40px_-30px_rgba(7,20,51,0.7)]" style={{ width: TRACK_W }}>
            <img src={imgCampaign} alt="" aria-hidden draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover opacity-30" />
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/85 via-white/55 to-white/80" />
            <Trail rects={rects} active={active} finished={finished} />
            {STEPS.map((s, i) => (
              <Slot key={s.label} step={s} index={i} rect={rects[i]} state={i < active ? "done" : i === active ? "active" : "next"} />
            ))}
            <Phone
              left={rects[active].x + (rects[active].w - PHONE_W) / 2}
              color={beat === 0 ? FEATURES[0].color : STEPS[active].color}
              step={active}
              screenKey={beat === 0 ? "login" : String(active)}
            >
              {beat === 0 && <LoginScreen />}
              {beat >= 1 && active === 0 && <TasksScreen live />}
              {active === 1 && <CaptureScreen live active={beat === 2} />}
              {active === 2 && <DetailsScreen live />}
              {active === 3 && <OfflineScreen live />}
              {active === 4 && <SyncScreen live />}
            </Phone>
          </div>
          <CapabilityRail active={FEATURE_AT[beat] ?? -1} />
        </div>

        <Outcome shown={finished} />
      </div>
    </FitBox>
  );
}

type Rect = { x: number; w: number; cx: number };
type SlotState = "done" | "active" | "next";

function Slot({ step, index, rect, state }: { step: Step; index: number; rect: Rect; state: SlotState }) {
  const I = step.icon;
  const n = index + 1;
  return (
    <motion.div
      initial={false}
      animate={{ left: rect.x, width: rect.w }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="absolute top-0"
      style={{ height: SLOT_Y + SLOT_H }}
    >
      <div className="flex items-center justify-center px-1" style={{ height: SLOT_Y }}>
        <motion.span
          initial={false}
          animate={{
            backgroundColor: state === "active" ? step.color : state === "done" ? "#ffffff" : "rgba(255,255,255,0.6)",
            color: state === "active" ? "#ffffff" : state === "done" ? step.color : "#64748b",
            boxShadow: state === "active" ? `0 10px 22px -10px ${step.color}` : "0 0 0 0 rgba(0,0,0,0)",
          }}
          transition={{ duration: 0.4 }}
          className={cn(
            "font-display flex items-center text-center text-[13px] leading-tight font-bold",
            state === "active" ? "gap-1.5 rounded-full px-2.5 py-1" : "flex-col gap-0.5 rounded-xl px-1.5 py-1",
          )}
        >
          <span
            className="grid size-[20px] shrink-0 place-items-center rounded-full text-[12px]"
            style={{ background: state === "active" ? "rgba(255,255,255,0.25)" : `${step.color}1a`, color: state === "active" ? "#fff" : step.color }}
          >
            {state === "done" ? <CheckCircle weight="fill" className="size-[18px]" /> : n}
          </span>
          <span className={cn(state === "active" && "whitespace-nowrap")}>{step.label}</span>
        </motion.span>
      </div>

      <AnimatePresence initial={false}>
        {state === "next" && (
          <motion.div
            key="next"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 grid place-items-center rounded-[26px] border-2 border-dashed border-[#9fb6d8]/80 bg-white/30"
            style={{ top: SLOT_Y, height: SLOT_H }}
          >
            <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: n * 0.3 }}>
              <I weight="duotone" className="size-[52px]" style={{ color: `${step.color}66` }} />
            </motion.span>
          </motion.div>
        )}
        {state === "done" && (
          <DoneTicket key="done" step={step} index={index} />
        )}
        {state === "active" && (
          <motion.span
            key="active"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-[6%] h-[60px] rounded-[50%] blur-md"
            style={{ top: SLOT_Y + SLOT_H - 34, background: `radial-gradient(closest-side, ${step.color}66, transparent)` }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const TICKET_CUT = 172;
const TICKET_MASK = `radial-gradient(circle 11px at 0 ${TICKET_CUT}px, transparent 96%, #000 100%) left / 51% 100% no-repeat, radial-gradient(circle 11px at 100% ${TICKET_CUT}px, transparent 96%, #000 100%) right / 51% 100% no-repeat`;

/** A completed step collapses into an evidence ticket showing what it produced. */
function DoneTicket({ step, index }: { step: Step; index: number }) {
  const I = step.icon;
  const rise = (d: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: d, duration: 0.4, ease: EASE } });
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
      className="absolute inset-x-0 drop-shadow-[0_16px_22px_rgba(7,20,51,0.18)]"
      style={{ top: SLOT_Y, height: SLOT_H }}
    >
      <div
        className="flex size-full flex-col items-center overflow-hidden rounded-[22px] border-2 bg-white text-center"
        style={{ borderColor: `${step.color}40`, mask: TICKET_MASK, WebkitMask: TICKET_MASK }}
      >
        <div className="relative flex w-full shrink-0 flex-col items-center justify-center gap-2.5 px-2" style={{ height: TICKET_CUT, background: `linear-gradient(180deg, ${step.color}26, ${step.color}08)` }}>
          <span className="relative grid size-[58px] place-items-center rounded-2xl text-white shadow-md" style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)` }}>
            <I weight="fill" className="size-[30px]" />
            <motion.span
              initial={{ scale: 0, rotate: -60 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 320, damping: 13 }}
              className="absolute -top-2 -right-2 rounded-full bg-white"
            >
              <CheckCircle weight="fill" className="size-[24px] text-[#16a34a]" />
            </motion.span>
          </span>
          <span className="font-display text-[14px] leading-tight font-bold text-navy">{step.label}</span>
        </div>
        <span className="mx-3 w-[calc(100%-24px)] shrink-0 border-t-2 border-dashed" style={{ borderColor: `${step.color}40` }} />
        <motion.div {...rise(0.35)} className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2 px-2.5 text-[13px] leading-tight">
          <TicketBody index={index} color={step.color} />
        </motion.div>
        <motion.span {...rise(0.6)} className="mb-4 inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-1 text-[13px] font-bold text-[#15803d]">
          <CheckCircle weight="fill" className="size-[15px]" /> Completed
        </motion.span>
      </div>
    </motion.div>
  );
}

function TicketBody({ index, color }: { index: number; color: string }) {
  switch (index) {
    case 0:
      return (
        <>
          <Billboard className="aspect-[4/3] w-full rounded-lg ring-2 ring-white shadow" />
          <span className="font-semibold text-navy">{TASKS[0].name}</span>
          <Chip tone={TASK_TONE["In Progress"]}>In Progress</Chip>
        </>
      );
    case 1:
      return (
        <>
          <div className="relative w-full">
            <Billboard slogan className="aspect-[3/4] w-full rounded-lg ring-2 ring-white shadow" />
            <span className="absolute -right-1.5 -bottom-1.5 grid size-[28px] place-items-center rounded-full text-white shadow" style={{ background: color }}>
              <Camera weight="fill" className="size-[15px]" />
            </span>
          </div>
          <span className="font-semibold text-navy">
            {RECORDS[0].kind} · {RECORDS[0].time}
          </span>
        </>
      );
    case 2:
      return (
        <>
          <div className="relative h-[110px] w-full overflow-hidden rounded-lg bg-[#eaf2fb] ring-1 ring-black/5">
            <svg viewBox="0 0 100 110" className="absolute inset-0 size-full" preserveAspectRatio="none">
              <path d="M -5 70 L 105 50" stroke="#fff" strokeWidth={9} />
              <path d="M 30 -5 L 50 115" stroke="#fff" strokeWidth={7} />
              <path d="M 60 0 C 80 40 60 80 80 115" fill="none" stroke="#cdeccf" strokeWidth={10} />
            </svg>
            <motion.span className="absolute top-[22%] left-1/2 -translate-x-1/2" animate={{ y: [0, -4, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
              <MapPin weight="fill" className="size-[30px] text-[#e11d48] drop-shadow" />
            </motion.span>
          </div>
          <span className="font-semibold text-[#15803d]">
            {GPS.split(", ")[0]}
            <br />
            {GPS.split(", ")[1]}
          </span>
        </>
      );
    case 3:
      return (
        <>
          <div className="relative h-[120px] w-full">
            {[-8, 0, 8].map((r, i) => (
              <Billboard
                key={r}
                className="absolute inset-x-[8%] top-[14%] aspect-[4/3] rounded-md shadow ring-2 ring-white"
                style={{ transform: `rotate(${r}deg) translateY(${(1 - i) * 4}px)` }}
              />
            ))}
          </div>
          <Chip tone="#ea580c">Saved Offline</Chip>
          <span className="font-semibold text-navy">Offline Queue ({RECORDS.length})</span>
        </>
      );
    default:
      return (
        <>
          <CloudArrowUp weight="duotone" className="size-[48px]" style={{ color }} />
          <Chip tone="#16a34a">Uploaded</Chip>
        </>
      );
  }
}

function LoginScreen() {
  const [pin, setPin] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPin((p) => (p >= 5 ? 5 : p + 1)), 380);
    return () => clearInterval(t);
  }, []);
  const ok = pin >= 5;
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 bg-linear-to-b from-[#e8f0fd] to-white px-[10%]">
      <motion.span
        className="grid size-[72px] place-items-center rounded-[22px] text-white shadow-[0_14px_24px_-10px_rgba(29,79,196,0.8)]"
        animate={{ backgroundColor: ok ? "#16a34a" : "#1d4fc4", scale: ok ? [1, 1.12, 1] : 1 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={ok ? "ok" : "lock"} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}>
            {ok ? <CheckCircle weight="fill" className="size-[40px]" /> : <ShieldCheck weight="fill" className="size-[40px]" />}
          </motion.span>
        </AnimatePresence>
      </motion.span>
      <span className="font-display text-[18px] font-bold text-navy">DIPR Field</span>
      <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
        <User weight="bold" className="size-[16px] shrink-0 text-[#1d4fc4]" />
        <span className="h-[6px] w-2/3 rounded-full bg-[#c9d8ee]" />
      </div>
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="size-[14px] rounded-full border-2 border-[#1d4fc4]"
            animate={{ backgroundColor: pin > i ? "#1d4fc4" : "rgba(29,79,196,0)", scale: pin === i + 1 ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>
      <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}>
        <Fingerprint weight="duotone" className="size-[40px] text-[#1d4fc4]" />
      </motion.span>
      <motion.span
        className="w-full rounded-lg py-2 text-center font-semibold text-white"
        animate={{ backgroundColor: ok ? "#16a34a" : "#1d4fc4" }}
      >
        {ok ? "Signed In" : "Sign In"}
      </motion.span>
    </div>
  );
}

function Trail({ rects, active, finished }: { rects: Rect[]; active: number; finished: boolean }) {
  const first = rects[0].cx;
  const last = rects[rects.length - 1].cx;
  const reach = finished ? last : rects[active].cx;
  const spring = { type: "spring", stiffness: 120, damping: 20 } as const;
  return (
    <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox={`0 0 ${TRACK_W} ${MAIN_H}`}>
      <motion.line initial={false} animate={{ x1: first, x2: last }} transition={spring} y1={TRAIL_Y} y2={TRAIL_Y} stroke="#9fb6d8" strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
      <motion.line initial={false} animate={{ x1: first, x2: reach }} transition={spring} y1={TRAIL_Y} y2={TRAIL_Y} stroke="#16a34a" strokeWidth={4} strokeLinecap="round" />
      <motion.line
        initial={false}
        animate={{ x1: first, x2: reach, strokeDashoffset: [0, -24] }}
        transition={{ x1: spring, x2: spring, strokeDashoffset: { duration: 0.8, repeat: Infinity, ease: "linear" } }}
        y1={TRAIL_Y}
        y2={TRAIL_Y}
        stroke="#ffffff"
        strokeWidth={2}
        strokeDasharray="3 9"
        strokeLinecap="round"
      />
      {rects.map((r, i) => {
        const done = finished || i < active;
        const cur = !finished && i === active;
        return (
          <motion.g key={i} initial={false} animate={{ x: r.cx }} transition={spring}>
            {cur && (
              <motion.circle
                cy={TRAIL_Y}
                r={10}
                fill="none"
                stroke={STEPS[i].color}
                strokeWidth={2}
                animate={{ r: [8, 20], opacity: [0.8, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <circle cy={TRAIL_Y} r={done || cur ? 8 : 6} fill={done ? "#16a34a" : cur ? STEPS[i].color : "#ffffff"} stroke={done || cur ? "#ffffff" : "#9fb6d8"} strokeWidth={2.5} />
          </motion.g>
        );
      })}
    </svg>
  );
}

function Phone({ left, color, step, screenKey, children }: { left: number; color: string; step: number; screenKey: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, left }}
      animate={{ opacity: 1, y: 0, left }}
      transition={{ left: { type: "spring", stiffness: 110, damping: 19 }, default: { duration: 0.6, ease: EASE } }}
      className="absolute z-10"
      style={{ top: SLOT_Y + 4, width: PHONE_W, height: PHONE_H }}
    >
      <motion.div
        key={step}
        initial={{ rotate: step === 0 ? 0 : 5, scale: 0.97 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 12 }}
        className="relative size-full rounded-[34px] bg-[#0d1424] p-[7px]"
        style={{ boxShadow: `0 0 0 3px ${color}, 0 34px 50px -26px ${color}` }}
      >
        <span className="absolute top-[11px] left-1/2 z-10 h-[14px] w-[30%] -translate-x-1/2 rounded-full bg-[#0d1424]" />
        <div className="flex size-full flex-col overflow-hidden rounded-[28px] bg-white text-[13px] leading-tight">
          <StatusBar dark={step === 1} offline={step === 3} />
          <div className="relative min-h-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={screenKey}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="absolute inset-0"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatusBar({ dark, offline }: { dark?: boolean; offline?: boolean }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-between px-[9%] pt-[clamp(5px,0.8vh,9px)] pb-1 font-semibold", dark ? "bg-black text-white" : "text-navy")}>
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <CellSignalFull weight="fill" className="size-[1em]" />
        {offline ? <WifiSlash weight="bold" className="size-[1em] text-[#e11d48]" /> : <WifiHigh weight="bold" className="size-[1em]" />}
      </span>
    </div>
  );
}

/** Campaign hoarding artwork used as the captured evidence. */
export function Billboard({ className, slogan, style }: { className?: string; slogan?: boolean; style?: CSSProperties }) {
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ containerType: "inline-size", ...style }}>
      <img src={imgCampaign} alt="" className="absolute inset-0 size-full object-cover object-[50%_45%]" />
      <span className="absolute inset-0 bg-linear-to-r from-white/90 via-white/55 to-transparent" />
      <span className="absolute inset-y-0 left-[6%] flex flex-col justify-center">
        <span className="font-display text-[14cqw] leading-[0.95] font-black text-[#14532d] uppercase">
          Swachh
          <br />
          Karnataka
        </span>
        {slogan && <span className="font-display mt-[2cqw] text-[5.2cqw] font-bold text-[#15803d] uppercase">Cleaner Today, Brighter Tomorrow</span>}
      </span>
    </div>
  );
}

function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-100 px-[6%] py-[clamp(4px,0.8vh,8px)]">
      <ArrowLeft weight="bold" className="size-[1.05em] shrink-0 text-navy" />
      <span className="font-display min-w-0 flex-1 truncate text-[14px] font-bold text-navy">{title}</span>
      {right}
    </div>
  );
}

function Chip({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 font-semibold whitespace-nowrap" style={{ color: tone, background: `${tone}17` }}>
      {children}
    </span>
  );
}

function TasksScreen({ live }: { live: boolean }) {
  return (
    <div className="flex size-full flex-col">
      <ScreenHeader title="Field Tasks" right={<MagnifyingGlass weight="bold" className="size-[1.05em] text-navy" />} />
      <div className="flex shrink-0 gap-3 border-b border-slate-100 px-[6%] font-semibold">
        <span className="relative py-1 text-[#1d4fc4]">
          Assigned (4)
          <span className="absolute inset-x-0 -bottom-px h-[3px] rounded bg-[#1d4fc4]" />
        </span>
        <span className="py-1 text-navy/50">Completed</span>
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-fr gap-[2px] px-[4%] py-1">
        {TASKS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={false}
            animate={{ opacity: live ? 1 : 0.6, x: live ? 0 : 6, backgroundColor: live && i === 0 ? "#eff4ff" : "#ffffff" }}
            transition={{ delay: live ? 0.1 + i * 0.1 : 0, duration: 0.4 }}
            className="flex min-h-0 items-center gap-1.5 rounded-md px-1"
            style={{ boxShadow: live && i === 0 ? "inset 3px 0 0 #1d4fc4" : undefined }}
          >
            <Billboard className="aspect-square h-[min(100%,40px)] shrink-0 rounded" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-navy">{t.name}</span>
              <Chip tone={TASK_TONE[t.status]}>{t.status}</Chip>
            </span>
          </motion.div>
        ))}
      </div>
      <div className="flex shrink-0 justify-around border-t border-slate-100 py-[clamp(4px,0.7vh,7px)] text-navy/50">
        <ListChecks weight="fill" className="size-[1.3em] text-[#1d4fc4]" />
        <MapTrifold className="size-[1.3em]" />
        <ArrowsClockwise className="size-[1.3em]" />
        <User className="size-[1.3em]" />
      </div>
    </div>
  );
}

function CaptureScreen({ live, active }: { live: boolean; active: boolean }) {
  const shot = useAfter(active, 900);
  const taken = shot || (live && !active);
  return (
    <div className="flex size-full flex-col bg-black text-white">
      <div className="flex shrink-0 items-center justify-between px-[8%] py-1">
        <Lightning weight="fill" className="size-[1.1em]" />
        <span className="rounded-full bg-white/15 px-2 font-semibold">{CAMPAIGN.id.slice(-4)}</span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <img src={imgField} alt="" className="absolute inset-0 size-full scale-125 object-cover opacity-50 blur-[2px]" />
        <motion.div
          initial={false}
          animate={{ scale: live ? 1 : 0.92 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="absolute inset-x-[6%] top-[18%] h-[44%]"
        >
          <Billboard slogan className="size-full rounded-sm ring-4 ring-[#334155]" />
          <span className="absolute -bottom-[30%] left-[20%] h-[30%] w-[5%] bg-[#475569]" />
          <span className="absolute right-[20%] -bottom-[30%] h-[30%] w-[5%] bg-[#475569]" />
        </motion.div>
        <motion.span
          initial={false}
          animate={{ opacity: live ? 1 : 0, scale: live ? 1 : 1.15 }}
          className="absolute inset-x-[3%] top-[14%] h-[52%] rounded border-2 border-dashed border-[#facc15]"
        />
        <AnimatePresence>
          {shot && active && <motion.span key="flash" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 bg-white" />}
        </AnimatePresence>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1 py-[clamp(4px,0.8vh,8px)]">
        <div className="flex w-full items-center justify-between px-[10%]">
          <motion.span initial={false} animate={{ opacity: taken ? 1 : 0, scale: taken ? 1 : 0.5 }} className="block size-[clamp(22px,3.4vh,30px)] overflow-hidden rounded ring-2 ring-white">
            <Billboard className="size-full" />
          </motion.span>
          <motion.span
            animate={active && !shot ? { scale: [1, 0.86, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid size-[clamp(34px,5.4vh,48px)] place-items-center rounded-full ring-[3px] ring-white"
          >
            <span className="size-[80%] rounded-full bg-white" />
          </motion.span>
          <span className="size-[clamp(22px,3.4vh,30px)]" />
        </div>
        <div className="flex gap-3 font-semibold">
          <span className="rounded-full bg-white/20 px-2">Photo</span>
          <span className="text-white/70">Video</span>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: I, label, children }: { icon: CessIcon; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1 font-semibold text-navy/60">
        <I weight="bold" className="size-[1em] shrink-0" />
        {label}
      </span>
      <div className="mt-0.5 truncate rounded-md border border-slate-200 px-1.5 py-0.5 font-medium text-navy">{children}</div>
    </div>
  );
}

function DetailsScreen({ live }: { live: boolean }) {
  const located = useAfter(live, 1100);
  return (
    <div className="flex size-full flex-col">
      <ScreenHeader title="Evidence Details" />
      <div className="flex min-h-0 flex-1 flex-col gap-[clamp(3px,0.6vh,6px)] px-[6%] py-1">
        <Billboard slogan className="min-h-[40px] w-full flex-1 rounded-md" />
        <div className="shrink-0">
          <div className="truncate font-semibold text-navy">Majestic Circle Hoarding</div>
          <div className="truncate font-mono text-[#1d4fc4]">{CAMPAIGN.id}</div>
        </div>
        <Field icon={CalendarBlank} label="Date & Time">
          12 Aug 2026, 10:24 AM
        </Field>
        <Field icon={GpsFix} label="Location (GPS)">
          <AnimatePresence mode="wait" initial={false}>
            {located ? (
              <motion.span key="gps" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 text-[#15803d]">
                <MapPin weight="fill" className="size-[1em] shrink-0" />
                {GPS}
              </motion.span>
            ) : (
              <motion.span key="wait" exit={{ opacity: 0 }} className="flex items-center gap-1 text-[#1d4fc4]">
                <motion.span animate={live ? { rotate: 360 } : undefined} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-flex">
                  <GpsFix weight="bold" className="size-[1em]" />
                </motion.span>
                {live ? "Locating…" : "Get Location"}
              </motion.span>
            )}
          </AnimatePresence>
        </Field>
        <motion.span
          initial={false}
          animate={{ backgroundColor: located ? "#1d4fc4" : "#94a3b8" }}
          className="mb-1 shrink-0 rounded-lg py-[clamp(4px,0.8vh,7px)] text-center font-semibold text-white"
        >
          Save Evidence
        </motion.span>
      </div>
    </div>
  );
}

function OfflineScreen({ live }: { live: boolean }) {
  return (
    <div className="flex size-full flex-col">
      <div className="mx-[5%] mt-1 flex shrink-0 items-center gap-1.5 rounded-lg bg-[#fef2f2] px-2 py-[clamp(3px,0.7vh,6px)] font-semibold text-[#be123c]">
        <WifiSlash weight="bold" className="size-[1.15em] shrink-0" />
        <span className="truncate">No Internet Connection</span>
      </div>
      <div className="flex shrink-0 items-center justify-between px-[6%] pt-[clamp(3px,0.7vh,7px)]">
        <span className="font-display text-[14px] font-bold text-navy">Offline Queue ({live ? RECORDS.length : 0})</span>
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-fr gap-[2px] px-[4%] py-1">
        {RECORDS.map((r, i) => (
          <motion.div
            key={r.name}
            initial={false}
            animate={{ opacity: live ? 1 : 0, y: live ? 0 : 10 }}
            transition={{ delay: live ? 0.25 + i * 0.35 : 0, duration: 0.4 }}
            className="flex min-h-0 items-center gap-1.5 rounded-md border border-slate-100 px-1"
          >
            <Billboard className="aspect-square h-[min(100%,40px)] shrink-0 rounded" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-navy">{r.name}</span>
              <Chip tone="#ea580c">Saved Offline</Chip>
            </span>
          </motion.div>
        ))}
      </div>
      <div className="mx-[5%] mb-1.5 flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#eff6ff] py-[clamp(3px,0.7vh,6px)] font-semibold text-[#1d4fc4]">
        <House weight="fill" className="size-[1.1em]" /> Stored on device
      </div>
    </div>
  );
}

function SyncScreen({ live }: { live: boolean }) {
  const synced = useAfter(live, 1400);
  return (
    <div className="flex size-full flex-col">
      <div className="flex shrink-0 flex-col items-center gap-1 px-[6%] pt-[clamp(4px,1vh,10px)]">
        <AnimatePresence mode="wait" initial={false}>
          {synced ? (
            <motion.span key="ok" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
              <CheckCircle weight="fill" className="size-[clamp(34px,5.4vh,48px)] text-[#16a34a]" />
            </motion.span>
          ) : (
            <motion.span key="spin" exit={{ opacity: 0, transition: { duration: 0.2 } }} animate={live ? { rotate: 360 } : undefined} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <ArrowsClockwise weight="bold" className="size-[clamp(34px,5.4vh,48px)] text-[#1d4fc4]" />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="font-display text-center text-[14px] font-bold" style={{ color: synced ? "#15803d" : "#1d4fc4" }}>
          {synced ? "Data Synced Successfully" : live ? "Syncing…" : "Waiting for network"}
        </span>
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-fr gap-[2px] px-[4%] py-1">
        {RECORDS.map((r, i) => (
          <div key={r.name} className="flex min-h-0 items-center gap-1.5 rounded-md border border-slate-100 px-1">
            <Billboard className="aspect-square h-[min(100%,40px)] shrink-0 rounded" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-navy">{r.name}</span>
              <AnimatePresence mode="wait" initial={false}>
                {synced ? (
                  <motion.span key="up" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15 }} className="inline-block">
                    <Chip tone="#16a34a">
                      <CheckCircle weight="fill" className="size-[1em]" /> Uploaded
                    </Chip>
                  </motion.span>
                ) : (
                  <motion.span key="q" exit={{ opacity: 0 }} className="inline-block">
                    <Chip tone="#64748b">{r.kind}</Chip>
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </div>
        ))}
      </div>
      <motion.span
        initial={false}
        animate={{ backgroundColor: synced ? "#1d4fc4" : "#94a3b8" }}
        className="mx-[6%] mb-1.5 shrink-0 rounded-lg py-[clamp(4px,0.8vh,7px)] text-center font-semibold text-white"
      >
        Continue
      </motion.span>
    </div>
  );
}

const MAP_ROUTE = "M 18 604 C 40 560 96 572 104 528 S 150 470 168 446";

/** Field view: the officer captures the hoarding, the photo pops out, then the GPS pin locks on the map. */
function OfficerColumn({ captured, located }: { captured: boolean; located: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
      className="relative w-[250px] shrink-0 overflow-hidden rounded-[22px] bg-[#eaf2fb] shadow-[0_22px_40px_-26px_rgba(7,20,51,0.8)] ring-1 ring-white"
    >
      <FieldMap located={located} />

      <div className="absolute inset-x-0 top-0 h-[260px] overflow-hidden [mask-image:linear-gradient(180deg,#000_62%,transparent_100%)]">
        <motion.img
          src={imgField}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full object-cover object-[34%_50%]"
          animate={{ scale: [1.04, 1.12, 1.04] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="absolute inset-0 bg-linear-to-b from-navy/45 to-transparent to-50%" />
        <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[13px] font-semibold text-white backdrop-blur-sm">
          <motion.span className="size-[8px] rounded-full bg-[#ef4444]" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          REC · 10:24 AM
        </span>
        <motion.span
          className="absolute top-[52px] left-[54px] h-[150px] w-[120px]"
          animate={captured ? { opacity: 0.35, scale: 1 } : { opacity: [0.6, 1, 0.6], scale: [1, 1.03, 1] }}
          transition={captured ? { duration: 0.4 } : { duration: 1.6, repeat: Infinity }}
        >
          {["top-0 left-0 border-t-[3px] border-l-[3px]", "top-0 right-0 border-t-[3px] border-r-[3px]", "bottom-0 left-0 border-b-[3px] border-l-[3px]", "right-0 bottom-0 border-r-[3px] border-b-[3px]"].map((c) => (
            <span key={c} className={cn("absolute size-[22px] rounded-[3px] border-white", c)} />
          ))}
          <span className="absolute top-1/2 left-1/2 size-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80" />
        </motion.span>
        <AnimatePresence>
          {captured && (
            <motion.span key="flash" initial={{ opacity: 0.95 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} className="pointer-events-none absolute inset-0 bg-white" />
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={false}
        animate={captured ? { opacity: 1, y: 0, rotate: -5, scale: 1 } : { opacity: 0, y: -60, rotate: 0, scale: 0.7 }}
        transition={{ type: "spring", stiffness: 140, damping: 14, delay: captured ? 0.25 : 0 }}
        className="absolute top-[196px] left-[22px] z-10 w-[206px] rounded-[6px] bg-white p-2 pb-2.5 shadow-[0_18px_30px_-12px_rgba(7,20,51,0.55)]"
      >
        <Billboard slogan className="aspect-[16/9] w-full rounded-[3px]" />
        <span className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-navy">
          <Camera weight="fill" className="size-[15px] shrink-0 text-[#0891b2]" />
          <span className="truncate">Majestic Circle Hoarding</span>
        </span>
        <motion.span
          initial={false}
          animate={captured ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -40 }}
          transition={{ type: "spring", stiffness: 300, damping: 13, delay: captured ? 0.7 : 0 }}
          className="absolute -top-3 -right-3 grid size-[34px] place-items-center rounded-full bg-white shadow-md"
        >
          <CheckCircle weight="fill" className="size-[30px] text-[#16a34a]" />
        </motion.span>
      </motion.div>

      <motion.div
        initial={false}
        animate={{
          borderColor: located ? "#16a34a" : "rgba(255,255,255,0.9)",
          boxShadow: located ? "0 12px 24px -12px rgba(22,163,74,0.7)" : "0 12px 24px -14px rgba(7,20,51,0.5)",
        }}
        className="absolute inset-x-3 bottom-3 z-10 flex items-center gap-2.5 rounded-xl border-2 bg-white/95 px-2.5 py-2 text-[13px] leading-tight backdrop-blur-sm"
      >
        <span className="grid size-[34px] shrink-0 place-items-center rounded-full" style={{ background: located ? "#dcfce7" : "#e0ecff" }}>
          {located ? (
            <MapPin weight="fill" className="size-[20px] text-[#e11d48]" />
          ) : (
            <motion.span className="inline-flex" animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}>
              <GpsFix weight="bold" className="size-[20px] text-[#1d4fc4]" />
            </motion.span>
          )}
        </span>
        <span className="min-w-0">
          <span className="font-display block font-bold text-navy">Majestic Circle, Bengaluru</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={located ? "gps" : "wait"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={cn("block font-semibold whitespace-nowrap", located ? "text-[#15803d]" : "text-[#1d4fc4]")}
            >
              {located ? GPS : "Locating…"}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.div>
    </motion.div>
  );
}

function FieldMap({ located }: { located: boolean }) {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 250 608" preserveAspectRatio="xMidYMid slice">
      <path d="M 150 300 C 200 290 250 320 250 360 V 420 C 220 410 190 380 160 380 Z" fill="#cdeccf" />
      <path d="M 0 460 C 30 440 60 470 70 500 C 50 520 20 520 0 510 Z" fill="#cfe4fb" />
      <g fill="none" stroke="#ffffff" strokeLinecap="round">
        <path d="M -10 380 L 260 330" strokeWidth={14} />
        <path d="M 60 260 L 120 620" strokeWidth={12} />
        <path d="M 200 260 C 180 380 220 470 190 620" strokeWidth={10} />
        <path d="M -10 520 L 260 470" strokeWidth={9} />
      </g>
      <g fill="none" stroke="#d5e1f0" strokeLinecap="round">
        <path d="M -10 380 L 260 330" strokeWidth={1} strokeDasharray="6 6" />
        <path d="M 60 260 L 120 620" strokeWidth={1} strokeDasharray="6 6" />
      </g>
      <path d={MAP_ROUTE} fill="none" stroke="#9fb6d8" strokeWidth={4} strokeDasharray="2 8" strokeLinecap="round" />
      <motion.path
        d={MAP_ROUTE}
        fill="none"
        stroke="#1d4fc4"
        strokeWidth={5}
        strokeLinecap="round"
        initial={false}
        animate={{ pathLength: located ? 1 : 0 }}
        transition={{ duration: 1.2, ease: EASE }}
      />
      <g transform="translate(168 446)">
        {[0, 1].map((i) => (
          <motion.circle
            key={i}
            r={10}
            fill="none"
            stroke={located ? "#e11d48" : "#1d4fc4"}
            strokeWidth={2}
            animate={{ r: [6, located ? 26 : 40], opacity: [0.8, 0] }}
            transition={{ duration: located ? 1.6 : 1.2, delay: i * 0.7, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
        <motion.g
          initial={false}
          animate={located ? { y: 0, opacity: 1, scale: 1 } : { y: -40, opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 260, damping: 12, delay: located ? 1 : 0 }}
        >
          <path d="M 0 0 C -4 -10 -14 -16 -14 -26 A 14 14 0 1 1 14 -26 C 14 -16 4 -10 0 0 Z" fill="#e11d48" stroke="#ffffff" strokeWidth={2.5} />
          <circle cy={-26} r={5.5} fill="#ffffff" />
        </motion.g>
      </g>
    </svg>
  );
}

function CapabilityRail({ active }: { active: number }) {
  const all = active === -1;
  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
      className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-[#c9d8ee] bg-white/90 shadow-[0_18px_30px_-24px_rgba(7,20,51,0.7)]"
    >
      <div className="font-display flex h-[48px] shrink-0 items-center px-4 text-[18px] font-bold text-white" style={{ background: "linear-gradient(90deg, #0b1f4a, #1d4fc4)" }}>
        Key Capabilities
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col justify-around px-3 py-2">
        <span className="absolute top-[42px] bottom-[42px] left-[33px] w-[3px] rounded-full bg-[#e2e8f0]" />
        <motion.span
          className="absolute top-[42px] left-[33px] w-[3px] rounded-full bg-linear-to-b from-[#2563eb] to-[#16a34a]"
          initial={false}
          animate={{ height: all ? "calc(100% - 84px)" : `calc((100% - 84px) * ${active / (FEATURES.length - 1)})` }}
          transition={{ type: "spring", stiffness: 110, damping: 20 }}
        />
        {FEATURES.map((f, i) => {
          const I = f.icon;
          const on = all || i === active;
          const past = all || i < active;
          return (
            <motion.div
              key={f.title}
              initial={false}
              animate={{
                backgroundColor: i === active ? `${f.color}12` : "rgba(255,255,255,0)",
                boxShadow: i === active ? `inset 0 0 0 1.5px ${f.color}55` : "inset 0 0 0 0 rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.35 }}
              className="relative flex items-start gap-3 rounded-xl px-2 py-2"
            >
              <motion.span
                initial={false}
                animate={{ scale: i === active ? 1.08 : 1, backgroundColor: on || past ? f.color : "#ffffff", color: on || past ? "#ffffff" : f.color }}
                transition={{ duration: 0.35 }}
                className="relative z-10 grid size-[40px] shrink-0 place-items-center rounded-full border-2"
                style={{ borderColor: f.color }}
              >
                <I weight="fill" className="size-[20px]" />
              </motion.span>
              <span className="min-w-0 pt-0.5">
                <span className="font-display block text-[15px] leading-tight font-bold text-navy">{f.title}</span>
                <motion.span
                  initial={false}
                  animate={{ height: on ? "auto" : 0, opacity: on ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="block overflow-hidden text-[13px] leading-snug text-ink/80"
                >
                  <span className="block pt-1">{f.text}</span>
                </motion.span>
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
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0.4, y: 4 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative flex h-[56px] shrink-0 items-center gap-4 overflow-hidden rounded-2xl border border-[#16a34a]/25 bg-[linear-gradient(90deg,#dcfce7,#f4fdf6_45%,#dcfce7)] pr-5 shadow-[0_14px_30px_-24px_rgba(7,20,51,0.7)]"
    >
      <span className="flex h-full w-[96px] shrink-0 items-center justify-center bg-linear-to-r from-[#15803d] to-[#16a34a] pr-3 text-white [clip-path:polygon(0_0,calc(100%-18px)_0,100%_50%,calc(100%-18px)_100%,0_100%)]">
        <motion.span animate={shown ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 1.6, repeat: Infinity }}>
          <CheckCircle weight="duotone" className="size-[30px]" />
        </motion.span>
      </span>
      <p className="font-display flex-1 text-center text-[22px] font-bold text-navy">
        <span className="text-[#15803d]">Verified field evidence</span>, synced to one central platform.
      </p>
      {shown && (
        <motion.span
          aria-hidden
          className="absolute inset-y-0 w-[120px] -skew-x-12 bg-linear-to-r from-transparent via-white/60 to-transparent"
          animate={{ left: ["-10%", "110%"] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.2 }}
        />
      )}
    </motion.div>
  );
}
