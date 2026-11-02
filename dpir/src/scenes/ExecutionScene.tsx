import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { FeatureStrip, type Feature } from "@/components/FeatureStrip";
import { useLinkPaths } from "@/hooks/useLinkPaths";
import { Creative } from "@/scenes/AssetScene";
import { CAMPAIGN } from "@/scenes/CampaignScene";
import {
  CheckCircle,
  Clock,
  Files,
  Globe,
  Handshake,
  ListChecks,
  MapPin,
  Newspaper,
  SealCheck,
  ShareNetwork,
  Television,
  VideoCamera,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import imgOutdoor from "@/assets/photos/media-outdoor.webp";

const EASE = [0.22, 1, 0.36, 1] as const;

type ChKey = "print" | "digital" | "outdoor";
type Status = "Published" | "Live" | "Installed" | "Verified" | "Scheduled";
const STATUS_TONE: Record<Status, string> = { Published: "#16a34a", Live: "#16a34a", Installed: "#2563eb", Verified: "#16a34a", Scheduled: "#7c3aed" };

type Channel = {
  key: ChKey;
  title: string;
  icon: CessIcon;
  color: string;
  table: string;
  cols: [string, string, string, string];
  rows: { a: string; b: string; c: string; s: Status; s2?: Status }[];
  stats: [string, string, string];
  stats2?: [string, string, string];
  progress: [number, number];
  vendor: string;
  docs: string;
};

const CHANNELS: Channel[] = [
  {
    key: "print",
    title: "Print Advertising",
    icon: Newspaper,
    color: "#ea580c",
    table: "Publication Schedule",
    cols: ["Newspaper", "Ad Size", "Date", "Status"],
    rows: [
      { a: "The Hindu", b: "Half Page", c: "05-08-2026", s: "Published" },
      { a: "Vijayavani", b: "Half Page", c: "08-08-2026", s: "Published" },
      { a: "Prajavani", b: "Quarter Page", c: "12-08-2026", s: "Scheduled", s2: "Published" },
      { a: "Deccan Herald", b: "Half Page", c: "18-08-2026", s: "Scheduled" },
    ],
    stats: ["25 Planned", "19 Published", "6 Remaining"],
    stats2: ["25 Planned", "21 Published", "4 Remaining"],
    progress: [76, 85],
    vendor: "Print agency assigned",
    docs: "Tear sheets linked",
  },
  {
    key: "digital",
    title: "Digital Advertising",
    icon: Television,
    color: "#7c3aed",
    table: "Digital Campaign Records",
    cols: ["Platform", "Ad Type", "Start", "Status"],
    rows: [
      { a: "News Portal", b: "Display Ad", c: "01-08-2026", s: "Live" },
      { a: "Facebook", b: "Banner", c: "01-08-2026", s: "Live" },
      { a: "YouTube", b: "Video Ad", c: "15-08-2026", s: "Scheduled", s2: "Live" },
    ],
    stats: ["3 Planned", "2 Live", "1 Scheduled"],
    stats2: ["3 Planned", "3 Live", "0 Scheduled"],
    progress: [60, 70],
    vendor: "Digital agency assigned",
    docs: "Screenshots linked",
  },
  {
    key: "outdoor",
    title: "Outdoor Advertising",
    icon: MapPin,
    color: "#16a34a",
    table: "Outdoor Locations",
    cols: ["Location", "Type", "Start", "Status"],
    rows: [
      { a: "Majestic Circle", b: "Hoarding", c: "01-08-2026", s: "Verified" },
      { a: "Hebbal Flyover", b: "Hoarding", c: "01-08-2026", s: "Verified" },
      { a: "Mysuru Road", b: "Billboard", c: "05-08-2026", s: "Installed", s2: "Verified" },
      { a: "K.R. Puram", b: "Transit Media", c: "10-08-2026", s: "Scheduled" },
    ],
    stats: ["12 Planned", "9 Installed", "3 Remaining"],
    stats2: ["12 Planned", "10 Installed", "2 Remaining"],
    progress: [72, 80],
    vendor: "Outdoor agency assigned",
    docs: "Geo-tagged photos linked",
  },
];

const FEATURES: Feature[] = [
  { title: "Print Advertising", icon: Newspaper, color: "#ea580c", items: ["Associate newspaper advertisement creatives.", "Maintain publication information.", "Record publication schedules and dates.", "Associate publication evidence with campaigns."] },
  { title: "Digital Advertising", icon: Television, color: "#7c3aed", items: ["Manage digital advertisement creatives.", "Maintain campaign-wise digital advertising records.", "Record associated digital publication or display information.", "Maintain supporting evidence."] },
  { title: "Outdoor Advertising", icon: MapPin, color: "#16a34a", items: ["Maintain outdoor advertisement information.", "Associate assets with locations.", "Maintain geo-tagged asset information.", "Support field-level display verification."] },
  {
    title: "Common Execution",
    icon: ListChecks,
    color: "#2563eb",
    items: ["Campaign-wise activity management.", "Agency assignment.", "Scheduling and status tracking.", "Media-wise execution records.", "Supporting document and asset association."],
  },
];

const LINKS = CHANNELS.map((c) => ({ id: c.key, from: "camp", to: c.key }));

/** Beats: 0 approved campaign, 1 print, 2 digital, 3 outdoor, 4 common execution, 5 expected outcome. */
export function ExecutionScene({ beat }: { beat: number }) {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<ChKey | null>(null);
  const { w, h, paths } = useLinkPaths(stage, LINKS, [beat]);
  const common = beat >= 4;
  const shown = (i: number) => beat >= i + 1;
  const pct = (c: Channel) => c.progress[common ? 1 : 0];
  const visible = CHANNELS.filter((_, i) => shown(i));
  const overall = visible.length ? Math.round(visible.reduce((s, c) => s + pct(c), 0) / CHANNELS.length) : 0;

  return (
    <div ref={stage} className="relative flex h-full flex-col gap-[clamp(6px,1vh,12px)] text-ink">
      <svg className="pointer-events-none absolute inset-0 z-0 overflow-visible" width={w} height={h} viewBox={`0 0 ${w || 1} ${h || 1}`} aria-hidden>
        {LINKS.map((l, i) => {
          const p = paths[l.id];
          if (!p) return null;
          const c = CHANNELS[i];
          const on = shown(i);
          const lit = hover === c.key;
          return (
            <g key={l.id}>
              <motion.path
                d={p.d}
                fill="none"
                stroke={c.color}
                strokeLinecap="round"
                strokeDasharray="10 8"
                initial={false}
                animate={{ opacity: on ? (hover === null || lit ? 0.95 : 0.3) : 0, strokeWidth: lit ? 4.5 : 3, strokeDashoffset: on && !reduce ? [0, -36] : 0 }}
                transition={{ opacity: { duration: 0.5 }, strokeDashoffset: { duration: 1.1, repeat: Infinity, ease: "linear" } }}
              />
              {on && !reduce && (
                <circle r={lit ? 6 : 4.5} fill={c.color} stroke="#fff" strokeWidth="2">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path={p.d} />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="font-display z-10 shrink-0 text-center text-[length:clamp(16px,2.4vh,23px)] font-bold text-navy"
      >
        Coordinating print, digital and outdoor advertising <span className="text-[#1d4fc4]">through one platform.</span>
      </motion.p>

      <CampaignCard overall={overall} pct={(c) => (CHANNELS.indexOf(c) < visible.length ? pct(c) : null)} hover={hover} setHover={setHover} />

      <div className="z-10 mt-[clamp(10px,2.4vh,30px)] grid min-h-0 flex-1 grid-cols-3 gap-[clamp(10px,1.2vw,20px)]">
        {CHANNELS.map((c, i) => (
          <ChannelCard key={c.key} c={c} shown={shown(i)} common={common} active={hover === c.key} dim={hover !== null && hover !== c.key} onHover={(on) => setHover(on ? c.key : null)} />
        ))}
      </div>

      <div className="z-10">
        <FeatureStrip
          features={FEATURES}
          active={beat - 1}
          outcomeShown={beat >= 5}
          outcome={
            <>
              <span className="font-display font-bold text-[#15803d]">A consolidated campaign execution record</span> covering all selected advertising channels.
            </>
          }
        />
      </div>
    </div>
  );
}

function CampaignCard({ overall, pct, hover, setHover }: { overall: number; pct: (c: Channel) => number | null; hover: ChKey | null; setHover: (k: ChKey | null) => void }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  return (
    <motion.div
      data-anchor="camp"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      className="z-10 mx-auto flex w-[min(100%,980px)] shrink-0 items-center gap-[clamp(10px,1.2vw,20px)] rounded-2xl border border-[#1d4fc4]/20 bg-white/95 p-[clamp(6px,0.8vw,12px)] shadow-[0_24px_50px_-30px_rgba(7,20,51,0.7)]"
    >
      <Creative kind="en" className="aspect-[16/10] h-[clamp(62px,10vh,104px)] shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#16a34a]/12 px-2 text-[13px] font-bold text-[#15803d]">Approved</span>
          <span className="font-display truncate text-[length:clamp(15px,2.2vh,20px)] font-bold text-navy">{CAMPAIGN.name}</span>
        </div>
        <div className="mt-1 grid grid-cols-[repeat(4,auto)] justify-start gap-x-[clamp(12px,1.6vw,28px)] text-[length:clamp(13px,1.6vh,14.5px)] leading-tight">
          {[
            ["Campaign ID", CAMPAIGN.id],
            ["Duration", "01-08-2026 to 30-09-2026"],
            ["Category", CAMPAIGN.category],
            ["Sanctioned Budget", `₹ ${CAMPAIGN.budget}`],
          ].map(([k, v]) => (
            <span key={k}>
              <span className="block text-ink/60">{k}</span>
              <span className="block font-semibold text-navy">{v}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 border-l border-slate-200 pl-[clamp(10px,1.2vw,20px)]">
        <div className="relative grid size-[clamp(62px,9vh,84px)] place-items-center">
          <svg viewBox="0 0 72 72" className="absolute inset-0 size-full -rotate-90" aria-hidden>
            <circle cx="36" cy="36" r={R} fill="none" stroke="#e2e8f0" strokeWidth="7" />
            <motion.circle cx="36" cy="36" r={R} fill="none" stroke="#16a34a" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} initial={false} animate={{ strokeDashoffset: C * (1 - overall / 100) }} transition={{ duration: 0.9, ease: EASE }} />
          </svg>
          <span className="font-display text-[length:clamp(16px,2.4vh,22px)] font-bold text-navy">{overall}%</span>
        </div>
        <div className="grid gap-0.5 text-[length:clamp(13px,1.6vh,14.5px)]">
          <span className="font-semibold text-navy/70">Campaign Progress</span>
          {CHANNELS.map((c) => {
            const v = pct(c);
            return (
              <button
                key={c.key}
                type="button"
                onMouseEnter={() => setHover(c.key)}
                onMouseLeave={() => setHover(null)}
                onClick={(e) => e.stopPropagation()}
                className={cn("flex items-center gap-2 rounded px-1 text-left", hover === c.key && "bg-slate-100")}
              >
                <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                <span className="w-16 font-medium">{c.title.split(" ")[0]}</span>
                <span className="font-bold text-navy">{v === null ? "–" : `${v}%`}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function ChannelCard({ c, shown, common, active, dim, onHover }: { c: Channel; shown: boolean; common: boolean; active: boolean; dim: boolean; onHover: (on: boolean) => void }) {
  const I = c.icon;
  const stats = common && c.stats2 ? c.stats2 : c.stats;
  const statIcons: CessIcon[] = [ListChecks, CheckCircle, Clock];
  return (
    <motion.div
      data-anchor={c.key}
      onMouseEnter={() => shown && onHover(true)}
      onMouseLeave={() => onHover(false)}
      initial={false}
      animate={shown ? { opacity: dim ? 0.55 : 1, y: 0, scale: active ? 1.01 : 1 } : { opacity: 0.12, y: 16, scale: 0.98 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex min-h-0 flex-col overflow-hidden rounded-2xl border-[1.5px] bg-white/95 shadow-[0_20px_44px_-28px_rgba(7,20,51,0.7)]"
      style={{ borderColor: active ? c.color : `${c.color}50`, boxShadow: active ? `0 0 0 2px ${c.color}, 0 20px 40px -24px ${c.color}` : undefined }}
    >
      <div className="flex shrink-0 items-center gap-2.5 px-[clamp(8px,0.9vw,14px)] py-[clamp(5px,0.8vh,9px)]" style={{ background: `linear-gradient(90deg, ${c.color}18, transparent)` }}>
        <span className="grid size-[clamp(30px,4.4vh,40px)] shrink-0 place-items-center rounded-full text-white shadow" style={{ background: c.color }}>
          <I weight="fill" className="size-1/2" />
        </span>
        <span className="font-display min-w-0 flex-1 text-[length:clamp(15px,2.2vh,20px)] leading-tight font-bold text-navy">{c.title}</span>
        <span className="shrink-0 rounded-full px-2 text-[13px] font-bold" style={{ color: c.color, background: `${c.color}18` }}>
          In Progress
        </span>
      </div>

      <div className="relative min-h-[clamp(56px,8vh,200px)] flex-1 overflow-hidden">
        <Visual k={c.key} />
      </div>

      <motion.div initial={false} animate={{ height: common ? "auto" : 0, opacity: common ? 1 : 0 }} transition={{ duration: 0.45 }} className="shrink-0 overflow-hidden">
        <div className="flex gap-1.5 overflow-hidden px-[clamp(8px,0.9vw,14px)] pt-1.5 text-[13px] font-semibold whitespace-nowrap">
          <span className="flex min-w-0 shrink items-center gap-1 rounded-full bg-[#0d9488]/12 px-2 text-[#0f766e]">
            <Handshake weight="fill" className="size-[1.1em]" /> {c.vendor}
          </span>
          <span className="flex min-w-0 shrink items-center gap-1 rounded-full bg-[#2563eb]/12 px-2 text-[#1d4ed8]">
            <Files weight="fill" className="size-[1.1em]" /> {c.docs}
          </span>
        </div>
      </motion.div>

      <div className="shrink-0 px-[clamp(8px,0.9vw,14px)] pt-1.5 text-[length:clamp(13px,1.55vh,14px)]">
        <div className="font-display mb-0.5 font-bold text-navy">{c.table}</div>
        <div className="grid grid-cols-[1.35fr_1fr_1fr_0.95fr] gap-1.5 rounded bg-slate-50 px-1.5 py-0.5 font-semibold text-navy/65">
          {c.cols.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {c.rows.map((r, i) => {
          const s = common && r.s2 ? r.s2 : r.s;
          return (
            <motion.div
              key={r.a}
              initial={false}
              animate={shown ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
              transition={{ delay: shown ? 0.35 + i * 0.1 : 0 }}
              className="grid grid-cols-[1.35fr_1fr_1fr_0.95fr] items-center gap-1.5 border-b border-slate-100 px-1.5 py-[clamp(1px,0.35vh,4px)]"
            >
              <span className="truncate font-semibold text-navy">{r.a}</span>
              <span className="truncate">{r.b}</span>
              <span className="truncate">{r.c.slice(0, 5)}</span>
              <motion.span key={s} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="flex items-center gap-1 font-semibold whitespace-nowrap" style={{ color: STATUS_TONE[s] }}>
                {s === "Scheduled" ? <Clock weight="bold" className="size-[1em]" /> : <CheckCircle weight="fill" className="size-[1em]" />}
                {s}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-1 px-[clamp(8px,0.9vw,14px)] py-[clamp(5px,0.8vh,9px)]">
        {stats.map((s, i) => {
          const SI = statIcons[i];
          const [n, ...label] = s.split(" ");
          return (
            <span key={i} className="flex items-center gap-1.5 rounded-lg px-1.5 py-1" style={{ background: `${c.color}0d` }}>
              <SI weight="duotone" className="size-[clamp(18px,2.6vh,24px)] shrink-0" style={{ color: c.color }} />
              <span className="leading-tight">
                <motion.span key={n} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display block text-[length:clamp(15px,2.1vh,19px)] font-bold text-navy">
                  {n}
                </motion.span>
                <span className="block text-[13px] text-ink/70">{label.join(" ")}</span>
              </span>
            </span>
          );
        })}
      </div>
    </motion.div>
  );
}

function Visual({ k }: { k: ChKey }) {
  if (k === "print") {
    return (
      <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#e7e2d6,#f8f6f0)] p-2">
        <div className="absolute top-[14%] left-[10%] h-[80%] w-[52%] -rotate-6 rounded-sm bg-[#efebe1] shadow-md" />
        <div className="relative flex h-full w-[min(78%,330px)] rotate-2 flex-col gap-1 rounded-sm bg-[#fbfaf6] p-[3%] shadow-lg">
          <span className="font-display border-b-2 border-ink pb-0.5 text-center text-[length:clamp(13px,2vh,18px)] leading-none font-black tracking-wide text-ink">KARNATAKA DAILY</span>
          <div className="grid min-h-0 flex-1 grid-cols-[1fr_1.6fr] gap-1.5">
            <div className="grid content-start gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className="h-1 rounded bg-slate-300" style={{ width: `${65 + ((i * 17) % 35)}%` }} />
              ))}
            </div>
            <Creative kind="kn" className="h-full rounded-sm" />
          </div>
        </div>
      </div>
    );
  }
  if (k === "digital") {
    const plats: [string, CessIcon][] = [
      ["Web Portals", Globe],
      ["Social Media", ShareNetwork],
      ["Video Platforms", VideoCamera],
    ];
    return (
      <div className="absolute inset-0 flex items-center gap-2 bg-[linear-gradient(135deg,#ede9fe,#f8fafc)] p-2">
        <div className="grid shrink-0 gap-1.5">
          {plats.map(([l, PI]) => (
            <span key={l} className="flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[13px] font-semibold text-navy shadow-sm">
              <PI weight="fill" className="size-[1.1em] text-[#7c3aed]" />
              {l}
            </span>
          ))}
        </div>
        <div className="relative h-full min-w-0 flex-1">
          <div className="absolute inset-y-[4%] right-[14%] left-0 flex flex-col rounded-md border-4 border-[#0d1424] bg-[#0d1424] shadow-lg">
            <Creative kind="en" className="min-h-0 flex-1 rounded-sm" />
          </div>
          <div className="absolute right-0 bottom-0 h-[72%] w-[26%] rounded-lg border-[3px] border-[#0d1424] bg-[#0d1424] shadow-lg">
            <Creative kind="square" className="size-full rounded" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0">
      <img src={imgOutdoor} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute top-[8%] left-1/2 aspect-[2/1] h-[62%] max-w-[72%] -translate-x-1/2 overflow-hidden rounded-sm border-[3px] border-slate-700 shadow-xl">
        <Creative kind="en" className="size-full" />
      </div>
      <span className="absolute top-[62%] right-[10%] flex items-center gap-1 rounded-full bg-white/95 px-2 text-[13px] font-bold text-[#dc2626] shadow">
        <MapPin weight="fill" className="size-[1.1em]" /> Geo-tagged
      </span>
      <span className="absolute top-[62%] left-[10%] flex items-center gap-1 rounded-full bg-white/95 px-2 text-[13px] font-bold text-[#16a34a] shadow">
        <SealCheck weight="fill" className="size-[1.1em]" /> Field verified
      </span>
    </div>
  );
}

