import {
  ArrowRight,
  Bank,
  Buildings,
  CaretRight,
  ChartLineUp,
  FileText,
  Gear,
  Headset,
  HouseLine,
  Lightbulb,
  Lightning,
  MagnifyingGlass,
  MapPin,
  Megaphone,
  SquaresFour,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { QUICK as CIVIC_QUICK } from "@/components/civic/CivicSections";
import { CARD, INITIATIVE_LIST, LAYOUTS, Pin, type LayoutKind } from "@/components/dashboard/DashSections";
import { areaLabel, areaOf } from "@/components/dashboard/DashShell";
import { CountUp, EASE } from "@/components/home/shared";
import { ABOUT, HIGHLIGHTS, ORG, SERVICES } from "@/lib/content";
import type { AreaKey } from "@/lib/ia";
import { useLang, type Text } from "@/lib/i18n";
import { PHOTOS } from "@/lib/photos";
import { usePrefs } from "@/lib/prefs";
import { asset, cn, external } from "@/lib/utils";
import { DrawPath, Float, IconPop, ITEM, ITEM_X, LIFT, RiseLines, Sheen, stagger, Underline } from "@/components/dashboard/motion";

const t2 = (en: string, kn: string): Text => ({ en, kn });
const svc = (icon: (typeof SERVICES)[number]["icon"]) => SERVICES.find((s) => s.icon === icon)!.href;
const hl = (key: (typeof HIGHLIGHTS)[number]["key"]) => HIGHLIGHTS.find((h) => h.key === key)!;

function Heading({ icon: I, title, sub, action }: { icon: Icon; title: Text; sub?: Text; action?: ReactNode }) {
  const { t } = useLang();
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <IconPop className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand transition-colors duration-500">
          <I size={22} weight="duotone" />
        </IconPop>
        <div>
          <h2 className="font-display text-[19px] font-bold leading-tight text-navy">{t(title)}</h2>
          {sub ? <p className="text-[12.5px] text-muted">{t(sub)}</p> : <Underline />}
        </div>
      </div>
      {action}
    </div>
  );
}

const MORE = "group inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-brand transition-colors duration-300 hover:bg-brand hover:text-white";

function More({ label, to, href }: { label: Text; to?: string; href?: string }) {
  const { t } = useLang();
  const body = (
    <>
      {t(label)}
      <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
    </>
  );
  return to ? (
    <Link to={to} className={MORE}>
      {body}
    </Link>
  ) : (
    <a href={href} {...external(href ?? "")} className={MORE}>
      {body}
    </a>
  );
}

const reveal = { initial: { opacity: 0, y: 26 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" } } as const;

/* ---------- Hero ---------- */

const HERO = {
  pre: t2("Shaping a", "ಉಜ್ವಲ"),
  accent: t2("Brighter Bengaluru", "ಬೆಂಗಳೂರಿನ ನಿರ್ಮಾಣ"),
  body: t2(
    "Planned layouts. Sustainable development. Vibrant communities. A global city for tomorrow.",
    "ಯೋಜಿತ ಬಡಾವಣೆಗಳು. ಸುಸ್ಥಿರ ಅಭಿವೃದ್ಧಿ. ಚೈತನ್ಯಶೀಲ ಸಮುದಾಯಗಳು. ನಾಳೆಗಾಗಿ ಜಾಗತಿಕ ನಗರ.",
  ),
  cta: t2("Explore BDA Services", "ಬಿಡಿಎ ಸೇವೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ"),
  credit: t2("Photo: Varthur skyline by SlowPhoton, CC BY-SA 4.0", "ಛಾಯಾಚಿತ್ರ: ವರ್ತೂರು, SlowPhoton, CC BY-SA 4.0"),
};

const STAT_ICONS: { icon: Icon; tone: string }[] = [
  { icon: HouseLine, tone: "text-blue-600" },
  { icon: Bank, tone: "text-violet-600" },
  { icon: Buildings, tone: "text-orange-500" },
  { icon: MapPin, tone: "text-emerald-600" },
];

const ORBIT: { key: AreaKey; icon: Icon; tone: string; angle: number }[] = [
  { key: "departments", icon: UsersThree, tone: "from-orange-400 to-orange-500", angle: 192 },
  { key: "services", icon: Gear, tone: "from-teal-400 to-teal-500", angle: 228 },
  { key: "property", icon: Buildings, tone: "from-blue-500 to-blue-600", angle: 266 },
  { key: "planning", icon: ChartLineUp, tone: "from-emerald-400 to-emerald-500", angle: 304 },
  { key: "information", icon: FileText, tone: "from-pink-400 to-rose-500", angle: 340 },
  { key: "news", icon: Megaphone, tone: "from-sky-500 to-blue-600", angle: 16 },
];

const SWAY = "animate-sway group-hover/orbit:[animation-play-state:paused] motion-reduce:animate-none";
const SWAY_BACK = "animate-sway-reverse group-hover/orbit:[animation-play-state:paused] motion-reduce:animate-none";

function OrbitBubble({ item, index, size = "lg" }: { item: (typeof ORBIT)[number]; index: number; size?: "lg" | "sm" }) {
  const { t } = useLang();
  const a = areaOf(item.key);
  const I = item.icon;
  return (
    <motion.a
      href={a.href}
      {...external(a.href)}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.4 + index * 0.08 }}
      className="group flex flex-col items-center gap-1.5 text-center"
    >
      <span
        className={cn(
          "grid place-items-center rounded-full bg-gradient-to-br text-white shadow-[0_14px_26px_-12px_rgba(15,31,61,0.6)] ring-4 ring-white transition-transform duration-300 group-hover:scale-110",
          item.tone,
          size === "lg" ? "size-14 xl:size-16" : "size-12",
        )}
      >
        <I size={size === "lg" ? 28 : 24} weight="duotone" />
      </span>
      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[12px] font-semibold leading-tight text-navy backdrop-blur transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
        {t(areaLabel(item.key))}
      </span>
    </motion.a>
  );
}

