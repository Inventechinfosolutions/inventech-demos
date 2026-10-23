import {
  ArrowRight,
  Buildings,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  FilePdf,
  FileText,
  Gavel,
  Gear,
  HouseLine,
  Leaf,
  LinkSimple,
  MapPin,
  MapTrifold,
  Megaphone,
  Phone,
  Plant,
  CalendarBlank,
  SquaresFour,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { GreenMap } from "@/components/bright/BrightSections";
import { QUICK as CIVIC_QUICK, INITIATIVE_ORDER, INITIATIVE_STYLE, LINKS as CIVIC_LINKS } from "@/components/civic/CivicSections";
import { INITIATIVE_LIST, LAYOUTS, Pin, type LayoutKind } from "@/components/dashboard/DashSections";
import { areaLabel, areaOf, Landmarks } from "@/components/dashboard/DashShell";
import { IconPop, ITEM, ITEM_X, LIFT, Sheen, stagger } from "@/components/dashboard/motion";
import { Fern, SoftLeaf } from "@/components/garden/GardenDecor";
import { CountUp, EASE } from "@/components/home/shared";
import { UPDATES, UPDATE_TABS, type UpdateTab } from "@/components/portal/PortalUpdates";
import { ABOUT, HIGHLIGHTS, ORG, SERVICES, VALUES } from "@/lib/content";
import type { AreaKey } from "@/lib/ia";
import { VALUE_ICONS } from "@/lib/icons";
import { useLang, type Text } from "@/lib/i18n";
import { PHOTOS } from "@/lib/photos";
import { usePrefs } from "@/lib/prefs";
import { asset, cn, dateParts, external } from "@/lib/utils";

const t2 = (en: string, kn: string): Text => ({ en, kn });
const svc = (icon: (typeof SERVICES)[number]["icon"]) => SERVICES.find((s) => s.icon === icon)!.href;
const hl = (key: (typeof HIGHLIGHTS)[number]["key"]) => HIGHLIGHTS.find((h) => h.key === key)!;

const CARD = "rounded-[28px] border border-white bg-white/90 shadow-[0_24px_60px_-34px_rgba(15,31,61,0.45)] backdrop-blur";
const ROUND_BTN =
  "grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white text-navy shadow-[0_10px_22px_-12px_rgba(15,31,61,0.45)] transition-colors duration-300 hover:border-brand hover:bg-brand hover:text-white";
const VIEW_ALL = t2("View All", "ಎಲ್ಲಾ ನೋಡಿ");
const reveal = { initial: { opacity: 0, y: 26 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" } } as const;

function SideTitle({ icon: I, tone, title, sub, className }: { icon: Icon; tone: string; title: Text; sub: Text; className?: string }) {
  const { t } = useLang();
  return (
    <div className={className}>
      <div className="flex items-center gap-2.5">
        <IconPop className={cn("grid size-10 shrink-0 place-items-center rounded-full", tone)}>
          <I size={22} weight="duotone" />
        </IconPop>
        <h2 className="font-display text-[21px] font-bold leading-tight text-navy">{t(title)}</h2>
      </div>
      <p className="mt-2 max-w-[13rem] text-[13px] leading-snug text-muted">{t(sub)}</p>
    </div>
  );
}

function MoreLink({ to, href, label = VIEW_ALL }: { to?: string; href?: string; label?: Text }) {
  const { t } = useLang();
  const cls = "group inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white";
  const body = (
    <>
      {t(label)}
      <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
    </>
  );
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <a href={href} {...external(href ?? "")} className={cls}>
      {body}
    </a>
  );
}

/* ---------- Hero ---------- */

const HERO = {
  eyebrow: ORG.name,
  shaping: t2("Shaping", "ತಲೆಮಾರುಗಳಿಗಾಗಿ"),
  city: t2("Bengaluru", "ಬೆಂಗಳೂರಿನ"),
  forWord: t2("for", ""),
  generations: t2("Generations", "ನಿರ್ಮಾಣ"),
  body: t2(
    "Planned layouts. Sustainable development. Vibrant communities. A global city for tomorrow.",
    "ಯೋಜಿತ ಬಡಾವಣೆಗಳು. ಸುಸ್ಥಿರ ಅಭಿವೃದ್ಧಿ. ಚೈತನ್ಯಶೀಲ ಸಮುದಾಯಗಳು. ನಾಳೆಗಾಗಿ ಜಾಗತಿಕ ನಗರ.",
  ),
  cta: t2("Explore BDA", "ಬಿಡಿಎ ಅನ್ವೇಷಿಸಿ"),
  commitment: t2("Our Commitment", "ನಮ್ಮ ಬದ್ಧತೆ"),
  explore: t2("Explore BDA", "ಬಿಡಿಎ ಅನ್ವೇಷಿಸಿ"),
  exploreSub: t2("Find information and access services across BDA's key areas", "ಬಿಡಿಎಯ ಪ್ರಮುಖ ವಿಭಾಗಗಳಲ್ಲಿ ಮಾಹಿತಿ ಮತ್ತು ಸೇವೆಗಳನ್ನು ಪಡೆಯಿರಿ"),
  credit: t2("Photo: Varthur skyline by SlowPhoton, CC BY-SA 4.0", "ಛಾಯಾಚಿತ್ರ: ವರ್ತೂರು, SlowPhoton, CC BY-SA 4.0"),
};

const FAN: { key: AreaKey; icon: Icon; card: string; bubble: string }[] = [
  { key: "services", icon: Gear, card: "from-violet-50 to-violet-100/80", bubble: "bg-violet-200/70 text-violet-700" },
  { key: "property", icon: HouseLine, card: "from-emerald-50 to-emerald-100/80", bubble: "bg-emerald-200/70 text-emerald-700" },
  { key: "departments", icon: UsersThree, card: "from-orange-50 to-amber-100/80", bubble: "bg-orange-200/70 text-orange-600" },
  { key: "planning", icon: ChartLineUp, card: "from-sky-50 to-blue-100/80", bubble: "bg-blue-200/70 text-blue-700" },
  { key: "information", icon: FileText, card: "from-pink-50 to-rose-100/80", bubble: "bg-rose-200/70 text-rose-600" },
  { key: "news", icon: Megaphone, card: "from-indigo-50 to-violet-100/80", bubble: "bg-indigo-200/70 text-indigo-700" },
];

const FAN_ANGLES = [-36, -21, -7, 7, 21, 36];
const FAN_R = 720;

function FanCard({ item, index, active, onHover }: { item: (typeof FAN)[number]; index: number; active: boolean; onHover: () => void }) {
  const { t } = useLang();
  const a = areaOf(item.key);
  const I = item.icon;
  const deg = FAN_ANGLES[index];
  const rad = (deg * Math.PI) / 180;
  const x = Math.sin(rad) * FAN_R;
  const y = (1 - Math.cos(rad)) * FAN_R;
  return (
    <motion.a
      href={a.href}
      {...external(a.href)}
      onMouseEnter={onHover}
      onFocus={onHover}
      initial={{ opacity: 0, y: y + 60, rotate: deg * 1.6, x: "-50%" }}
      animate={{ opacity: 1, y: active ? y - 14 : y, rotate: deg * 0.55, x: "-50%", scale: active ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 20, delay: active ? 0 : 0.3 + index * 0.07 }}
      style={{ left: `calc(50% + ${x}px)`, zIndex: active ? 20 : 10 - Math.round(Math.abs(index - 2.5) * 2) }}
      className={cn(
        "group absolute top-0 flex h-[156px] w-[176px] origin-bottom flex-col items-center justify-center gap-3 rounded-[30px] border-2 border-white bg-gradient-to-b px-3 text-center shadow-[0_24px_40px_-24px_rgba(15,31,61,0.55)] transition-colors duration-300 hover:from-brand hover:to-brand",
        item.card,
        active && "shadow-[0_30px_50px_-22px_rgba(15,31,61,0.6)]",
      )}
    >
      <span className={cn("grid size-14 place-items-center rounded-full ring-4 ring-white/80 transition-colors duration-300 group-hover:bg-white group-hover:text-brand", item.bubble)}>
        <I size={28} weight="duotone" />
      </span>
      <span className="text-[14px] font-semibold leading-tight text-navy transition-colors group-hover:text-white">{t(areaLabel(item.key))}</span>
    </motion.a>
  );
}

function ExploreFan() {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(2);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || reduce) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % FAN.length), 3200);
    return () => window.clearTimeout(id);
  }, [active, paused, reduce]);
  const step = (dir: 1 | -1) => setActive((a) => (a + dir + FAN.length) % FAN.length);
  const about = areaOf("about");
  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative mx-auto hidden h-[330px] w-[1180px] origin-top max-xl:scale-[0.82] max-xl:-mb-16 lg:block">
        {FAN.map((f, i) => (
          <FanCard key={f.key} item={f} index={i} active={active === i} onHover={() => setActive(i)} />
        ))}
        <button type="button" onClick={() => step(-1)} aria-label="Previous" className={cn(ROUND_BTN, "absolute left-[4px] top-[150px] z-30")}>
          <CaretLeft size={16} weight="bold" />
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Next" className={cn(ROUND_BTN, "absolute right-[4px] top-[150px] z-30")}>
          <CaretRight size={16} weight="bold" />
        </button>
        <motion.a
          href={about.href}
          {...external(about.href)}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.8 }}
          className="group absolute left-1/2 top-[120px] z-30 flex -translate-x-1/2 flex-col items-center"
        >
          <span className="relative grid size-[104px] place-items-center rounded-full bg-white shadow-[0_18px_40px_-16px_rgba(15,31,61,0.55)] ring-[6px] ring-white/70 transition-transform duration-300 group-hover:scale-105">
            <span className="absolute inset-1.5 animate-spin-slow rounded-full border-2 border-dashed border-brand/25" aria-hidden />
            <img src={asset("images/bda-logo.jpg")} alt="BDA" className="size-[76px] rounded-full object-contain" />
          </span>
        </motion.a>
        <div className="absolute inset-x-0 top-[244px] z-20 flex justify-center">
          <div className="rounded-2xl bg-white/75 px-4 py-1.5 text-center backdrop-blur-sm">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.3em] text-navy [&:lang(kn)]:tracking-normal">{t(HERO.explore)}</p>
            <p className="mt-0.5 text-[13px] text-muted">{t(HERO.exploreSub)}</p>
          </div>
        </div>
      </div>
      <div className="lg:hidden">
        <p className="mb-3 text-center text-[12px] font-bold uppercase tracking-[0.3em] text-navy [&:lang(kn)]:tracking-normal">{t(HERO.explore)}</p>
        <motion.ul {...stagger(0.06, 0.1)} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FAN.map((f) => {
            const a = areaOf(f.key);
            const I = f.icon;
            return (
              <motion.li key={f.key} variants={ITEM}>
                <a
                  href={a.href}
                  {...external(a.href)}
                  className={cn("group flex h-full flex-col items-center gap-2 rounded-3xl border-2 border-white bg-gradient-to-b px-2 py-4 text-center shadow-md transition-colors hover:from-brand hover:to-brand", f.card)}
                >
                  <span className={cn("grid size-12 place-items-center rounded-full ring-4 ring-white/80 group-hover:bg-white group-hover:text-brand", f.bubble)}>
                    <I size={24} weight="duotone" />
                  </span>
                  <span className="text-[13px] font-semibold leading-tight text-navy group-hover:text-white">{t(areaLabel(f.key))}</span>
                </a>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </div>
  );
}

function Commitment() {
  const { t } = useLang();
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
      className="absolute right-6 top-6 z-20 hidden w-[232px] rounded-3xl border border-white bg-white/85 p-4 shadow-[0_24px_50px_-26px_rgba(15,31,61,0.55)] backdrop-blur-md xl:block"
    >
      <p className="font-display text-[16px] font-bold leading-tight text-navy">{t(HERO.commitment)}</p>
      <motion.ul {...stagger(0.08, 0.9, false)} className="mt-3 space-y-1">
        {VALUES.map((v) => {
          const I = VALUE_ICONS[v.key];
          return (
            <motion.li key={v.key} variants={ITEM_X} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-[12.5px] font-medium text-ink">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <I size={17} weight="duotone" />
              </span>
              {t(v.label)}
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.div>
  );
}

export function HorizonHero() {
  const { t } = useLang();
  const services = areaOf("services");
  return (
    <section className="relative isolate overflow-x-clip pb-6">
      <SoftLeaf className="-left-6 top-40 hidden h-40 w-20 -rotate-[30deg] md:block" tone="mint" opacity={0.5} />
      <SoftLeaf className="left-4 top-[22rem] hidden h-24 w-12 rotate-[25deg] md:block" tone="teal" opacity={0.35} delay={0.4} />
      <Fern className="-right-2 top-[30rem] hidden h-44 w-20 rotate-[18deg] lg:block" />
      <div className="relative mx-auto max-w-site px-5 lg:px-8">
        <div className="relative grid gap-6 pt-6 lg:min-h-[360px] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="relative z-10 pt-4 lg:pt-10">
            <motion.p
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.28em" }}
              transition={{ duration: 0.9, ease: EASE }}
              className="text-[11px] font-bold uppercase text-navy/75 [&:lang(kn)]:!tracking-normal"
            >
              {t(HERO.eyebrow)}
            </motion.p>
            <h1 className="mt-3 font-display leading-[1.02] text-navy [&:lang(kn)]:leading-[1.3]">
              {[
                <span key="a" className="text-[40px] font-medium sm:text-[50px]">{t(HERO.shaping)}</span>,
                <span key="b" className="text-[46px] font-bold sm:text-[60px]">{t(HERO.city)}</span>,
                <span key="c" className="text-[40px] font-bold sm:text-[54px]">
                  {t(HERO.forWord) && <>{t(HERO.forWord)} </>}
                  <span className="text-emerald-600">{t(HERO.generations)}</span>
                </span>,
              ].map((line, i) => (
                <span key={i} className="block overflow-hidden pb-[0.06em]">
                  <motion.span className="block" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.85, ease: EASE, delay: 0.15 + i * 0.12 }}>
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.55 }} className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink/80">
              {t(HERO.body)}
            </motion.p>
            <motion.a
              href={services.href}
              {...external(services.href)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.7 }}
              className="group relative mt-6 inline-flex items-center gap-3 overflow-hidden rounded-full bg-navy px-6 py-3 text-[14px] font-semibold text-white shadow-[0_16px_30px_-14px_rgba(15,31,61,0.7)] transition-colors hover:bg-brand"
            >
              <Sheen />
              {t(HERO.cta)}
              <ArrowRight weight="bold" className="transition-transform group-hover:translate-x-1" />
            </motion.a>
          </div>
          <div className="relative min-h-[240px] sm:min-h-[320px] lg:-mb-[170px] lg:-mr-8 lg:-mt-6 lg:h-[600px]">
            <svg width="0" height="0" className="absolute" aria-hidden>
              <clipPath id="horizon-blob" clipPathUnits="objectBoundingBox">
                <path d="M0.16,0 L1,0 L1,0.86 C0.9,0.92 0.78,0.84 0.66,0.9 C0.52,0.97 0.4,1 0.26,0.93 C0.12,0.86 0.02,0.74 0.03,0.56 C0.04,0.42 0.12,0.34 0.08,0.2 C0.06,0.1 0.1,0.03 0.16,0 Z" />
              </clipPath>
            </svg>
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: EASE }}
              className="absolute inset-0 overflow-hidden [clip-path:url(#horizon-blob)]"
            >
              <img src={asset(PHOTOS.skyline)} alt="" className="size-full object-cover object-[55%_55%] contrast-110 saturate-[1.35] motion-safe:animate-[kenburns_24s_ease-in-out_infinite_alternate]" />
              <span className="absolute inset-0 bg-gradient-to-t from-sky-100/70 via-transparent to-amber-50/20" aria-hidden />
            </motion.div>
            <Commitment />
            <a
              href="https://commons.wikimedia.org/wiki/File:Skyline_of_Varthur,_Bangalore.jpg"
              {...external("https://commons.wikimedia.org/")}
              className="absolute right-6 top-[262px] z-10 hidden rounded-full bg-white/70 px-2 py-0.5 text-[9.5px] text-muted backdrop-blur transition-colors hover:bg-brand hover:text-white lg:block"
            >
              {t(HERO.credit)}
            </a>
          </div>
        </div>
        <div className="relative z-10 mt-6 lg:-mt-40">
          <ExploreFan />
        </div>
      </div>
    </section>
  );
}

