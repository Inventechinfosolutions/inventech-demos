import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { useLinkPaths } from "@/hooks/useLinkPaths";
import {
  ArrowRight,
  Binoculars,
  CalendarCheck,
  ChartBar,
  Database,
  Desktop,
  EnvelopeSimple,
  FileXls,
  Files,
  Handshake,
  Image as ImageIcon,
  Megaphone,
  SealCheck,
  Target,
  Warning,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import imgCreative from "@/assets/photos/act-creative.webp";
import imgField from "@/assets/photos/act-field.webp";
import imgPlanning from "@/assets/photos/act-planning.webp";
import imgPublication from "@/assets/photos/act-publication.webp";
import imgReport from "@/assets/photos/act-report.webp";
import imgVendor from "@/assets/photos/act-vendor.webp";
import imgVerify from "@/assets/photos/act-verify.webp";
import imgPile from "@/assets/photos/pile.webp";

const EASE = [0.22, 1, 0.36, 1] as const;

type Activity = { n: string; title: string; body: string; color: string; icon: CessIcon; photo: string };

const ACTIVITIES: Activity[] = [
  { n: "01", title: "Campaign Planning", body: "Defining campaign objectives, schedules and budgets.", color: "#2563eb", icon: CalendarCheck, photo: imgPlanning },
  { n: "02", title: "Creative Management", body: "Managing advertisement designs, media files and versions.", color: "#7c3aed", icon: ImageIcon, photo: imgCreative },
  { n: "03", title: "Agency Coordination", body: "Assigning and coordinating advertising execution.", color: "#0d9488", icon: Handshake, photo: imgVendor },
  { n: "04", title: "Publication and Display", body: "Managing advertisements across print, digital and outdoor media.", color: "#ea580c", icon: Megaphone, photo: imgPublication },
  { n: "05", title: "Field Monitoring", body: "Collecting evidence of actual advertisement display.", color: "#0284c7", icon: Binoculars, photo: imgField },
  { n: "06", title: "Verification", body: "Validating submitted photographs, videos and associated metadata.", color: "#dc2626", icon: SealCheck, photo: imgVerify },
  { n: "07", title: "Reporting and Analysis", body: "Reviewing expenditure, campaign progress and compliance.", color: "#8b5cf6", icon: ChartBar, photo: imgReport },
];

const PILE: { label: string; icon: CessIcon; x: number; y: number; r: number; tone: string }[] = [
  { label: "Spreadsheets", icon: FileXls, x: 20, y: 14, r: -8, tone: "#16a34a" },
  { label: "Emails", icon: EnvelopeSimple, x: 82, y: 22, r: 6, tone: "#2563eb" },
  { label: "Documents", icon: Files, x: 14, y: 62, r: 5, tone: "#64748b" },
  { label: "Reports", icon: ChartBar, x: 86, y: 66, r: -6, tone: "#ea580c" },
  { label: "Multiple Systems", icon: Database, x: 50, y: 92, r: 3, tone: "#7c3aed" },
];

const MARKS: { x: number; y: number; color: string; s: number }[] = [
  { x: 4, y: 30, color: "#7c3aed", s: 1 },
  { x: 96, y: 44, color: "#ea580c", s: 1.1 },
  { x: 30, y: -6, color: "#2563eb", s: 0.9 },
  { x: 70, y: 100, color: "#0d9488", s: 1 },
  { x: 2, y: 88, color: "#dc2626", s: 0.85 },
  { x: 98, y: 92, color: "#8b5cf6", s: 0.9 },
];

const LINKS = ACTIVITIES.map((_, i) => ({ id: `l${i}`, from: `a${i}`, to: "hub" }));

/** Beats: 0 subtitle + scattered records, 1 seven activities, 2 the challenge, 3 the requirement + convergence. */
export function ChallengeScene({ beat }: { beat: number }) {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const joined = beat >= 3;
  const { w, h, paths } = useLinkPaths(stage, LINKS, [beat]);

  const card = (i: number, grow = true) => (
    <ActivityCard key={i} grow={grow} a={ACTIVITIES[i]} anchor={`a${i}`} shown={beat >= 1} delay={i * 0.09} active={hover === i} joined={joined} onHover={(on) => setHover(on ? i : null)} />
  );

  return (
    <div className="flex h-full flex-col gap-[clamp(8px,1.2vh,14px)] text-ink">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="font-display shrink-0 text-center text-[length:clamp(16px,2.4vh,23px)] font-bold text-navy"
      >
        Multiple activities. Different stakeholders. <span className="text-[#1d4fc4]">One need for centralized visibility.</span>
      </motion.p>

      <div ref={stage} className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-[clamp(28px,4vw,72px)] gap-y-[clamp(8px,1.2vh,14px)]">
        <svg className="pointer-events-none absolute inset-0 z-0 overflow-visible" width={w} height={h} viewBox={`0 0 ${w || 1} ${h || 1}`} aria-hidden>
          {LINKS.map((l, i) => {
            const p = paths[l.id];
            if (!p) return null;
            const color = joined ? ACTIVITIES[i].color : beat === 2 ? "#ef4444" : "#94a3b8";
            return (
              <g key={l.id}>
                <motion.path
                  d={p.d}
                  fill="none"
                  stroke={color}
                  strokeLinecap="round"
                  initial={false}
                  animate={{
                    opacity: beat >= 1 ? (hover === null || hover === i ? 1 : 0.3) : 0,
                    strokeWidth: hover === i ? 4 : joined ? 2.6 : 2,
                    strokeDasharray: joined ? "10 8" : "4 9",
                    strokeDashoffset: joined && !reduce ? [0, -36] : 0,
                  }}
                  transition={{
                    opacity: { duration: 0.5, delay: beat >= 1 && !joined ? 0.4 + i * 0.09 : 0 },
                    strokeDashoffset: joined ? { duration: 1.1, repeat: Infinity, ease: "linear" } : { duration: 0 },
                  }}
                />
                <AnimatePresence>
                  {beat >= 1 && !joined && (
                    <motion.text
                      x={p.mid.x}
                      y={p.mid.y + 7}
                      textAnchor="middle"
                      fontSize="22"
                      fontWeight="800"
                      fill={beat === 2 ? "#ef4444" : ACTIVITIES[i].color}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: [0, -4, 0] }}
                      exit={{ opacity: 0, scale: 0.4 }}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.09, y: { duration: 2, repeat: Infinity, delay: i * 0.2 } }}
                      style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    >
                      ?
                    </motion.text>
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </svg>

        <div className="z-10 flex min-h-0 flex-col gap-[clamp(8px,1.2vh,14px)]">
          {card(1)}
          {card(2)}
          {card(3)}
        </div>
        <div className="z-10 flex min-h-0 flex-col gap-[clamp(8px,1.2vh,14px)]">
          {card(0, false)}
          <div className="relative grid min-h-0 flex-1 place-items-center">
            <div data-anchor="hub" className="relative grid size-[clamp(170px,30vh,280px)] place-items-center">
              <AnimatePresence>
                {!joined && (
                  <motion.div
                    key="photo"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1, rotate: beat === 2 && !reduce ? [0, -1.5, 1.5, 0] : 0 }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={{ duration: 0.6, ease: EASE, rotate: { duration: 0.5, repeat: beat === 2 ? Infinity : 0, repeatDelay: 1 } }}
                    className={cn(
                      "absolute inset-[6%] overflow-hidden rounded-full border-4 bg-white shadow-[0_24px_50px_-24px_rgba(7,20,51,0.7)]",
                      beat === 2 ? "border-red-300" : "border-white",
                    )}
                  >
                    <img src={imgPile} alt="" className="size-full object-cover" />
                    <span className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(255,255,255,0.55))]" />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {!joined &&
                  MARKS.map((m, i) => (
                    <motion.span
                      key={`m${i}`}
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={reduce ? { opacity: 1, scale: m.s } : { opacity: 1, scale: m.s, y: [0, -6, 0] }}
                      exit={{ opacity: 0, scale: 0.2 }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.06, y: { duration: 2.2, repeat: Infinity, delay: i * 0.25 } }}
                      className="font-display absolute -translate-x-1/2 -translate-y-1/2 text-[length:clamp(26px,4.4vh,40px)] leading-none font-black drop-shadow"
                      style={{ left: `${m.x}%`, top: `${m.y}%`, color: beat === 2 ? "#ef4444" : m.color }}
                    >
                      ?
                    </motion.span>
                  ))}
              </AnimatePresence>
              <AnimatePresence>
                {!joined &&
                  PILE.map((p, i) => {
                    const I = p.icon;
                    return (
                      <motion.span
                        key={p.label}
                        initial={{ opacity: 0, scale: 0.6, left: "50%", top: "50%" }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          left: `${p.x}%`,
                          top: `${p.y}%`,
                          rotate: beat === 2 && !reduce ? [p.r, p.r + 6, p.r - 6, p.r] : p.r,
                        }}
                        exit={{ opacity: 0, scale: 0.2, left: "50%", top: "50%", rotate: 0 }}
                        transition={{ duration: 0.6, ease: EASE, delay: i * 0.08, rotate: { duration: 0.5, repeat: beat === 2 ? Infinity : 0, repeatDelay: 1 } }}
                        className={cn(
                          "absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-[length:clamp(13px,1.6vh,15px)] font-semibold whitespace-nowrap text-ink shadow-[0_10px_20px_-12px_rgba(7,20,51,0.5)]",
                          beat === 2 ? "border-red-300" : "border-slate-200",
                        )}
                      >
                        <I weight="duotone" className="size-[1.3em]" style={{ color: p.tone }} />
                        {p.label}
                      </motion.span>
                    );
                  })}
              </AnimatePresence>
              <AnimatePresence>
                {joined && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
                    className="relative grid size-full place-items-center"
                  >
                    {!reduce &&
                      [0, 1].map((k) => (
                        <motion.span
                          key={k}
                          className="absolute inset-0 rounded-full border-2 border-[#1d4fc4]/40"
                          animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                          transition={{ duration: 2.4, repeat: Infinity, delay: k * 1.2 }}
                        />
                      ))}
                    <span className="grid size-full place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#3b82f6,#0b1f4a_75%)] p-[12%] text-center text-white shadow-[0_24px_50px_-20px_rgba(29,79,196,0.9)] ring-4 ring-white">
                      <span className="flex flex-col items-center gap-1">
                        <Desktop weight="duotone" className="size-[clamp(28px,4.4vh,44px)] text-gold" />
                        <span className="font-display text-[length:clamp(15px,2.2vh,20px)] leading-tight font-bold">Advertisement Monitoring Tool</span>
                      </span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="z-10 flex min-h-0 flex-col gap-[clamp(8px,1.2vh,14px)]">
          {card(4)}
          {card(5)}
          {card(6)}
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-3">
        <Callout
          shown={beat >= 2}
          tone="#dc2626"
          soft="#fef2f2"
          icon={Warning}
          title="The Challenge"
          text="Without a unified operational view, information relating to campaign planning, execution, evidence and reporting can become fragmented across different activities and stakeholders."
        />
        <motion.span
          initial={false}
          animate={{ opacity: beat >= 3 ? 1 : 0.15, x: beat >= 3 ? 0 : -8 }}
          transition={{ duration: 0.5 }}
          className="grid size-[clamp(34px,5vh,46px)] place-items-center self-center rounded-full bg-[#1d4fc4] text-white shadow-lg"
        >
          <ArrowRight weight="bold" className="size-1/2" />
        </motion.span>
        <Callout
          shown={beat >= 3}
          tone="#16a34a"
          soft="#f0fdf4"
          icon={Target}
          title="The Requirement"
          text="A centralized system that connects the complete advertising lifecycle and provides a common source of information for authorized DIPR officials."
        />
      </div>
    </div>
  );
}

