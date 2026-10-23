import {
  Buildings,
  CaretDown,
  CaretRight,
  Check,
  FacebookLogo,
  Heart,
  InstagramLogo,
  Leaf,
  List,
  MagnifyingGlass,
  Palette,
  Plant,
  UserCircle,
  UsersThree,
  X,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { ITEM_X, stagger } from "@/components/dashboard/motion";
import { Fern, SoftLeaf } from "@/components/garden/GardenDecor";
import { EASE } from "@/components/home/shared";
import { MegaContent } from "@/components/portal/PortalNav";
import { ONLINE_SERVICES, ORG, SERVICES, SITE, SOCIAL } from "@/lib/content";
import { AREAS, type AreaKey } from "@/lib/ia";
import { useLang, type Text } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { asset, cn, external } from "@/lib/utils";
import { SIDE, type SideItem } from "./plannerData";
import { PLANNER_THEMES, PlannerVariantContext, VARIANT_PATH, plannerThemeStyle, usePlannerTheme, usePlannerVariant, type PlannerThemeId, type PlannerVariant } from "./plannerTheme";

const t2 = (en: string, kn: string): Text => ({ en, kn });

const TEXT = {
  tagline: t2("Shaping Bengaluru's Tomorrow", "ಬೆಂಗಳೂರಿನ ನಾಳೆಯನ್ನು ರೂಪಿಸುತ್ತಿದೆ"),
  login: t2("Citizen Login", "ನಾಗರಿಕ ಲಾಗಿನ್"),
  search: t2("Search", "ಹುಡುಕಿ"),
  menu: t2("Open menu", "ಮೆನು ತೆರೆಯಿರಿ"),
  close: t2("Close menu", "ಮೆನು ಮುಚ್ಚಿ"),
  follow: t2("Follow Us", "ನಮ್ಮನ್ನು ಅನುಸರಿಸಿ"),
  theme: t2("Colour theme", "ಬಣ್ಣದ ಥೀಮ್"),
  new: t2("NEW", "ಹೊಸ"),
};

const NAV: { label: Text; area?: AreaKey; href?: string }[] = [
  { label: t2("About BDA", "ಬಿಡಿಎ ಬಗ್ಗೆ"), area: "about" },
  { label: t2("Properties & Layouts", "ಆಸ್ತಿ ಮತ್ತು ಬಡಾವಣೆಗಳು"), area: "property" },
  { label: t2("Auctions & Allotments", "ಹರಾಜು ಮತ್ತು ಹಂಚಿಕೆಗಳು"), href: `${SITE}/e-auction` },
  { label: t2("Planning & Development", "ಯೋಜನೆ ಮತ್ತು ಅಭಿವೃದ್ಧಿ"), area: "planning" },
  { label: t2("Online Services", "ಆನ್‌ಲೈನ್ ಸೇವೆಗಳು"), area: "services" },
  { label: t2("Notices & Documents", "ಸೂಚನೆಗಳು ಮತ್ತು ದಾಖಲೆಗಳು"), area: "information" },
  { label: t2("RTI", "ಆರ್‌ಟಿಐ"), href: `${SITE}/rti` },
  { label: t2("Contact Us", "ಸಂಪರ್ಕಿಸಿ"), href: `${SITE}/contact` },
];

const navHref = (n: (typeof NAV)[number]) => n.href ?? AREAS.find((a) => a.key === n.area)!.href;

const LOGINS = [
  ONLINE_SERVICES.find((s) => s.icon === "ptax")!,
  ONLINE_SERVICES.find((s) => s.icon === "betterment")!,
  ONLINE_SERVICES.find((s) => s.icon === "housing")!,
  SERVICES.find((s) => s.icon === "cdrms")!,
];

const SIZES = [
  { label: "A-", title: t2("Decrease text size", "ಅಕ್ಷರ ಗಾತ್ರ ಕಡಿಮೆ ಮಾಡಿ") },
  { label: "A", title: t2("Normal text size", "ಸಾಮಾನ್ಯ ಅಕ್ಷರ ಗಾತ್ರ") },
  { label: "A+", title: t2("Increase text size", "ಅಕ್ಷರ ಗಾತ್ರ ಹೆಚ್ಚಿಸಿ") },
];

export const SEARCH_ID = "planner-search";

function BdaLogo({ className }: { className?: string }) {
  return (
    <motion.img
      src={asset("images/bda-logo.jpg")}
      alt="BDA"
      whileHover={{ rotate: 360 }}
      transition={{ duration: 1.2, ease: EASE }}
      className={cn("shrink-0 rounded-full bg-white object-contain", className)}
    />
  );
}

function Brand() {
  const { t } = useLang();
  const variant = usePlannerVariant();
  return (
    <Link to={VARIANT_PATH[variant]} className="flex shrink-0 items-center gap-3">
      <BdaLogo className="size-[52px]" />
      <span className="hidden leading-tight sm:block">
        <span className="block text-[12.5px] font-bold text-navy">{ORG.name.en}</span>
        <span className="block text-[12.5px] font-semibold text-navy">{ORG.nameKn}</span>
        <span className="block text-[11px] text-muted">{t(TEXT.tagline)}</span>
      </span>
    </Link>
  );
}

function CitizenLogin() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 whitespace-nowrap rounded-full bg-[var(--pl-accent)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(140,90,30,0.8)] transition-colors duration-300 hover:bg-brand"
      >
        <UserCircle size={18} weight="fill" />
        <span className="hidden sm:inline">{t(TEXT.login)}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-xl border border-line bg-white p-1.5 shadow-xl"
          >
            {LOGINS.map((l) => (
              <li key={l.href}>
                <a href={l.href} {...external(l.href)} className="block rounded-lg px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-brand hover:text-white">
                  {t(l.label)}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemePicker({ theme, setTheme }: { theme: PlannerThemeId; setTheme: (id: PlannerThemeId) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t(TEXT.theme)}
        title={t(TEXT.theme)}
        className="grid size-10 place-items-center rounded-full bg-[var(--pl-chip)] text-navy transition-colors duration-300 hover:bg-brand hover:text-white"
      >
        <Palette size={18} weight="duotone" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-2 w-[300px] origin-top-right rounded-2xl border border-line bg-white p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]"
          >
            <p className="px-1 font-display text-[14px] font-semibold text-navy">{t(TEXT.theme)}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PLANNER_THEMES.map((th) => {
                const p = th.palette;
                const active = th.id === theme;
                return (
                  <button
                    key={th.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTheme(th.id)}
                    className={cn(
                      "group relative rounded-xl border-2 p-2 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-brand",
                      active ? "border-brand" : "border-line",
                    )}
                  >
                    <span className="flex h-14 flex-col overflow-hidden rounded-lg border border-black/5" style={{ background: `linear-gradient(180deg, ${p.page1}, ${p.page2})` }} aria-hidden>
                      <span className="flex h-3 items-center justify-end gap-0.5 px-1" style={{ background: p.header }}>
                        <span className="h-1.5 w-4 rounded-full" style={{ background: p.accent }} />
                      </span>
                      <span className="flex flex-1 items-center gap-1 px-1.5">
                        <span className="h-4 w-5 rounded bg-white" />
                        <span className="h-1.5 w-8 rounded-full" style={{ background: p.ink }} />
                      </span>
                      <span className="h-2.5" style={{ background: p.footer }} />
                    </span>
                    <span className="mt-1.5 block text-[12px] font-semibold text-ink">{t(th.label)}</span>
                    {active && (
                      <motion.span layoutId="planner-theme-check" className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-brand text-white">
                        <Check size={12} weight="bold" />
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({ onMenu, theme, setTheme }: { onMenu: () => void; theme: PlannerThemeId; setTheme: (id: PlannerThemeId) => void }) {
  const { t, lang, setLang } = useLang();
  const { scaleIndex, setScaleIndex } = usePrefs();
  const [open, setOpen] = useState<AreaKey | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const { pathname } = useLocation();
  useEffect(() => setOpen(null), [pathname]);
  const show = (k: AreaKey) => {
    window.clearTimeout(timer.current);
    setOpen(k);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(null), 180);
  };
  const area = AREAS.find((a) => a.key === open);
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--pl-line)] bg-[var(--pl-header)] backdrop-blur" onMouseLeave={hide}>
      <div className="flex items-center gap-3 px-4 py-2.5 lg:px-5">
        <button type="button" onClick={onMenu} aria-label={t(TEXT.menu)} className="grid size-10 place-items-center rounded-full bg-[var(--pl-chip)] text-navy transition-colors hover:bg-brand hover:text-white xl:hidden">
          <List size={20} weight="bold" />
        </button>
        <Brand />
        <motion.nav {...stagger(0.04, 0.1, false)} aria-label="Primary" className="mx-auto hidden items-center xl:flex">
          {NAV.map((n) => {
            const href = navHref(n);
            const on = n.area && open === n.area;
            return (
              <motion.a
                key={n.label.en}
                variants={ITEM_X}
                href={href}
                {...external(href)}
                onMouseEnter={() => (n.area ? show(n.area) : hide())}
                onFocus={() => n.area && show(n.area)}
                aria-haspopup={n.area ? "true" : undefined}
                aria-expanded={n.area ? open === n.area : undefined}
                className={cn(
                  "relative whitespace-nowrap rounded-lg px-[7px] py-2 text-[11.5px] font-medium text-navy transition-colors duration-300 hover:bg-brand hover:text-white 2xl:px-3 2xl:text-[13px]",
                  on && "bg-brand text-white",
                )}
              >
                {t(n.label)}
              </motion.a>
            );
          })}
        </motion.nav>
        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <ThemePicker theme={theme} setTheme={setTheme} />
          <button
            type="button"
            aria-label={t(TEXT.search)}
            onClick={() => {
              const el = document.getElementById(SEARCH_ID) as HTMLInputElement | null;
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
              el?.focus({ preventScroll: true });
            }}
            className="grid size-10 place-items-center rounded-full bg-[var(--pl-chip)] text-navy transition-colors duration-300 hover:bg-brand hover:text-white"
          >
            <MagnifyingGlass size={18} weight="bold" />
          </button>
          <div role="group" aria-label="Language" className="hidden items-center text-[12.5px] font-semibold md:flex">
            {(["en", "kn"] as const).map((l, i) => (
              <span key={l} className="flex items-center">
                {i > 0 && <span className="mx-1 h-4 w-px bg-line" aria-hidden />}
                <button
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={cn("rounded-md px-2 py-1 transition-colors hover:bg-brand hover:text-white", lang === l ? "text-navy underline decoration-[var(--pl-accent)] decoration-2 underline-offset-4" : "text-muted")}
                >
                  {l === "en" ? "English" : "ಕನ್ನಡ"}
                </button>
              </span>
            ))}
          </div>
          <button type="button" onClick={() => setLang(lang === "en" ? "kn" : "en")} className="grid size-10 place-items-center rounded-full bg-[var(--pl-chip)] text-[13px] font-bold text-navy transition-colors hover:bg-brand hover:text-white md:hidden">
            {lang === "en" ? "ಕ" : "EN"}
          </button>
          <div className="hidden items-center lg:flex xl:hidden 2xl:flex">
            {SIZES.map((s, i) => (
              <button
                key={s.label}
                type="button"
                title={t(s.title)}
                aria-label={t(s.title)}
                aria-pressed={scaleIndex === i}
                onClick={() => setScaleIndex(i)}
                className={cn("grid h-8 min-w-8 place-items-center rounded-md px-1 text-[12.5px] font-semibold transition-colors hover:bg-brand hover:text-white", scaleIndex === i ? "text-navy" : "text-muted")}
              >
                {s.label}
              </button>
            ))}
          </div>
          <CitizenLogin />
        </div>
      </div>
      <AnimatePresence>
        {area && (
          <motion.div
            key="mega"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE }}
            onMouseEnter={() => window.clearTimeout(timer.current)}
            className="absolute inset-x-0 top-full hidden border-b border-line bg-white shadow-[0_30px_60px_-30px_rgba(11,44,107,0.45)] xl:block"
          >
            <MegaContent area={area} className="mx-auto max-w-site px-8 py-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function useSideFilter() {
  const { query } = usePrefs();
  const q = query.trim().toLowerCase();
  return (item: { title?: Text; label?: Text; sub?: Text }) => {
    if (!q) return true;
    const texts = [item.title, item.label, item.sub].filter(Boolean) as Text[];
    return texts.some((x) => x.en.toLowerCase().includes(q) || x.kn.includes(q));
  };
}

function SideLink({ item, featured = false }: { item: SideItem; featured?: boolean }) {
  const { t } = useLang();
  const I = item.icon;
  return (
    <a
      href={item.href}
      {...external(item.href)}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border px-2 py-[7px] transition-colors duration-300 hover:border-brand hover:bg-brand",
        featured
          ? "border-[var(--pl-accent)] bg-[var(--pl-accent)] shadow-[0_10px_22px_-12px_var(--pl-accent)] [&_*]:!text-white"
          : item.isNew
            ? "border-emerald-200 bg-emerald-50/80"
            : "border-transparent",
      )}
    >
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:bg-white", featured ? "bg-white/20" : cn(item.tone.tile, item.tone.icon))}>
        <I size={19} weight="duotone" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold text-navy group-hover:text-white">
          {t(item.title)}
          {item.isNew && <span className="rounded-full bg-emerald-600 px-1.5 py-px text-[9px] font-bold text-white group-hover:bg-white group-hover:text-brand">{t(TEXT.new)}</span>}
        </span>
        <span className="mt-0.5 block text-[10px] leading-snug text-muted group-hover:text-white/85">{t(item.sub)}</span>
      </span>
      <CaretRight size={12} weight="bold" className="shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-white" />
    </a>
  );
}

export function SideMenu({ className }: { className?: string }) {
  const keep = useSideFilter();
  const variant = usePlannerVariant();
  return (
    <motion.nav
      {...stagger(0.035, 0.2, false)}
      aria-label="Services"
      className={cn("flex flex-col gap-0.5 rounded-2xl border border-white bg-white/90 p-2 shadow-[0_18px_40px_-28px_rgba(60,45,20,0.45)]", className)}
    >
      {SIDE.filter(keep).map((s, i) => (
        <motion.div key={s.title.en} variants={ITEM_X}>
          <SideLink item={s} featured={variant === "skyline" && i === 0} />
        </motion.div>
      ))}
    </motion.nav>
  );
}

const PILLARS: { icon: typeof Plant; tone: string; label: Text }[] = [
  { icon: Leaf, tone: "text-[#e9b949]", label: t2("Planned Neighbourhoods", "ಯೋಜಿತ ನೆರೆಹೊರೆಗಳು") },
  { icon: UsersThree, tone: "text-[#7fd1b9]", label: t2("Sustainable Growth", "ಸುಸ್ಥಿರ ಬೆಳವಣಿಗೆ") },
  { icon: Buildings, tone: "text-[#f0a254]", label: t2("Better Infrastructure", "ಉತ್ತಮ ಮೂಲಸೌಕರ್ಯ") },
  { icon: Heart, tone: "text-[#7cc47f]", label: t2("Inclusive Bengaluru", "ಎಲ್ಲರನ್ನೊಳಗೊಂಡ ಬೆಂಗಳೂರು") },
];

const FOOT_LINKS: { label: Text; href: string; internal?: boolean }[] = [
  { label: t2("Sitemap", "ಸೈಟ್‌ಮ್ಯಾಪ್"), href: "/sitemap", internal: true },
  { label: t2("Disclaimer", "ಹಕ್ಕು ನಿರಾಕರಣೆ"), href: `${SITE}/about-us` },
  { label: t2("Accessibility", "ಪ್ರವೇಶಸಾಧ್ಯತೆ"), href: `${SITE}/about-us` },
  { label: t2("Terms of Use", "ಬಳಕೆಯ ನಿಯಮಗಳು"), href: `${SITE}/casite/terms-and-conditions` },
  { label: t2("Privacy Policy", "ಗೌಪ್ಯತಾ ನೀತಿ"), href: `${SITE}/casite/privacy-policy` },
];

const SOCIALS = [
  { icon: XLogo, href: SOCIAL.x, label: "X", tone: "bg-white text-black" },
  { icon: FacebookLogo, href: SOCIAL.facebook, label: "Facebook", tone: "bg-[#1877f2] text-white" },
  { icon: YoutubeLogo, href: SOCIAL.youtube, label: "YouTube", tone: "bg-[#ff0000] text-white" },
  { icon: InstagramLogo, href: SOCIAL.instagram, label: "Instagram", tone: "bg-[linear-gradient(45deg,#f9a825,#e91e63_55%,#8e24aa)] text-white" },
];

/** [x, width, top] of each tower in the footer skyline, on a 0-400 x 0-60 canvas. */
const SKY: [number, number, number][] = [
  [8, 10, 34], [20, 8, 26], [30, 12, 14], [44, 9, 30], [60, 14, 8], [76, 10, 22], [88, 8, 32], [108, 12, 18], [122, 10, 4], [134, 9, 24],
  [150, 16, 28], [170, 10, 12], [182, 12, 20], [214, 9, 30], [226, 13, 10], [242, 8, 26], [268, 11, 18], [282, 9, 34], [306, 12, 22],
  [320, 8, 30], [350, 10, 26], [364, 12, 16], [380, 9, 32],
];
const SKY_TREES: [number, number][] = [[54, 6], [100, 5], [204, 7], [258, 6], [296, 5], [338, 8], [394, 6]];

function FooterSkyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 60" fill="none" stroke="currentColor" strokeWidth="0.8" className={className} aria-hidden>
      <path d="M0 59.5h400" />
      {SKY.map(([x, w, top]) => (
        <g key={x}>
          <rect x={x} y={top} width={w} height={59.5 - top} />
          {Array.from({ length: Math.floor((56 - top) / 5) }, (_, i) => (
            <path key={i} d={`M${x + 2} ${top + 4 + i * 5}h${w - 4}`} strokeDasharray="1.4 1.2" strokeOpacity="0.8" />
          ))}
        </g>
      ))}
      {SKY_TREES.map(([x, r]) => (
        <g key={x}>
          <circle cx={x} cy={59.5 - r * 1.6} r={r} />
          <path d={`M${x} ${59.5 - r * 0.6}V59.5`} />
        </g>
      ))}
      <path d="M190 59.5V44h22v15.5M193 44v-6h16v6M196 38a5 5 0 0 1 10 0M201 33v-3" />
      {SKY.filter((_, i) => i % 3 === 0).map(([x, w, top], i) => (
        <motion.rect
          key={`l${x}`}
          x={x + w / 2 - 1}
          y={top + 6 + (i % 3) * 5}
          width="2"
          height="2"
          fill="#ffd98f"
          stroke="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.55, repeatDelay: 1.5 }}
        />
      ))}
    </svg>
  );
}

function Footer() {
  const { t } = useLang();
  return (
    <footer className="relative isolate mt-10 bg-[var(--pl-footer)] text-white">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 -top-[44px] h-[45px] w-full" aria-hidden>
        <path d="M0 30C200 4 420 2 640 22S1060 58 1440 6V60H0Z" fill="var(--pl-wave)" opacity="0.55" />
        <path d="M0 40C240 14 500 16 740 34S1150 50 1440 22V60H0Z" fill="var(--pl-footer)" />
      </svg>
      <motion.div {...stagger(0.06, 0.1)} className="relative flex flex-col gap-5 px-5 pb-4 pt-2 lg:flex-row lg:items-center lg:gap-0 lg:px-8">
        <motion.div variants={ITEM_X} className="flex shrink-0 items-center gap-3 lg:pr-6">
          <BdaLogo className="size-14 ring-2 ring-[#e9c27a]/70" />
          <span className="leading-snug">
            <span className="block text-[12.5px] font-bold">{ORG.name.en}</span>
            <span className="block text-[12px] font-semibold text-white/90">{ORG.nameKn}</span>
            <span className="block max-w-[14rem] text-[11px] text-white/70">{t(ORG.address)}</span>
          </span>
        </motion.div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:flex lg:gap-0">
          {PILLARS.map((p) => {
            const I = p.icon;
            return (
              <motion.li key={p.label.en} variants={ITEM_X} className="flex items-center gap-3 border-white/20 lg:border-l lg:px-5">
                <I size={30} weight="duotone" className={cn("shrink-0", p.tone)} />
                <span className="max-w-[6.5rem] text-[11.5px] leading-snug text-white/90">{t(p.label)}</span>
              </motion.li>
            );
          })}
        </ul>
        <motion.div variants={ITEM_X} className="relative min-w-0 flex-1 lg:self-stretch lg:pl-4">
          <ul className="relative z-10 flex flex-wrap items-center gap-y-1 text-[11.5px] lg:-mt-1 lg:justify-end">
            {FOOT_LINKS.map((l, i) => (
              <li key={l.label.en} className="flex items-center">
                {i > 0 && <span className="mx-1 h-3 w-px bg-white/30" aria-hidden />}
                {l.internal ? (
                  <Link to={l.href} className="rounded px-1.5 py-1 text-white/85 transition-colors hover:bg-brand hover:text-white">
                    {t(l.label)}
                  </Link>
                ) : (
                  <a href={l.href} {...external(l.href)} className="rounded px-1.5 py-1 text-white/85 transition-colors hover:bg-brand hover:text-white">
                    {t(l.label)}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <FooterSkyline className="pointer-events-none absolute -bottom-1 right-0 hidden h-[40px] w-full max-w-[480px] text-[#d4ab62] lg:block" />
        </motion.div>
        <motion.div variants={ITEM_X} className="shrink-0 border-white/20 lg:ml-5 lg:border-l lg:pl-6">
          <p className="text-[12px] font-semibold">{t(TEXT.follow)}</p>
          <div className="mt-2 flex gap-2">
            {SOCIALS.map((s) => {
              const I = s.icon;
              return (
                <a key={s.label} href={s.href} {...external(s.href)} aria-label={s.label} className={cn("grid size-8 place-items-center rounded-full transition-colors hover:bg-brand hover:text-white", s.tone)}>
                  <I size={16} weight="fill" />
                </a>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}

const MOTTO = t2("People | Places | Progress", "ಜನರು | ಸ್ಥಳಗಳು | ಪ್ರಗತಿ");

function LightFooter() {
  const { t } = useLang();
  return (
    <footer className="relative mt-8 bg-[var(--pl-glow)] text-navy">
      <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 -top-[26px] h-[27px] w-full" aria-hidden>
        <path d="M0 26C240 6 520 4 760 20S1160 36 1440 10V40H0Z" fill="var(--pl-glow)" />
        <path d="M0 26C240 6 520 4 760 20S1160 36 1440 10" fill="none" stroke="var(--pl-line)" strokeWidth="1.5" />
      </svg>
      <motion.div {...stagger(0.06, 0.1)} className="relative flex flex-col gap-5 px-5 pb-3 pt-1 lg:flex-row lg:items-center lg:gap-0 lg:px-8">
        <motion.div variants={ITEM_X} className="flex shrink-0 items-center gap-3 lg:pr-6">
          <BdaLogo className="size-14 ring-2 ring-[var(--pl-accent)]/50" />
          <span className="leading-snug">
            <span className="block text-[12.5px] font-bold">{ORG.name.en}</span>
            <span className="block text-[12px] font-semibold">{ORG.nameKn}</span>
            <span className="block max-w-[15rem] text-[11px] text-muted">{t(ORG.address)}</span>
          </span>
        </motion.div>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:flex lg:gap-0">
          {PILLARS.map((p) => {
            const I = p.icon;
            return (
              <motion.li key={p.label.en} variants={ITEM_X} className="flex items-center gap-3 border-[var(--pl-line)] lg:border-l lg:px-5">
                <I size={30} weight="duotone" className={cn("shrink-0", p.tone, "brightness-90")} />
                <span className="max-w-[6.5rem] text-[11.5px] leading-snug">{t(p.label)}</span>
              </motion.li>
            );
          })}
        </ul>
        <motion.div variants={ITEM_X} className="relative hidden min-w-0 flex-1 self-stretch lg:block">
          <FooterSkyline className="pointer-events-none absolute -bottom-3 left-1/2 h-[58px] w-[440px] max-w-full -translate-x-1/2 text-[var(--pl-accent)]" />
        </motion.div>
        <motion.div variants={ITEM_X} className="flex shrink-0 flex-col gap-2 lg:items-end lg:pl-4">
          <ul className="flex flex-wrap items-center gap-y-1 text-[11px] lg:justify-end">
            {FOOT_LINKS.map((l, i) => (
              <li key={l.label.en} className="flex items-center">
                {i > 0 && <span className="mx-1 h-3 w-px bg-[var(--pl-line)]" aria-hidden />}
                {l.internal ? (
                  <Link to={l.href} className="rounded px-1.5 py-0.5 text-muted transition-colors hover:bg-brand hover:text-white">
                    {t(l.label)}
                  </Link>
                ) : (
                  <a href={l.href} {...external(l.href)} className="rounded px-1.5 py-0.5 text-muted transition-colors hover:bg-brand hover:text-white">
                    {t(l.label)}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-navy/70 [&:lang(kn)]:tracking-normal">
            {t(MOTTO)}
            <Leaf size={18} weight="duotone" className="text-emerald-600" />
          </span>
        </motion.div>
        <motion.div variants={ITEM_X} className="shrink-0 border-[var(--pl-line)] lg:ml-5 lg:border-l lg:pl-6">
          <p className="text-[12px] font-semibold">{t(TEXT.follow)}</p>
          <div className="mt-2 flex gap-2">
            {SOCIALS.map((s) => {
              const I = s.icon;
              return (
                <a key={s.label} href={s.href} {...external(s.href)} aria-label={s.label} className={cn("grid size-8 place-items-center rounded-full shadow-sm transition-colors hover:bg-brand hover:text-white", s.tone === "bg-white text-black" ? "border border-line bg-white text-black" : s.tone)}>
                  <I size={16} weight="fill" />
                </a>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}

/** On desktop, scale the whole page so it fits the window without scrolling. */
function useFitScreen(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const fit = () => {
      el.style.zoom = "";
      el.style.minHeight = "";
      if (window.innerWidth < 1280) return;
      const zoom = Math.max(0.66, Math.min(1, Math.floor(((window.innerHeight - 4) / el.scrollHeight) * 1000) / 1000));
      el.style.zoom = String(zoom);
      el.style.minHeight = `${window.innerHeight / zoom}px`;
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    fit();
    document.fonts?.ready.then(schedule);
    const late = window.setTimeout(schedule, 600);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(late);
      window.removeEventListener("resize", schedule);
      el.style.zoom = "";
      el.style.minHeight = "";
    };
  }, deps);
  return ref;
}

export function PlannerShell({ children, variant = "planner" }: { children: ReactNode; variant?: PlannerVariant }) {
  const { t, lang } = useLang();
  const [theme, setTheme] = usePlannerTheme();
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  const { query, scaleIndex } = usePrefs();
  const fitRef = useFitScreen([pathname, lang, query, scaleIndex]);
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);
  return (
    <PlannerVariantContext.Provider value={variant}>
    <div ref={fitRef} style={plannerThemeStyle(theme)} className="relative isolate flex min-h-svh flex-col overflow-x-clip bg-[radial-gradient(70%_50%_at_50%_0%,var(--pl-glow),transparent_70%),linear-gradient(180deg,var(--pl-page1),var(--pl-page2))] transition-[background] duration-500">
      <SoftLeaf className="-left-8 top-[52%] hidden h-48 w-20 -rotate-[25deg] md:block" tone="mint" opacity={0.6} />
      <SoftLeaf className="-left-5 bottom-28 hidden h-44 w-20 rotate-[20deg] md:block" tone="teal" opacity={0.55} delay={0.3} />
      <SoftLeaf className="left-6 bottom-20 hidden h-32 w-14 rotate-[48deg] md:block" tone="mint" opacity={0.5} delay={0.5} />
      <Fern className="-right-4 top-[40%] hidden h-56 w-24 rotate-[14deg] lg:block" />
      <SoftLeaf className="-right-6 bottom-36 hidden h-40 w-16 -rotate-[24deg] md:block" tone="mint" opacity={0.5} delay={0.4} />
      <Header onMenu={() => setDrawer(true)} theme={theme} setTheme={setTheme} />
      <div className="relative flex flex-1 gap-3 px-3 py-3 lg:px-4">
        <aside className="hidden w-[224px] shrink-0 xl:flex xl:flex-col">
          <SideMenu className="flex-1 justify-between" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
      {variant === "skyline" ? <LightFooter /> : <Footer />}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-50 xl:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label={t(TEXT.close)} className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="relative flex h-full w-[290px] flex-col overflow-y-auto bg-[var(--pl-page1)] p-3 shadow-2xl"
            >
              <button type="button" onClick={() => setDrawer(false)} aria-label={t(TEXT.close)} className="ml-auto grid size-9 place-items-center rounded-full bg-white text-navy hover:bg-brand hover:text-white">
                <X size={18} weight="bold" />
              </button>
              <ul className="my-2 grid gap-0.5">
                {NAV.map((n) => {
                  const href = navHref(n);
                  return (
                    <li key={n.label.en}>
                      <a href={href} {...external(href)} className="flex items-center justify-between rounded-lg px-3 py-2 text-[13.5px] font-semibold text-navy transition-colors hover:bg-brand hover:text-white">
                        {t(n.label)}
                        <CaretDown size={12} weight="bold" className="-rotate-90 opacity-50" />
                      </a>
                    </li>
                  );
                })}
              </ul>
              <SideMenu />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PlannerVariantContext.Provider>
  );
}