/* ---------- Quick citizen services ---------- */

const QUICK_TONES = [
  "bg-sky-100 text-sky-600",
  "bg-emerald-100 text-emerald-600",
  "bg-orange-100 text-orange-500",
  "bg-blue-100 text-blue-600",
  "bg-amber-100 text-amber-600",
  "bg-teal-100 text-teal-600",
  "bg-indigo-100 text-indigo-600",
];

export function QuickCitizenServices() {
  const { t } = useLang();
  const { query } = usePrefs();
  const ref = useRef<HTMLUListElement>(null);
  const q = query.trim().toLowerCase();
  const help = hl("helpline");
  const items = [
    ...CIVIC_QUICK.map((s, i) => ({ ...s, tone: QUICK_TONES[i % QUICK_TONES.length], sub: undefined as string | undefined })),
    { icon: Phone, label: help.title, href: help.href, tone: "bg-rose-100 text-rose-600", sub: ORG.helpline },
  ].filter((s) => !q || s.label.en.toLowerCase().includes(q) || s.label.kn.includes(q));
  return (
    <motion.section id="services" {...reveal} transition={{ duration: 0.6, ease: EASE }} className="mx-auto max-w-site scroll-mt-28 px-5 lg:px-8">
      <div className={cn(CARD, "relative flex flex-col gap-4 overflow-hidden p-5 lg:flex-row lg:items-center lg:gap-6 lg:p-6")}>
        <span className="pointer-events-none absolute -left-16 -top-10 size-64 rounded-full bg-gradient-to-br from-emerald-100 via-emerald-50 to-transparent" aria-hidden />
        <SideTitle
          icon={Leaf}
          tone="bg-emerald-100 text-emerald-600"
          title={t2("Quick Citizen Services", "ತ್ವರಿತ ನಾಗರಿಕ ಸೇವೆಗಳು")}
          sub={t2("Most accessed services at your fingertips", "ಹೆಚ್ಚು ಬಳಸುವ ಸೇವೆಗಳು ನಿಮ್ಮ ಬೆರಳ ತುದಿಯಲ್ಲಿ")}
          className="relative shrink-0 lg:w-[220px]"
        />
        <motion.ul ref={ref} {...stagger(0.05, 0.15)} className="relative flex min-w-0 flex-1 snap-x gap-1 overflow-x-auto py-1 [scrollbar-width:none]">
          {items.length === 0 && <li className="px-3 py-4 text-[13px] text-muted">{t(t2("No matching services. Try another word.", "ಯಾವುದೇ ಸೇವೆ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಪದ ಪ್ರಯತ್ನಿಸಿ."))}</li>}
          {items.map((s) => {
            const I = s.icon;
            return (
              <motion.li key={s.label.en} variants={ITEM} className="w-[112px] shrink-0 snap-start">
                <a href={s.href} {...external(s.href)} className="group flex h-full flex-col items-center gap-2 rounded-2xl px-1.5 py-2.5 text-center transition-colors duration-300 hover:bg-brand">
                  <span className={cn("grid size-[60px] place-items-center rounded-full shadow-[0_10px_20px_-12px_rgba(15,31,61,0.5)] ring-4 ring-white transition-transform duration-300 group-hover:scale-110", s.tone)}>
                    <I size={28} weight="duotone" />
                  </span>
                  <span className="text-[12.5px] font-semibold leading-tight text-navy group-hover:text-white">{t(s.label)}</span>
                  {s.sub && <span className="-mt-1 text-[11.5px] font-bold text-navy group-hover:text-white">{s.sub}</span>}
                </a>
              </motion.li>
            );
          })}
        </motion.ul>
        <button
          type="button"
          onClick={() => ref.current?.scrollBy({ left: 300, behavior: "smooth" })}
          aria-label="Next"
          className={cn(ROUND_BTN, "relative hidden self-center lg:grid")}
        >
          <CaretRight size={16} weight="bold" />
        </button>
      </div>
    </motion.section>
  );
}

