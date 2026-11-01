import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import digitalImg from "@/assets/ecosystem/digital.jpg";
import fieldImg from "@/assets/ecosystem/field.jpg";
import mobileImg from "@/assets/ecosystem/mobile.jpg";
import officialsImg from "@/assets/ecosystem/officials.jpg";
import outdoorImg from "@/assets/ecosystem/outdoor.jpg";
import printImg from "@/assets/ecosystem/print.jpg";
import vendorsImg from "@/assets/ecosystem/vendors.jpg";
import webImg from "@/assets/ecosystem/web.jpg";
import { FitBox } from "@/components/FitBox";
import {
  ArrowsClockwise,
  Camera,
  ChartBar,
  CloudArrowUp,
  Database,
  Eye,
  GearSix,
  Images,
  MapPin,
  Megaphone,
  Plugs,
  ShareNetwork,
  ShieldCheck,
  Stack,
  Television,
  UsersThree,
  WifiHigh,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Side = { img: string; title: string; sub?: string; desc?: string; tint: string; accent: string };

const PEOPLE: Side[] = [
  { img: officialsImg, title: "DIPR Officials", desc: "Administration, approvals, monitoring and reports.", tint: "#e8f0fd", accent: "#1d4fc4" },
  { img: vendorsImg, title: "Vendors", sub: "Execution partners", desc: "Campaign execution, asset deployment and updates.", tint: "#efeafd", accent: "#6d28d9" },
  { img: fieldImg, title: "Field Teams", sub: "Monitoring officers", desc: "Field verification, photo/video capture, GPS and evidence submission.", tint: "#e9f6ec", accent: "#16a34a" },
];

const CHANNELS: Side[] = [
  { img: printImg, title: "PRINT", sub: "Newspapers", tint: "#e8f0fd", accent: "#1d4fc4" },
  { img: digitalImg, title: "DIGITAL", sub: "Online media", tint: "#efeafd", accent: "#6d28d9" },
  { img: outdoorImg, title: "OUTDOOR", sub: "Hoardings & displays", tint: "#e9f6ec", accent: "#16a34a" },
];

const SERVICES: { label: string; icon: CessIcon }[] = [
  { label: "Campaign Management", icon: Megaphone },
  { label: "Asset Inventory", icon: Stack },
  { label: "Proof-of-Display", icon: Camera },
  { label: "Vendor & User Management", icon: UsersThree },
  { label: "Reporting & Analytics", icon: ChartBar },
  { label: "Security & Audit", icon: ShieldCheck },
];

const DATA: { label: string; sub: string; icon: CessIcon }[] = [
  { label: "Secure APIs", sub: "REST interfaces", icon: Plugs },
  { label: "Data Repository", sub: "Campaigns & metadata", icon: Database },
  { label: "Media Storage", sub: "Images & videos", icon: Images },
];

const EXTERNAL: { label: string; sub: string; icon: CessIcon }[] = [
  { label: "External Systems & Services", sub: "(Integration)", icon: ShareNetwork },
  { label: "DIPR Systems", sub: "(as required)", icon: Stack },
  { label: "Third-Party", sub: "Verification Services", icon: ShieldCheck },
  { label: "Other External", sub: "Services (as approved)", icon: CloudArrowUp },
];

const VALUES: { label: string; icon: CessIcon; color: string }[] = [
  { label: "Centralized Management", icon: GearSix, color: "#6d28d9" },
  { label: "Multi-Channel Execution", icon: Stack, color: "#1d4fc4" },
  { label: "Evidence-Based Verification", icon: ShieldCheck, color: "#16a34a" },
  { label: "Real-Time Visibility", icon: Eye, color: "#ea7a0b" },
  { label: "Data-Driven Decisions", icon: ChartBar, color: "#13265a" },
];

/** Main-row geometry in design pixels (1440 x 496). */
const MAIN_H = 496;
const SIDE_W = 330;
const CHANNEL_W = 320;
const GAP = 60;
const CARD_Y = [122, 270, 418];
const TARGET_Y = [138, 277, 400];

/**
 * Beats: 0 platform, 1 connected ecosystem, 2 web & mobile apps, 3 application services,
 * 4 integration & data, 5 advertising channels, 6 external systems, 7 value outcomes.
 */
export function EcosystemScene({ beat }: { beat: number }) {
  const [hover, setHover] = useState<string | null>(null);
  const on = (b: number) => beat >= b;
  const focus = (b: number) => beat === b;

  return (
    <FitBox w={1440} h={744}>
      <div className="flex size-full flex-col gap-2.5 text-[14px] text-ink">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex h-[62px] shrink-0 items-center gap-4 overflow-hidden rounded-xl border border-[#c9d8ee] bg-linear-to-r from-[#e8f0fd] via-white to-[#e8f0fd] pr-5"
        >
          <span className="flex h-full w-[76px] shrink-0 items-center justify-center rounded-r-full bg-linear-to-r from-navy to-[#1d4fc4] text-white">
            <motion.span animate={{ rotate: [0, -10, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <Megaphone weight="fill" className="size-[28px]" />
            </motion.span>
          </span>
          <p className="font-display text-[18px] leading-snug font-semibold text-navy">
            The Advertisement Monitoring Tool acts as a centralized platform connecting DIPR officials, advertising vendors, field personnel and
            external systems through web and mobile applications.
          </p>
        </motion.div>

        <div className="relative shrink-0" style={{ height: MAIN_H }}>
          <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox={`0 0 1440 ${MAIN_H}`}>
            <defs>
              {[...PEOPLE, ...CHANNELS].map((s) => (
                <marker key={s.title} id={`eco-arrow-${s.title}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" fill={s.accent} />
                </marker>
              ))}
            </defs>
            {PEOPLE.map((p, i) => {
              const x1 = SIDE_W + 2;
              const x2 = SIDE_W + GAP - 4;
              const d = `M ${x1} ${CARD_Y[i]} C ${x1 + 30} ${CARD_Y[i]} ${x2 - 30} ${TARGET_Y[i]} ${x2} ${TARGET_Y[i]}`;
              return <Wire key={p.title} d={d} color={p.accent} marker={`eco-arrow-${p.title}`} on={on(1)} fast={focus(1) || hover === p.title} />;
            })}
            {CHANNELS.map((c, i) => {
              const x1 = 1440 - CHANNEL_W - 2;
              const x2 = 1440 - CHANNEL_W - GAP + 4;
              const d = `M ${x1} ${CARD_Y[i]} C ${x1 - 30} ${CARD_Y[i]} ${x2 + 30} ${TARGET_Y[i]} ${x2} ${TARGET_Y[i]}`;
              return <Wire key={c.title} d={d} color={c.accent} marker={`eco-arrow-${c.title}`} on={on(5)} fast={focus(5) || hover === c.title} />;
            })}
          </svg>

          <SidePanel
            title="Connected Ecosystem"
            icon={UsersThree}
            items={PEOPLE}
            className="left-0"
            width={SIDE_W}
            on={on(1)}
            focus={focus(1)}
            hover={hover}
            onHover={setHover}
            renderText={(p) => (
              <>
                <span className="font-display block text-[19px] leading-tight font-bold text-navy">{p.title}</span>
                {p.sub && <span className="block text-[15px] leading-tight font-medium text-navy/85">{p.sub}</span>}
                <span className="mt-1.5 block rounded-md bg-white/85 px-2 py-1 text-[13px] leading-snug text-navy shadow-sm">{p.desc}</span>
              </>
            )}
          />

          <Platform beat={beat} />

          <SidePanel
            title="Advertising Channels"
            icon={Television}
            items={CHANNELS}
            className="right-0"
            width={CHANNEL_W}
            on={on(5)}
            focus={focus(5)}
            hover={hover}
            onHover={setHover}
            renderText={(c) => (
              <>
                <span className="font-display block text-[24px] leading-tight font-extrabold text-navy">{c.title}</span>
                <span className="block text-[16px] leading-tight font-medium text-navy/85">{c.sub}</span>
              </>
            )}
          />
        </div>

        <External on={on(6)} focus={focus(6)} />
        <Values on={on(7)} focus={focus(7)} />
      </div>
    </FitBox>
  );
}

function Wire({ d, color, marker, on, fast }: { d: string; color: string; marker: string; on: boolean; fast: boolean }) {
  return (
    <motion.g initial={false} animate={{ opacity: on ? 1 : 0.2 }} transition={{ duration: 0.4 }}>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.16} strokeWidth={8} />
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} markerEnd={`url(#${marker})`} />
      {on && (
        <>
          <motion.path
            d={d}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="2 10"
            animate={{ strokeDashoffset: [0, -24] }}
            transition={{ duration: fast ? 0.5 : 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle
            r={4}
            fill={color}
            stroke="#fff"
            strokeWidth={1.5}
            style={{ offsetPath: `path("${d}")` }}
            animate={{ offsetDistance: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: fast ? 1 : 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
      <circle cx={d.split(" ")[1]} cy={d.split(" ")[2]} r={5} fill="#fff" stroke={color} strokeWidth={2.5} />
    </motion.g>
  );
}

function PanelHeader({ title, icon: I }: { title: string; icon: CessIcon }) {
  return (
    <div className="font-display flex h-[44px] shrink-0 items-center gap-3 rounded-t-xl bg-linear-to-r from-navy to-[#1d4fc4] px-4 text-[17px] font-bold tracking-wide text-white uppercase">
      <I weight="fill" className="size-[24px]" />
      {title}
    </div>
  );
}

function SidePanel({
  title,
  icon,
  items,
  className,
  width,
  on,
  focus,
  hover,
  onHover,
  renderText,
}: {
  title: string;
  icon: CessIcon;
  items: Side[];
  className: string;
  width: number;
  on: boolean;
  focus: boolean;
  hover: string | null;
  onHover: (t: string | null) => void;
  renderText: (s: Side) => ReactNode;
}) {
  return (
    <motion.section
      initial={false}
      animate={{
        opacity: on ? 1 : 0.4,
        boxShadow: focus ? "0 0 0 2px #1d4fc4, 0 22px 40px -24px #1d4fc4" : "0 14px 28px -24px rgba(7,20,51,0.6)",
      }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn("absolute top-0 flex h-full flex-col rounded-xl border border-[#c9d8ee] bg-white/95", className)}
      style={{ width }}
    >
      <PanelHeader title={title} icon={icon} />
      <div className="grid flex-1 grid-rows-3 gap-2 p-2">
        {items.map((s, i) => {
          const hot = hover === s.title;
          return (
            <motion.div
              key={s.title}
              onMouseEnter={() => onHover(s.title)}
              onMouseLeave={() => onHover(null)}
              initial={false}
              animate={{
                x: focus ? [className === "left-0" ? -14 : 14, 0] : 0,
                y: hot ? -3 : 0,
                boxShadow: hot ? `0 0 0 2px ${s.accent}, 0 16px 28px -18px ${s.accent}` : "0 0 0 0 rgba(0,0,0,0)",
              }}
              transition={{ delay: focus ? i * 0.12 : 0, duration: 0.45, ease: EASE }}
              className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-2.5 overflow-hidden rounded-lg border px-2"
              style={{ background: s.tint, borderColor: `${s.accent}33` }}
            >
              <motion.img
                src={s.img}
                alt={s.title}
                draggable={false}
                className="block h-[104px] w-[112px] object-contain mix-blend-multiply"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.2 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="min-w-0">{renderText(s)}</div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

function Platform({ beat }: { beat: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{
        opacity: 1,
        scale: 1,
        boxShadow: beat === 0 ? "0 0 0 2.5px #1d4fc4, 0 26px 44px -24px #1d4fc4" : "0 18px 36px -26px rgba(7,20,51,0.7)",
      }}
      transition={{ duration: 0.55, ease: EASE }}
      className="absolute top-0 flex h-full flex-col overflow-hidden rounded-xl border-2 border-[#1d4fc4]/40 bg-linear-to-b from-[#eef4fd] to-white"
      style={{ left: SIDE_W + GAP, right: CHANNEL_W + GAP }}
    >
      <div className="flex h-[66px] shrink-0 flex-col items-center justify-center gap-1 bg-linear-to-r from-navy via-[#1d3f9c] to-navy text-white">
        <span className="font-display flex items-center gap-2.5 text-[22px] leading-none font-bold">
          <motion.span animate={{ rotate: [0, -10, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <Megaphone weight="fill" className="size-[26px]" />
          </motion.span>
          DIPR – Advertisement Monitoring Tool
        </span>
        <span className="rounded-full bg-white/95 px-4 py-[2px] text-[14px] font-semibold text-navy">Centralized Digital Platform</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-2.5">
        <div className="grid h-[128px] shrink-0 grid-cols-2 gap-2.5">
          <AppCard on={beat >= 2} focus={beat === 2} img={webImg} title="Web Application" desc="Administration · Campaigns · Approvals · Assets · Reports" />
          <AppCard
            on={beat >= 2}
            focus={beat === 2}
            img={mobileImg}
            title="Mobile Application"
            desc="Field Tasks · Photo/Video · GPS · Offline Capture · Sync"
            extra={
              <div className="flex flex-col gap-1.5 text-[#1d4fc4]">
                {[Camera, MapPin, WifiHigh, ArrowsClockwise].map((I, i) => (
                  <I key={i} weight="bold" className="size-[16px]" />
                ))}
              </div>
            }
          />
        </div>

        <Block on={beat >= 3} focus={beat === 3} title="Integrated Application Services" icon={GearSix} color="#6d28d9">
          <div className="grid h-full grid-cols-6 gap-2">
            {SERVICES.map((s, i) => {
              const I = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={false}
                  animate={{ y: beat === 3 ? [10, 0] : 0, opacity: 1 }}
                  transition={{ delay: beat === 3 ? 0.1 + i * 0.07 : 0, duration: 0.35 }}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-[#d6dfeb] bg-white px-1 text-center text-[13px] leading-tight font-semibold text-navy shadow-sm"
                >
                  <I weight="duotone" className="size-[28px] text-[#1d4fc4]" />
                  {s.label}
                </motion.div>
              );
            })}
          </div>
        </Block>

        <Block on={beat >= 4} focus={beat === 4} title="Integration & Data Management" icon={Database} color="#1d4fc4" short>
          <div className="grid h-full grid-cols-3 rounded-lg border border-[#d6dfeb] bg-white [&>*+*]:border-l [&>*+*]:border-[#d6dfeb]">
            {DATA.map((d, i) => {
              const I = d.icon;
              return (
                <motion.div
                  key={d.label}
                  initial={false}
                  animate={{ x: beat === 4 ? [10, 0] : 0 }}
                  transition={{ delay: beat === 4 ? 0.1 + i * 0.08 : 0, duration: 0.35 }}
                  className="flex items-center justify-center gap-3 px-2"
                >
                  <I weight="duotone" className="size-[30px] shrink-0 text-[#1d4fc4]" />
                  <span className="leading-tight">
                    <span className="block text-[15px] font-bold text-navy">{d.label}</span>
                    <span className="block text-[13px] text-navy/80">{d.sub}</span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        </Block>
      </div>
    </motion.section>
  );
}

function AppCard({ on, focus, img, title, desc, extra }: { on: boolean; focus: boolean; img: string; title: string; desc: string; extra?: ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: on ? 1 : 0.4,
        y: focus ? [8, 0] : 0,
        boxShadow: focus ? "0 0 0 2px #1d4fc4, 0 18px 30px -20px #1d4fc4" : "0 10px 20px -18px rgba(7,20,51,0.6)",
      }}
      transition={{ duration: 0.45, ease: EASE }}
      className="flex items-center gap-2.5 overflow-hidden rounded-lg border border-[#c9d8ee] bg-linear-to-br from-[#eaf1fd] to-white px-2.5"
    >
      <motion.img
        src={img}
        alt={title}
        draggable={false}
        className="block h-[108px] w-auto max-w-[120px] shrink-0 object-contain mix-blend-multiply"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {extra}
      <div className="min-w-0">
        <span className="font-display block text-[18px] leading-tight font-bold text-navy">{title}</span>
        <span className="mt-1 block text-[13px] leading-snug text-navy/85">{desc}</span>
      </div>
    </motion.div>
  );
}

function Block({
  on,
  focus,
  title,
  icon: I,
  color,
  short,
  children,
}: {
  on: boolean;
  focus: boolean;
  title: string;
  icon: CessIcon;
  color: string;
  short?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: on ? 1 : 0.4,
        boxShadow: focus ? `0 0 0 2px ${color}, 0 18px 30px -20px ${color}` : "0 0 0 0 rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn("flex flex-col overflow-hidden rounded-lg border bg-white/70", short ? "h-[100px] shrink-0" : "min-h-0 flex-1")}
      style={{ borderColor: `${color}44` }}
    >
      <div
        className="font-display relative flex h-[32px] shrink-0 items-center justify-center gap-2.5 overflow-hidden text-[16px] font-bold tracking-wide text-white uppercase"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}cc, ${color})` }}
      >
        <I weight="fill" className="size-[20px]" />
        {title}
        {focus && (
          <motion.span
            aria-hidden
            className="absolute inset-y-0 w-[80px] -skew-x-12 bg-linear-to-r from-transparent via-white/45 to-transparent"
            animate={{ left: ["-15%", "110%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <div className="min-h-0 flex-1 p-2">{children}</div>
    </motion.div>
  );
}

function External({ on, focus }: { on: boolean; focus: boolean }) {
  return (
    <div className="-mt-2.5 flex shrink-0 flex-col items-center" style={{ paddingLeft: SIDE_W + GAP - 180, paddingRight: CHANNEL_W + GAP - 180 }}>
      <svg className="h-[34px] w-[1030px] overflow-visible" viewBox="0 0 1030 34">
        <defs>
          <marker id="eco-ext-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#1d4fc4" />
          </marker>
        </defs>
        {[355, 515, 675].map((x) => (
          <motion.g key={x} initial={false} animate={{ opacity: on ? 1 : 0.25 }}>
            <line x1={x} y1={3} x2={x} y2={31} stroke="#1d4fc4" strokeWidth={2.5} markerStart="url(#eco-ext-arrow)" markerEnd="url(#eco-ext-arrow)" />
            {on && (
              <motion.line
                x1={x}
                y1={8}
                x2={x}
                y2={26}
                stroke="#fff"
                strokeWidth={1.5}
                strokeDasharray="2 5"
                animate={{ strokeDashoffset: [0, -14] }}
                transition={{ duration: focus ? 0.4 : 0.9, repeat: Infinity, ease: "linear" }}
              />
            )}
          </motion.g>
        ))}
      </svg>
      <motion.div
        initial={false}
        animate={{
          opacity: on ? 1 : 0.4,
          boxShadow: focus ? "0 0 0 2px #1d4fc4, 0 18px 30px -20px #1d4fc4" : "0 12px 24px -20px rgba(7,20,51,0.6)",
        }}
        transition={{ duration: 0.45 }}
        className="grid h-[54px] w-full grid-cols-4 rounded-xl border border-[#c9d8ee] bg-linear-to-r from-[#f2f6fd] via-white to-[#f2f6fd] [&>*+*]:border-l [&>*+*]:border-[#d6dfeb]"
      >
        {EXTERNAL.map((e, i) => {
          const I = e.icon;
          return (
            <motion.div
              key={e.label}
              initial={false}
              animate={{ y: focus ? [8, 0] : 0 }}
              transition={{ delay: focus ? 0.08 + i * 0.08 : 0, duration: 0.35 }}
              className="my-2 flex items-center justify-center gap-2.5 px-2"
            >
              <I weight="duotone" className="size-[28px] shrink-0 text-[#1d4fc4]" />
              <span className="leading-tight">
                <span className="block text-[14px] font-bold text-navy">{e.label}</span>
                <span className="block text-[13px] text-navy/80">{e.sub}</span>
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function Values({ on, focus }: { on: boolean; focus: boolean }) {
  return (
    <div className="flex h-[56px] shrink-0">
      {VALUES.map((v, i) => {
        const I = v.icon;
        const first = i === 0;
        const last = i === VALUES.length - 1;
        return (
          <motion.div
            key={v.label}
            initial={false}
            animate={{ opacity: on ? 1 : 0.4, x: focus ? [-12, 0] : 0 }}
            transition={{ delay: focus ? i * 0.1 : 0, duration: 0.4, ease: EASE }}
            className={cn("relative flex flex-1 items-center justify-center gap-3 overflow-hidden text-white", !first && "-ml-[18px]")}
            style={{
              background: `linear-gradient(90deg, ${v.color}, ${v.color}d9)`,
              clipPath: last
                ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 18px 50%)"
                : first
                  ? "polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%)"
                  : "polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 18px 50%)",
              borderRadius: first ? "14px 0 0 14px" : last ? "0 14px 14px 0" : undefined,
            }}
          >
            <span className="grid size-[36px] shrink-0 place-items-center rounded-full border-2 border-white/80">
              <I weight="bold" className="size-[20px]" />
            </span>
            <span className="font-display text-[18px] leading-tight font-bold">{v.label}</span>
            {focus && (
              <motion.span
                aria-hidden
                className="absolute inset-y-0 w-[70px] -skew-x-12 bg-linear-to-r from-transparent via-white/35 to-transparent"
                animate={{ left: ["-20%", "120%"] }}
                transition={{ delay: 0.3 + i * 0.1, duration: 1.4, repeat: Infinity, repeatDelay: 0.8 }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
