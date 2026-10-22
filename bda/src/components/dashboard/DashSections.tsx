import {
  ArrowRight,
  ArrowUpRight,
  Bank,
  Bell,
  Buildings,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  Factory,
  FilePdf,
  FileText,
  Gear,
  HouseLine,
  Lightbulb,
  LinkSimple,
  MapTrifold,
  Megaphone,
  Phone,
  Storefront,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { QUICK as CIVIC_QUICK, INITIATIVE_ORDER, INITIATIVE_STYLE, LINKS as CIVIC_LINKS } from "@/components/civic/CivicSections";
import { EASE } from "@/components/home/shared";
import { UPDATES, UPDATE_TABS, type UpdateTab } from "@/components/portal/PortalUpdates";
import { HIGHLIGHTS, ORG, SERVICES } from "@/lib/content";
import { INITIATIVES, type AreaKey } from "@/lib/ia";
import { useLang, type Text } from "@/lib/i18n";
import { PHOTOS } from "@/lib/photos";
import { usePrefs } from "@/lib/prefs";
import { asset, cn, dateParts, external } from "@/lib/utils";
import { areaLabel, areaOf } from "./DashShell";
import { DrawPath, IconPop, ITEM, ITEM_X, LIFT, RiseLines, Sheen, stagger, Underline } from "./motion";

const t2 = (en: string, kn: string): Text => ({ en, kn });
const svc = (icon: (typeof SERVICES)[number]["icon"]) => SERVICES.find((s) => s.icon === icon)!.href;
const hl = (key: (typeof HIGHLIGHTS)[number]["key"]) => HIGHLIGHTS.find((h) => h.key === key)!;
const highlight = (key: (typeof HIGHLIGHTS)[number]["key"]) => hl(key).href;

const VIEW_ALL = t2("View All", "ಎಲ್ಲಾ ನೋಡಿ");
export const CARD = "rounded-[22px] border border-white bg-white/95 shadow-[0_22px_50px_-30px_rgba(15,31,61,0.45)] transition-colors duration-500";
const ROUND_BTN =
  "grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white text-navy shadow-[0_8px_18px_-10px_rgba(15,31,61,0.4)] transition-colors duration-300 hover:border-brand hover:bg-brand hover:text-white disabled:opacity-40";

const MORE =
  "group ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-brand transition-colors duration-300 hover:bg-brand hover:text-white";

function Panel({
  icon: I,
  title,
  sub,
  href,
  to,
  more = VIEW_ALL,
  children,
  className,
  delay = 0,
  extra,
}: {
  icon: Icon;
  title: Text;
  sub?: Text;
  href?: string;
  to?: string;
  more?: Text;
  children: ReactNode;
  className?: string;
  delay?: number;
  extra?: ReactNode;
}) {
  const { t } = useLang();
  const moreBody = (
    <>
      {t(more)}
      <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
    </>
  );
  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={cn(CARD, "flex flex-col p-5", className)}
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconPop className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand transition-colors duration-500">
            <I size={22} weight="duotone" />
          </IconPop>
          <div className="min-w-0">
            <h2 className="font-display text-[17px] font-semibold leading-tight text-navy">{t(title)}</h2>
            {sub ? <p className="text-[12px] text-muted">{t(sub)}</p> : <Underline />}
          </div>
        </div>
        {extra}
        {to ? (
          <Link to={to} className={MORE}>
            {moreBody}
          </Link>
        ) : (
          href && (
            <a href={href} {...external(href)} className={MORE}>
              {moreBody}
            </a>
          )
        )}
      </div>
      {children}
    </motion.section>
  );
}

/* ---------- Hero ---------- */

const HERO = {
  eyebrow: t2("Planned Today", "ಇಂದೇ ಯೋಜನೆ"),
  pre: t2("A Greater", "ಮುಂದಿನ ಪೀಳಿಗೆಗಳಿಗಾಗಿ"),
  accent: t2("Bengaluru", "ಬೃಹತ್ ಬೆಂಗಳೂರು"),
  post: t2("for Generations", ""),
  body: t2(
    "Planned layouts. Sustainable development. Vibrant communities. A global city for tomorrow.",
    "ಯೋಜಿತ ಬಡಾವಣೆಗಳು. ಸುಸ್ಥಿರ ಅಭಿವೃದ್ಧಿ. ಚೈತನ್ಯಶೀಲ ಸಮುದಾಯಗಳು. ನಾಳೆಗಾಗಿ ಜಾಗತಿಕ ನಗರ.",
  ),
  cta: t2("Explore BDA Services", "ಬಿಡಿಎ ಸೇವೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ"),
  core: [t2("Explore", "ಅನ್ವೇಷಿಸಿ"), t2("BDA", "ಬಿಡಿಎ"), t2("Services", "ಸೇವೆಗಳು")],
  credit: t2("Photo: Varthur skyline by SlowPhoton, CC BY-SA 4.0", "ಛಾಯಾಚಿತ್ರ: ವರ್ತೂರು, SlowPhoton, CC BY-SA 4.0"),
};

