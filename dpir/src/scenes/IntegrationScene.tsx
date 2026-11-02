import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import titleBg from "@/assets/title-bg.webp";
import { FitBox } from "@/components/FitBox";
import {
  ArrowsClockwise,
  Bank,
  DeviceMobile,
  Camera,
  ChartBar,
  CheckCircle,
  ClipboardText,
  CloudArrowUp,
  CurrencyInr,
  Desktop,
  EnvelopeSimple,
  FolderSimple,
  GearSix,
  Handshake,
  Image,
  LinkSimple,
  MapPin,
  MapTrifold,
  Megaphone,
  ShareNetwork,
  ShieldCheck,
  Stack,
  UsersThree,
  VideoCamera,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Item = { label: string; note?: string; icon: CessIcon };
type GroupId = "dept" | "verify" | "external";
type Group = { id: GroupId; title: string; tag: string; icon: CessIcon; color: string; from: string; items: Item[] };

const DEPT: Group = {
  id: "dept",
  title: "DIPR / Departmental Systems",
  tag: "(Indicative)",
  icon: Bank,
  color: "#1d4fc4",
  from: "#0b1f4a",
  items: [
    { label: "Campaign / Communication Management System", note: "(if available)", icon: ClipboardText },
    { label: "Financial / Expenditure System (Khajane-II)", note: "(if available)", icon: CurrencyInr },
    { label: "Document Management System", note: "(if available)", icon: FolderSimple },
    { label: "User Directory / SSO", note: "(if available)", icon: UsersThree },
  ],
};

const VERIFY: Group = {
  id: "verify",
  title: "Third-Party Verification Services",
  tag: "(Indicative)",
  icon: ShieldCheck,
  color: "#7c3aed",
  from: "#4c1d95",
  items: [
    { label: "Image / Display Verification", note: "(e.g., image analysis, location validation)", icon: Camera },
    { label: "Video Verification", icon: VideoCamera },
    { label: "Location / Geo-verification", icon: MapPin },
  ],
};

const EXTERNAL: Group = {
  id: "external",
  title: "Other External Services",
  tag: "(As Required)",
  icon: ShareNetwork,
  color: "#0d9488",
  from: "#115e59",
  items: [
    { label: "Geospatial / Maps Services", note: "(e.g., location visualization)", icon: MapTrifold },
    { label: "Notification Services", note: "(e.g., NIC SMS gateway, email alerts)", icon: EnvelopeSimple },
    { label: "Other Authorized Services", note: "(as per DIPR requirements)", icon: CloudArrowUp },
  ],
};

type ScreenKey = "dashboard" | "campaign" | "asset" | "execution" | "pod" | "reports" | "mobile" | "dept" | "verify" | "external" | "api";

const MODULES: { label: string; icon: CessIcon; screen: ScreenKey }[] = [
  { label: "Campaign Management", icon: Megaphone, screen: "campaign" },
  { label: "Asset Repository", icon: Image, screen: "asset" },
  { label: "Execution Tracking", icon: GearSix, screen: "execution" },
  { label: "Proof-of-Display", icon: Image, screen: "pod" },
  { label: "Reports & Analytics", icon: ChartBar, screen: "reports" },
];

const SCREEN_TITLE: Record<ScreenKey, string> = {
  dashboard: "Dashboard",
  campaign: "Campaigns",
  asset: "Asset Repository",
  execution: "Execution Tracking",
  pod: "Proof of Display",
  reports: "Reports & Analytics",
  mobile: "Field Data Sync",
  dept: "DIPR Systems",
  verify: "Verification",
  external: "External Services",
  api: "Secure APIs",
};

const SCREEN_COLOR: Partial<Record<ScreenKey, string>> = { verify: "#7c3aed", external: "#0d9488", pod: "#16a34a" };

/** Screen shown on the hub laptop for each beat; `null` lets the screen cycle through the modules. */
const BEAT_SCREEN: (ScreenKey | null)[] = [null, "mobile", "dept", "verify", "external", "api", null];
const CYCLE: ScreenKey[] = ["dashboard", ...MODULES.map((m) => m.screen)];

const CAPABILITIES: { title: string; icon: CessIcon; items: string[] }[] = [
  { title: "API Management", icon: Desktop, items: ["Secure RESTful APIs.", "Standardized data exchange.", "API authentication and access control."] },
  {
    title: "DIPR System Integration",
    icon: Stack,
    items: ["Integration with existing DIPR systems (if required).", "Exchange of campaign-related information.", "Data synchronization based on agreed interfaces."],
  },
  {
    title: "Third-Party Integration",
    icon: Handshake,
    items: ["Integration with verification services.", "Support for external verification workflows.", "Exchange of relevant evidence and verification information."],
  },
  {
    title: "Integration Governance",
    icon: ShieldCheck,
    items: ["Secure API communication.", "Controlled access and role-based permissions.", "Integration monitoring and error handling.", "Traceability and audit records."],
  },
];

/** Beat at which each connected group comes online. */
const GROUP_AT: Record<GroupId, number> = { dept: 2, verify: 3, external: 4 };

/**
 * Beats: 0 monitoring tool, 1 mobile application, 2 departmental systems, 3 third-party verification,
 * 4 other external services, 5 integration capabilities, 6 expected outcome.
 */
export function IntegrationScene({ beat }: { beat: number }) {
  const [hover, setHover] = useState<GroupId | null>(null);
  const live = (g: GroupId) => beat >= GROUP_AT[g] || hover === g;
  const focus = (g: GroupId) => beat === GROUP_AT[g] || hover === g;
  const groupProps = (g: Group) => ({ group: g, live: live(g.id), focus: focus(g.id), onHover: setHover });

  const [modHover, setModHover] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const idle = BEAT_SCREEN[beat] == null && hover === null && modHover === null;
  useEffect(() => {
    if (!idle) return;
    const t = setInterval(() => setTick((x) => x + 1), 2600);
    return () => clearInterval(t);
  }, [idle]);
  const screen: ScreenKey = hover ?? (modHover !== null ? MODULES[modHover].screen : (BEAT_SCREEN[beat] ?? CYCLE[tick % CYCLE.length]));

  return (
    <FitBox w={1440} h={724}>
      <div className="flex size-full flex-col gap-3 text-[14px] text-ink">
        <div className="relative h-[482px] shrink-0">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute size-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c7bdf5]/60 bg-[radial-gradient(circle,rgba(124,58,237,0.14),rgba(124,58,237,0.07)_50%,rgba(29,79,196,0.03)_68%,transparent_71%)]"
            style={{ left: HUB.cx, top: HUB.cy }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          <Wires live={live} focus={focus} mobile={beat >= 1} />

          <Box at={LEFT}>
            <GroupPanel {...groupProps(DEPT)} />
          </Box>
          <Box at={MOBILE}>
            <MobileCard on={beat >= 1} focus={beat === 1} />
          </Box>
          <Box at={HUB}>
            <Hub focus={beat === 0} screen={screen} onModuleHover={setModHover} />
          </Box>
          <Box at={VERIFY_BOX}>
            <GroupPanel {...groupProps(VERIFY)} />
          </Box>
          <Box at={EXTERNAL_BOX}>
            <GroupPanel {...groupProps(EXTERNAL)} />
          </Box>

          {WIRES.map((w) => (
            <WireLabel key={w.id} x={w.label[0]} y={w.label[1]} on={live(w.id)} focus={focus(w.id)} />
          ))}
        </div>

        <Capabilities on={beat >= 5} focus={beat === 5} />
        <Outcome shown={beat >= 6} />
      </div>
    </FitBox>
  );
}

type Rect = { x: number; y: number; w: number; h: number };

/** Diagram layout in design-canvas pixels (1440 x 482). */
const LEFT: Rect = { x: 0, y: 72, w: 362, h: 404 };
const HUB: Rect & { cx: number; cy: number } = { x: 492, y: 140, w: 440, h: 300, cx: 712, cy: 290 };
const MOBILE: Rect = { x: 547, y: 0, w: 330, h: 92 };
const VERIFY_BOX: Rect = { x: 1068, y: 0, w: 372, h: 228 };
const EXTERNAL_BOX: Rect = { x: 1068, y: 244, w: 372, h: 238 };

const WIRES: { id: GroupId; d: string; label: [number, number] }[] = [
  { id: "dept", d: "M 364 290 H 490", label: [427, 290] },
  { id: "verify", d: "M 934 236 H 958 V 114 H 1066", label: [1012, 114] },
  { id: "external", d: "M 934 344 H 958 V 363 H 1066", label: [1012, 363] },
];
const MOBILE_WIRE = "M 712 94 V 138";

function Box({ at, children }: { at: Rect; children: ReactNode }) {
  return (
    <div className="absolute flex flex-col" style={{ left: at.x, top: at.y, width: at.w, height: at.h }}>
      {children}
    </div>
  );
}

function Wires({ live, focus, mobile }: { live: (g: GroupId) => boolean; focus: (g: GroupId) => boolean; mobile: boolean }) {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox="0 0 1440 482">
      <defs>
        <marker id="wire-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#1d4fc4" />
        </marker>
      </defs>
      {WIRES.map((w) => (
        <Wire key={w.id} d={w.d} on={live(w.id)} fast={focus(w.id)} />
      ))}
      <Wire d={MOBILE_WIRE} on={mobile} fast={false} />
    </svg>
  );
}