function ActivityCard({
  a,
  grow,
  anchor,
  shown,
  delay,
  active,
  joined,
  onHover,
}: {
  a: Activity;
  grow: boolean;
  anchor: string;
  shown: boolean;
  delay: number;
  active: boolean;
  joined: boolean;
  onHover: (on: boolean) => void;
}) {
  return (
    <motion.div
      data-anchor={anchor}
      onMouseEnter={() => shown && onHover(true)}
      onMouseLeave={() => onHover(false)}
      initial={false}
      animate={shown ? { opacity: 1, y: 0, rotate: joined ? 0 : (Number(a.n) % 2 ? -0.6 : 0.6), scale: active ? 1.03 : 1 } : { opacity: 0.12, y: 14, rotate: 0, scale: 0.98 }}
      transition={{ duration: 0.55, ease: EASE, delay: shown && !active ? delay : 0 }}
      className={cn(
        "flex min-h-0 items-stretch gap-3 overflow-hidden rounded-2xl border-[1.5px] p-[clamp(6px,0.9vh,10px)] pl-[clamp(10px,1.1vw,16px)] shadow-[0_18px_40px_-28px_rgba(7,20,51,0.65)]",
        grow ? "flex-1" : "min-h-[clamp(88px,13vh,124px)]",
      )}
      style={{
        background: `linear-gradient(100deg, ${a.color}1f, #ffffff 55%)`,
        borderColor: active || joined ? a.color : `${a.color}55`,
        boxShadow: active ? `0 0 0 2px ${a.color}, 0 20px 40px -24px ${a.color}` : undefined,
      }}
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center py-1">
        <span className="flex items-center gap-2.5">
          <span
            className="font-display grid h-[clamp(28px,4vh,38px)] min-w-[clamp(34px,4.6vh,44px)] shrink-0 place-items-center rounded-lg px-1.5 text-[length:clamp(14px,2vh,18px)] font-bold text-white shadow-md"
            style={{ background: a.color }}
          >
            {a.n}
          </span>
          <span className="font-display text-[length:clamp(15px,2.15vh,20px)] leading-tight font-bold text-navy">{a.title}</span>
        </span>
        <span className="mt-1.5 block text-[length:clamp(13px,1.75vh,15.5px)] leading-snug text-ink/85">{a.body}</span>
      </span>
      <motion.span
        className="relative w-[36%] shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-md"
        animate={{ scale: active ? 1.04 : 1 }}
        transition={{ duration: 0.4 }}
      >
        <img src={a.photo} alt="" className="absolute inset-0 size-full object-cover" />
      </motion.span>
    </motion.div>
  );
}