const PETALS: { key: AreaKey; icon: Icon; color: string; angle: number }[] = [
  { key: "services", icon: Gear, color: "text-sky-600", angle: 180 },
  { key: "planning", icon: ChartLineUp, color: "text-emerald-600", angle: 225 },
  { key: "property", icon: Buildings, color: "text-blue-600", angle: 270 },
  { key: "departments", icon: UsersThree, color: "text-orange-500", angle: 315 },
  { key: "information", icon: FileText, color: "text-indigo-600", angle: 360 },
  { key: "news", icon: Megaphone, color: "text-purple-600", angle: 405 },
];

const CX = 260;
const CY = 226;
const R1 = 98;
const R2 = 212;
const HALF = 22.5;
const GAP = 11;

const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
};

const SWAY = "animate-sway group-hover/hub:[animation-play-state:paused] motion-reduce:animate-none";
const SWAY_BACK = "animate-sway-reverse group-hover/hub:[animation-play-state:paused] motion-reduce:animate-none";

function petalPath(angle: number) {
  const di = (Math.asin(GAP / R1) * 180) / Math.PI;
  const dO = (Math.asin(GAP / R2) * 180) / Math.PI;
  const [x1, y1] = polar(R2, angle - HALF + dO);
  const [x2, y2] = polar(R2, angle + HALF - dO);
  const [x3, y3] = polar(R1, angle + HALF - di);
  const [x4, y4] = polar(R1, angle - HALF + di);
  const f = (n: number) => n.toFixed(1);
  return `M${f(x1)} ${f(y1)}A${R2} ${R2} 0 0 1 ${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}A${R1} ${R1} 0 0 0 ${f(x4)} ${f(y4)}Z`;
}

function PetalHub() {
  const { t } = useLang();
  const services = areaOf("services");
  return (
    <svg viewBox="0 0 520 450" className="group/hub w-full max-w-[460px] overflow-visible lg:max-w-[560px]" role="group" aria-label={t(HERO.cta)}>
      <defs>
        <filter id="petal-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f1f3d" floodOpacity="0.18" />
        </filter>
      </defs>
      <g className={SWAY} style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }}>
      {PETALS.map((p, i) => {
        const a = areaOf(p.key);
        const [lx, ly] = polar((R1 + R2) / 2 + 4, p.angle);
        const [dx, dy] = polar(8, p.angle);
        const I = p.icon;
        return (
          <motion.a
            key={p.key}
            href={a.href}
            {...external(a.href)}
            className="group outline-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ x: dx - CX, y: dy - CY, transition: { duration: 0.25 } }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.35 + i * 0.08 }}
            style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }}
          >
            <path
              d={petalPath(p.angle)}
              filter="url(#petal-shadow)"
              strokeWidth="18"
              strokeLinejoin="round"
              className="fill-white stroke-white transition-colors duration-300 group-hover:fill-brand group-hover:stroke-brand group-focus-visible:fill-brand group-focus-visible:stroke-brand"
            />
            <g className={SWAY_BACK} style={{ transformOrigin: `${lx}px ${ly}px`, transformBox: "view-box" }}>
              <foreignObject x={lx - 62} y={ly - 44} width="124" height="88" className="pointer-events-none">
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
                  <I size={34} weight="duotone" className={cn("transition-colors duration-300 group-hover:text-white", p.color)} />
                  <span className="text-[13px] font-semibold leading-tight text-navy transition-colors duration-300 group-hover:text-white">{t(areaLabel(p.key))}</span>
                </div>
              </foreignObject>
            </g>
          </motion.a>
        );
      })}
      </g>
      <circle cx={CX} cy={CY} r="84" className="fill-brand/15 animate-ping-soft" style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }} />
      <motion.a
        href={services.href}
        {...external(services.href)}
        className="group outline-none"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05, transition: { duration: 0.25 } }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
        style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }}
      >
        <circle cx={CX} cy={CY} r="80" filter="url(#petal-shadow)" className="fill-white" />
        <circle cx={CX} cy={CY} r="72" fill="none" strokeWidth="2" strokeDasharray="3 5" className="stroke-brand/40 animate-spin-slow" style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }} />
        <circle cx={CX} cy={CY} r="64" className="fill-brand-soft/60 transition-colors duration-300 group-hover:fill-brand" />
        <foreignObject x={CX - 64} y={CY - 64} width="128" height="128" className="pointer-events-none">
          <div className="flex h-full flex-col items-center justify-center text-center leading-none text-navy transition-colors duration-300 group-hover:text-white">
            <Bank size={30} weight="duotone" className="text-brand transition-colors group-hover:text-white" />
            <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] [&:lang(kn)]:tracking-normal">{t(HERO.core[0])}</span>
            <span className="mt-1 font-display text-[28px] font-bold">{t(HERO.core[1])}</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] [&:lang(kn)]:tracking-normal">{t(HERO.core[2])}</span>
          </div>
        </foreignObject>
      </motion.a>
    </svg>
  );
}