function Wire({ d, on, fast }: { d: string; on: boolean; fast: boolean }) {
  return (
    <motion.g initial={false} animate={{ opacity: on ? 1 : 0.22 }} transition={{ duration: 0.4 }}>
      <path d={d} fill="none" stroke="#1d4fc4" strokeOpacity={0.18} strokeWidth={8} strokeLinejoin="round" />
      <motion.path
        d={d}
        fill="none"
        stroke="#1d4fc4"
        strokeWidth={2.5}
        strokeLinejoin="round"
        markerStart="url(#wire-arrow)"
        markerEnd="url(#wire-arrow)"
        initial={false}
        animate={{ pathLength: on ? 1 : 0.999 }}
      />
      {on && (
        <>
          <motion.path
            d={d}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="2 14"
            animate={{ strokeDashoffset: [0, -32] }}
            transition={{ duration: fast ? 0.5 : 1, repeat: Infinity, ease: "linear" }}
          />
          {[0, 0.5].map((delay) => (
            <motion.circle
              key={delay}
              r={4.5}
              fill="#7c3aed"
              stroke="#fff"
              strokeWidth={1.5}
              style={{ offsetPath: `path("${d}")` }}
              initial={{ offsetDistance: "0%" }}
              animate={{ offsetDistance: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: fast ? 1.2 : 2.4, delay: delay * (fast ? 1.2 : 2.4), repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </>
      )}
    </motion.g>
  );
}

function WireLabel({ x, y, on, focus }: { x: number; y: number; on: boolean; focus: boolean }) {
  return (
    <motion.span
      initial={false}
      animate={{ opacity: on ? 1 : 0.35, scale: focus ? 1.08 : 1 }}
      transition={{ duration: 0.35 }}
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg bg-linear-to-b from-[#2563eb] to-[#1d4fc4] px-2 py-1 text-center text-[13px] leading-tight font-semibold whitespace-nowrap text-white shadow-md ring-2 ring-white"
      style={{ left: x, top: y }}
    >
      Secure API
      <br />
      Integration
    </motion.span>
  );
}

function GroupPanel({ group, live, focus, onHover }: { group: Group; live: boolean; focus: boolean; onHover: (g: GroupId | null) => void }) {
  const H = group.icon;
  return (
    <motion.section
      onMouseEnter={() => onHover(group.id)}
      onMouseLeave={() => onHover(null)}
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: live ? 1 : 0.5,
        y: 0,
        boxShadow: focus ? `0 0 0 2px ${group.color}, 0 20px 36px -22px ${group.color}` : "0 14px 28px -24px rgba(7,20,51,0.55)",
      }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dbe4f0] bg-white/95"
    >
      <div className="flex shrink-0 items-center gap-2.5 px-3 py-2 text-white" style={{ background: `linear-gradient(90deg, ${group.from}, ${group.color})` }}>
        <H weight="duotone" className="size-[30px] shrink-0" />
        <span className="font-display text-[17px] leading-tight font-bold">
          {group.title}
          <span className="block text-[14px] font-medium text-white/85">{group.tag}</span>
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-evenly gap-1.5 p-2.5">
        {group.items.map((it, i) => {
          const I = it.icon;
          return (
            <motion.div
              key={it.label}
              initial={false}
              animate={{ x: focus ? [10, 0] : 0, opacity: live ? 1 : 0.7 }}
              transition={{ delay: focus ? 0.1 + i * 0.08 : 0, duration: 0.4 }}
              className="flex items-center gap-3 rounded-lg border border-[#d6e0ee] bg-[#f5f8fd] px-3 py-1.5"
            >
              <span className="grid size-[36px] shrink-0 place-items-center rounded-lg" style={{ background: `${group.color}18`, color: group.color }}>
                <I weight="fill" className="size-[21px]" />
              </span>
              <span className="leading-tight font-semibold text-navy">
                {it.label}
                {it.note && <span className="block text-[13px] font-normal text-ink/75">{it.note}</span>}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

function MobileCard({ on, focus }: { on: boolean; focus: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: on ? 1 : 0.4,
        y: on ? 0 : 10,
        boxShadow: focus ? "0 0 0 2px #1d4fc4, 0 20px 36px -22px #1d4fc4" : "0 14px 28px -24px rgba(7,20,51,0.55)",
      }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative z-10 flex flex-1 items-center justify-center gap-4 rounded-xl border border-[#c9d8ee] bg-linear-to-b from-white to-[#eef4fc] px-5 py-2.5"
    >
      <span className="relative flex h-[66px] w-[38px] shrink-0 items-center justify-center rounded-[8px] border-[3px] border-navy bg-linear-to-b from-[#2563eb] to-[#1d4fc4]">
        <span className="absolute top-[3px] h-[3px] w-[12px] rounded-full bg-navy/60" />
        <span className="font-display text-[11px] font-bold text-white">DIPR</span>
      </span>
      <span className="font-display text-center text-[16px] leading-tight font-bold text-navy">
        Mobile Application
        <span className="block text-[14px] font-medium text-ink/80">(Field Monitoring &amp; Evidence Capture)</span>
      </span>
    </motion.div>
  );
}

function Hub({ focus, screen, onModuleHover }: { focus: boolean; screen: ScreenKey; onModuleHover: (i: number | null) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: focus
          ? "0 0 0 4px rgba(124,58,237,0.55), 0 30px 50px -22px rgba(29,79,196,0.8)"
          : "0 0 0 4px rgba(199,210,254,0.55), 0 26px 44px -24px rgba(7,20,51,0.65)",
      }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[18px] border-[3px] border-white bg-[linear-gradient(135deg,#1a3a8f_0%,#1f4fbf_45%,#2a63d6_100%)]"
    >
      <span aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-[260px] rounded-full bg-white/8" />
      <div className="relative flex min-h-0 flex-1 items-center justify-center gap-3.5 px-3">
        <ToolScreen screen={screen} />
        <span className="font-display text-[23px] leading-[1.18] font-bold whitespace-nowrap text-white drop-shadow-sm">
          DIPR
          <br />
          Advertisement
          <br />
          Monitoring Tool
        </span>
      </div>
      <div className="relative mx-2 mb-2 grid shrink-0 grid-cols-5 gap-1.5 rounded-xl border border-white/70 bg-[#eef3fd] p-1.5 shadow-inner">
        {MODULES.map((m, i) => {
          const I = m.icon;
          const proof = m.label === "Proof-of-Display";
          const active = m.screen === screen;
          return (
            <motion.div
              key={m.label}
              onMouseEnter={() => onModuleHover(i)}
              onMouseLeave={() => onModuleHover(null)}
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: active ? -2 : 0,
                boxShadow: active ? "0 0 0 2px #1d4fc4, 0 8px 16px -8px rgba(29,79,196,0.8)" : "0 4px 10px -8px rgba(7,20,51,0.6)",
              }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.4, boxShadow: { duration: 0.3 }, y: { duration: 0.3 } }}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-lg border px-0.5 pt-1.5 pb-1 text-center text-[13px] leading-tight font-medium tracking-tight text-navy transition-colors duration-300",
                active ? "border-[#1d4fc4] bg-linear-to-b from-[#e8f0fd] to-white" : "border-[#d3def2] bg-linear-to-b from-white to-[#f3f7fe]",
              )}
            >
              <span className="relative">
                <I weight={m.icon === Megaphone || m.icon === ChartBar ? "fill" : "bold"} className="size-[28px] text-[#1d4fc4]" />
                {proof && (
                  <CheckCircle weight="fill" className="absolute -right-1.5 -bottom-1 size-[15px] rounded-full bg-white text-[#16a34a]" />
                )}
              </span>
              {m.label}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

const SIDEBAR: ScreenKey[][] = [["dashboard"], ["campaign", "dept"], ["asset", "mobile"], ["execution", "pod", "verify"], ["reports", "external", "api"]];

function ToolScreen({ screen }: { screen: ScreenKey }) {
  const color = SCREEN_COLOR[screen] ?? "#1d4fc4";
  return (
    <div className="flex shrink-0 flex-col items-center">
      <div className="flex h-[124px] w-[184px] overflow-hidden rounded-t-lg border-[4px] border-[#0a1838] bg-white">
        <div className="flex w-[24px] shrink-0 flex-col items-center gap-[6px] bg-[#13265a] pt-2">
          <span className="mb-0.5 size-[7px] rounded-full bg-gold" />
          {SIDEBAR.map((keys, i) => {
            const on = keys.includes(screen);
            return (
              <motion.span
                key={i}
                className="h-[4px] rounded-full"
                animate={{ width: on ? 15 : 10, backgroundColor: on ? "#ffffff" : "rgba(255,255,255,0.4)" }}
                transition={{ duration: 0.3 }}
              />
            );
          })}
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-[#f4f7fd] p-1.5">
          <div className="mb-1 flex h-[14px] shrink-0 items-center justify-between">
            <AnimatePresence mode="wait">
              <motion.span
                key={screen}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.25 }}
                className="font-display truncate text-[11px] font-bold"
                style={{ color }}
              >
                {SCREEN_TITLE[screen]}
              </motion.span>
            </AnimatePresence>
            <span className="h-[6px] w-[26px] rounded-full bg-[#dbe4f0]" />
          </div>
          <div className="relative min-h-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="absolute inset-0"
              >
                <MiniScreen screen={screen} color={color} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <span className="h-[9px] w-[212px] rounded-b-lg bg-linear-to-b from-[#e2e8f0] to-[#94a3b8]" />
    </div>
  );
}

const TILE = "rounded-[4px] bg-white ring-1 ring-black/5";

function Bars({ values, color, accentLast }: { values: number[]; color: string; accentLast?: boolean }) {
  return (
    <>
      {values.map((h, i) => (
        <motion.span
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{ background: accentLast && i < values.length - 1 ? `${color}66` : color }}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: EASE }}
        />
      ))}
    </>
  );
}

function Checks({ rows, color, delay = 0.15 }: { rows: number; color: string; delay?: number }) {
  return (
    <div className="flex flex-col justify-around gap-[3px]">
      {Array.from({ length: rows }, (_, i) => (
        <motion.span
          key={i}
          className="flex items-center gap-1"
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + i * 0.18 }}
        >
          <CheckCircle weight="fill" className="size-[10px] shrink-0" style={{ color }} />
          <span className="h-[4px] flex-1 rounded-full bg-[#c9d8ee]" />
        </motion.span>
      ))}
    </div>
  );
}

function Flow({ from: From, to: To, color }: { from: CessIcon; to: CessIcon; color: string }) {
  return (
    <div className={cn(TILE, "flex items-center justify-between px-2 py-1")}>
      <span className="grid size-[24px] place-items-center rounded-md" style={{ background: `${color}1f`, color }}>
        <From weight="fill" className="size-[15px]" />
      </span>
      <span className="relative mx-1.5 h-[2px] flex-1 rounded-full" style={{ background: `${color}33` }}>
        {[0, 0.6].map((d) => (
          <motion.span
            key={d}
            className="absolute top-1/2 size-[6px] -translate-y-1/2 rounded-full"
            style={{ background: color }}
            animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, delay: d, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </span>
      <span className="grid size-[24px] place-items-center rounded-md bg-[#1d4fc4] text-white">
        <To weight="fill" className="size-[15px]" />
      </span>
    </div>
  );
}

function MiniScreen({ screen, color }: { screen: ScreenKey; color: string }) {
  switch (screen) {
    case "dashboard":
      return (
        <div className="flex h-full flex-col gap-1">
          <div className="grid grid-cols-3 gap-1">
            {[
              ["68", "#2563eb"],
              ["832", "#16a34a"],
              ["₹12.8Cr", "#ea580c"],
            ].map(([v, c]) => (
              <span key={v} className={cn(TILE, "px-1 py-[2px] text-center text-[10px] font-bold")} style={{ color: c }}>
                {v}
              </span>
            ))}
          </div>
          <div className="flex min-h-0 flex-1 gap-1">
            <div className={cn(TILE, "flex flex-1 items-end gap-[4px] p-1.5")}>
              <Bars values={[38, 58, 46, 78, 96]} color="#2563eb" />
            </div>
            <motion.span animate={{ rotate: [0, -8, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className={cn(TILE, "grid w-[40px] place-items-center")}>
              <Megaphone weight="fill" className="size-[22px] text-[#1d4fc4]" />
            </motion.span>
          </div>
        </div>
      );
    case "campaign":
      return (
        <div className="grid h-full grid-cols-[1.3fr_1fr] gap-1">
          <div className={cn(TILE, "grid grid-cols-7 content-center gap-[2px] p-1")}>
            {Array.from({ length: 21 }, (_, i) => (
              <motion.span
                key={i}
                className="aspect-square rounded-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, backgroundColor: [3, 4, 5, 10, 11, 16, 17].includes(i) ? color : "#e8eef7" }}
                transition={{ delay: i * 0.02 }}
              />
            ))}
          </div>
          <div className={cn(TILE, "flex flex-col justify-between p-1")}>
            <Checks rows={3} color={color} />
            <div className="h-[4px] overflow-hidden rounded-full bg-[#eef2f7]">
              <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: "64%" }} transition={{ delay: 0.5, duration: 0.8 }} />
            </div>
          </div>
        </div>
      );
    case "asset":
      return (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-1">
          {["#2563eb", "#7c3aed", "#ea580c", "#16a34a", "#0d9488", "#dc2626"].map((c, i) => (
            <motion.span
              key={c}
              className="relative grid place-items-center rounded-[4px]"
              style={{ background: `linear-gradient(135deg, ${c}, ${c}aa)` }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              {i % 2 ? <VideoCamera weight="fill" className="size-[13px] text-white" /> : <Image weight="fill" className="size-[13px] text-white" />}
              <MapPin weight="fill" className="absolute right-[2px] bottom-[2px] size-[8px] text-white/90" />
            </motion.span>
          ))}
        </div>
      );
    case "execution":
      return (
        <div className={cn(TILE, "flex h-full flex-col justify-around px-1.5")}>
          {[
            [86, "#16a34a"],
            [64, "#2563eb"],
            [42, "#ea580c"],
            [72, "#7c3aed"],
          ].map(([w, c], i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="size-[6px] shrink-0 rounded-full" style={{ background: c as string }} />
              <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-[#eef2f7]">
                <motion.span
                  className="block h-full rounded-full"
                  style={{ background: c as string }}
                  initial={{ width: 0 }}
                  animate={{ width: `${w}%` }}
                  transition={{ delay: 0.1 + i * 0.1, duration: 0.7, ease: EASE }}
                />
              </span>
            </span>
          ))}
        </div>
      );
    case "pod":
    case "verify":
      return (
        <div className="grid h-full grid-cols-[1.5fr_1fr] gap-1">
          <div className="relative overflow-hidden rounded-[4px] ring-1 ring-black/5">
            <img src={titleBg} alt="" className="size-full object-cover" draggable={false} />
            {screen === "verify" ? (
              <motion.span
                className="absolute inset-x-0 h-[3px]"
                style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                animate={{ top: ["4%", "92%", "4%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : (
              <motion.span
                className="absolute inset-[18%] rounded-[3px] border-2"
                style={{ borderColor: color }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            )}
            <MapPin weight="fill" className="absolute top-[6%] right-[6%] size-[12px] text-[#ef4444] drop-shadow" />
          </div>
          <div className={cn(TILE, "flex flex-col items-center justify-center gap-1 p-1")}>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 14 }}
              className="grid size-[26px] place-items-center rounded-full"
              style={{ background: `${color}1f`, color }}
            >
              {screen === "verify" ? <ShieldCheck weight="fill" className="size-[18px]" /> : <CheckCircle weight="fill" className="size-[18px]" />}
            </motion.span>
            <span className="h-[4px] w-full rounded-full bg-[#c9d8ee]" />
            <span className="h-[4px] w-2/3 rounded-full bg-[#dbe4f0]" />
          </div>
        </div>
      );
    case "reports":
      return (
        <div className="grid h-full grid-cols-[1.5fr_1fr] gap-1">
          <div className={cn(TILE, "flex items-end gap-[4px] p-1.5")}>
            <Bars values={[42, 68, 55, 80, 62, 92]} color={color} accentLast />
          </div>
          <div className={cn(TILE, "grid place-items-center")}>
            <svg viewBox="0 0 36 36" className="size-[44px] -rotate-90">
              <circle cx="18" cy="18" r="13" fill="none" stroke="#eef2f7" strokeWidth="6" />
              <motion.circle
                cx="18"
                cy="18"
                r="13"
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeDasharray="82"
                initial={{ strokeDashoffset: 82 }}
                animate={{ strokeDashoffset: 22 }}
                transition={{ duration: 0.9, delay: 0.2 }}
              />
            </svg>
          </div>
        </div>
      );
    case "mobile":
      return (
        <div className="flex h-full flex-col gap-1">
          <Flow from={DeviceMobile} to={ArrowsClockwise} color={color} />
          <div className={cn(TILE, "min-h-0 flex-1 p-1.5")}>
            <Checks rows={3} color="#16a34a" delay={0.3} />
          </div>
        </div>
      );
    case "dept":
      return (
        <div className="flex h-full flex-col gap-1">
          <Flow from={Bank} to={Megaphone} color={color} />
          <div className="grid min-h-0 flex-1 grid-cols-4 gap-1">
            {[ClipboardText, CurrencyInr, FolderSimple, UsersThree].map((I, i) => (
              <motion.span
                key={i}
                className={cn(TILE, "grid place-items-center")}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <I weight="duotone" className="size-[16px]" style={{ color }} />
              </motion.span>
            ))}
          </div>
        </div>
      );
    case "external":
      return (
        <div className="relative h-full overflow-hidden rounded-[4px] bg-[#e6f4f1] ring-1 ring-black/5">
          <svg viewBox="0 0 160 80" className="absolute inset-0 size-full" preserveAspectRatio="none">
            <path d="M0 52 C 30 40 50 62 80 48 S 130 30 160 40" fill="none" stroke="#b6dcd5" strokeWidth="6" />
            <path d="M40 0 V 80 M110 0 V 80" stroke="#cfe8e3" strokeWidth="3" />
          </svg>
          {[
            [24, 40],
            [52, 22],
            [70, 58],
          ].map(([l, t], i) => (
            <motion.span
              key={i}
              className="absolute"
              style={{ left: `${l}%`, top: `${t}%` }}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.4, delay: i * 0.3, repeat: Infinity }}
            >
              <MapPin weight="fill" className="size-[13px]" style={{ color }} />
            </motion.span>
          ))}
          <motion.span
            className="absolute top-[6%] right-[5%] flex items-center gap-1 rounded-md bg-white px-1.5 py-[2px] shadow"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: EASE }}
          >
            <EnvelopeSimple weight="fill" className="size-[11px]" style={{ color }} />
            <span className="h-[4px] w-[22px] rounded-full bg-[#c9d8ee]" />
          </motion.span>
        </div>
      );
    case "api":
      return (
        <div className="flex h-full flex-col justify-around rounded-[4px] bg-[#0f1d3d] px-1.5 font-mono text-[9px] leading-none">
          {[
            ["GET", "/campaigns", "200"],
            ["POST", "/evidence", "201"],
            ["GET", "/verify", "200"],
            ["PUT", "/sync", "200"],
          ].map(([m, path, code], i) => (
            <motion.span
              key={path}
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.2 }}
            >
              <span className="w-[24px] font-bold text-[#60a5fa]">{m}</span>
              <span className="flex-1 truncate text-white/85">{path}</span>
              <span className="font-bold text-[#4ade80]">{code}</span>
            </motion.span>
          ))}
        </div>
      );
  }
}

function Capabilities({ on, focus }: { on: boolean; focus: boolean }) {
  return (
    <motion.section
      initial={false}
      animate={{
        opacity: on ? 1 : 0.45,
        boxShadow: focus ? "0 0 0 2px #1d4fc4, 0 20px 36px -22px #1d4fc4" : "0 14px 28px -24px rgba(7,20,51,0.55)",
      }}
      transition={{ duration: 0.5 }}
      className="flex h-[158px] shrink-0 overflow-hidden rounded-xl border border-[#dbe4f0] bg-white/95"
    >
      <div className="font-display flex w-[150px] shrink-0 flex-col items-center justify-center gap-2 bg-linear-to-b from-[#0b1f4a] to-[#1d4fc4] text-center text-[18px] leading-tight font-bold text-white">
        <GearSix weight="duotone" className="size-[38px]" />
        Integration
        <br />
        Capabilities
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-[1fr_1.12fr_1.12fr_1.1fr]">
        {CAPABILITIES.map((c, i) => {
          const I = c.icon;
          return (
            <motion.div
              key={c.title}
              initial={false}
              animate={{ opacity: on ? 1 : 0.6, y: focus ? [8, 0] : 0 }}
              transition={{ delay: focus ? 0.1 + i * 0.1 : 0, duration: 0.4 }}
              className={cn("flex flex-col gap-1.5 px-4 py-2.5", i > 0 && "border-l border-[#d6dfeb]")}
            >
              <span className="font-display flex items-center gap-2 text-[16px] font-bold text-navy">
                <I weight="duotone" className="size-[28px] shrink-0 text-[#1d4fc4]" />
                {c.title}
              </span>
              <ul className="grid gap-1 leading-tight">
                {c.items.map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="mt-[6px] size-[5px] shrink-0 rounded-full bg-navy" />
                    {t}
                  </li>
                ))}
              </ul>
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
      animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.99 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex h-[60px] shrink-0 items-center gap-5 overflow-hidden rounded-2xl border border-[#7c3aed]/25 bg-[linear-gradient(90deg,#f5f3ff,#ffffff_60%,#f5f3ff)] pr-5 shadow-[0_14px_30px_-24px_rgba(7,20,51,0.7)]"
    >
      <span className="font-display flex h-full shrink-0 items-center gap-2.5 bg-linear-to-r from-[#5b21b6] to-[#7c3aed] pr-8 pl-4 text-[19px] font-bold text-white [clip-path:polygon(0_0,calc(100%-18px)_0,100%_50%,calc(100%-18px)_100%,0_100%)]">
        <LinkSimple weight="bold" className="size-[26px]" /> Expected Outcome
      </span>
      <span className="h-8 w-px shrink-0 bg-navy/25" />
      <p className="font-display flex-1 text-center text-[18px] leading-snug font-bold text-navy">
        A scalable and interoperable platform that can securely exchange information with DIPR systems and authorized external verification services.
      </p>
    </motion.div>
  );
}
