import {
  ArrowRight,
  Bank,
  CaretDown,
  CaretRight,
  ChartBar,
  Compass,
  Desktop,
  FilePdf,
  Files,
  Images,
  Info,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  Megaphone,
  SquaresFour,
  Stack,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconPop, ITEM, ITEM_X, LIFT, RiseLines, Sheen, stagger } from "@/components/dashboard/motion";
import { CountUp, EASE } from "@/components/home/shared";
import { HIGHLIGHTS, LEADERS, SERVICES, SITE } from "@/lib/content";
import { useLang, type Text } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { asset, cn, dateParts, external } from "@/lib/utils";
import { ANNOUNCE, DEPT_BG, DEPTS, GALLERY, ONLINE, POPULAR, TILES, dept } from "./plannerData";
import { usePlannerVariant } from "./plannerTheme";
import { SEARCH_ID, useSideFilter } from "./PlannerShell";

const t2 = (en: string, kn: string): Text => ({ en, kn });
const svc = (icon: (typeof SERVICES)[number]["icon"]) => SERVICES.find((s) => s.icon === icon)!.href;

const CARD = "rounded-2xl border border-white bg-white/95 shadow-[0_18px_40px_-28px_rgba(60,45,20,0.5)]";
const VIEW_ALL = t2("View All", "ಎಲ್ಲಾ ನೋಡಿ");

function CardHead({ icon: I, tone, title, href, to, action }: { icon: Icon; tone: string; title: Text; href?: string; to?: string; action?: ReactNode }) {
  const { t, lang } = useLang();
  const serif = usePlannerVariant() === "skyline" && lang === "en";
  const link = href ?? to;
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className={cn("flex min-w-0 items-center gap-1.5 leading-tight text-navy", serif ? "font-serif text-[17px] font-semibold" : "font-display text-[14px] font-bold")}>
        <IconPop className={cn("grid size-6 shrink-0 place-items-center", tone)}>
          <I size={20} weight="duotone" />
        </IconPop>
        {t(title)}
      </h2>
      {action}
      {link && (
        <a href={link} {...external(link)} className="group flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-[10.5px] font-semibold text-navy transition-colors hover:bg-brand hover:text-white">
          {t(VIEW_ALL)}
          <ArrowRight size={12} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
        </a>
      )}
    </div>
  );
}

/* ---------- Hero ---------- */

const HERO = {
  eyebrow: t2("People | Places | Progress", "ಜನರು | ಸ್ಥಳಗಳು | ಪ್ರಗತಿ"),
  lines: [t2("Building", "ಉತ್ತಮ"), t2("a Better", "ಬೆಂಗಳೂರಿನ"), t2("Bengaluru", "ನಿರ್ಮಾಣ")],
  body: t2(
    "Planned neighbourhoods. Sustainable growth. Inclusive development. A city for future generations.",
    "ಯೋಜಿತ ನೆರೆಹೊರೆಗಳು. ಸುಸ್ಥಿರ ಬೆಳವಣಿಗೆ. ಎಲ್ಲರನ್ನೊಳಗೊಂಡ ಅಭಿವೃದ್ಧಿ. ಭವಿಷ್ಯದ ಪೀಳಿಗೆಗಾಗಿ ನಗರ.",
  ),
  search: t2("Search layouts, sites, auctions, documents, services, departments...", "ಬಡಾವಣೆ, ನಿವೇಶನ, ಹರಾಜು, ದಾಖಲೆ, ಸೇವೆ, ವಿಭಾಗಗಳನ್ನು ಹುಡುಕಿ..."),
  go: t2("Search", "ಹುಡುಕಿ"),
  popular: t2("Popular searches:", "ಜನಪ್ರಿಯ ಹುಡುಕಾಟಗಳು:"),
};