function HubGrid() {
  const { t } = useLang();
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {PETALS.map((p, i) => {
        const a = areaOf(p.key);
        const I = p.icon;
        return (
          <motion.a
            key={p.key}
            href={a.href}
            {...external(a.href)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.3 + i * 0.06 }}
            className="group flex flex-col items-center gap-1.5 rounded-2xl bg-white/95 px-1.5 py-3 text-center shadow-[0_14px_28px_-18px_rgba(15,31,61,0.6)] transition-colors duration-300 hover:bg-brand"
          >
            <I size={28} weight="duotone" className={cn("transition-colors group-hover:text-white", p.color)} />
            <span className="text-[11.5px] font-semibold leading-tight text-navy group-hover:text-white">{t(areaLabel(p.key))}</span>
          </motion.a>
        );
      })}
    </div>
  );
}

export function DashHero() {
  const { t } = useLang();
  const services = areaOf("services");
  return (
    <section className="relative grid items-center gap-6 px-4 pb-2 pt-4 md:px-7 lg:min-h-[470px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-2">
      <div className="max-w-xl">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, letterSpacing: "0.32em" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="text-[12px] font-bold uppercase text-navy/70 [&:lang(kn)]:!tracking-normal"
        >
          {t(HERO.eyebrow)}
        </motion.p>
        <h1 className="mt-3 font-display text-[38px] font-bold leading-[1.05] text-navy transition-colors duration-500 sm:text-[52px] xl:text-[60px]">
          <RiseLines
            delay={0.15}
            lines={[
              { text: t(HERO.pre) },
              { text: t(HERO.accent), className: "text-brand transition-colors duration-500" },
              ...(t(HERO.post) ? [{ text: t(HERO.post) }] : []),
            ]}
          />
        </h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.55 }} className="mt-4 max-w-sm text-[15px] font-medium leading-relaxed text-ink/80">
          {t(HERO.body)}
        </motion.p>
        <motion.a
          href={services.href}
          {...external(services.href)}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.7 }}
          className="group relative mt-6 inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-navy py-3 pl-6 pr-3 text-[14px] font-semibold text-white shadow-[0_16px_30px_-14px_rgba(0,0,0,0.55)] transition-colors duration-300 hover:bg-brand"
        >
          <Sheen />
          {t(HERO.cta)}
          <span className="grid size-7 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-1">
            <ArrowRight weight="bold" size={15} />
          </span>
        </motion.a>
      </div>
      <div className="hidden justify-center md:flex lg:justify-end lg:pr-2">
        <PetalHub />
      </div>
      <div className="md:hidden">
        <HubGrid />
      </div>
      <a
        href="https://commons.wikimedia.org/wiki/File:Skyline_of_Varthur,_Bangalore.jpg"
        {...external("https://commons.wikimedia.org/")}
        className="absolute bottom-0 right-4 hidden rounded-full bg-black/25 px-2 py-0.5 text-[9.5px] text-white/85 backdrop-blur transition-colors hover:bg-brand md:right-7 lg:block"
      >
        {t(HERO.credit)}
      </a>
    </section>
  );
}

/* ---------- Quick services ---------- */

const QUICK_COLORS = ["text-blue-600", "text-emerald-600", "text-orange-500", "text-purple-600", "text-teal-600", "text-rose-500", "text-indigo-600"];

const QUICK: { icon: Icon; label: Text; href: string; color: string; sub?: string }[] = [
  ...CIVIC_QUICK.map((q, i) => ({ ...q, color: QUICK_COLORS[i % QUICK_COLORS.length] })),
  { icon: Phone, label: hl("helpline").title, href: hl("helpline").href, color: "text-rose-600", sub: ORG.helpline },
];

const NO_MATCH = t2("No matching services. Try another word.", "ಯಾವುದೇ ಸೇವೆ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಪದ ಪ್ರಯತ್ನಿಸಿ.");
const PREV = t2("Previous", "ಹಿಂದಿನ");
const NEXT = t2("Next", "ಮುಂದಿನ");

