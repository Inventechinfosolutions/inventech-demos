import { motion } from "motion/react";
import { Fragment, useState } from "react";
import { FitBox } from "@/components/FitBox";
import {
  AndroidLogo,
  AppleLogo,
  ArrowsLeftRight,
  ChartBar,
  CheckSquare,
  ClipboardText,
  ClockCounterClockwise,
  CloudArrowUp,
  Database,
  Devices,
  GearSix,
  Handshake,
  HardDrives,
  Image,
  Key,
  Laptop,
  LinkSimple,
  Lock,
  MapPin,
  Megaphone,
  PlayCircle,
  Plugs,
  Pulse,
  ShieldCheck,
  Stack,
  Target,
  TreeStructure,
  UserGear,
  UsersThree,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Cell = { title: string; note?: string; icon: CessIcon | "api" };
type Layer = { name: string; sub: string; icon: CessIcon; color: string; from: string; stack: boolean; cells: Cell[] };

const LAYERS: Layer[] = [
  {
    name: "1. Presentation Layer",
    sub: "(User Access)",
    icon: Devices,
    color: "#1d4fc4",
    from: "#0b1f4a",
    stack: true,
    cells: [
      { title: "Web Application", note: "(Administration & Management)", icon: Laptop },
      { title: "Android Mobile App", note: "(Field Operations)", icon: AndroidLogo },
      { title: "iOS Mobile App / Progressive Web App", note: "(As Finalized)", icon: AppleLogo },
      { title: "Responsive User Interfaces", note: "(Desktop, Tablet, Mobile)", icon: Devices },
    ],
  },
  {
    name: "2. Application Layer",
    sub: "(Business Services)",
    icon: GearSix,
    color: "#6d28d9",
    from: "#3b1585",
    stack: true,
    cells: [
      { title: "Campaign Management", icon: Megaphone },
      { title: "Asset Inventory", icon: Stack },
      { title: "Proof-of-Display", icon: Image },
      { title: "Reporting & Analytics", icon: ChartBar },
      { title: "User & Access Management", icon: UsersThree },
      { title: "Agency & Execution Management", icon: Handshake },
      { title: "Notification & Workflow Services", icon: TreeStructure },
    ],
  },
  {
    name: "3. Integration Layer",
    sub: "(System Connectivity)",
    icon: Plugs,
    color: "#15803d",
    from: "#0f5f2e",
    stack: false,
    cells: [
      { title: "Secure REST APIs", icon: "api" },
      { title: "DIPR System Integrations", note: "(As Required)", icon: ArrowsLeftRight },
      { title: "Third-Party Verification Services", note: "(e.g., Image / Video / Location Verification)", icon: ShieldCheck },
      { title: "External Service Interfaces", note: "(e.g., Maps, SMS, Email – as required)", icon: ArrowsLeftRight },
    ],
  },
  {
    name: "4. Data Management Layer",
    sub: "(Data & Repositories)",
    icon: Database,
    color: "#b45309",
    from: "#7c3a06",
    stack: false,
    cells: [
      { title: "Campaign & Transaction Data", note: "(e.g., campaigns, activities, schedules, expenditure)", icon: Database },
      { title: "Advertising Asset Repository", note: "(approved creatives, media assets)", icon: Image },
      { title: "Evidence Photographs & Videos", note: "(PoD images, videos, supporting files)", icon: PlayCircle },
      { title: "GPS & Device Metadata", note: "(location, timestamp, device details)", icon: MapPin },
      { title: "Audit & Activity Records", note: "(user actions, approvals, verification outcomes)", icon: ClipboardText },
    ],
  },
  {
    name: "5. Security Layer",
    sub: "(Access & Control)",
    icon: ShieldCheck,
    color: "#2563eb",
    from: "#123a9c",
    stack: false,
    cells: [
      { title: "Role-Based Access Control", note: "(RBAC)", icon: UserGear },
      { title: "Authentication & Authorization", note: "(e.g., SSO, MFA – if required)", icon: Key },
      { title: "Data Encryption", note: "(in transit & at rest)", icon: Lock },
      { title: "API Security", note: "(secured and controlled access)", icon: ShieldCheck },
      { title: "Audit Logging", note: "(user and system activities)", icon: CheckSquare },
      { title: "Data Retention Controls", note: "(as per policy)", icon: ClockCounterClockwise },
    ],
  },
  {
    name: "6. Infrastructure Layer",
    sub: "(Hosting & Operations)",
    icon: CloudArrowUp,
    color: "#5b21b6",
    from: "#2e1065",
    stack: false,
    cells: [
      { title: "Application Hosting", note: "(Karnataka State Data Centre / MeitY-empanelled cloud, as finalized)", icon: HardDrives },
      { title: "Database & Media Storage", note: "(structured data, images, videos, documents)", icon: Database },
      { title: "Backup & Recovery", note: "(regular backups, restoration and DR)", icon: CloudArrowUp },
      { title: "Application Monitoring", note: "(availability, performance, alerts)", icon: Pulse },
      { title: "Deployment & Maintenance", note: "(releases, updates, patches and support)", icon: GearSix },
    ],
  },
];

/** One highlight per layer, in layer order. */
const HIGHLIGHTS: { title: string; text: string; icon: CessIcon }[] = [
  { title: "Multi-channel Access", text: "Web and mobile applications for different user groups.", icon: Devices },
  { title: "Comprehensive Business Services", text: "End-to-end campaign, execution, verification and reporting capabilities.", icon: Stack },
  { title: "Interoperable and Extensible", text: "Secure APIs for DIPR systems and third-party services.", icon: LinkSimple },
  { title: "Centralized Data Management", text: "Structured data with a repository for advertisement assets and field evidence.", icon: Database },
  { title: "Built-in Security", text: "Role-based access, encryption and audit trails for accountability.", icon: ShieldCheck },
  { title: "Reliable and Scalable", text: "Hosted at the State Data Centre or MeitY-empanelled cloud with backup, monitoring and maintainability.", icon: CloudArrowUp },
];

/**
 * Beats 0-5 build the six layers top to bottom (each lights its matching highlight), beat 6 expected outcome.
 */
export function ArchitectureScene({ beat }: { beat: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? (beat <= 5 ? beat : null);

  return (
    <FitBox w={1440} h={744}>
      <div className="flex size-full flex-col gap-3 text-[14px] text-ink">
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_292px] gap-3.5">
          <div className="flex min-h-0 flex-col">
            {LAYERS.map((l, i) => (
              <Fragment key={l.name}>
                {i > 0 && <FlowArrow on={beat >= i} />}
                <LayerRow layer={l} index={i} shown={beat >= i} focus={active === i} onHover={setHover} />
              </Fragment>
            ))}
          </div>
          <Highlights beat={beat} active={active} onHover={setHover} />
        </div>
        <Outcome shown={beat >= 6} />
      </div>
    </FitBox>
  );
}

function LayerRow({ layer, index, shown, focus, onHover }: { layer: Layer; index: number; shown: boolean; focus: boolean; onHover: (i: number | null) => void }) {
  const L = layer.icon;
  return (
    <motion.div
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      initial={false}
      animate={{ opacity: shown ? 1 : 0.28, x: shown ? 0 : -14 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="grid min-h-0 flex-1 grid-cols-[204px_minmax(0,1fr)] gap-2.5"
    >
      <motion.div
        animate={{ boxShadow: focus ? `0 0 0 3px ${layer.color}55, 0 16px 28px -18px ${layer.color}` : "0 10px 22px -20px rgba(7,20,51,0.7)" }}
        className="flex items-center gap-2.5 rounded-xl px-2.5 text-white"
        style={{ background: `linear-gradient(120deg, ${layer.from}, ${layer.color})` }}
      >
        <span className="grid size-[42px] shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/30">
          <L weight="duotone" className="size-[28px]" />
        </span>
        <span className="font-display text-[17px] leading-tight font-bold">
          {layer.name}
          <span className="mt-0.5 block text-[13.5px] font-medium text-white/85">{layer.sub}</span>
        </span>
      </motion.div>

      <motion.div
        animate={{
          borderColor: focus ? layer.color : "#d6e0ee",
          boxShadow: focus ? `0 16px 30px -22px ${layer.color}` : "0 10px 22px -22px rgba(7,20,51,0.6)",
        }}
        className="flex min-w-0 items-stretch rounded-xl border-[1.5px] bg-white/95 px-1"
        style={{ background: `linear-gradient(180deg, #ffffff, ${layer.color}0a)` }}
      >
        {layer.cells.map((c, j) => (
          <motion.div
            key={c.title}
            initial={false}
            animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 6 }}
            transition={{ delay: shown ? 0.12 + j * 0.06 : 0, duration: 0.35 }}
            className={cn(
              "my-1 flex min-w-0 flex-1 basis-0 flex-col justify-center px-2 leading-tight",
              layer.stack ? "items-center gap-1 text-center" : "gap-0.5",
              j > 0 && "border-l border-[#d6e0ee]",
            )}
          >
            {layer.stack ? (
              <>
                <CellIcon icon={c.icon} color={layer.color} big />
                <span className="font-semibold text-navy">{c.title}</span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 font-semibold text-navy">
                <CellIcon icon={c.icon} color={layer.color} big={false} />
                {c.title}
              </span>
            )}
            {c.note && <span className="text-[13px] leading-[1.15] text-ink/75">{c.note}</span>}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function CellIcon({ icon, color, big }: { icon: CessIcon | "api"; color: string; big: boolean }) {
  if (icon === "api") {
    return (
      <span className="grid h-[26px] shrink-0 place-items-center rounded-md border-2 px-1 text-[13px] font-extrabold tracking-wide" style={{ borderColor: color, color }}>
        API
      </span>
    );
  }
  const I = icon;
  return (
    <span className="grid shrink-0 place-items-center rounded-lg" style={{ color, background: big ? "transparent" : `${color}14`, width: big ? undefined : 28, height: big ? undefined : 28 }}>
      <I weight="duotone" className={big ? "size-[27px]" : "size-[19px]"} />
    </span>
  );
}

function FlowArrow({ on }: { on: boolean }) {
  return (
    <div className="relative grid h-[16px] shrink-0 grid-cols-[204px_minmax(0,1fr)] gap-2.5">
      <span />
      <motion.span initial={false} animate={{ opacity: on ? 1 : 0.25 }} className="relative mx-auto flex h-full w-[10px] flex-col items-center">
        <svg viewBox="0 0 10 16" className="h-full w-full overflow-visible">
          <path d="M5 1 V15 M1.5 4.5 L5 1 L8.5 4.5 M1.5 11.5 L5 15 L8.5 11.5" fill="none" stroke="#1d4fc4" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {on && (
          <motion.span
            className="absolute left-1/2 size-[5px] -translate-x-1/2 rounded-full bg-[#7c3aed]"
            animate={{ top: ["0%", "85%"], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.span>
    </div>
  );
}

function Highlights({ beat, active, onHover }: { beat: number; active: number | null; onHover: (i: number | null) => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex min-h-0 flex-col overflow-hidden rounded-xl border-[1.5px] border-[#c9d8ee] bg-white/95 shadow-[0_16px_30px_-24px_rgba(7,20,51,0.6)]"
    >
      <div className="font-display flex shrink-0 items-center gap-2.5 bg-linear-to-r from-navy to-[#1d4fc4] px-4 py-2.5 text-[20px] font-bold text-white">
        <GearSix weight="duotone" className="size-[28px]" />
        Key Highlights
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-2 py-1">
        {HIGHLIGHTS.map((h, i) => {
          const I = h.icon;
          const color = LAYERS[i].color;
          const on = active === i;
          const seen = beat >= i;
          return (
            <motion.div
              key={h.title}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              initial={false}
              animate={{ opacity: seen ? 1 : 0.4, backgroundColor: on ? `${color}12` : "rgba(255,255,255,0)", x: on ? 3 : 0 }}
              transition={{ duration: 0.35 }}
              className={cn("flex min-h-0 flex-1 items-center gap-3 rounded-lg px-2", i > 0 && "border-t border-[#e3e9f2]")}
            >
              <motion.span
                animate={{ scale: on ? 1.08 : 1 }}
                className="grid size-[42px] shrink-0 place-items-center rounded-xl"
                style={{ background: `${color}16`, color }}
              >
                <I weight="duotone" className="size-[28px]" />
              </motion.span>
              <span className="leading-tight">
                <span className="font-display block text-[15.5px] font-bold" style={{ color: on ? color : "#0b1f4a" }}>
                  {h.title}
                </span>
                <span className="mt-0.5 block text-[13.5px] text-ink/85">{h.text}</span>
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
      animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.99 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex h-[54px] shrink-0 items-center gap-5 overflow-hidden rounded-2xl border border-[#7c3aed]/25 bg-[linear-gradient(90deg,#f5f3ff,#ffffff_60%,#f5f3ff)] pr-5 shadow-[0_14px_30px_-24px_rgba(7,20,51,0.7)]"
    >
      <span className="font-display flex h-full shrink-0 items-center gap-2.5 bg-linear-to-r from-[#5b21b6] to-[#7c3aed] pr-8 pl-4 text-[19px] font-bold text-white [clip-path:polygon(0_0,calc(100%-18px)_0,100%_50%,calc(100%-18px)_100%,0_100%)]">
        <Target weight="duotone" className="size-[26px]" /> Expected Outcome
      </span>
      <span className="h-8 w-px shrink-0 bg-navy/25" />
      <p className="font-display flex-1 text-center text-[18px] leading-snug font-bold text-navy">
        A robust, secure and scalable platform to manage, monitor and report advertisement campaigns across media channels.
      </p>
    </motion.div>
  );
}
