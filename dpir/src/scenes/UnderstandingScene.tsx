import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AmtDevices, type CapKey } from "@/components/AmtDevices";
import {
  CalendarBlank,
  ChartBar,
  CheckCircle,
  FolderSimple,
  Image as ImageIcon,
  Megaphone,
  ShieldCheck,
  Target,
  Trophy,
  Camera,
  ArrowRight,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Cap = { key: CapKey; n: string; title: string; body: string; color: string; soft: string; icon: CessIcon; tags: string[] };

const CAPS: Cap[] = [
  {
    key: "campaign",
    n: "01",
    title: "Campaign Planning & Management",
    body: "Manage campaign creation, approvals, scheduling, budgeting and vendor assignments.",
    color: "#2563eb",
    soft: "#eff5ff",
    icon: CalendarBlank,
    tags: ["Plan", "Approve", "Schedule", "Assign", "Track Budget"],
  },
  {
    key: "asset",
    n: "02",
    title: "Centralized Asset Management",
    body: "Maintain a centralized repository of advertising creatives with metadata, version control, geo-tagging and search capabilities.",
    color: "#7c3aed",
    soft: "#f5f0ff",
    icon: FolderSimple,
    tags: ["Metadata", "Versions", "Geo-tags", "Search"],
  },
  {
    key: "pod",
    n: "03",
    title: "Proof-of-Display & Field Monitoring",
    body: "Capture and verify photographs, videos, GPS coordinates, timestamps and device metadata through web and mobile applications.",
    color: "#16a34a",
    soft: "#effaf2",
    icon: Camera,
    tags: ["Photo / Video", "GPS Location", "Timestamp", "Device Metadata"],
  },
  {
    key: "report",
    n: "04",
    title: "Reporting & Analytics",
    body: "Provide campaign KPIs, expenditure tracking, compliance reports, dashboards and audit trails.",
    color: "#ea580c",
    soft: "#fff4ec",
    icon: ChartBar,
    tags: ["Campaign Performance", "Expenditure Tracking", "Compliance Reports", "Audit Trail"],
  },
  {
    key: "security",
    n: "05",
    title: "Security & Integration",
    body: "Ensure role-based access, secure APIs, authentication, data protection and integration with existing DIPR systems and third-party verification services.",
    color: "#dc2626",
    soft: "#fff1f1",
    icon: ShieldCheck,
    tags: ["Role-based Access", "Secure APIs", "Data Protection", "System Integration"],
  },
];

const LIFECYCLE: { title: string; color: string; icon: CessIcon; cap: number }[] = [
  { title: "Campaign Planning", color: "#2563eb", icon: Target, cap: 0 },
  { title: "Asset Management", color: "#7c3aed", icon: ImageIcon, cap: 1 },
  { title: "Execution", color: "#0d9488", icon: Megaphone, cap: 0 },
  { title: "Verification", color: "#ea580c", icon: CheckCircle, cap: 2 },
  { title: "Intelligence", color: "#8b5cf6", icon: ChartBar, cap: 3 },
];

/**
 * Beats: 0 intro + platform, 1–5 one capability each, 6 lifecycle, 7 desired outcome.
 * Cards and lifecycle steps are clickable / hoverable and drive the device screens.
 */
export function UnderstandingScene({ beat }: { beat: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  useEffect(() => setPinned(null), [beat]);

  const beatCap = beat >= 1 && beat <= 5 ? beat - 1 : null;
  const active = hover ?? pinned ?? beatCap;
  const focus = active === null ? null : CAPS[active].key;
  const color = active === null ? "#2563eb" : CAPS[active].color;

  const card = (i: number, side: "left" | "right" | "top") => (
    <CapCard
      key={CAPS[i].key}
      cap={CAPS[i]}
      side={side}
      shown={beat >= i + 1}
      active={active === i}
      dim={active !== null && active !== i}
      onHover={(on) => setHover(on ? i : null)}
      onPick={() => setPinned((p) => (p === i ? null : i))}
    />
  );

  return (
    <div className="flex h-full flex-col gap-[clamp(6px,1.1vh,12px)] text-ink">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="shrink-0 text-center">
        <p className="font-display text-[length:clamp(15px,2.3vh,22px)] font-bold text-navy">
          A unified digital platform to manage the complete lifecycle of government advertising activities.
        </p>
      </motion.div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)_minmax(0,1fr)] gap-[clamp(8px,1vw,16px)]">
        <div className="flex min-h-0 flex-col gap-[clamp(8px,1.2vh,14px)]">
          {card(0, "left")}
          {card(3, "left")}
        </div>
        <div className="flex min-h-0 flex-col gap-[clamp(6px,1vh,12px)]">
          {card(1, "top")}
          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-end">
            <motion.div
              aria-hidden
              className="absolute bottom-[4%] left-1/2 h-[22%] w-[92%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(37,99,235,0.35),rgba(20,196,212,0.15)_60%,transparent)]"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
              className="relative flex min-h-0 w-full flex-1 items-end justify-center"
            >
              <div className="h-full max-h-full w-full [&>div]:max-h-full">
                <div className="flex h-full items-end">
                  <AmtDevices focus={focus} color={color} />
                </div>
              </div>
            </motion.div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative mt-1 rounded-full bg-linear-to-r from-navy to-[#1d4fc4] px-5 py-1.5 font-display text-[length:clamp(11px,1.6vh,15px)] font-bold text-white shadow-[0_10px_24px_-10px_rgba(29,79,196,0.9)]"
            >
              Advertisement Monitoring Tool
            </motion.span>
          </div>
        </div>
        <div className="flex min-h-0 flex-col gap-[clamp(8px,1.2vh,14px)]">
          {card(2, "right")}
          {card(4, "right")}
        </div>
      </div>

      <motion.div
        className="grid shrink-0 grid-cols-5 gap-[clamp(4px,0.6vw,10px)]"
        initial={false}
        animate={{ opacity: beat >= 6 ? 1 : 0.12 }}
        transition={{ duration: 0.4 }}
      >
        {LIFECYCLE.map((s, i) => {
          const I = s.icon;
          const on = hover === s.cap && beat >= 6;
          return (
            <motion.button
              key={s.title}
              type="button"
              aria-disabled={beat < 6}
              onClick={(e) => {
                if (beat < 6) return;
                e.stopPropagation();
                setPinned((p) => (p === s.cap ? null : s.cap));
              }}
              onMouseEnter={() => beat >= 6 && setHover(s.cap)}
              onMouseLeave={() => setHover(null)}
              initial={false}
              animate={beat >= 6 ? { opacity: 1, x: 0 } : { opacity: 0.4, x: -10 }}
              transition={{ duration: 0.5, ease: EASE, delay: beat >= 6 ? i * 0.15 : 0 }}
              className="group relative flex items-center gap-2 text-left"
            >
              <span
                className="relative z-10 grid size-[clamp(30px,4.6vh,44px)] shrink-0 place-items-center rounded-full text-white shadow-md transition-transform group-hover:scale-110"
                style={{ background: s.color }}
              >
                <I weight="bold" className="size-[55%]" />
              </span>
              <span
                className="-ml-4 flex min-w-0 flex-1 flex-col justify-center py-1 pr-[18px] pl-5 [clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)]"
                style={{ background: on ? `${s.color}33` : `linear-gradient(90deg, ${s.color}1f, ${s.color}38)` }}
              >
                <span className="font-display truncate py-1 text-[length:clamp(13px,1.9vh,17px)] font-bold" style={{ color: s.color }}>
                  {s.title}
                </span>
              </span>
              {beat >= 6 && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-6 w-8 bg-linear-to-r from-transparent via-white/70 to-transparent"
                  animate={{ x: ["0%", "600%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: 0.8 + i * 0.25, repeatDelay: 1.5 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div
        initial={false}
        animate={beat >= 7 ? { opacity: 1, y: 0 } : { opacity: 0.1, y: 8 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative flex shrink-0 items-center gap-[clamp(10px,1.5vw,24px)] overflow-hidden rounded-2xl bg-linear-to-r from-navy-deep via-navy to-[#1d4fc4] px-[clamp(12px,2vw,28px)] py-[clamp(6px,1.1vh,12px)] text-white shadow-[0_18px_40px_-22px_rgba(7,20,51,0.9)]"
      >
        <motion.span
          animate={beat >= 7 ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] } : undefined}
          transition={{ duration: 1, delay: 0.3 }}
          className="grid size-[clamp(30px,4.6vh,44px)] shrink-0 place-items-center rounded-full bg-gold/20 text-gold"
        >
          <Trophy weight="fill" className="size-[60%]" />
        </motion.span>
        <span className="h-8 w-px bg-white/20" />
        <span className="shrink-0 text-[length:clamp(13px,1.8vh,16px)] font-medium text-white/85">Our Understanding of the Desired Outcome</span>
        <ArrowRight weight="bold" className="size-5 shrink-0 text-gold" />
        <span className="font-display min-w-0 text-[length:clamp(17px,2.7vh,26px)] leading-tight font-bold">
          One Platform. <span className="text-gold">Complete Advertising Lifecycle.</span>
        </span>
        {beat >= 7 && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-24 -skew-x-12 bg-linear-to-r from-transparent via-white/15 to-transparent"
            initial={{ left: "-10%" }}
            animate={{ left: "110%" }}
            transition={{ duration: 1.6, delay: 0.4, repeat: Infinity, repeatDelay: 3 }}
          />
        )}
      </motion.div>
    </div>
  );
}

function CapCard({
  cap,
  side,
  shown,
  active,
  dim,
  onHover,
  onPick,
}: {
  cap: Cap;
  side: "left" | "right" | "top";
  shown: boolean;
  active: boolean;
  dim: boolean;
  onHover: (on: boolean) => void;
  onPick: () => void;
}) {
  const I = cap.icon;
  return (
    <motion.button
      type="button"
      aria-disabled={!shown}
      onClick={(e) => {
        if (!shown) return;
        e.stopPropagation();
        onPick();
      }}
      onMouseEnter={() => shown && onHover(true)}
      onMouseLeave={() => onHover(false)}
      initial={false}
      animate={
        shown
          ? { opacity: dim ? 0.55 : 1, x: 0, y: 0, scale: active ? 1.02 : 1 }
          : { opacity: 0.18, x: side === "left" ? -24 : side === "right" ? 24 : 0, y: side === "top" ? -16 : 0, scale: 0.98 }
      }
      transition={{ duration: 0.55, ease: EASE }}
      className={cn(
        "relative flex min-h-0 gap-3 rounded-2xl border bg-white/90 p-[clamp(8px,1.4vh,16px)] text-left shadow-[0_18px_40px_-30px_rgba(7,20,51,0.6)] backdrop-blur",
        side !== "top" && "flex-1",
        !shown && "border-dashed",
      )}
      style={{ borderColor: active ? cap.color : `${cap.color}40`, background: shown ? `linear-gradient(135deg, #ffffff 55%, ${cap.soft})` : undefined, boxShadow: active ? `0 0 0 2px ${cap.color}, 0 20px 40px -24px ${cap.color}` : undefined }}
    >
      {side !== "top" && (
        <span aria-hidden className={cn("absolute top-1/2 hidden h-0 w-[clamp(8px,1vw,16px)] border-t-2 border-dashed lg:block", side === "left" ? "-right-[clamp(8px,1vw,16px)]" : "-left-[clamp(8px,1vw,16px)]")} style={{ borderColor: `${cap.color}80` }}>
          <span className={cn("absolute -top-[5px] size-2 rounded-full", side === "left" ? "-right-1" : "-left-1")} style={{ background: cap.color }} />
        </span>
      )}
      <motion.span
        className="grid size-[clamp(30px,4.8vh,46px)] shrink-0 place-items-center rounded-full font-display text-[length:clamp(12px,1.8vh,17px)] font-bold text-white shadow-md"
        style={{ background: cap.color }}
        animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: 1.4, repeat: active ? Infinity : 0 }}
      >
        {cap.n}
      </motion.span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display flex items-center gap-2 text-[length:clamp(12px,1.85vh,17px)] leading-tight font-bold text-navy">
          {cap.title}
          <I weight="duotone" className="size-[1.2em] shrink-0" style={{ color: cap.color }} />
        </span>
        <span className="mt-1 text-[length:clamp(13px,1.7vh,15px)] leading-snug text-ink/80">{cap.body}</span>
        {side === "top" && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {cap.tags.map((t) => (
              <span key={t} className="rounded-full px-2 py-0.5 text-[length:clamp(13px,1.6vh,14px)] font-semibold" style={{ background: `${cap.color}14`, color: cap.color }}>
                {t}
              </span>
            ))}
          </span>
        )}
      </span>
      {side !== "top" && (
        <span className="flex w-[38%] shrink-0 flex-col justify-center gap-[clamp(3px,0.7vh,7px)] self-stretch rounded-xl border bg-white/80 p-[clamp(6px,1vh,10px)]" style={{ borderColor: `${cap.color}26` }}>
          {cap.tags.map((t, i) => (
            <motion.span
              key={t}
              initial={false}
              animate={shown ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
              transition={{ delay: shown ? 0.25 + i * 0.08 : 0 }}
              className="flex items-center gap-1.5 text-[length:clamp(13px,1.6vh,14.5px)] leading-tight font-semibold text-navy"
            >
              <span className="grid size-[1.5em] shrink-0 place-items-center rounded-md" style={{ background: `${cap.color}18`, color: cap.color }}>
                <CheckCircle weight="fill" className="size-[1em]" />
              </span>
              {t}
            </motion.span>
          ))}
        </span>
      )}
    </motion.button>
  );
}