function useScroller() {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return { ref, edge, update, by };
}

const MARQUEE_SPEED = 38;

export function ServiceStrip() {
  const { t } = useLang();
  const { query } = usePrefs();
  const reduce = useReducedMotion();
  const q = query.trim().toLowerCase();
  const items = q ? QUICK.filter((s) => s.label.en.toLowerCase().includes(q) || s.label.kn.includes(q)) : QUICK;
  const loop = !q && !reduce;
  const { ref, edge, update, by } = useScroller();
  const [paused, setPaused] = useState(false);
  useEffect(update, [q]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !loop) return;
    let pos = el.scrollLeft;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64) / 1000;
      last = now;
      const half = el.scrollWidth / 2;
      if (paused || Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft;
      if (!paused) {
        pos += MARQUEE_SPEED * dt;
        if (pos >= half) pos -= half;
        el.scrollLeft = pos;
      } else if (pos >= half) {
        el.scrollLeft = pos - half;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [loop, paused, ref]);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (loop && el && dir === -1 && el.scrollLeft < el.clientWidth) el.scrollLeft += el.scrollWidth / 2;
    by(dir);
  };
  const list = loop ? [...items, ...items] : items;

  return (
    <section
      id="services"
      className="flex scroll-mt-28 items-center gap-3 px-4 md:px-7"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => window.setTimeout(() => setPaused(false), 2500)}
    >
      <button type="button" onClick={() => nudge(-1)} disabled={!loop && edge.start} aria-label={t(PREV)} className={cn(ROUND_BTN, "hidden sm:grid")}>
        <CaretLeft size={16} weight="bold" />
      </button>
      <div
        ref={ref}
        onScroll={update}
        className={cn(
          "-my-4 flex min-w-0 flex-1 gap-3 overflow-x-auto px-1 py-4 [scrollbar-width:none]",
          loop ? "[mask-image:linear-gradient(to_right,transparent,#000_3%,#000_97%,transparent)]" : "snap-x",
        )}
      >
        {items.length === 0 && <p className={cn(CARD, "w-full px-5 py-4 text-[13px] text-muted")}>{t(NO_MATCH)}</p>}
        {list.map((s, i) => {
          const I = s.icon;
          const copy = i >= items.length;
          return (
            <motion.a
              key={`${s.label.en}-${copy ? "b" : "a"}`}
              href={s.href}
              {...external(s.href)}
              aria-hidden={copy || undefined}
              tabIndex={copy ? -1 : undefined}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE, delay: 0.5 + Math.min(i, 7) * 0.05 }}
              className={cn(
                "group flex min-w-[148px] flex-col items-center justify-center gap-2 rounded-2xl border border-white bg-white/95 px-3 py-4 text-center shadow-[0_16px_34px_-22px_rgba(15,31,61,0.55)] transition-[background-color,transform] duration-300 hover:-translate-y-1 hover:bg-brand",
                loop ? "shrink-0" : "flex-1 snap-start",
              )}
            >
              <I size={34} weight="duotone" className={cn("transition-[color,transform] duration-300 group-hover:scale-110 group-hover:text-white", s.color)} />
              <span className="text-[12.5px] font-semibold leading-tight text-navy transition-colors group-hover:text-white">{t(s.label)}</span>
              {s.sub && <span className="-mt-1 text-[11.5px] font-bold text-rose-600 group-hover:text-white">{s.sub}</span>}
            </motion.a>
          );
        })}
      </div>
      <button type="button" onClick={() => nudge(1)} disabled={!loop && edge.end} aria-label={t(NEXT)} className={cn(ROUND_BTN, "hidden sm:grid")}>
        <CaretRight size={16} weight="bold" />
      </button>
    </section>
  );
}

/* ---------- Explore Bengaluru ---------- */

type LayoutKind = "residential" | "commercial" | "industrial" | "casite" | "formed";

export type { LayoutKind };