function Callout({ shown, tone, soft, icon: I, title, text }: { shown: boolean; tone: string; soft: string; icon: CessIcon; title: string; text: string }) {
  return (
    <motion.div
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0.12, y: 10 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex items-center gap-4 rounded-2xl border-l-[6px] px-[clamp(12px,1.4vw,22px)] py-[clamp(8px,1.3vh,14px)] shadow-[0_18px_40px_-30px_rgba(7,20,51,0.6)]"
      style={{ background: soft, borderColor: tone }}
    >
      <motion.span
        animate={shown ? { scale: [1, 1.12, 1] } : undefined}
        transition={{ duration: 1.6, repeat: shown ? Infinity : 0, repeatDelay: 1.2 }}
        className="grid size-[clamp(38px,5.6vh,52px)] shrink-0 place-items-center rounded-full text-white shadow-md"
        style={{ background: tone }}
      >
        <I weight="fill" className="size-1/2" />
      </motion.span>
      <span className="min-w-0">
        <span className="font-display block text-[length:clamp(16px,2.3vh,21px)] font-bold" style={{ color: tone }}>
          {title}
        </span>
        <span className="mt-0.5 block text-[length:clamp(13px,1.8vh,16px)] leading-snug text-ink/85">{text}</span>
      </span>
    </motion.div>
  );
}
