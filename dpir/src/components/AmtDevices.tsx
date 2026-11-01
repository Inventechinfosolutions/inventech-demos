import { AnimatePresence, motion } from "motion/react";
import titleBg from "@/assets/title-bg.webp";
import {
  Camera,
  ChartBar,
  CheckCircle,
  Clock,
  CloudArrowUp,
  FilePdf,
  FileImage,
  FileVideo,
  Fingerprint,
  GpsFix,
  LockKey,
  MagnifyingGlass,
  MapPin,
  ShieldCheck,
  UploadSimple,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

export type CapKey = "campaign" | "asset" | "pod" | "report" | "security";

const EASE = [0.22, 1, 0.36, 1] as const;

const MENU: { label: string; cap: CapKey | null }[] = [
  { label: "Dashboard", cap: null },
  { label: "Campaigns", cap: "campaign" },
  { label: "Creatives", cap: "asset" },
  { label: "Media Planning", cap: "campaign" },
  { label: "Field Verification", cap: "pod" },
  { label: "Proof of Display", cap: "pod" },
  { label: "Expenditure", cap: "report" },
  { label: "Reports", cap: "report" },
  { label: "Users & Roles", cap: "security" },
];

const SCREEN_TITLE: Record<CapKey | "dashboard", string> = {
  dashboard: "Dashboard",
  campaign: "Campaigns",
  asset: "Creative Library",
  pod: "Proof of Display",
  report: "Reports & Analytics",
  security: "Users & Roles",
};

/** Laptop and phone mock of the Advertisement Monitoring Tool; the screen follows the focused capability. */
export function AmtDevices({ focus, color }: { focus: CapKey | null; color: string }) {
  const screen = focus ?? "dashboard";
  return (
    <div className="relative mx-auto aspect-[16/10.4] w-full max-w-[600px]">
      <div className="absolute inset-x-[4%] top-0 bottom-[7%] rounded-[14px] bg-[#1b2234] p-[1.6%] shadow-[0_30px_60px_-30px_rgba(7,20,51,0.8)]">
        <div className="flex h-full overflow-hidden rounded-[8px] bg-[#f4f7fb] text-[length:clamp(7px,0.95vh,9.5px)] text-ink">
          <aside className="flex w-[25%] shrink-0 flex-col gap-[2px] bg-navy-deep px-[3%] py-[3%] text-white/75">
            <span className="mb-[6%] flex items-center gap-1 font-display text-[1.25em] font-bold text-white">
              <span className="size-[1.1em] rounded-full bg-gold" />
              DIPR
            </span>
            {MENU.map((m) => {
              const on = m.cap === focus || (m.cap === null && focus === null);
              return (
                <span
                  key={m.label}
                  className={cn("truncate rounded px-[6%] py-[3%] transition-colors duration-300", on && "font-bold text-white")}
                  style={on ? { background: color } : undefined}
                >
                  {m.label}
                </span>
              );
            })}
          </aside>
          <div className="flex min-w-0 flex-1 flex-col p-[2.5%]">
            <div className="mb-[2%] flex items-center justify-between">
              <span className="font-display text-[1.35em] font-bold text-navy">{SCREEN_TITLE[screen]}</span>
              <span className="flex items-center gap-1 rounded-full bg-white px-2 py-[1px] text-muted-foreground ring-1 ring-black/5">
                <MagnifyingGlass className="size-[1.1em]" /> Search
              </span>
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
                  {screen === "dashboard" && <DashboardScreen />}
                  {screen === "campaign" && <CampaignScreen color={color} />}
                  {screen === "asset" && <AssetScreen color={color} />}
                  {screen === "pod" && <PodScreen color={color} />}
                  {screen === "report" && <ReportScreen color={color} />}
                  {screen === "security" && <SecurityScreen color={color} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-[3%] h-[4.5%] rounded-b-[18px] rounded-t-[4px] bg-linear-to-b from-[#cfd6e2] to-[#9aa5b8] shadow-[0_14px_24px_-12px_rgba(7,20,51,0.6)]" />
      <Phone focus={focus} color={color} />
    </div>
  );
}

function Kpi({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="rounded-md bg-white p-[6%] ring-1 ring-black/5">
      <div className="font-display text-[1.6em] leading-none font-bold" style={{ color: tone }}>
        {value}
      </div>
      <div className="mt-[3px] text-muted-foreground">{label}</div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="flex h-full flex-col gap-[3%]">
      <div className="grid grid-cols-4 gap-[2%]">
        <Kpi value="68" label="Active Campaigns" tone="#2563eb" />
        <Kpi value="1,245" label="Ad Releases" tone="#7c3aed" />
        <Kpi value="832" label="Verified Displays" tone="#16a34a" />
        <Kpi value="₹12.8 Cr" label="Total Spend" tone="#ea580c" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1.1fr_1fr] gap-[2%]">
        <div className="relative overflow-hidden rounded-md bg-white ring-1 ring-black/5">
          <svg viewBox="0 0 100 80" className="size-full">
            <path d="M30 6 L52 4 L66 14 L70 30 L62 44 L66 60 L52 76 L36 72 L28 56 L18 50 L22 32 L16 18 Z" fill="#dbe8f8" stroke="#9fbde6" strokeWidth="0.8" />
            {[
              [40, 20],
              [55, 30],
              [34, 42],
              [50, 52],
              [44, 64],
              [28, 30],
            ].map(([x, y], i) => (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="2.4"
                fill={["#2563eb", "#16a34a", "#ea580c", "#7c3aed"][i % 4]}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                animate={{ scale: [1, 1.45, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25 }}
              />
            ))}
          </svg>
        </div>
        <div className="flex flex-col gap-[4%] rounded-md bg-white p-[5%] ring-1 ring-black/5">
          <span className="font-bold text-navy">Recent activity</span>
          {["Ad release verified", "Creative approved", "Hoarding photo uploaded", "Campaign published"].map((a, i) => (
            <span key={a} className="flex items-center gap-1 truncate">
              <span className="size-[0.7em] shrink-0 rounded-full" style={{ background: ["#16a34a", "#2563eb", "#ea580c", "#7c3aed"][i] }} />
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignScreen({ color }: { color: string }) {
  const steps = ["Plan", "Approve", "Schedule", "Assign vendor", "Track budget"];
  return (
    <div className="grid h-full grid-cols-[1.25fr_1fr] gap-[3%]">
      <div className="grid grid-cols-7 content-start gap-[3px] rounded-md bg-white p-[4%] ring-1 ring-black/5">
        {Array.from({ length: 28 }, (_, i) => {
          const on = [3, 4, 5, 10, 11, 17, 18, 19, 24].includes(i);
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.012 }}
              className="grid aspect-square place-items-center rounded-[3px] text-[0.9em]"
              style={on ? { background: `${color}22`, color, fontWeight: 700 } : { background: "#f1f4f9" }}
            >
              {i + 1}
            </motion.span>
          );
        })}
      </div>
      <div className="flex flex-col justify-between rounded-md bg-white p-[5%] ring-1 ring-black/5">
        {steps.map((s, i) => (
          <motion.span
            key={s}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.12 }}
            className="flex items-center gap-1"
          >
            <CheckCircle weight="fill" className="size-[1.3em]" style={{ color }} />
            {s}
          </motion.span>
        ))}
        <div className="mt-1 h-[6px] overflow-hidden rounded-full bg-[#eef2f7]">
          <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: "64%" }} transition={{ duration: 1, delay: 0.6 }} />
        </div>
        <span className="text-muted-foreground">Budget used 64%</span>
      </div>
    </div>
  );
}

function AssetScreen({ color }: { color: string }) {
  const files = [
    { icon: FileImage, ext: "JPG", name: "Hoarding_KR-Puram", v: "v3", tone: "#2563eb" },
    { icon: FileVideo, ext: "MP4", name: "TV_Spot_30s", v: "v2", tone: "#7c3aed" },
    { icon: FilePdf, ext: "PDF", name: "Print_FullPage", v: "v4", tone: "#dc2626" },
    { icon: FileImage, ext: "JPG", name: "Bus_Shelter_A", v: "v1", tone: "#2563eb" },
    { icon: FileVideo, ext: "MP4", name: "Social_Reel", v: "v2", tone: "#7c3aed" },
    { icon: FilePdf, ext: "PDF", name: "Brochure_EN_KN", v: "v5", tone: "#dc2626" },
  ];
  return (
    <div className="grid h-full grid-cols-3 grid-rows-2 gap-[3%]">
      {files.map((f, i) => {
        const I = f.icon;
        return (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="flex flex-col justify-between rounded-md bg-white p-[7%] ring-1 ring-black/5"
          >
            <span className="flex items-center justify-between">
              <I weight="duotone" className="size-[2.2em]" style={{ color: f.tone }} />
              <span className="rounded px-1 font-bold text-white" style={{ background: color }}>
                {f.v}
              </span>
            </span>
            <span className="truncate font-bold text-navy">{f.name}</span>
            <span className="flex items-center gap-[2px] text-muted-foreground">
              <MapPin weight="fill" className="size-[1em]" style={{ color }} />
              Geo-tagged · {f.ext}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function PodScreen({ color }: { color: string }) {
  return (
    <div className="grid h-full grid-cols-[1.4fr_1fr] gap-[3%]">
      <div className="relative overflow-hidden rounded-md ring-1 ring-black/5">
        <img src={titleBg} alt="" className="size-full object-cover" />
        <motion.span
          className="absolute inset-[18%] rounded border-2"
          style={{ borderColor: color }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        <span className="absolute bottom-[4%] left-[4%] rounded bg-black/60 px-1 text-white">12.9762° N, 77.5929° E · 10:42 AM</span>
      </div>
      <div className="flex flex-col justify-between rounded-md bg-white p-[5%] ring-1 ring-black/5">
        {[
          [Camera, "Photo captured"],
          [GpsFix, "GPS matched to site"],
          [Clock, "Timestamp recorded"],
          [Fingerprint, "Device metadata"],
          [CheckCircle, "Verified"],
        ].map(([I, label], i) => {
          const Icon = I as typeof Camera;
          return (
            <motion.span key={label as string} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.15 }} className="flex items-center gap-1">
              <Icon weight="fill" className="size-[1.3em]" style={{ color }} />
              {label as string}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

function ReportScreen({ color }: { color: string }) {
  const bars = [42, 68, 55, 80, 62, 90];
  return (
    <div className="grid h-full grid-cols-[1.4fr_1fr] gap-[3%]">
      <div className="flex items-end gap-[6%] rounded-md bg-white px-[6%] pt-[6%] pb-[4%] ring-1 ring-black/5">
        {bars.map((h, i) => (
          <motion.span
            key={i}
            className="flex-1 rounded-t-[3px]"
            style={{ background: i === bars.length - 1 ? color : `${color}66` }}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-[4%]">
        <div className="grid flex-1 place-items-center rounded-md bg-white ring-1 ring-black/5">
          <svg viewBox="0 0 36 36" className="h-[80%]">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#eef2f7" strokeWidth="6" />
            <motion.circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeDasharray="88"
              initial={{ strokeDashoffset: 88 }}
              animate={{ strokeDashoffset: 22 }}
              transition={{ duration: 1 }}
              transform="rotate(-90 18 18)"
            />
          </svg>
        </div>
        <span className="flex items-center gap-1 rounded-md bg-white p-[6%] ring-1 ring-black/5">
          <ChartBar weight="fill" className="size-[1.3em]" style={{ color }} />
          Export PDF / CSV
        </span>
      </div>
    </div>
  );
}

function SecurityScreen({ color }: { color: string }) {
  const roles = [
    ["Commissioner", "Approve"],
    ["Deputy Director", "Plan & review"],
    ["Field Officer", "Capture PoD"],
    ["Vendor", "Upload proof"],
    ["Auditor", "Read only"],
  ];
  return (
    <div className="grid h-full grid-cols-[1.5fr_1fr] gap-[3%]">
      <div className="flex flex-col justify-between rounded-md bg-white p-[4%] ring-1 ring-black/5">
        {roles.map(([r, p], i) => (
          <motion.span key={r} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center justify-between gap-1">
            <span className="font-bold text-navy">{r}</span>
            <span className="text-muted-foreground">{p}</span>
            <span className="relative h-[1.2em] w-[2.2em] rounded-full" style={{ background: color }}>
              <span className="absolute top-[12%] right-[8%] size-[0.9em] rounded-full bg-white" />
            </span>
          </motion.span>
        ))}
      </div>
      <div className="grid place-items-center rounded-md bg-white ring-1 ring-black/5">
        <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }} className="grid size-[55%] place-items-center rounded-full" style={{ background: `${color}1f`, color }}>
          <ShieldCheck weight="fill" className="size-[60%]" />
        </motion.span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <LockKey weight="fill" className="size-[1.1em]" /> SSO · MFA · Audit
        </span>
      </div>
    </div>
  );
}

function Phone({ focus, color }: { focus: CapKey | null; color: string }) {
  const pod = focus === "pod";
  const actions = [
    { icon: Camera, label: "Capture Ad" },
    { icon: GpsFix, label: "Verify Location" },
    { icon: UploadSimple, label: "Upload Proof" },
    { icon: CloudArrowUp, label: "Sync Offline" },
  ];
  return (
    <motion.div
      animate={{ y: pod ? -10 : 0, scale: pod ? 1.06 : 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="absolute right-0 bottom-[5%] w-[23%] rounded-[16px] bg-[#1b2234] p-[1.2%] shadow-[0_24px_40px_-18px_rgba(7,20,51,0.85)]"
      style={pod ? { boxShadow: `0 0 0 3px ${color}, 0 24px 40px -18px rgba(7,20,51,0.85)` } : undefined}
    >
      <div className="flex aspect-[9/17] flex-col gap-[5%] rounded-[12px] bg-[#f4f7fb] p-[8%] text-[length:clamp(6.5px,0.85vh,8.5px)]">
        <span className="font-display text-[1.3em] font-bold text-navy">DIPR Field</span>
        {actions.map((a, i) => {
          const I = a.icon;
          return (
            <motion.span
              key={a.label}
              className="flex items-center gap-1 rounded-md bg-white px-[6%] py-[7%] font-semibold text-navy ring-1 ring-black/5"
              animate={pod ? { backgroundColor: ["#ffffff", `${color}26`, "#ffffff"] } : { backgroundColor: "#ffffff" }}
              transition={pod ? { duration: 1.2, delay: i * 0.3, repeat: Infinity, repeatDelay: 1.2 } : undefined}
            >
              <I weight="fill" className="size-[1.4em]" style={{ color: pod ? color : "#2563eb" }} />
              {a.label}
            </motion.span>
          );
        })}
      </div>
    </motion.div>
  );
}