export const LAYOUTS: { key: LayoutKind; icon: Icon; label: Text; blurb: Text; cta: Text; href: string; photo: string; pin: string; dot: string; pins: [number, number][] }[] = [
  {
    key: "residential",
    icon: HouseLine,
    label: t2("Residential Layouts", "ವಸತಿ ಬಡಾವಣೆಗಳು"),
    blurb: t2("Well planned residential communities across Bengaluru.", "ಬೆಂಗಳೂರಿನಾದ್ಯಂತ ಸುಯೋಜಿತ ವಸತಿ ಸಮುದಾಯಗಳು."),
    cta: t2("Explore Layouts", "ಬಡಾವಣೆಗಳನ್ನು ನೋಡಿ"),
    href: svc("layouts"),
    photo: PHOTOS.flats,
    pin: "#2563eb",
    dot: "bg-blue-600",
    pins: [[30, 30], [66, 26], [44, 64]],
  },
  {
    key: "commercial",
    icon: Storefront,
    label: t2("Commercial Sites", "ವಾಣಿಜ್ಯ ನಿವೇಶನಗಳು"),
    blurb: t2("Commercial plots offered through transparent e-auction.", "ಪಾರದರ್ಶಕ ಇ-ಹರಾಜಿನ ಮೂಲಕ ವಾಣಿಜ್ಯ ನಿವೇಶನಗಳು."),
    cta: t2("View E-Auction", "ಇ-ಹರಾಜು ನೋಡಿ"),
    href: svc("auction"),
    photo: PHOTOS.headOffice,
    pin: "#f97316",
    dot: "bg-orange-500",
    pins: [[54, 44], [36, 50]],
  },
  {
    key: "industrial",
    icon: Factory,
    label: t2("Industrial Sites", "ಕೈಗಾರಿಕಾ ನಿವೇಶನಗಳು"),
    blurb: t2("Sites along the upcoming Bengaluru Business Corridor.", "ಬೆಂಗಳೂರು ಬಿಸಿನೆಸ್ ಕಾರಿಡಾರ್ ಉದ್ದಕ್ಕೂ ನಿವೇಶನಗಳು."),
    cta: t2("See the Corridor", "ಕಾರಿಡಾರ್ ನೋಡಿ"),
    href: svc("corridor"),
    photo: PHOTOS.skyline,
    pin: "#9333ea",
    dot: "bg-purple-600",
    pins: [[18, 50], [82, 52]],
  },
  {
    key: "casite",
    icon: Bank,
    label: t2("CA Sites", "ಸಿಎ ನಿವೇಶನಗಳು"),
    blurb: t2("Civic amenity sites reserved for public purposes.", "ಸಾರ್ವಜನಿಕ ಉದ್ದೇಶಗಳಿಗೆ ಮೀಸಲಾದ ನಾಗರಿಕ ಸೌಲಭ್ಯ ನಿವೇಶನಗಳು."),
    cta: t2("View CA Sites", "ಸಿಎ ನಿವೇಶನಗಳು"),
    href: svc("casite"),
    photo: PHOTOS.layoutBoard,
    pin: "#16a34a",
    dot: "bg-green-600",
    pins: [[60, 70], [26, 74]],
  },
  {
    key: "formed",
    icon: MapTrifold,
    label: t2("BDA Formed Layouts", "ಬಿಡಿಎ ರಚಿಸಿದ ಬಡಾವಣೆಗಳು"),
    blurb: t2("Layouts developed and handed over by BDA.", "ಬಿಡಿಎ ಅಭಿವೃದ್ಧಿಪಡಿಸಿ ಹಸ್ತಾಂತರಿಸಿದ ಬಡಾವಣೆಗಳು."),
    cta: t2("Explore Layouts", "ಬಡಾವಣೆಗಳನ್ನು ನೋಡಿ"),
    href: svc("formed"),
    photo: PHOTOS.layoutSigns,
    pin: "#db2777",
    dot: "bg-pink-600",
    pins: [[76, 36], [56, 18], [80, 72]],
  },
];

const EXPLORE = {
  title: t2("Explore Bengaluru", "ಬೆಂಗಳೂರು ಅನ್ವೇಷಿಸಿ"),
  sub: t2("Find plots, sites and layouts across the city.", "ನಗರದಾದ್ಯಂತ ನಿವೇಶನ ಮತ್ತು ಬಡಾವಣೆಗಳನ್ನು ಹುಡುಕಿ."),
  city: t2("Bengaluru", "ಬೆಂಗಳೂರು"),
};

const ROADS = ["M0 150C70 140 120 128 160 132s110-22 160-40", "M150 0c4 50 6 90 10 132s-10 90-6 128", "M24 24l136 108 140 116", "M300 18L160 132 30 250"];