/* ---------- Initiatives ---------- */

const INIT_TONES = [
  { card: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", btn: "bg-emerald-500" },
  { card: "bg-orange-50", icon: "bg-orange-100 text-orange-500", btn: "bg-orange-500" },
  { card: "bg-violet-50", icon: "bg-violet-100 text-violet-600", btn: "bg-violet-500" },
  { card: "bg-pink-50", icon: "bg-pink-100 text-rose-500", btn: "bg-rose-500" },
];

export function HorizonInitiatives() {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const items = INITIATIVE_LIST.map((it, k) => ({ ...it, icon: INITIATIVE_STYLE[INITIATIVE_ORDER[k]].icon }));
  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  return (
    <section className="relative isolate mx-auto max-w-site px-5 lg:px-8">
      <SoftLeaf className="-left-2 bottom-0 hidden h-36 w-16 rotate-[-20deg] lg:block" tone="mint" opacity={0.45} />
      <div className="grid items-center gap-5 lg:grid-cols-[220px_auto_minmax(0,1fr)]">
        <SideTitle
          icon={Plant}
          tone="bg-emerald-100 text-emerald-600"
          title={t2("Current Initiatives", "ಪ್ರಸ್ತುತ ಉಪಕ್ರಮಗಳು")}
          sub={t2("Key initiatives for a sustainable and inclusive Bengaluru", "ಸುಸ್ಥಿರ ಮತ್ತು ಒಳಗೊಳ್ಳುವ ಬೆಂಗಳೂರಿಗಾಗಿ ಪ್ರಮುಖ ಉಪಕ್ರಮಗಳು")}
        />
        <button type="button" onClick={() => by(-1)} aria-label="Previous" className={cn(ROUND_BTN, "hidden lg:grid")}>
          <CaretLeft size={16} weight="bold" />
        </button>
        <div
          ref={ref}
          onScroll={(e) => {
            const el = e.currentTarget;
            setPage(Math.round((el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth)) * (items.length - 1)));
          }}
          className="-my-6 flex snap-x gap-5 overflow-x-auto px-3 py-6 [scrollbar-width:none]"
        >
          {items.map((it, i) => {
            const tone = INIT_TONES[i % INIT_TONES.length];
            const I = it.icon;
            return (
              <motion.a
                key={it.label.en}
                href={it.href}
                {...external(it.href)}
                initial={{ opacity: 0, y: 30, rotate: -2 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true }}
                whileHover={LIFT}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.1 }}
                className="group w-[250px] shrink-0 snap-start sm:w-[270px]"
              >
                <span className={cn("relative block -skew-x-6 overflow-hidden rounded-[26px] border-2 border-white shadow-[0_22px_40px_-26px_rgba(15,31,61,0.55)] transition-colors duration-300 group-hover:bg-brand", tone.card)}>
                  <span className="block skew-x-6">
                    <span className="block h-[130px] overflow-hidden">
                      <img src={asset(it.photo)} alt="" className="size-full scale-[1.15] object-cover transition-transform duration-700 group-hover:scale-125" />
                    </span>
                    <span className={cn("absolute left-5 top-[104px] grid size-12 place-items-center rounded-full ring-4 ring-white", tone.icon)}>
                      <I size={22} weight="duotone" />
                    </span>
                    <span className="flex min-h-[124px] flex-col px-5 pb-4 pt-8">
                      <span className="font-display text-[15px] font-bold leading-snug text-navy group-hover:text-white">{t(it.label)}</span>
                      <span className="mt-1 pr-8 text-[12px] leading-snug text-muted group-hover:text-white/85">{t(it.sub)}</span>
                      <span className={cn("ml-auto mt-auto grid size-8 place-items-center rounded-full text-white transition-colors group-hover:bg-white group-hover:text-brand", tone.btn)}>
                        <ArrowRight size={14} weight="bold" />
                      </span>
                    </span>
                  </span>
                </span>
              </motion.a>
            );
          })}
        </div>
      </div>
      <div className="mt-5 flex justify-center gap-2 lg:pl-[260px]">
        {items.map((it, i) => (
          <button
            key={it.label.en}
            type="button"
            aria-label={t(it.label)}
            onClick={() => {
              const el = ref.current;
              if (el) el.scrollTo({ left: (i / (items.length - 1)) * (el.scrollWidth - el.clientWidth), behavior: "smooth" });
            }}
            className={cn("h-2 rounded-full transition-all duration-300", page === i ? "w-6 bg-emerald-500" : "w-2 bg-line hover:bg-emerald-300")}
          />
        ))}
      </div>
    </section>
  );
}