export function PlannerHero() {
  const { t } = useLang();
  const { query, setQuery } = usePrefs();
  const reduce = useReducedMotion();
  const sky = usePlannerVariant() === "skyline";
  return (
    <section className="relative min-h-[300px] overflow-hidden rounded-2xl lg:min-h-[322px]">
      {!sky && (
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-25 sm:opacity-100">
        <motion.img
          src={asset("images/planner-hero-city.webp")}
          alt=""
          initial={{ opacity: 0, scale: 1.05 }}
          animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [1, 1.035, 1] }}
          transition={reduce ? { duration: 1 } : { opacity: { duration: 1.4, ease: EASE }, scale: { duration: 24, repeat: Infinity, ease: "easeInOut" } }}
          className="absolute inset-0 size-full origin-bottom-right object-contain mix-blend-multiply object-right-bottom sm:bottom-[52px] sm:left-auto sm:right-0 sm:h-[calc(100%-52px)] sm:w-[76%]"
        />
        {[
          { top: "12%", w: 90, d: 46, delay: 0 },
          { top: "24%", w: 60, d: 60, delay: 8 },
        ].map((c) => (
          <motion.span
            key={c.top}
            className="absolute right-0 h-5 rounded-full bg-white/70 blur-[3px]"
            style={{ top: c.top, width: c.w }}
            initial={{ x: 40, opacity: 0 }}
            animate={reduce ? { opacity: 0.8 } : { x: [40, -760], opacity: [0, 0.85, 0.85, 0] }}
            transition={{ duration: c.d, repeat: Infinity, ease: "linear", delay: c.delay }}
          />
        ))}
        {!reduce &&
          [0, 1, 2].map((i) => (
            <motion.svg
              key={i}
              viewBox="0 0 20 8"
              className="absolute right-[18%] w-4 text-[#4a5a78]"
              style={{ top: `${14 + i * 4}%` }}
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: [-(i * 14), -520 - i * 14], y: [0, -14, 6], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 2 + i * 0.7 }}
            >
              <motion.path
                d="M1 6Q5 1 10 6Q15 1 19 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                animate={{ d: ["M1 6Q5 1 10 6Q15 1 19 6", "M1 4Q5 6 10 6Q15 6 19 4", "M1 6Q5 1 10 6Q15 1 19 6"] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              />
            </motion.svg>
          ))}
      </div>
      )}
      <div className="relative z-10 px-3 pb-3 pt-3 sm:px-4">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, letterSpacing: "0.32em" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="text-[10.5px] font-semibold uppercase text-navy/70 [&:lang(kn)]:!tracking-normal"
        >
          {t(HERO.eyebrow)}
        </motion.p>
        <h1 className="mt-2 font-serif text-[40px] leading-[1.02] text-[var(--pl-ink)] sm:text-[50px] [&:lang(kn)]:font-display [&:lang(kn)]:text-[34px] [&:lang(kn)]:font-bold [&:lang(kn)]:leading-[1.3]">
          <RiseLines lines={HERO.lines.map((l) => ({ text: t(l) }))} delay={0.15} />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.55 }}
          className="mt-2 max-w-[19rem] text-[13.5px] leading-snug text-ink/80"
        >
          {t(HERO.body)}
        </motion.p>
        <motion.form
          role="search"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.7 }}
          onSubmit={(e) => {
            e.preventDefault();
            document.getElementById("planner-tiles")?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          className={cn(
            "mt-5 flex max-w-[600px] items-center gap-2 border border-white bg-white p-1.5 pl-4 shadow-[0_16px_34px_-20px_rgba(15,31,61,0.55)] focus-within:ring-4 focus-within:ring-brand/15",
            sky ? "rounded-full pl-5" : "rounded-xl",
          )}
        >
          <MagnifyingGlass size={18} className="shrink-0 text-navy" />
          <input
            id={SEARCH_ID}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(HERO.search)}
            aria-label={t(HERO.search)}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[13px] text-ink outline-none placeholder:text-muted"
          />
          {sky ? (
            <motion.button
              type="submit"
              aria-label={t(HERO.go)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--pl-accent)] text-white shadow-[0_8px_18px_-8px_var(--pl-accent)] transition-colors hover:bg-brand"
            >
              <Sheen />
              <ArrowRight size={18} weight="bold" />
            </motion.button>
          ) : (
            <button type="submit" className="relative shrink-0 overflow-hidden rounded-lg bg-[var(--pl-ink)] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand">
              <Sheen />
              {t(HERO.go)}
            </button>
          )}
        </motion.form>
        <motion.div {...stagger(0.05, 0.85, false)} className="mt-3 flex flex-wrap items-center gap-1.5">
          <motion.span variants={ITEM_X} className="mr-1 text-[11.5px] font-semibold text-navy">
            {t(HERO.popular)}
          </motion.span>
          {POPULAR.map((p) => (
            <motion.a
              key={p.label.en}
              variants={ITEM}
              href={p.href}
              {...external(p.href)}
              className="rounded-full border border-[var(--pl-chip-line)] bg-[var(--pl-chip)] px-3 py-1 text-[11px] font-medium text-navy transition-colors hover:border-brand hover:bg-brand hover:text-white"
            >
              {t(p.label)}
            </motion.a>
          ))}
        </motion.div>
      </div>
      <Leaders />
    </section>
  );
}

const LEADER_CARDS = [
  { ...LEADERS.left, role: t2("Hon'ble Chief Minister", "ಮಾನ್ಯ ಮುಖ್ಯಮಂತ್ರಿಗಳು") },
  { ...LEADERS.right, role: t2("Chairman, BDA", "ಅಧ್ಯಕ್ಷರು, ಬಿಡಿಎ") },
];