function CityMap() {
  return (
    <svg viewBox="0 0 320 260" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
      <rect width="320" height="260" fill="#eef3f6" />
      <path d="M58 40C96 10 170 8 224 26c50 16 84 60 80 112-4 56-46 98-108 110-62 12-128-6-162-52C4 150 14 74 58 40z" fill="#fbfcfd" stroke="#dbe5ec" strokeWidth="2" />
      <path d="M40 60c14-6 30-2 36 8s-6 22-22 22-26-22-14-30z" fill="#bcdcf5" />
      <path d="M228 170c18-6 40 2 42 18s-20 26-38 20-22-32-4-38z" fill="#bcdcf5" />
      <path d="M200 46c10-4 24 0 24 10s-14 14-24 10-10-16 0-20z" fill="#bcdcf5" />
      <path d="M96 196c8-4 20-2 22 6s-10 14-20 12-10-14-2-18z" fill="#bcdcf5" />
      <path d="M130 110c10-10 30-8 36 4s-6 24-22 24-22-18-14-28z" fill="#cdebd3" />
      <path d="M262 84c10-4 22 2 22 12s-14 16-24 10-8-18 2-22z" fill="#cdebd3" />
      <path d="M30 150c10-6 24-2 26 8s-12 18-22 14-14-16-4-22z" fill="#cdebd3" />
      <g stroke="#e3eaf0" strokeWidth="1.2" fill="none">
        <path d="M20 90h280M20 130h280M20 170h280M20 210h280M80 20v220M120 20v220M200 20v220M240 20v220" />
      </g>
      <ellipse cx="160" cy="132" rx="104" ry="86" fill="none" stroke="#fff" strokeWidth="7" />
      <ellipse cx="160" cy="132" rx="104" ry="86" fill="none" stroke="#f6c66b" strokeWidth="1.6" />
      <g fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round">
        {ROADS.map((d, i) => (
          <DrawPath key={d} d={d} delay={0.2 + i * 0.15} />
        ))}
      </g>
      <g fill="none" stroke="#f6c66b" strokeWidth="1.2" strokeLinecap="round">
        {ROADS.slice(0, 2).map((d, i) => (
          <DrawPath key={d} d={d} delay={0.5 + i * 0.15} />
        ))}
      </g>
    </svg>
  );
}

export function Pin({ color, active, delay }: { color: string; active: boolean; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="relative block"
      animate={{ scale: active ? 1.25 : 0.85, opacity: active ? 1 : 0.6 }}
      transition={{ duration: 0.35 }}
    >
      {active && <span className="absolute bottom-0 left-1/2 size-6 -translate-x-1/2 translate-y-1/2 rounded-full animate-ping-soft" style={{ background: `${color}55` }} />}
      <motion.svg
        viewBox="0 0 24 32"
        className="relative block h-7 w-auto drop-shadow-md"
        animate={active && !reduce ? { y: [0, -5, 0] } : { y: 0 }}
        transition={{ duration: 1.8, repeat: active ? Infinity : 0, ease: "easeInOut", delay }}
      >
        <path d="M12 0C5.4 0 0 5.2 0 11.6 0 20.3 12 32 12 32s12-11.7 12-20.4C24 5.2 18.6 0 12 0z" fill={color} />
        <circle cx="12" cy="11.5" r="4.6" fill="white" />
      </motion.svg>
    </motion.span>
  );
}

