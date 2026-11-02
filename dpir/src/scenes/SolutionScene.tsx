import { motion, useReducedMotion } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { KaMark } from "@/components/SlideKit";
import { useLinkPaths } from "@/hooks/useLinkPaths";
import {
  CalendarCheck,
  ChartPieSlice,
  CheckCircle,
  Desktop,
  DeviceMobile,
  Eye,
  FolderSimple,
  GpsFix,
  Handshake,
  LockKey,
  MapPin,
  Megaphone,
  Newspaper,
  PlugsConnected,
  SealCheck,
  ShieldCheck,
  SquaresFour,
  Television,
  UsersThree,
  WifiSlash,
  type CessIcon,
} from "@/lib/icons";
import imgDigital from "@/assets/photos/media-digital.webp";
import imgOutdoor from "@/assets/photos/media-outdoor.webp";
import imgPrint from "@/assets/photos/media-print.webp";
import imgMobile from "@/assets/photos/sol-mobile.webp";
import imgVendors from "@/assets/photos/eco-officials.webp";
import imgWeb from "@/assets/photos/training.webp";

const EASE = [0.22, 1, 0.36, 1] as const;

type NodeKey = "web" | "mobile" | "vendors" | "media" | "caps" | "hub";

const NODE_COLOR: Record<NodeKey, string> = {
  web: "#1d4fc4",
  mobile: "#16a34a",
  vendors: "#0d9488",
  media: "#ea580c",
  caps: "#7c3aed",
  hub: "#0b1f4a",
};

const WEB_ITEMS = ["Campaign administration", "Planning and approvals", "Asset management", "Agency coordination", "Dashboards and reports", "User and access management"];
const MOBILE_ITEMS = ["Field task management", "Photo and video capture", "GPS and timestamp capture", "Offline data collection", "Online synchronization", "Evidence submission"];
const VENDOR_ITEMS = ["Receive assignments", "Execute advertisements", "Upload proof of display", "Track campaign status"];

const MEDIA: { label: string; icon: CessIcon; color: string; photo: string; items: string[] }[] = [
  { label: "Print", icon: Newspaper, color: "#ea580c", photo: imgPrint, items: ["Newspapers", "Magazines", "Inserts"] },
  { label: "Digital", icon: Television, color: "#1d4fc4", photo: imgDigital, items: ["Online media", "Social media", "OTT platforms", "Web portals"] },
  { label: "Outdoor", icon: MapPin, color: "#16a34a", photo: imgOutdoor, items: ["Hoardings", "Bus shelters", "Transit media", "Street furniture"] },
];

const CAPABILITIES: { label: string; icon: CessIcon; color: string; node: NodeKey }[] = [
  { label: "End-to-end campaign management", icon: Megaphone, color: "#1d4fc4", node: "web" },
  { label: "Centralized advertising asset inventory", icon: FolderSimple, color: "#7c3aed", node: "web" },
  { label: "Print, digital and outdoor media management", icon: Newspaper, color: "#16a34a", node: "media" },
  { label: "Campaign scheduling, budgeting and approvals", icon: CalendarCheck, color: "#ea580c", node: "web" },
  { label: "Agency assignment and execution tracking", icon: Handshake, color: "#0d9488", node: "vendors" },
  { label: "Proof-of-Display (PoD) capture and verification", icon: SealCheck, color: "#dc2626", node: "mobile" },
  { label: "GPS-enabled field monitoring", icon: GpsFix, color: "#2563eb", node: "mobile" },
  { label: "Mobile and offline data capture", icon: WifiSlash, color: "#16a34a", node: "mobile" },
  { label: "Automated compliance and KPI reporting", icon: ChartPieSlice, color: "#7c3aed", node: "caps" },
  { label: "Role-based access and audit trails", icon: LockKey, color: "#475569", node: "hub" },
  { label: "Secure APIs and third-party integrations", icon: PlugsConnected, color: "#0284c7", node: "hub" },
];

const PILLARS: { label: string; icon: CessIcon; color: string }[] = [
  { label: "Centralized Management", icon: SquaresFour, color: "#7c3aed" },
  { label: "Multi-Channel Execution", icon: UsersThree, color: "#0d9488" },
  { label: "Evidence-Based Verification", icon: ShieldCheck, color: "#ea580c" },
  { label: "Real-Time Visibility", icon: Eye, color: "#2563eb" },
  { label: "Data-Driven Decisions", icon: ChartPieSlice, color: "#db2777" },
];