function Leaders() {
  const { t } = useLang();
  const reduce = useReducedMotion();
  return (
    <div className="relative z-10 flex gap-2 px-3 pb-3 sm:absolute sm:right-3 sm:top-3 sm:flex-col sm:p-0 xl:flex-row">
      {LEADER_CARDS.map((l, i) => (
        <motion.figure
          key={l.photo}
          initial={{ opacity: 0, y: -16, scale: 0.94 }}
          animate={reduce ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: [0, -4, 0], scale: 1 }}
          transition={
            reduce
              ? { duration: 0.5 }
              : { opacity: { duration: 0.6, delay: 0.9 + i * 0.15 }, scale: { duration: 0.6, ease: EASE, delay: 0.9 + i * 0.15 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.6 + i * 1.2 } }
          }
          className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-white/80 bg-white/80 p-1.5 pr-3 shadow-[0_14px_30px_-18px_rgba(15,31,61,0.55)] backdrop-blur-md sm:flex-none"
        >
          <span className="relative shrink-0">
            <motion.span
              aria-hidden
              className="absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,var(--pl-accent),#fff4dc,var(--pl-accent),var(--pl-ink),var(--pl-accent))]"
              animate={reduce ? undefined : { rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <img src={asset(l.photo)} alt={t(l.name)} className="relative size-12 rounded-full border-2 border-white object-cover object-top" />
          </span>
          <figcaption className="min-w-0 leading-tight">
            <span className="block truncate text-[12px] font-bold text-navy">{t(l.name)}</span>
            <span className="mt-0.5 block text-[10.5px] font-medium text-[var(--pl-accent)]">{t(l.role)}</span>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}

/* ---------- Jurisdiction map ---------- */

type ZoneKey = "north" | "south" | "east" | "west" | "central";

type Pt = [number, number];

/** Deterministic wavy border between two points so shared zone edges line up exactly. */
function wiggle(a: Pt, b: Pt, seed: number, amp = 5, steps = 10): Pt[] {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [-dy / len, dx / len];
  return Array.from({ length: steps + 1 }, (_, i) => {
    const s = i / steps;
    const o = amp * Math.sin(s * Math.PI) * (0.7 * Math.sin(s * Math.PI * 3 + seed) + 0.3 * Math.sin(s * Math.PI * 7 + seed * 2));
    return [a[0] + dx * s + nx * o, a[1] + dy * s + ny * o];
  });
}

const rev = (p: Pt[]) => [...p].reverse();
const poly = (...parts: Pt[][]) => `M${parts.flat().map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;

function blob(cx: number, cy: number, rx: number, ry: number) {
  const n = 96;
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.08 * Math.sin(3 * a + 1) + 0.05 * Math.sin(5 * a + 2) + 0.035 * Math.sin(9 * a + 0.5) + 0.022 * Math.sin(17 * a + 1.3) + 0.014 * Math.sin(29 * a);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

const OUTLINE = blob(150, 120, 126, 100);
const C: Pt[] = [
  [116, 86],
  [166, 74],
  [198, 104],
  [190, 146],
  [144, 160],
  [106, 128],
];
const E = {
  c12: wiggle(C[0], C[1], 1, 2.5, 6),
  c23: wiggle(C[1], C[2], 2, 2.5, 6),
  c34: wiggle(C[2], C[3], 3, 2.5, 6),
  c45: wiggle(C[3], C[4], 4, 2.5, 6),
  c56: wiggle(C[4], C[5], 5, 2.5, 6),
  c61: wiggle(C[5], C[0], 6, 2.5, 6),
  r1: wiggle(C[0], [-10, 30], 7, 7, 14),
  r2: wiggle(C[2], [320, 64], 8, 7, 14),
  r3: wiggle(C[3], [300, 260], 9, 7, 14),
  r4: wiggle(C[5], [-10, 236], 10, 7, 14),
};
const ZONE_PATHS: Record<ZoneKey, string> = {
  central: poly(E.c12, E.c23, E.c34, E.c45, E.c56, E.c61),
  north: poly(rev(E.r1), E.c12, E.c23, E.r2, [[330, -20], [-20, -20]]),
  east: poly(E.r2, [[330, 64], [330, 270], [300, 270]], rev(E.r3), rev(E.c34)),
  south: poly(E.r3, [[300, 270], [-20, 270], [-20, 236]], rev(E.r4), rev(E.c56), rev(E.c45)),
  west: poly(E.r4, [[-20, 236], [-20, 30]], rev(E.r1), rev(E.c61)),
};

const ZONES: { key: ZoneKey; label: Text; fill: string; pin: string; at: Pt; pinAt: Pt }[] = [
  { key: "north", label: t2("North Zone", "ಉತ್ತರ ವಲಯ"), fill: "#a5d98f", pin: "#2f9a5b", at: [190, 50], pinAt: [128, 60] },
  { key: "south", label: t2("South Zone", "ದಕ್ಷಿಣ ವಲಯ"), fill: "#f7d77c", pin: "#c99216", at: [156, 198], pinAt: [214, 184] },
  { key: "east", label: t2("East Zone", "ಪೂರ್ವ ವಲಯ"), fill: "#f8b47f", pin: "#e0702b", at: [246, 128], pinAt: [254, 102] },
  { key: "west", label: t2("West Zone", "ಪಶ್ಚಿಮ ವಲಯ"), fill: "#93c3ee", pin: "#2f6fc4", at: [90, 108], pinAt: [78, 152] },
  { key: "central", label: t2("Central Zone", "ಕೇಂದ್ರ ವಲಯ"), fill: "#f6a8be", pin: "#d23d5f", at: [152, 128], pinAt: [150, 106] },
];

const MAP_STATS: { icon: Icon; tone: string; value: string; label: Text }[] = [
  { icon: MapPin, tone: "text-emerald-600", value: "923", label: t2("Formed Layouts", "ರಚಿತ ಬಡಾವಣೆಗಳು") },
  { icon: Stack, tone: "text-blue-600", value: "12", label: t2("Zones", "ವಲಯಗಳು") },
  { icon: Files, tone: "text-blue-600", value: "3,064", label: t2("Document Records", "ದಾಖಲೆಗಳು") },
];

export function JurisdictionMap() {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const sky = usePlannerVariant() === "skyline";
  const [hover, setActive] = useState<ZoneKey | null>(null);
  const [pinned, setPinned] = useState<ZoneKey | "">("");
  const active = hover ?? (pinned || null);
  const map = svc("map");
  return (
    <motion.section
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
      className={cn(CARD, "flex flex-col overflow-hidden p-4", sky && "bg-white/85 backdrop-blur-md")}
    >
      <CardHead
        icon={MapTrifold}
        tone="text-[var(--pl-accent)]"
        title={t2("BDA Jurisdiction Map", "ಬಿಡಿಎ ವ್ಯಾಪ್ತಿ ನಕ್ಷೆ")}
        action={
          sky && (
            <label className="relative shrink-0">
              <span className="sr-only">{t(t2("Highlight a zone", "ವಲಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ"))}</span>
              <select
                value={pinned}
                onChange={(e) => setPinned(e.target.value as ZoneKey | "")}
                className="cursor-pointer appearance-none rounded-lg border border-line bg-white py-1.5 pl-3 pr-7 text-[11.5px] font-semibold text-navy shadow-sm outline-none transition-colors hover:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">{t(t2("All Zones", "ಎಲ್ಲಾ ವಲಯಗಳು"))}</option>
                {ZONES.map((z) => (
                  <option key={z.key} value={z.key}>
                    {t(z.label)}
                  </option>
                ))}
              </select>
              <CaretDown size={11} weight="bold" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-navy" />
            </label>
          )
        }
      />
      <div className="relative mt-1 flex flex-1 items-center">
        <motion.ul
          {...stagger(0.07, 0.6, false)}
          className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 space-y-0.5 sm:block rounded-xl border border-line/70 bg-white/95 p-2 shadow-[0_14px_30px_-18px_rgba(15,31,61,0.55)] backdrop-blur"
        >
          {ZONES.map((z) => (
            <motion.li key={z.key} variants={ITEM_X}>
              <a
                href={map}
                {...external(map)}
                onMouseEnter={() => setActive(z.key)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(z.key)}
                onBlur={() => setActive(null)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-navy transition-colors hover:bg-brand hover:text-white",
                  active === z.key && "bg-brand text-white",
                )}
              >
                <MapPin size={15} weight="fill" style={{ color: active === z.key ? "#fff" : z.pin }} />
                {t(z.label)}
              </a>
            </motion.li>
          ))}
        </motion.ul>
        <div className="relative min-w-0 flex-1 sm:ml-[20%]">
          <svg viewBox="22 14 262 214" className="h-auto w-full overflow-visible max-lg:max-h-[300px]" role="img" aria-label={t(t2("BDA zones map", "ಬಿಡಿಎ ವಲಯಗಳ ನಕ್ಷೆ"))}>
            <defs>
              <clipPath id="planner-outline">
                <path d={OUTLINE} />
              </clipPath>
              <filter id="planner-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
              <radialGradient id="planner-shine" cx="0.38" cy="0.3" r="0.8">
                <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
                <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <motion.path
              d={OUTLINE}
              fill="#5b4a2a"
              opacity="0.16"
              filter="url(#planner-shadow)"
              transform="translate(3 7)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.16 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
            <g clipPath="url(#planner-outline)">
              {ZONES.map((z, i) => (
                <motion.path
                  key={z.key}
                  d={ZONE_PATHS[z.key]}
                  fill={z.fill}
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: active && active !== z.key ? 0.5 : 1, filter: active === z.key ? "saturate(1.35) brightness(0.97)" : "saturate(1) brightness(1)" }}
                  transition={{ duration: 0.45, ease: EASE, delay: active ? 0 : 0.4 + i * 0.1 }}
                  onMouseEnter={() => setActive(z.key)}
                  onMouseLeave={() => setActive(null)}
                  className="cursor-pointer"
                />
              ))}
              <g fill="none" stroke="#fff" pointerEvents="none">
                <ellipse cx="152" cy="118" rx="72" ry="56" strokeOpacity="0.7" strokeWidth="1.4" strokeDasharray="5 4" />
                <ellipse cx="150" cy="120" rx="106" ry="83" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 4" />
                <path d="M30 104C90 96 210 128 280 116M156 14C146 80 162 160 150 230M60 196C120 150 190 92 252 40M58 52C110 100 196 150 246 206" strokeOpacity="0.35" strokeWidth="0.8" />
              </g>
              <g fill="#8fc7e8" stroke="#fff" strokeWidth="0.8" pointerEvents="none">
                <ellipse cx="98" cy="172" rx="7" ry="4.5" />
                <ellipse cx="212" cy="74" rx="6" ry="4" />
                <ellipse cx="226" cy="168" rx="5" ry="3.5" />
                <ellipse cx="84" cy="80" rx="4.5" ry="3" />
              </g>
              <rect x="0" y="0" width="320" height="260" fill="url(#planner-shine)" pointerEvents="none" />
            </g>
            <path d={OUTLINE} fill="none" stroke="#fff" strokeWidth="3" pointerEvents="none" />
            <path d={OUTLINE} fill="none" stroke="#d9c7a3" strokeWidth="0.8" strokeDasharray="2 3" pointerEvents="none" transform="translate(150 120) scale(1.035) translate(-150 -120)" />
            {ZONES.map((z, i) => (
              <motion.g
                key={`pin-${z.key}`}
                pointerEvents="none"
                initial={{ y: -14, opacity: 0 }}
                animate={reduce ? { y: 0, opacity: 1 } : { y: [0, -3, 0], opacity: 1 }}
                transition={reduce ? { delay: 1 } : { y: { duration: 2.4, repeat: Infinity, delay: 1.2 + i * 0.3 }, opacity: { delay: 1 + i * 0.1 } }}
              >
                {!reduce && (
                  <motion.ellipse
                    cx={z.pinAt[0]}
                    cy={z.pinAt[1]}
                    fill="none"
                    stroke={z.pin}
                    strokeWidth="1.2"
                    initial={{ rx: 1, ry: 0.5, opacity: 0.8 }}
                    animate={{ rx: [1, 11], ry: [0.5, 4.5], opacity: [0.8, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 1.4 + i * 0.4 }}
                  />
                )}
                <path d={`M${z.pinAt[0]} ${z.pinAt[1]}c-4-5-6-8-6-11a6 6 0 0 1 12 0c0 3-2 6-6 11z`} fill={z.pin} stroke="#fff" strokeWidth="1.2" />
                <circle cx={z.pinAt[0]} cy={z.pinAt[1] - 11} r="2" fill="#fff" />
              </motion.g>
            ))}
            {ZONES.map((z, i) => (
              <motion.g key={`l-${z.key}`} pointerEvents="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 + i * 0.08 }}>
                <rect x={z.at[0] - 27} y={z.at[1] - 7} width="54" height="15" rx="7.5" fill="#5b4a2a" opacity="0.12" transform="translate(0 1.5)" />
                <rect x={z.at[0] - 27} y={z.at[1] - 8} width="54" height="15" rx="7.5" fill="#fff" />
                <text x={z.at[0]} y={z.at[1] + 2.4} textAnchor="middle" fontSize="7.4" fontWeight="700" fill="var(--pl-ink)">
                  {t(z.label)}
                </text>
              </motion.g>
            ))}
          </svg>
          <motion.span
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 1, ease: EASE, delay: 0.9 }}
            className="absolute right-0 top-0 flex flex-col items-center text-navy"
            aria-hidden
          >
            <span className="text-[9px] font-bold">N</span>
            <Compass size={22} weight="duotone" />
          </motion.span>
        </div>
      </div>
      <motion.ul {...stagger(0.08, 0.9, false)} className="mt-2 grid grid-cols-4 gap-1 border-t border-line pt-2.5">
        {MAP_STATS.map((s) => {
          const I = s.icon;
          return (
            <motion.li key={s.value} variants={ITEM} className="flex items-center gap-1.5">
              <I size={20} weight="duotone" className={cn("shrink-0", s.tone)} />
              <span className="min-w-0 leading-tight">
                <CountUp value={s.value} className="block font-display text-[14px] font-bold text-navy" />
                <span className="block text-[10px] text-muted">{t(s.label)}</span>
              </span>
            </motion.li>
          );
        })}
        <motion.li variants={ITEM}>
          <a href={map} {...external(map)} className="group flex items-center gap-1.5 rounded-lg p-0.5 transition-colors hover:bg-brand">
            <MapTrifold size={20} weight="duotone" className="shrink-0 text-navy group-hover:text-white" />
            <span className="leading-tight">
              <span className="block text-[12px] font-bold text-navy group-hover:text-white">{t(t2("Explore", "ಅನ್ವೇಷಿಸಿ"))}</span>
              <span className="block text-[10px] text-muted group-hover:text-white/85">{t(t2("Interactive Map", "ಸಂವಾದಾತ್ಮಕ ನಕ್ಷೆ"))}</span>
            </span>
          </a>
        </motion.li>
      </motion.ul>
    </motion.section>
  );
}

/* ---------- Service tiles ---------- */

export function ServiceTiles() {
  const { t } = useLang();
  const keep = useSideFilter();
  const items = TILES.filter(keep);
  return (
    <motion.ul id="planner-tiles" {...stagger(0.06, 0.2)} className="grid scroll-mt-28 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {items.length === 0 && <li className="col-span-full rounded-xl bg-white/80 p-4 text-[13px] text-muted">{t(t2("No matching services. Try another word.", "ಯಾವುದೇ ಸೇವೆ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಪದ ಪ್ರಯತ್ನಿಸಿ."))}</li>}
      {items.map((s) => {
        const I = s.icon;
        return (
          <motion.li key={s.title.en} variants={ITEM} whileHover={LIFT}>
            <a
              href={s.href}
              {...external(s.href)}
              className={cn("group relative flex h-full min-h-[96px] flex-col rounded-2xl border p-3 transition-colors duration-300 hover:border-brand hover:bg-brand", s.bg)}
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(120%_90%_at_0%_0%,rgba(255,255,255,0.75),transparent_60%)] transition-opacity duration-300 group-hover:opacity-0" />
              <span className="relative flex items-start justify-between">
                <I size={30} weight="duotone" className={cn("transition-transform duration-300 group-hover:scale-110 group-hover:text-white", s.tone.icon)} />
                <ArrowRight size={15} weight="bold" className={cn("transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white", s.tone.arrow)} />
              </span>
              <span className="mt-1.5 text-[13px] font-bold leading-tight text-navy group-hover:text-white">{t(s.title)}</span>
              <span className="mt-0.5 text-[11px] leading-snug text-muted group-hover:text-white/85">{t(s.sub)}</span>
            </a>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

export function PhotoTiles() {
  const { t } = useLang();
  const keep = useSideFilter();
  const items = TILES.filter((s) => s.photo && keep(s));
  return (
    <motion.ul id="planner-tiles" {...stagger(0.06, 0.2)} className="grid scroll-mt-28 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {items.length === 0 && <li className="col-span-full rounded-xl bg-white/80 p-4 text-[13px] text-muted">{t(t2("No matching services. Try another word.", "ಯಾವುದೇ ಸೇವೆ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಪದ ಪ್ರಯತ್ನಿಸಿ."))}</li>}
      {items.map((s) => {
        const I = s.icon;
        return (
          <motion.li key={s.title.en} variants={ITEM} whileHover={LIFT}>
            <a
              href={s.href}
              {...external(s.href)}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white bg-white shadow-[0_18px_40px_-28px_rgba(60,45,20,0.5)] transition-colors duration-300 hover:border-brand hover:bg-brand"
            >
              <span className="relative block h-[68px] overflow-hidden 2xl:h-[84px]">
                <img src={asset(s.photo!)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/15 to-transparent" />
              </span>
              <span className="flex flex-1 items-start gap-2 p-2.5">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border transition-colors group-hover:border-white/30 group-hover:bg-white/15", s.bg)}>
                  <I size={19} weight="duotone" className={cn("transition-transform duration-300 group-hover:scale-110 group-hover:text-white", s.tone.icon)} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-[13.5px] font-semibold leading-tight text-navy group-hover:text-white [&:lang(kn)]:font-display">{t(s.title)}</span>
                  <span className="mt-0.5 block text-[10.5px] leading-snug text-muted group-hover:text-white/85">{t(s.sub)}</span>
                </span>
                <span className="mt-1.5 grid size-6 shrink-0 place-items-center rounded-full border border-line text-navy transition-all duration-300 group-hover:translate-x-0.5 group-hover:border-white group-hover:text-white">
                  <ArrowRight size={11} weight="bold" />
                </span>
              </span>
            </a>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/* ---------- Bottom cards ---------- */

function Panel({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={cn(CARD, "flex min-w-0 flex-col p-3.5", className)}
    >
      {children}
    </motion.section>
  );
}

export function AnnouncementsCard() {
  const { t, lang } = useLang();
  const sky = usePlannerVariant() === "skyline";
  return (
    <Panel>
      <CardHead icon={Megaphone} tone="text-orange-500" title={t2("Latest Announcements", "ಇತ್ತೀಚಿನ ಪ್ರಕಟಣೆಗಳು")} href={HIGHLIGHTS.find((h) => h.key === "news")!.href} />
      <motion.ul
        {...stagger(0.08, 0.2)}
        className={cn(
          "relative mt-2 flex flex-1 flex-col justify-between",
          sky ? "pl-4 before:absolute before:bottom-4 before:left-[5px] before:top-4 before:w-0.5 before:rounded-full before:bg-orange-200" : "divide-y divide-line",
        )}
      >
        {ANNOUNCE.map((a) => {
          const d = dateParts(a.date, lang);
          return (
            <motion.li key={a.title.en} variants={ITEM_X} className="relative">
              {sky && <span aria-hidden className="absolute -left-[15px] top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-orange-400 ring-[3px] ring-orange-100" />}
              <a href={a.href} {...external(a.href)} className="group flex items-center gap-2 rounded-lg px-0.5 py-1.5 transition-colors hover:bg-brand">
                <span className="w-9 shrink-0 text-center leading-none">
                  <span className="block font-display text-[17px] font-bold text-navy group-hover:text-white">{d.day}</span>
                  <span className="mt-0.5 block text-[8.5px] font-semibold uppercase text-muted group-hover:text-white/80">{d.monthYear}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("inline-block rounded px-1.5 py-px text-[8.5px] font-bold uppercase tracking-wide group-hover:bg-white/20 group-hover:text-white", a.tagTone)}>{t(a.tag)}</span>
                  <span className="mt-0.5 block text-[11.5px] font-medium leading-snug text-ink group-hover:text-white">{t(a.title)}</span>
                </span>
                {a.isNew && (
                  <motion.span
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white"
                  >
                    {t(t2("New", "ಹೊಸ"))}
                  </motion.span>
                )}
                <FilePdf size={20} weight="duotone" className="shrink-0 text-red-500 group-hover:text-white" />
              </a>
            </motion.li>
          );
        })}
      </motion.ul>
    </Panel>
  );
}

export function DepartmentsCard() {
  const { t } = useLang();
  const sky = usePlannerVariant() === "skyline";
  return (
    <Panel delay={0.06}>
      <CardHead icon={Bank} tone="text-blue-600" title={t2("Our Departments", "ನಮ್ಮ ವಿಭಾಗಗಳು")} href={`${SITE}/section-layout`} />
      <motion.ul {...stagger(0.04, 0.2)} className="mt-3 grid flex-1 auto-rows-fr grid-cols-3 gap-2">
        {DEPTS.map((d, i) => {
          const I = d.icon;
          return (
            <motion.li key={d.label.en} variants={ITEM} whileHover={LIFT}>
              <a href={d.href} {...external(d.href)} className={cn("group flex h-full flex-col items-center justify-center gap-1 rounded-lg px-0.5 py-2 text-center transition-colors hover:bg-brand", sky ? DEPT_BG[i] : "bg-[var(--pl-chip)]")}>
                <I size={sky ? 24 : 20} weight={sky ? "fill" : "duotone"} className={cn("transition-transform group-hover:scale-110 group-hover:text-white", d.tone)} />
                <span className="text-[10px] font-semibold leading-tight text-navy group-hover:text-white">{t(d.label)}</span>
              </a>
            </motion.li>
          );
        })}
      </motion.ul>
    </Panel>
  );
}

export function OnlineServicesCard() {
  const { t } = useLang();
  const keep = useSideFilter();
  const items = ONLINE.filter(keep);
  return (
    <Panel delay={0.12}>
      <CardHead icon={Desktop} tone="text-blue-600" title={t2("Online Services", "ಆನ್‌ಲೈನ್ ಸೇವೆಗಳು")} href={svc("online")} />
      <motion.ul {...stagger(0.06, 0.2)} className="mt-2 flex flex-1 flex-col justify-between divide-y divide-line">
        {items.length === 0 && <li className="py-3 text-[12px] text-muted">{t(t2("No matching services.", "ಯಾವುದೇ ಸೇವೆ ಸಿಗಲಿಲ್ಲ."))}</li>}
        {items.map((s) => {
          const I = s.icon;
          return (
            <motion.li key={s.label.en} variants={ITEM_X}>
              <a href={s.href} {...external(s.href)} className="group flex items-center gap-2.5 rounded-lg px-1 py-[7px] transition-colors hover:bg-brand">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-md group-hover:bg-white", s.tone)}>
                  <I size={15} weight="duotone" />
                </span>
                <span className="min-w-0 flex-1 text-[11.5px] font-medium leading-tight text-ink group-hover:text-white">{t(s.label)}</span>
                <CaretRight size={12} weight="bold" className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
              </a>
            </motion.li>
          );
        })}
      </motion.ul>
    </Panel>
  );
}

const KEY_INFO: { icon: Icon; tone: string; value: string; label: Text; href: string }[] = [
  { icon: SquaresFour, tone: "bg-emerald-50 text-emerald-600", value: "923", label: t2("Formed Layouts", "ರಚಿತ ಬಡಾವಣೆಗಳು"), href: dept("town-planning", "Town Planning") },
  { icon: MapPin, tone: "bg-emerald-50 text-emerald-600", value: "12", label: t2("Zones", "ವಲಯಗಳು"), href: svc("map") },
  { icon: Files, tone: "bg-blue-50 text-blue-600", value: "3,064", label: t2("Document Records", "ದಾಖಲೆಗಳು"), href: `${SITE}/section-layout` },
  { icon: ChartBar, tone: "bg-amber-50 text-amber-600", value: "100+", label: t2("Ongoing Projects", "ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಯೋಜನೆಗಳು"), href: dept("engineering", "Engineering") },
];

function KeyInfo() {
  const { t } = useLang();
  return (
    <Panel delay={0.18} className="flex-1 pb-3">
      <CardHead icon={Info} tone="text-orange-500" title={t2("Key Information", "ಪ್ರಮುಖ ಮಾಹಿತಿ")} />
      <motion.ul {...stagger(0.07, 0.2)} className="mt-2 grid flex-1 grid-cols-2 content-around gap-x-3 gap-y-2">
        {KEY_INFO.map((k) => {
          const I = k.icon;
          return (
            <motion.li key={k.label.en} variants={ITEM}>
              <a href={k.href} {...external(k.href)} className="group flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-brand">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg group-hover:bg-white", k.tone)}>
                  <I size={20} weight="duotone" />
                </span>
                <span className="leading-tight">
                  <CountUp value={k.value} className="block font-display text-[16px] font-bold text-navy group-hover:text-white" />
                  <span className="block text-[10.5px] text-muted group-hover:text-white/85">{t(k.label)}</span>
                </span>
              </a>
            </motion.li>
          );
        })}
      </motion.ul>
    </Panel>
  );
}

function GalleryCard() {
  const ref = useRef<HTMLUListElement>(null);
  const href = svc("gallery");
  const [start, setStart] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setStart((s) => (s + 1) % GALLERY.length), 4000);
    return () => window.clearInterval(id);
  }, [reduce]);
  const shown = Array.from({ length: 4 }, (_, i) => GALLERY[(start + i) % GALLERY.length]);
  return (
    <Panel delay={0.24} className="pb-3">
      <CardHead icon={Images} tone="text-blue-600" title={t2("Gallery", "ಗ್ಯಾಲರಿ")} href={href} />
      <div className="mt-2 flex items-center gap-1.5">
        <ul ref={ref} className="grid flex-1 grid-cols-4 gap-1.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((src, i) => (
              <motion.li key={`${src}-${start}-${i}`} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="h-full">
                <a href={href} {...external(href)} className="group block aspect-[4/3] overflow-hidden rounded-lg shadow-[0_8px_16px_-10px_rgba(15,31,61,0.6)]">
                  <img src={asset(src)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </a>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <button type="button" aria-label="Next" onClick={() => setStart((s) => (s + 1) % GALLERY.length)} className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-navy shadow transition-colors hover:bg-brand hover:text-white">
          <CaretRight size={12} weight="bold" />
        </button>
      </div>
    </Panel>
  );
}

export function InfoColumn() {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <KeyInfo />
      <GalleryCard />
    </div>
  );
}