/* ---------- Property & Land ---------- */

type LandTab = "layouts" | "eauction" | "flats" | "stray" | "ca" | "formed";

const LAND: { key: LandTab; icon: Icon; label: Text; title: Text; sub: Text; href: string; pins: LayoutKind }[] = [
  { key: "layouts", icon: SquaresFour, label: t2("BDA Layouts", "ಬಿಡಿಎ ಬಡಾವಣೆಗಳು"), title: t2("Explore BDA Layouts", "ಬಿಡಿಎ ಬಡಾವಣೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ"), sub: t2("Find plots, sites and layouts across Bengaluru", "ಬೆಂಗಳೂರಿನಾದ್ಯಂತ ನಿವೇಶನ ಮತ್ತು ಬಡಾವಣೆಗಳನ್ನು ಹುಡುಕಿ"), href: svc("layouts"), pins: "residential" },
  { key: "eauction", icon: Gavel, label: t2("E-Auction Sites", "ಇ-ಹರಾಜು ನಿವೇಶನಗಳು"), title: t2("E-Auction Sites", "ಇ-ಹರಾಜು ನಿವೇಶನಗಳು"), sub: t2("Register and bid for sites through transparent e-auction", "ಪಾರದರ್ಶಕ ಇ-ಹರಾಜಿನ ಮೂಲಕ ನೋಂದಾಯಿಸಿ ಬಿಡ್ ಮಾಡಿ"), href: svc("auction"), pins: "commercial" },
  { key: "flats", icon: Buildings, label: t2("Flats / Villas", "ಫ್ಲ್ಯಾಟ್ / ವಿಲ್ಲಾ"), title: t2("BDA Flats & Villas", "ಬಿಡಿಎ ಫ್ಲ್ಯಾಟ್ ಮತ್ತು ವಿಲ್ಲಾಗಳು"), sub: t2("Book a BDA flat or villa online", "ಬಿಡಿಎ ಫ್ಲ್ಯಾಟ್ ಅಥವಾ ವಿಲ್ಲಾ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಬುಕ್ ಮಾಡಿ"), href: svc("flats"), pins: "residential" },
  { key: "stray", icon: MapPin, label: t2("Stray Sites", "ಬಿಡಿ ನಿವೇಶನಗಳು"), title: t2("Stray Sites", "ಬಿಡಿ ನಿವೇಶನಗಳು"), sub: t2("Individual sites available across layouts", "ಬಡಾವಣೆಗಳಲ್ಲಿ ಲಭ್ಯವಿರುವ ಬಿಡಿ ನಿವೇಶನಗಳು"), href: svc("stray"), pins: "industrial" },
  { key: "ca", icon: MapPin, label: t2("CA Sites", "ಸಿಎ ನಿವೇಶನಗಳು"), title: t2("Civic Amenity Sites", "ನಾಗರಿಕ ಸೌಲಭ್ಯ ನಿವೇಶನಗಳು"), sub: t2("Sites reserved for public and civic purposes", "ಸಾರ್ವಜನಿಕ ಉದ್ದೇಶಗಳಿಗೆ ಮೀಸಲಾದ ನಿವೇಶನಗಳು"), href: svc("casite"), pins: "casite" },
  { key: "formed", icon: MapTrifold, label: t2("BDA Formed Layouts", "ಬಿಡಿಎ ರಚಿಸಿದ ಬಡಾವಣೆಗಳು"), title: t2("BDA Formed Layouts", "ಬಿಡಿಎ ರಚಿಸಿದ ಬಡಾವಣೆಗಳು"), sub: t2("Layouts developed and handed over by BDA", "ಬಿಡಿಎ ಅಭಿವೃದ್ಧಿಪಡಿಸಿ ಹಸ್ತಾಂತರಿಸಿದ ಬಡಾವಣೆಗಳು"), href: svc("formed"), pins: "formed" },
];