function Orbit() {
  return (
    <div className="group/orbit relative mx-auto aspect-square w-full max-w-[560px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full text-brand" aria-hidden>
        <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.35" strokeDasharray="1 1.5" />
        <circle cx="50" cy="50" r="38.5" fill="none" stroke="white" strokeWidth="1.4" />
      </svg>
      <span className="absolute inset-0 animate-spin-slow motion-reduce:animate-none" aria-hidden>
        <span className="absolute left-1/2 top-[6%] size-2.5 -translate-x-1/2 rounded-full bg-brand shadow-[0_0_0_5px_rgba(255,255,255,0.8)]" />
      </span>
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="absolute inset-[17%] overflow-hidden rounded-full shadow-[0_30px_60px_-28px_rgba(15,31,61,0.65)] ring-[10px] ring-white"
      >
        <img src={asset(PHOTOS.skyline)} alt="" className="size-full scale-110 object-cover object-[55%_60%] motion-safe:animate-[drift_18s_ease-in-out_infinite]" />
        <span className="absolute inset-0 bg-brand opacity-10 mix-blend-color" aria-hidden />
      </motion.div>
      <div className={cn("absolute inset-0", SWAY)} style={{ transformOrigin: "50% 50%" }}>
        {ORBIT.map((o, i) => {
          const rad = (o.angle * Math.PI) / 180;
          return (
            <div key={o.key} className="absolute -translate-x-1/2 -translate-y-[30%]" style={{ left: `${50 + 44 * Math.cos(rad)}%`, top: `${50 + 44 * Math.sin(rad)}%` }}>
              <div className={SWAY_BACK}>
                <Float index={i}>
                  <OrbitBubble item={o} index={i} />
                </Float>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BrightHero() {
  const { t } = useLang();
  const services = areaOf("services");
  return (
    <section className="relative grid items-center gap-8 overflow-x-clip px-4 pb-4 pt-2 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-4">
      <span
        aria-hidden
        className="pointer-events-none absolute left-[38%] top-10 hidden size-24 bg-[radial-gradient(circle,var(--color-brand)_1.2px,transparent_1.4px)] bg-[length:12px_12px] opacity-30 lg:block"
      />
      <div>
        <h1 className="font-serif text-[44px] leading-[1.02] text-navy transition-colors duration-500 sm:text-[60px] xl:text-[72px]">
          <RiseLines lines={[{ text: t(HERO.pre) }, { text: t(HERO.accent), className: "text-brand transition-colors duration-500" }]} />
        </h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.45 }} className="mt-5 max-w-md text-[16px] leading-relaxed text-ink/80">
          {t(HERO.body)}
        </motion.p>
        <motion.a
          href={services.href}
          {...external(services.href)}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.6 }}
          className="group relative mt-7 inline-flex items-center gap-3 overflow-hidden rounded-full bg-brand px-6 py-3.5 text-[14.5px] font-semibold text-white shadow-[0_18px_34px_-14px_rgba(0,0,0,0.5)] transition-colors duration-300 hover:bg-navy"
        >
          <Sheen />
          {t(HERO.cta)}
          <ArrowRight weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
        </motion.a>
        <ul className="mt-9 grid max-w-2xl grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-line">
          {ABOUT.stats.map((s, i) => {
            const { icon: I, tone } = STAT_ICONS[i];
            return (
              <motion.li
                key={s.label.en}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.5 + i * 0.08 }}
                className="flex items-start gap-2.5 sm:px-4 sm:first:pl-0"
              >
                <I size={30} weight="duotone" className={cn("mt-0.5 shrink-0", tone)} />
                <span className="min-w-0">
                  <CountUp value={s.value} className="block font-display text-[19px] font-bold leading-none text-navy" />
                  <span className="mt-1 block text-[11.5px] leading-snug text-muted">{t(s.label)}</span>
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>
      <div className="hidden sm:block">
        <Orbit />
      </div>
      <div className="sm:hidden">
        <div className="mx-auto mb-5 aspect-square w-3/4 overflow-hidden rounded-full ring-8 ring-white">
          <img src={asset(PHOTOS.skyline)} alt="" className="size-full object-cover object-[55%_60%]" />
        </div>
        <div className="grid grid-cols-3 gap-y-4">
          {ORBIT.map((o, i) => (
            <OrbitBubble key={o.key} item={o} index={i} size="sm" />
          ))}
        </div>
      </div>
      <a
        href="https://commons.wikimedia.org/wiki/File:Skyline_of_Varthur,_Bangalore.jpg"
        {...external("https://commons.wikimedia.org/")}
        className="absolute bottom-0 right-4 hidden rounded-full bg-white/70 px-2 py-0.5 text-[9.5px] text-muted backdrop-blur transition-colors hover:bg-brand hover:text-white md:right-8 lg:block"
      >
        {t(HERO.credit)}
      </a>
    </section>
  );
}

/* ---------- Search and quick actions ---------- */

const SEARCH = {
  title: t2("Search BDA", "ಬಿಡಿಎ ಹುಡುಕಿ"),
  sub: t2("Find layouts, sites, services, departments and more", "ಬಡಾವಣೆ, ನಿವೇಶನ, ಸೇವೆ, ವಿಭಾಗಗಳು ಮತ್ತು ಇನ್ನಷ್ಟು ಹುಡುಕಿ"),
  placeholder: t2("Search for layouts, e-auction sites, services, departments...", "ಬಡಾವಣೆ, ಇ-ಹರಾಜು ನಿವೇಶನ, ಸೇವೆ, ವಿಭಾಗಗಳನ್ನು ಹುಡುಕಿ..."),
  submit: t2("Search", "ಹುಡುಕಿ"),
  popular: t2("Popular:", "ಜನಪ್ರಿಯ:"),
  quick: t2("Quick Actions", "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು"),
  quickSub: t2("Most used services at your fingertips", "ಹೆಚ್ಚು ಬಳಸುವ ಸೇವೆಗಳು ನಿಮ್ಮ ಬೆರಳ ತುದಿಯಲ್ಲಿ"),
  none: t2("No matching services. Try another word.", "ಯಾವುದೇ ಸೇವೆ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಪದ ಪ್ರಯತ್ನಿಸಿ."),
};

const POPULAR: { label: Text; href: string }[] = [
  { label: t2("E-Auction", "ಇ-ಹರಾಜು"), href: svc("auction") },
  { label: t2("BDA Layouts", "ಬಿಡಿಎ ಬಡಾವಣೆಗಳು"), href: svc("layouts") },
  { label: t2("Property Tax", "ಆಸ್ತಿ ತೆರಿಗೆ"), href: svc("tax") },
  { label: t2("RTI", "ಆರ್‌ಟಿಐ"), href: svc("rti") },
];

const QUICK_TONES = [
  "bg-blue-50 text-blue-600",
  "bg-emerald-50 text-emerald-600",
  "bg-orange-50 text-orange-500",
  "bg-violet-50 text-violet-600",
  "bg-teal-50 text-teal-600",
  "bg-pink-50 text-pink-600",
  "bg-indigo-50 text-indigo-600",
];

export function SearchAndQuick() {
  const { t } = useLang();
  const { query, setQuery } = usePrefs();
  const q = query.trim().toLowerCase();
  const items = CIVIC_QUICK.map((s, i) => ({ ...s, tone: QUICK_TONES[i % QUICK_TONES.length] })).filter(
    (s) => !q || s.label.en.toLowerCase().includes(q) || s.label.kn.includes(q),
  );
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 px-4 md:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <motion.section {...reveal} transition={{ duration: 0.6, ease: EASE }} className={cn(CARD, "p-5")}>
        <Heading icon={MagnifyingGlass} title={SEARCH.title} sub={SEARCH.sub} />
        <form
          role="search"
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(SEARCH.placeholder)}
            aria-label={t(SEARCH.placeholder)}
            className="w-full rounded-full border border-line bg-page py-3.5 pl-11 pr-16 text-[14px] text-ink outline-none transition-colors duration-300 placeholder:text-muted focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
          />
          <button
            type="submit"
            aria-label={t(SEARCH.submit)}
            className="absolute right-1.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-brand text-white shadow-md transition-colors hover:bg-navy"
          >
            <MagnifyingGlass size={18} weight="bold" />
          </button>
        </form>
        <motion.div {...stagger(0.06, 0.3)} className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
          <motion.span variants={ITEM_X} className="font-semibold text-muted">
            {t(SEARCH.popular)}
          </motion.span>
          {POPULAR.map((p) => (
            <motion.a
              key={p.href}
              href={p.href}
              {...external(p.href)}
              variants={ITEM}
              whileHover={{ y: -2 }}
              className="rounded-full border border-line bg-white px-3 py-1 font-semibold text-navy transition-colors duration-300 hover:border-brand hover:bg-brand hover:text-white"
            >
              {t(p.label)}
            </motion.a>
          ))}
        </motion.div>
      </motion.section>
      <motion.section id="services" {...reveal} transition={{ duration: 0.6, ease: EASE, delay: 0.08 }} className={cn(CARD, "scroll-mt-28 p-5")}>
        <Heading icon={Lightning} title={SEARCH.quick} sub={SEARCH.quickSub} />
        {items.length === 0 ? (
          <p className="rounded-2xl bg-page px-4 py-6 text-center text-[13px] text-muted">{t(SEARCH.none)}</p>
        ) : (
          <motion.ul {...stagger(0.06, 0.2)} className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
            <AnimatePresence mode="popLayout">
              {items.map((s) => {
                const I = s.icon;
                return (
                  <motion.li key={s.label.en} layout variants={ITEM} exit={{ opacity: 0, scale: 0.9 }}>
                    <a
                      href={s.href}
                      {...external(s.href)}
                      className={cn(
                        "group flex h-full min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl px-2 py-3 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-brand hover:text-white hover:shadow-lg",
                        s.tone,
                      )}
                    >
                      <I size={30} weight="duotone" className="transition-transform duration-300 group-hover:scale-110" />
                      <span className="text-[12px] font-semibold leading-tight text-navy group-hover:text-white">{t(s.label)}</span>
                    </a>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        )}
      </motion.section>
    </div>
  );
}

/* ---------- Explore Bengaluru ---------- */

const EXPLORE = {
  title: t2("Explore Bengaluru", "ಬೆಂಗಳೂರು ಅನ್ವೇಷಿಸಿ"),
  sub: t2("Find plots, sites and layouts across the city", "ನಗರದಾದ್ಯಂತ ನಿವೇಶನ ಮತ್ತು ಬಡಾವಣೆಗಳನ್ನು ಹುಡುಕಿ"),
  map: t2("Open Jurisdiction Map", "ವ್ಯಾಪ್ತಿ ನಕ್ಷೆ ತೆರೆಯಿರಿ"),
  explore: t2("Explore", "ಅನ್ವೇಷಿಸಿ"),
  city: t2("Bengaluru", "ಬೆಂಗಳೂರು"),
};

const LEFT: LayoutKind[] = ["residential", "commercial", "industrial"];
const RIGHT: LayoutKind[] = ["casite", "formed"];

const MAP_ROADS = [
  "M62 128 A88 72 0 1 1 238 128 A88 72 0 1 1 62 128",
  "M20 150 C 90 136 210 132 290 112",
  "M140 18 C 148 90 150 170 156 246",
];

function GreenMap() {
  return (
    <svg viewBox="0 0 300 260" className="absolute inset-0 size-full drop-shadow-[0_24px_30px_rgba(15,31,61,0.25)]" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="bright-land" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe3b4" />
          <stop offset="1" stopColor="#8fcb8a" />
        </linearGradient>
      </defs>
      <motion.path
        d="M70 30 L120 14 L150 26 L196 12 L236 34 L262 30 L284 70 L272 104 L292 140 L270 176 L276 214 L236 236 L196 228 L160 250 L118 236 L84 244 L52 214 L22 196 L30 158 L10 124 L34 92 L26 58 Z"
        fill="url(#bright-land)"
        stroke="white"
        strokeWidth="4"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE }}
        style={{ transformOrigin: "150px 130px", transformBox: "view-box" }}
      />
      <g fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="3 3">
        <path d="M70 30 L110 120 L60 214M196 12 L170 120 L236 236M10 124 L110 120 L170 120 L292 140M150 26 L140 250" />
      </g>
      <g fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
        {MAP_ROADS.map((d, i) => (
          <DrawPath key={d} d={d} delay={0.5 + i * 0.2} />
        ))}
      </g>
      <g fill="#a9d6f2" stroke="white" strokeWidth="1.2">
        <ellipse cx="92" cy="78" rx="12" ry="7" />
        <ellipse cx="214" cy="186" rx="13" ry="8" />
        <ellipse cx="226" cy="74" rx="8" ry="5" />
        <ellipse cx="88" cy="192" rx="9" ry="6" />
      </g>
    </svg>
  );
}

function Callout({ kind, active, onActivate, index }: { kind: LayoutKind; active: boolean; onActivate: () => void; index: number }) {
  const { t } = useLang();
  const l = LAYOUTS.find((x) => x.key === kind)!;
  return (
    <motion.a
      href={l.href}
      {...external(l.href)}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: EASE, delay: 0.15 + index * 0.07 }}
      className={cn(
        "group relative z-10 flex w-full items-center gap-3 rounded-2xl border p-2 pr-4 shadow-[0_16px_30px_-20px_rgba(15,31,61,0.6)] backdrop-blur transition-colors duration-300",
        active ? "border-brand bg-brand text-white" : "border-white bg-white/95 hover:border-brand hover:bg-brand hover:text-white",
      )}
    >
      <span className="size-14 shrink-0 overflow-hidden rounded-full ring-4 ring-white/80">
        <img src={asset(l.photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
      </span>
      <span className="min-w-0">
        <span className={cn("block text-[13px] font-semibold leading-tight", active ? "text-white" : "text-navy group-hover:text-white")}>{t(l.label)}</span>
        <span className={cn("mt-1 inline-flex items-center gap-1 text-[12px] font-semibold", active ? "text-white/90" : "text-brand group-hover:text-white")}>
          {t(EXPLORE.explore)}
          <ArrowRight size={12} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
      <span className="ml-auto size-2.5 shrink-0 rounded-full ring-2 ring-white" style={{ background: l.pin }} aria-hidden />
    </motion.a>
  );
}

export function ExploreMap() {
  const { t } = useLang();
  const [active, setActive] = useState<LayoutKind>("residential");
  return (
    <motion.section {...reveal} transition={{ duration: 0.6, ease: EASE }} className={cn(CARD, "relative flex flex-col overflow-hidden p-5")}>
      <Heading icon={SquaresFour} title={EXPLORE.title} sub={EXPLORE.sub} action={<More label={EXPLORE.map} href={svc("map")} />} />
      <div className="relative flex flex-1 items-center overflow-hidden rounded-2xl bg-gradient-to-b from-brand-soft/70 via-white to-emerald-50/70 p-4 transition-colors duration-500 lg:min-h-[400px]">
        <img
          src={asset(PHOTOS.skyline)}
          alt=""
          className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full object-cover object-[50%_75%] opacity-35 [mask-image:linear-gradient(to_bottom,#000,transparent)]"
          aria-hidden
        />
        <div className="relative grid w-full items-center gap-4 lg:grid-cols-[210px_minmax(0,1fr)_210px] 2xl:grid-cols-[230px_minmax(0,1fr)_230px]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {LEFT.map((k, i) => (
              <Callout key={k} kind={k} index={i} active={active === k} onActivate={() => setActive(k)} />
            ))}
          </div>
          <div className="relative mx-auto aspect-[300/260] w-full max-w-[520px] lg:-mx-6 lg:w-[calc(100%+3rem)] lg:max-w-none">
            <GreenMap />
            <span className="absolute left-1/2 top-[49%] z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-navy px-3 py-1 text-[12.5px] font-bold text-white shadow-lg transition-colors duration-500">
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {RIGHT.map((k, i) => (
              <Callout key={k} kind={k} index={i + 3} active={active === k} onActivate={() => setActive(k)} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ---------- Initiatives ---------- */

export function FeaturedInitiatives() {
  const { t } = useLang();
  const [lead, ...rest] = INITIATIVE_LIST;
  return (
    <motion.section {...reveal} transition={{ duration: 0.6, ease: EASE, delay: 0.08 }} className={cn(CARD, "flex flex-col p-5")}>
      <Heading icon={Lightbulb} title={t2("Current Initiatives", "ಪ್ರಸ್ತುತ ಉಪಕ್ರಮಗಳು")} action={<More label={t2("View All", "ಎಲ್ಲಾ ನೋಡಿ")} to="/sitemap" />} />
      <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <motion.a
          href={lead.href}
          {...external(lead.href)}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={LIFT}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
          className="group relative flex min-h-[260px] flex-col overflow-hidden rounded-2xl border border-line transition-colors duration-300 hover:border-brand hover:bg-brand">
          <span className="h-40 overflow-hidden">
            <img src={asset(lead.photo)} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
          </span>
          <span className="flex flex-1 flex-col p-3.5">
            <span className="font-display text-[15px] font-bold leading-snug text-navy group-hover:text-white">{t(lead.label)}</span>
            <span className="mt-1 text-[12px] leading-snug text-muted group-hover:text-white/85">{t(lead.sub)}</span>
            <span className="mt-auto grid size-9 place-self-end place-items-center rounded-full bg-navy text-white transition-colors group-hover:bg-white group-hover:text-brand">
              <ArrowRight size={15} weight="bold" />
            </span>
          </span>
        </motion.a>
        <motion.ul {...stagger(0.1, 0.25)} className="flex flex-col divide-y divide-line">
          {rest.map((it) => (
            <motion.li key={it.label.en} variants={ITEM_X} className="py-1.5 first:pt-0 last:pb-0">
              <a href={it.href} {...external(it.href)} className="group flex items-center gap-3 rounded-2xl p-1.5 transition-colors duration-300 hover:bg-brand">
                <span className="size-16 shrink-0 overflow-hidden rounded-xl">
                  <img src={asset(it.photo)} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold leading-snug text-navy group-hover:text-white">{t(it.label)}</span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-muted group-hover:text-white/85">{t(it.sub)}</span>
                </span>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-page text-navy transition-colors group-hover:bg-white group-hover:text-brand">
                  <CaretRight size={13} weight="bold" />
                </span>
              </a>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </motion.section>
  );
}

/* ---------- Helpline ---------- */

export function HelplineCard() {
  const { t } = useLang();
  const help = hl("helpline");
  return (
    <motion.a
      href={help.href}
      {...reveal}
      transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
      className="group relative flex h-full items-center gap-4 overflow-hidden rounded-[22px] bg-gradient-to-br from-navy to-brand p-6 text-white shadow-[0_22px_50px_-28px_rgba(15,31,61,0.7)] transition-colors duration-500"
    >
      <Sheen />
      <span className="pointer-events-none absolute -right-10 -top-12 size-40 animate-ping-soft rounded-full border-[18px] border-white/10" aria-hidden />
      <motion.span
        animate={{ rotate: [0, -12, 10, -6, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 2.6 }}
        className="grid size-16 shrink-0 place-items-center rounded-full bg-white/15"
      >
        <Headset size={34} weight="duotone" />
      </motion.span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{t(help.title)}</span>
        <span className="mt-0.5 block whitespace-nowrap font-display text-[20px] font-bold tracking-wide">{ORG.helpline}</span>
      </span>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brand transition-transform duration-300 group-hover:translate-x-1">
        <ArrowRight size={16} weight="bold" />
      </span>
    </motion.a>
  );
}