export function ExploreBengaluru() {
  const { t } = useLang();
  const [active, setActive] = useState<LayoutKind>("residential");
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const index = LAYOUTS.findIndex((l) => l.key === active);
  const current = LAYOUTS[index];

  useEffect(() => {
    if (paused || reduce) return;
    const id = window.setTimeout(() => setActive(LAYOUTS[(index + 1) % LAYOUTS.length].key), 5000);
    return () => window.clearTimeout(id);
  }, [index, paused, reduce]);

  return (
    <Panel icon={MapTrifold} title={EXPLORE.title} sub={EXPLORE.sub} href={svc("map")}>
      <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,180px)_1fr] xl:grid-cols-[minmax(0,176px)_1fr_minmax(0,200px)]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <motion.ul {...stagger(0.07, 0.2)} className="grid grid-cols-2 gap-1.5 md:flex md:flex-col" role="tablist">
          {LAYOUTS.map((l) => {
            const on = l.key === active;
            const I = l.icon;
            return (
              <motion.li key={l.key} variants={ITEM_X}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(l.key)}
                  className={cn(
                    "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold transition-colors duration-300",
                    on ? "text-white" : "bg-page text-navy hover:bg-brand hover:text-white",
                  )}
                >
                  {on && <motion.span layoutId="explore-active" className="absolute inset-0 bg-brand" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
                  <I size={17} weight={on ? "fill" : "duotone"} className="relative shrink-0" />
                  <span className="relative leading-tight">{t(l.label)}</span>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
        <div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-line">
          <CityMap />
          <span className="absolute left-1/2 top-[50%] z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy px-3.5 py-1 text-[12px] font-bold text-white shadow-lg transition-colors duration-500">
            {t(EXPLORE.city)}
          </span>
          {LAYOUTS.flatMap((l) =>
            l.pins.map(([x, y], i) => (
              <button
                key={`${l.key}-${i}`}
                type="button"
                onClick={() => setActive(l.key)}
                aria-label={t(l.label)}
                style={{ left: `${x}%`, top: `${y}%`, zIndex: l.key === active ? 5 : 1 }}
                className="absolute -translate-x-1/2 -translate-y-full"
              >
                <Pin color={l.pin} active={l.key === active} delay={i * 0.25} />
              </button>
            )),
          )}
        </div>
        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white md:col-span-2 xl:col-span-1">
          <AnimatePresence mode="wait">
            <motion.a
              key={active}
              href={current.href}
              {...external(current.href)}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="group flex flex-1 flex-col transition-colors duration-300 hover:bg-brand md:flex-row xl:flex-col"
            >
              <span className="block h-32 overflow-hidden md:h-auto md:w-44 xl:h-32 xl:w-auto">
                <img src={asset(current.photo)} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </span>
              <span className="flex flex-1 flex-col p-3.5">
                <span className="font-display text-[14px] font-semibold text-navy group-hover:text-white">{t(current.label)}</span>
                <span className="mt-1 text-[12px] leading-snug text-muted group-hover:text-white/85">{t(current.blurb)}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[12.5px] font-semibold text-brand group-hover:text-white">
                  {t(current.cta)}
                  <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-1" />
                </span>
              </span>
            </motion.a>
          </AnimatePresence>
          <div className="flex justify-center gap-1.5 pb-3 pt-1" role="tablist">
            {LAYOUTS.map((l) => (
              <button
                key={l.key}
                type="button"
                role="tab"
                aria-selected={l.key === active}
                aria-label={t(l.label)}
                onClick={() => setActive(l.key)}
                className={cn("h-1.5 rounded-full transition-all duration-300", l.key === active ? "w-5 bg-brand" : "w-1.5 bg-line hover:bg-brand/60")}
              />
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- Current initiatives ---------- */

const INITIATIVE_PHOTOS = [PHOTOS.villa, PHOTOS.layoutSigns, PHOTOS.skyline, PHOTOS.headOffice];

export const INITIATIVE_LIST = INITIATIVE_ORDER.map((i) => ({
  href: INITIATIVES[i].href,
  label: INITIATIVES[i].label,
  sub: INITIATIVE_STYLE[i].sub,
  photo: INITIATIVE_PHOTOS[i],
}));

export function CurrentInitiatives() {
  const { t } = useLang();
  return (
    <Panel
      icon={Lightbulb}
      title={t2("Current Initiatives", "ಪ್ರಸ್ತುತ ಉಪಕ್ರಮಗಳು")}
      sub={t2("Key initiatives for a sustainable and inclusive Bengaluru", "ಸುಸ್ಥಿರ ಮತ್ತು ಒಳಗೊಳ್ಳುವ ಬೆಂಗಳೂರಿಗಾಗಿ ಪ್ರಮುಖ ಉಪಕ್ರಮಗಳು")}
      to="/sitemap"
      delay={0.1}
    >
      <motion.ul {...stagger(0.09, 0.2)} className="flex flex-1 flex-col divide-y divide-line">
        {INITIATIVE_LIST.map((it) => (
          <motion.li key={it.label.en} variants={ITEM_X} className="py-1 first:pt-0 last:pb-0">
            <a href={it.href} {...external(it.href)} className="group flex items-center gap-3.5 rounded-2xl p-1.5 transition-colors duration-300 hover:bg-brand">
              <span className="h-[60px] w-[100px] shrink-0 overflow-hidden rounded-xl">
                <img src={asset(it.photo)} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[14px] font-semibold leading-snug text-navy group-hover:text-white">{t(it.label)}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-muted group-hover:text-white/85">{t(it.sub)}</span>
              </span>
              <ArrowUpRight size={18} weight="bold" className="mr-1 shrink-0 text-brand opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white group-hover:opacity-100" />
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </Panel>
  );
}

/* ---------- Latest updates ---------- */

const TAG_TONE: Record<Exclude<UpdateTab, "all">, string> = {
  notice: "bg-rose-50 text-rose-600",
  eauction: "bg-amber-50 text-amber-700",
  report: "bg-emerald-50 text-emerald-700",
  news: "bg-violet-50 text-violet-700",
  openhouse: "bg-sky-50 text-sky-700",
};

const ONGOING = t2("Ongoing", "ಚಾಲ್ತಿಯಲ್ಲಿದೆ");

export function LatestUpdates() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<UpdateTab>("all");
  const items = useMemo(() => UPDATES.filter((u) => tab === "all" || u.tab === tab), [tab]);
  const { ref, edge, update, by } = useScroller();
  useEffect(() => {
    ref.current?.scrollTo({ left: 0 });
    update();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = (
    <div role="tablist" className="order-last flex w-full gap-1.5 overflow-x-auto [scrollbar-width:none] lg:order-none lg:w-auto">
      {UPDATE_TABS.map((tb) => {
        const on = tb.key === tab;
        return (
          <button
            key={tb.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setTab(tb.key)}
            className={cn("relative shrink-0 rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors duration-300", on ? "text-white" : "text-navy hover:bg-brand hover:text-white")}
          >
            {on && <motion.span layoutId="dash-tab" className="absolute inset-0 rounded-full bg-navy" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className="relative">{t(tb.label)}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <Panel icon={Bell} title={t2("Latest Updates", "ಇತ್ತೀಚಿನ ಅಪ್‌ಡೇಟ್‌ಗಳು")} href={highlight("news")} extra={tabs}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => by(-1)} disabled={edge.start} aria-label={t(PREV)} className={cn(ROUND_BTN, "hidden size-9 sm:grid")}>
          <CaretLeft size={15} weight="bold" />
        </button>
        <div ref={ref} onScroll={update} className="flex min-w-0 flex-1 snap-x overflow-x-auto [scrollbar-width:none]">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((u, i) => {
              const d = u.date ? dateParts(u.date, lang) : null;
              const tag = UPDATE_TABS.find((x) => x.key === u.tab)!;
              return (
                <motion.a
                  key={`${u.href}-${u.title.en}`}
                  layout
                  href={u.href}
                  {...external(u.href)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(i, 4) * 0.04 }}
                  className="group flex w-[260px] shrink-0 snap-start items-center gap-3 rounded-2xl border-r border-line px-3 py-2.5 transition-colors duration-300 last:border-r-0 hover:border-transparent hover:bg-brand"
                >
                  <span className="flex w-14 shrink-0 flex-col items-center text-navy group-hover:text-white">
                    {d ? (
                      <>
                        <span className="font-display text-[26px] font-bold leading-none">{d.day}</span>
                        <span className="mt-1 text-center text-[10px] font-semibold uppercase leading-tight text-muted group-hover:text-white/85">{d.monthYear}</span>
                      </>
                    ) : (
                      <>
                        <CalendarBlank size={24} weight="duotone" className="text-brand group-hover:text-white" />
                        <span className="mt-1 text-center text-[10px] font-semibold uppercase leading-tight text-muted group-hover:text-white/85">{t(ONGOING)}</span>
                      </>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-bold", TAG_TONE[u.tab])}>{t(tag.label)}</span>
                      {u.pdf && <FilePdf size={14} weight="fill" className="text-new group-hover:text-white" />}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-[12.5px] font-medium leading-snug text-ink group-hover:text-white">{t(u.title)}</span>
                  </span>
                </motion.a>
              );
            })}
          </AnimatePresence>
        </div>
        <button type="button" onClick={() => by(1)} disabled={edge.end} aria-label={t(NEXT)} className={cn(ROUND_BTN, "hidden size-9 sm:grid")}>
          <CaretRight size={15} weight="bold" />
        </button>
      </div>
    </Panel>
  );
}

/* ---------- Important links ---------- */

const LINK_TONES = [
  "bg-sky-50 text-sky-600",
  "bg-emerald-50 text-emerald-600",
  "bg-violet-50 text-violet-600",
  "bg-pink-50 text-pink-600",
  "bg-amber-50 text-amber-600",
  "bg-rose-50 text-rose-600",
  "bg-teal-50 text-teal-600",
];

export function ImportantLinks() {
  const { t } = useLang();
  return (
    <Panel icon={LinkSimple} title={t2("Important Links", "ಪ್ರಮುಖ ಕೊಂಡಿಗಳು")} to="/sitemap" more={t2("View All Links", "ಎಲ್ಲಾ ಕೊಂಡಿಗಳನ್ನು ನೋಡಿ")} delay={0.08}>
      <motion.ul {...stagger(0.05, 0.2)} className="grid flex-1 content-start gap-2 sm:grid-cols-2">
        {CIVIC_LINKS.map((l, i) => {
          const I = l.icon;
          return (
            <motion.li key={l.label.en} variants={ITEM} whileHover={LIFT}>
              <a href={l.href} {...external(l.href)} className="group flex h-full items-center gap-3 rounded-2xl border border-line p-2.5 transition-colors duration-300 hover:border-brand hover:bg-brand">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-full transition-all duration-300 group-hover:scale-110 group-hover:bg-white", LINK_TONES[i % LINK_TONES.length])}>
                  <I size={21} weight="duotone" />
                </span>
                <span className="text-[12.5px] font-semibold leading-tight text-navy group-hover:text-white">{t(l.label)}</span>
              </a>
            </motion.li>
          );
        })}
      </motion.ul>
    </Panel>
  );
}