const STAT_ICONS: { icon: Icon; tone: string }[] = [
  { icon: HouseLine, tone: "text-blue-600" },
  { icon: Buildings, tone: "text-sky-600" },
  { icon: UsersThree, tone: "text-emerald-600" },
  { icon: Plant, tone: "text-green-600" },
];

export function PropertyLand() {
  const { t } = useLang();
  const [tab, setTab] = useState<LandTab>("layouts");
  const current = LAND.find((l) => l.key === tab)!;
  return (
    <motion.section {...reveal} transition={{ duration: 0.6, ease: EASE }} className="mx-auto max-w-site px-5 lg:px-8">
      <div className={cn(CARD, "grid gap-4 p-4 lg:grid-cols-[250px_minmax(0,1fr)_220px] lg:p-5")}>
        <div className="flex flex-col">
          <SideTitle
            icon={HouseLine}
            tone="bg-emerald-100 text-emerald-600"
            title={t2("Property & Land", "ಆಸ್ತಿ ಮತ್ತು ಭೂಮಿ")}
            sub={t2("Explore layouts, sites, flats and more across Bengaluru", "ಬೆಂಗಳೂರಿನಾದ್ಯಂತ ಬಡಾವಣೆ, ನಿವೇಶನ, ಫ್ಲ್ಯಾಟ್ ಮತ್ತು ಇನ್ನಷ್ಟು ಅನ್ವೇಷಿಸಿ")}
          />
          <motion.ul {...stagger(0.05, 0.2)} role="tablist" className="mt-4 grid grid-cols-2 gap-1.5 lg:grid-cols-1">
            {LAND.map((l) => {
              const on = l.key === tab;
              const I = l.icon;
              return (
                <motion.li key={l.key} variants={ITEM_X}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(l.key)}
                    onMouseEnter={() => setTab(l.key)}
                    className={cn(
                      "relative flex w-full items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition-colors duration-300",
                      on ? "border-emerald-200 text-navy" : "border-line bg-white text-navy hover:border-brand hover:bg-brand hover:text-white",
                    )}
                  >
                    {on && <motion.span layoutId="horizon-land" className="absolute inset-0 bg-emerald-50" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
                    <span className={cn("relative grid size-7 shrink-0 place-items-center rounded-lg", on ? "bg-emerald-500 text-white" : "bg-page text-brand")}>
                      <I size={16} weight="duotone" />
                    </span>
                    <span className="relative leading-tight">{t(l.label)}</span>
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
        <div className="relative min-h-[320px] overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-sky-50 to-emerald-100/60">
          <img
            src={asset(PHOTOS.skyline)}
            alt=""
            className="pointer-events-none absolute inset-x-0 top-0 h-28 w-full object-cover object-[50%_75%] opacity-30 [mask-image:linear-gradient(to_bottom,#000,transparent)]"
            aria-hidden
          />
          <div className="absolute inset-y-6 left-[6%] right-[22%] sm:right-[30%]">
            <div className="relative size-full">
              <GreenMap />
              <span className="absolute left-1/2 top-[48%] z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-navy px-3 py-1 text-[12.5px] font-bold text-white shadow-lg">
                {t(t2("Bengaluru", "ಬೆಂಗಳೂರು"))}
              </span>
              {LAYOUTS.flatMap((l) =>
                l.pins.map(([x, y], i) => (
                  <span key={`${l.key}-${i}`} style={{ left: `${x}%`, top: `${y}%`, zIndex: l.key === current.pins ? 5 : 1 }} className="absolute -translate-x-1/2 -translate-y-full">
                    <Pin color={l.pin} active={l.key === current.pins} delay={i * 0.25} />
                  </span>
                )),
              )}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.a
              key={tab}
              href={current.href}
              {...external(current.href)}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="group absolute bottom-5 right-5 z-20 w-[230px] rounded-2xl border border-white bg-white/95 p-4 shadow-[0_20px_40px_-24px_rgba(15,31,61,0.6)] backdrop-blur transition-colors hover:bg-brand"
            >
              <span className="block font-display text-[15px] font-bold text-navy group-hover:text-white">{t(current.title)}</span>
              <span className="mt-1 block pr-10 text-[12px] leading-snug text-muted group-hover:text-white/85">{t(current.sub)}</span>
              <span className="absolute bottom-4 right-4 grid size-8 place-items-center rounded-full bg-emerald-500 text-white transition-colors group-hover:bg-white group-hover:text-brand">
                <ArrowRight size={14} weight="bold" />
              </span>
            </motion.a>
          </AnimatePresence>
        </div>
        <motion.ul {...stagger(0.1, 0.25)} className="grid grid-cols-2 gap-2 rounded-3xl bg-gradient-to-b from-sky-50 to-blue-50 p-4 lg:grid-cols-1 lg:content-center">
          {ABOUT.stats.map((s, i) => {
            const { icon: I, tone } = STAT_ICONS[i];
            return (
              <motion.li key={s.label.en} variants={ITEM} className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
                <I size={34} weight="duotone" className={cn("shrink-0", tone)} />
                <span className="min-w-0">
                  <CountUp value={s.value} className="block font-display text-[20px] font-bold leading-none text-navy" />
                  <span className="mt-1 block text-[11.5px] leading-snug text-muted">{t(s.label)}</span>
                </span>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </motion.section>
  );
}

/* ---------- Updates and links ---------- */

function UpdatesCard() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<UpdateTab>("all");
  const items = useMemo(() => UPDATES.filter((u) => tab === "all" || u.tab === tab).slice(0, 4), [tab]);
  return (
    <motion.div {...reveal} transition={{ duration: 0.6, ease: EASE }} className={cn(CARD, "p-5")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <IconPop className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <CalendarBlank size={20} weight="duotone" />
          </IconPop>
          <h2 className="font-display text-[19px] font-bold text-navy">{t(t2("Latest Updates", "ಇತ್ತೀಚಿನ ಅಪ್‌ಡೇಟ್‌ಗಳು"))}</h2>
        </div>
        <MoreLink href={hl("news").href} />
      </div>
      <div role="tablist" className="mt-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {UPDATE_TABS.map((tb) => {
          const on = tb.key === tab;
          return (
            <button
              key={tb.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(tb.key)}
              className={cn("relative shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors", on ? "border-navy text-white" : "border-line text-navy hover:border-brand hover:bg-brand hover:text-white")}
            >
              {on && <motion.span layoutId="horizon-tab" className="absolute inset-0 rounded-full bg-navy" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className="relative">{t(tb.label)}</span>
            </button>
          );
        })}
      </div>
      <ul className="mt-3 divide-y divide-line">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((u, i) => {
            const d = u.date ? dateParts(u.date, lang) : null;
            return (
              <motion.li key={`${u.href}-${u.title.en}`} layout initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                <a href={u.href} {...external(u.href)} className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-brand">
                  <span className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-line bg-white py-1 text-navy">
                    {d ? (
                      <>
                        <span className="font-display text-[20px] font-bold leading-none">{d.day}</span>
                        <span className="mt-0.5 text-[9.5px] font-semibold uppercase text-muted">{d.monthYear}</span>
                      </>
                    ) : (
                      <CalendarBlank size={22} weight="duotone" className="my-1 text-brand" />
                    )}
                  </span>
                  <FilePdf size={20} weight="fill" className={cn("shrink-0 group-hover:text-white", u.pdf ? "text-rose-500" : "text-rose-300")} />
                  <span className="line-clamp-2 flex-1 text-[13px] font-medium leading-snug text-ink group-hover:text-white">{t(u.title)}</span>
                  <ArrowRight size={15} weight="bold" className="shrink-0 text-brand transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                </a>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </motion.div>
  );
}

function LinksCard() {
  const { t } = useLang();
  return (
    <motion.div {...reveal} transition={{ duration: 0.6, ease: EASE, delay: 0.08 }} className="relative isolate">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5">
          <IconPop className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
            <LinkSimple size={20} weight="bold" />
          </IconPop>
          <h2 className="font-display text-[19px] font-bold text-navy">{t(t2("Important Links", "ಪ್ರಮುಖ ಕೊಂಡಿಗಳು"))}</h2>
        </div>
        <MoreLink to="/sitemap" />
      </div>
      <motion.ul {...stagger(0.05, 0.2)} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CIVIC_LINKS.map((l) => {
          const I = l.icon;
          return (
            <motion.li key={l.label.en} variants={ITEM} whileHover={LIFT}>
              <a href={l.href} {...external(l.href)} className="group flex h-full items-center gap-2.5 rounded-2xl border border-white bg-white/90 p-3 shadow-[0_14px_30px_-22px_rgba(15,31,61,0.55)] transition-colors hover:bg-brand">
                <I size={24} weight="duotone" className="shrink-0 text-brand group-hover:text-white" />
                <span className="text-[12px] font-semibold leading-tight text-navy group-hover:text-white">{t(l.label)}</span>
              </a>
            </motion.li>
          );
        })}
      </motion.ul>
      <Landmarks className="pointer-events-none absolute -bottom-10 right-0 -z-10 hidden w-[340px] text-navy/25 lg:block" />
    </motion.div>
  );
}

export function UpdatesAndLinks(): ReactNode {
  return (
    <section className="mx-auto grid max-w-site grid-cols-[minmax(0,1fr)] gap-6 px-5 lg:grid-cols-2 lg:px-8">
      <UpdatesCard />
      <LinksCard />
    </section>
  );
}