const LINKS = [
  { id: "web", from: "web", to: "hub" },
  { id: "mobile", from: "mobile", to: "hub" },
  { id: "vendors", from: "vendors", to: "hub" },
  { id: "media", from: "media", to: "hub" },
  { id: "caps", from: "hub", to: "caps" },
] as const;

type Linked = (typeof LINKS)[number]["id"];

/** Beats: 0 platform, 1 web application, 2 mobile application, 3 vendors + media channels, 4 core capabilities. */
export function SolutionScene({ beat }: { beat: number }) {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<NodeKey | null>(null);
  const { w, h, paths } = useLinkPaths(stage, [...LINKS], [beat]);

  const shownAt: Record<Linked, number> = { web: 1, mobile: 2, vendors: 3, media: 3, caps: 4 };
  const isShown = (k: Linked) => beat >= shownAt[k];
  const hoverProps = (k: NodeKey) => ({
    active: hover === k,
    dim: hover !== null && hover !== k && hover !== "hub",
    onHover: (on: boolean) => setHover(on ? k : null),
  });

  return (
    <div ref={stage} className="relative flex h-full flex-col gap-[clamp(6px,1vh,12px)] text-ink">
      <svg className="pointer-events-none absolute inset-0 z-0 overflow-visible" width={w} height={h} viewBox={`0 0 ${w || 1} ${h || 1}`} aria-hidden>
        {LINKS.map((l) => {
          const p = paths[l.id];
          if (!p) return null;
          const on = isShown(l.id);
          const color = NODE_COLOR[l.id];
          const lit = hover === l.id || hover === "hub";
          return (
            <g key={l.id}>
              <motion.path
                d={p.d}
                fill="none"
                stroke={color}
                strokeLinecap="round"
                initial={false}
                animate={{ opacity: on ? (hover === null || lit ? 0.9 : 0.25) : 0, strokeWidth: lit ? 4 : 2.6, strokeDashoffset: on && !reduce ? [0, -36] : 0 }}
                strokeDasharray="10 8"
                transition={{ opacity: { duration: 0.5 }, strokeDashoffset: { duration: 1.1, repeat: Infinity, ease: "linear" } }}
              />
              {on && !reduce && (
                <circle r={lit ? 6 : 4.5} fill={color} stroke="#fff" strokeWidth="2">
                  <animateMotion dur={`${2.2 + (l.id.length % 3) * 0.3}s`} repeatCount="indefinite" path={p.d} keyPoints={l.id === "caps" ? "0;1" : "1;0"} keyTimes="0;1" calcMode="linear" />
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
        From campaign initiation to verified execution and management reporting.
      </motion.p>

      <div className="z-10 grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-x-[clamp(24px,3.4vw,64px)] gap-y-[clamp(8px,1.2vh,14px)]">
        <NodeCard anchor="web" shown={isShown("web")} color={NODE_COLOR.web} icon={Desktop} title="DIPR Officials" role="Web Application" {...hoverProps("web")}>
          <PhotoList photo={imgWeb} items={WEB_ITEMS} color={NODE_COLOR.web} shown={isShown("web")} />
        </NodeCard>

        <div className="row-span-2 flex min-h-0 flex-col items-center justify-center">
          <Hub reduce={!!reduce} active={hover === "hub"} onHover={(on) => setHover(on ? "hub" : null)} />
        </div>

        <NodeCard anchor="mobile" shown={isShown("mobile")} color={NODE_COLOR.mobile} icon={DeviceMobile} title="Field Teams" role="Mobile Application" {...hoverProps("mobile")}>
          <PhotoList photo={imgMobile} items={MOBILE_ITEMS} color={NODE_COLOR.mobile} shown={isShown("mobile")} />
        </NodeCard>

        <NodeCard anchor="vendors" shown={isShown("vendors")} color={NODE_COLOR.vendors} icon={Handshake} title="Agencies" role="Empanelled Agencies" {...hoverProps("vendors")}>
          <PhotoList photo={imgVendors} items={VENDOR_ITEMS} color={NODE_COLOR.vendors} shown={isShown("vendors")} />
        </NodeCard>

        <NodeCard anchor="media" shown={isShown("media")} color={NODE_COLOR.media} icon={Megaphone} title="Media Channels" {...hoverProps("media")}>
          <div className="grid h-full grid-cols-3 gap-[clamp(6px,0.6vw,10px)]">
            {MEDIA.map((m, i) => {
              const I = m.icon;
              return (
                <motion.div
                  key={m.label}
                  initial={false}
                  animate={isShown("media") ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                  transition={{ delay: isShown("media") ? 0.3 + i * 0.12 : 0 }}
                  className="flex min-h-0 flex-col overflow-hidden rounded-xl border bg-white"
                  style={{ borderColor: `${m.color}40` }}
                >
                  <div className="flex items-center gap-1.5 px-2 py-1 font-display text-[length:clamp(13px,1.8vh,16px)] font-bold tracking-wide uppercase" style={{ color: m.color, background: `${m.color}12` }}>
                    <I weight="duotone" className="size-[1.2em] shrink-0" />
                    {m.label}
                  </div>
                  <ul className="shrink-0 px-2 py-1 text-[length:clamp(13px,1.6vh,14.5px)] leading-[1.25] font-medium text-ink">
                    {m.items.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <div className="relative mt-auto min-h-0 flex-1">
                    <img src={m.photo} alt="" className="absolute inset-0 size-full object-cover" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </NodeCard>
      </div>

      <motion.section
        data-anchor="caps"
        initial={false}
        animate={{ opacity: beat >= 4 ? 1 : 0.12 }}
        transition={{ duration: 0.4 }}
        className="z-10 shrink-0 rounded-2xl border border-[#1d4fc4]/20 bg-white/90 px-3 pt-1.5 pb-2.5 shadow-[0_18px_40px_-30px_rgba(7,20,51,0.6)] backdrop-blur"
      >
        <h3 className="font-display mb-1.5 text-center text-[length:clamp(15px,2.1vh,19px)] font-bold text-navy">Core Solution Capabilities</h3>
        <div className="grid grid-cols-11 gap-[clamp(4px,0.5vw,8px)]">
          {CAPABILITIES.map((c, i) => {
            const I = c.icon;
            const lit = hover === c.node;
            return (
              <motion.div
                key={c.label}
                onMouseEnter={() => beat >= 4 && setHover(c.node)}
                onMouseLeave={() => setHover(null)}
                initial={false}
                animate={beat >= 4 ? { opacity: hover && !lit ? 0.45 : 1, y: lit ? -4 : 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.4, ease: EASE, delay: beat >= 4 && !hover ? i * 0.06 : 0 }}
                className="flex flex-col items-center gap-1 rounded-xl border bg-white px-1 py-1.5 text-center [@media(max-height:780px)]:gap-0.5 [@media(max-height:780px)]:py-1"
                style={{ borderColor: lit ? c.color : "#e2e8f0", boxShadow: lit ? `0 10px 22px -12px ${c.color}` : undefined }}
              >
                <span className="grid size-[clamp(28px,3.8vh,36px)] place-items-center rounded-full text-white shadow [@media(max-height:780px)]:size-[22px]" style={{ background: c.color }}>
                  <I weight="fill" className="size-[55%]" />
                </span>
                <span className="text-[length:clamp(13px,1.5vh,14px)] leading-tight font-semibold text-navy">{c.label}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <motion.div
        initial={false}
        animate={beat >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, ease: EASE, delay: beat >= 4 ? 0.8 : 0 }}
        className="z-10 grid shrink-0 grid-cols-5 gap-2 rounded-2xl bg-[linear-gradient(90deg,#0b1f4a,#163a8a,#0b1f4a)] px-4 py-[clamp(6px,1vh,10px)] shadow-[0_18px_40px_-24px_rgba(7,20,51,0.9)]"
      >
        {PILLARS.map((p) => {
          const I = p.icon;
          return (
            <div key={p.label} className="flex items-center justify-center gap-2.5">
              <span className="grid size-[clamp(28px,4vh,38px)] shrink-0 place-items-center rounded-full text-white ring-2 ring-white/25" style={{ background: p.color }}>
                <I weight="fill" className="size-[55%]" />
              </span>
              <span className="font-display text-[length:clamp(13px,1.8vh,16px)] leading-tight font-bold text-white">{p.label}</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

const CLOUD = "M58 150 C26 150 8 128 12 102 C15 80 33 66 54 67 C56 38 82 18 112 22 C132 4 170 8 184 36 C214 32 238 56 234 86 C250 98 248 150 206 150 Z";

function Hub({ reduce, active, onHover }: { reduce: boolean; active: boolean; onHover: (on: boolean) => void }) {
  return (
    <motion.div
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: active ? 1.04 : 1 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
      className="relative flex w-full max-w-[340px] flex-col items-center"
    >
      <motion.div
        data-anchor="hub"
        className="relative w-full"
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 260 160" className="w-full overflow-visible drop-shadow-[0_18px_30px_rgba(29,79,196,0.35)]" aria-hidden>
          <defs>
            <linearGradient id="amt-cloud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#dbe8ff" />
            </linearGradient>
          </defs>
          <path d={CLOUD} fill="url(#amt-cloud)" stroke="#5b8def" strokeWidth="2.5" />
        </svg>
        <div className="absolute inset-x-[8%] top-[18%] bottom-[4%] flex flex-col items-center justify-center text-center">
          <KaMark className="size-[clamp(30px,4.6vh,46px)]" />
          <span className="font-display mt-0.5 text-[length:clamp(18px,2.8vh,26px)] leading-none font-black text-navy">DIPR</span>
          <span className="font-display text-[length:clamp(14px,2.05vh,19px)] leading-tight font-bold text-[#1d4fc4]">Advertisement Monitoring Tool</span>
          <span className="mt-0.5 text-[length:clamp(13px,1.6vh,14.5px)] font-semibold text-navy/80">Centralized Digital Platform</span>
        </div>
      </motion.div>
      <div className="relative -mt-[4%] h-[clamp(34px,6vh,56px)] w-[92%]">
        <span className="absolute inset-x-0 bottom-0 h-[70%] rounded-[50%] bg-[radial-gradient(ellipse,#60a5fa_0%,#1d4fc4_45%,#0b1f4a_80%)] shadow-[0_0_40px_6px_rgba(59,130,246,0.55)]" />
        <span className="absolute inset-x-[10%] bottom-[22%] h-[38%] rounded-[50%] border-2 border-cyan-200/80" />
        {!reduce &&
          [0, 1].map((k) => (
            <motion.span
              key={k}
              className="absolute inset-x-[6%] bottom-[10%] h-[50%] rounded-[50%] border-2 border-cyan-300/70"
              animate={{ scale: [1, 1.25], opacity: [0.8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: k * 1.2 }}
            />
          ))}
      </div>
    </motion.div>
  );
}

function NodeCard({
  anchor,
  shown,
  color,
  icon: I,
  title,
  role,
  active,
  dim,
  onHover,
  children,
}: {
  anchor: NodeKey;
  shown: boolean;
  color: string;
  icon: CessIcon;
  title: string;
  role?: string;
  active: boolean;
  dim: boolean;
  onHover: (on: boolean) => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      data-anchor={anchor}
      onMouseEnter={() => shown && onHover(true)}
      onMouseLeave={() => onHover(false)}
      initial={false}
      animate={shown ? { opacity: dim ? 0.5 : 1, y: 0, scale: active ? 1.02 : 1 } : { opacity: 0.12, y: 14, scale: 0.98 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="flex min-h-0 flex-col overflow-hidden rounded-2xl border-[1.5px] bg-white/95 shadow-[0_18px_40px_-28px_rgba(7,20,51,0.65)] backdrop-blur"
      style={{ borderColor: active ? color : `${color}55`, boxShadow: active ? `0 0 0 2px ${color}, 0 20px 40px -24px ${color}` : undefined }}
    >
      <div className="flex items-center gap-3 px-[clamp(10px,1.2vw,16px)] py-[clamp(5px,0.8vh,9px)] text-white" style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}>
        <span className="grid size-[clamp(30px,4.2vh,40px)] shrink-0 place-items-center rounded-full bg-white shadow" style={{ color }}>
          <I weight="duotone" className="size-[60%]" />
        </span>
        <span className="font-display min-w-0 flex-1 text-[length:clamp(15px,2.2vh,20px)] leading-tight font-bold">{title}</span>
        {role && <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 text-[length:clamp(13px,1.6vh,14px)] font-semibold">{role}</span>}
      </div>
      <div className="min-h-0 flex-1 p-[clamp(6px,1vh,10px)]">{children}</div>
    </motion.div>
  );
}

function PhotoList({ photo, items, color, shown }: { photo: string; items: string[]; color: string; shown: boolean }) {
  return (
    <div className="flex h-full gap-[clamp(8px,0.9vw,14px)]">
      <div className="relative w-[40%] shrink-0 overflow-hidden rounded-xl shadow-md">
        <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />
      </div>
      <ul className="grid min-w-0 flex-1 content-evenly">
        {items.map((t, i) => (
          <motion.li
            key={t}
            initial={false}
            animate={shown ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
            transition={{ delay: shown ? 0.25 + i * 0.08 : 0 }}
            className="flex items-start gap-2 text-[length:clamp(13px,1.85vh,16.5px)] leading-snug font-medium text-ink [@media(max-height:780px)]:leading-tight"
          >
            <CheckCircle weight="fill" className="mt-[0.15em] size-[1.1em] shrink-0" style={{ color }} />
            {t}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
