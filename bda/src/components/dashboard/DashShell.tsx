import { Bell, CaretRight, Check, Headset, House, List, MagnifyingGlass, Palette, TreeStructure, X, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { HeroSlides } from "@/components/home/HeroSlides";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { RailFlyoutProvider, useFlyoutTrigger } from "@/components/layout/RailFlyout";
import { LoginMenu } from "@/components/layout/TopBar";
import { NewBadge } from "@/components/portal/SitemapCallout";
import { ORG, SERVICES } from "@/lib/content";
import { DASH_THEMES, DashThemeProvider, themeStyle, useDashTheme } from "@/lib/dashTheme";
import { AREAS, type AreaKey } from "@/lib/ia";
import { useLang, type Text } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { asset, cn, external } from "@/lib/utils";
import { ITEM_X, stagger } from "./motion";

const t2 = (en: string, kn: string): Text => ({ en, kn });

const TEXT = {
  home: t2("Home", "ಮುಖಪುಟ"),
  support: t2("Citizen Support", "ನಾಗರಿಕ ಸಹಾಯ"),
  colours: t2("Change Colours", "ಬಣ್ಣ ಬದಲಿಸಿ"),
  sitemap: t2("Sitemap", "ಸೈಟ್‌ಮ್ಯಾಪ್"),
  builds: t2("Bengaluru Builds Tomorrow", "ನಾಳೆಯ ಬೆಂಗಳೂರು ನಿರ್ಮಾಣ"),
  search: t2("Search layouts, sites, services, departments...", "ಬಡಾವಣೆ, ನಿವೇಶನ, ಸೇವೆ, ವಿಭಾಗಗಳನ್ನು ಹುಡುಕಿ..."),
  updates: t2("Latest updates", "ಇತ್ತೀಚಿನ ಅಪ್‌ಡೇಟ್‌ಗಳು"),
  menu: t2("Open menu", "ಮೆನು ತೆರೆಯಿರಿ"),
  close: t2("Close menu", "ಮೆನು ಮುಚ್ಚಿ"),
  pick: t2("Choose a colour theme", "ಬಣ್ಣದ ಥೀಮ್ ಆರಿಸಿ"),
  pickSub: t2("Your choice is remembered on this device.", "ನಿಮ್ಮ ಆಯ್ಕೆಯನ್ನು ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗುತ್ತದೆ."),
  applied: t2("theme applied", "ಥೀಮ್ ಅನ್ವಯಿಸಲಾಗಿದೆ"),
};

export const NAV_AREAS: { key: AreaKey; label?: Text }[] = [
  { key: "property" },
  { key: "planning" },
  { key: "services" },
  { key: "departments" },
  { key: "information", label: t2("Information & Resources", "ಮಾಹಿತಿ ಮತ್ತು ಸಂಪನ್ಮೂಲಗಳು") },
  { key: "news" },
];

export const areaOf = (key: AreaKey) => AREAS.find((a) => a.key === key)!;
export const areaLabel = (key: AreaKey) => NAV_AREAS.find((n) => n.key === key)?.label ?? areaOf(key).label;

const svc = (icon: (typeof SERVICES)[number]["icon"]) => SERVICES.find((s) => s.icon === icon)!.href;

function SideLink({ icon: I, label, href, to, onClick, active, full, small, open, menu }: { icon: Icon; label: string; href?: string; to?: string; onClick?: () => void; active?: boolean; full: boolean; small?: boolean; open?: boolean; menu?: object }) {
  const cls = cn(
    "group relative flex items-center gap-3 rounded-xl px-3 font-medium transition-colors duration-300 hover:bg-brand hover:text-white",
    small ? "py-2 text-[12.5px] text-white/65" : "py-2.5 text-[13.5px] text-white/85",
    !full && "md:max-lg:justify-center md:max-lg:px-0",
    active && "bg-gradient-to-r from-brand to-brand-bright text-white shadow-[0_12px_24px_-12px_rgba(0,0,0,0.7)]",
    open && "bg-brand text-white",
  );
  const body = (
    <>
      <I size={small ? 18 : 21} weight={active ? "fill" : "duotone"} className="shrink-0 transition-transform duration-300 group-hover:scale-110" />
      <span className={cn("flex-1 leading-snug", !full && "md:max-lg:sr-only")}>{label}</span>
      {menu && <CaretRight size={12} weight="bold" className={cn("shrink-0 opacity-50 transition-transform duration-300", open && "translate-x-0.5 opacity-100", !full && "md:max-lg:hidden")} />}
    </>
  );
  if (to) return <Link to={to} title={label} className={cls} aria-current={active ? "page" : undefined}>{body}</Link>;
  if (href) return <a href={href} {...external(href)} title={menu ? undefined : label} className={cls} {...menu}>{body}</a>;
  return <button type="button" onClick={onClick} title={label} className={cn(cls, "w-full text-left")}>{body}</button>;
}

function AreaSideLink({ areaKey, full }: { areaKey: AreaKey; full: boolean }) {
  const { t } = useLang();
  const a = areaOf(areaKey);
  const { open, props } = useFlyoutTrigger(areaKey);
  return <SideLink icon={a.icon} label={t(areaLabel(areaKey))} href={a.href} full={full} open={open} menu={full ? undefined : props} />;
}

/** Line drawing of Bengaluru landmarks: a temple gopuram, Vidhana Soudha and new towers. */
export function Landmarks({ className = "w-full text-white/40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 116" className={className} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" aria-hidden>
      <path d="M2 112h196" />
      <path d="M14 112V76h22v36M15 76l2-8h16l2 8M18 68l2-7h10l2 7M21 61l2-6h4l2 6M25 55v-5" />
      <path d="M19 84h12M19 92h12M19 100h12M22 112v-6h6v6" />
      <circle cx="47" cy="98" r="7" />
      <path d="M47 105v7" />
      <path d="M60 112v-14h80v14M56 98h88M62 98V82h76v16M58 82h84" />
      <path d="M68 98V84M76 98V84M84 98V84M92 98V84M108 98V84M116 98V84M124 98V84M132 98V84" />
      <path d="M90 82l10-7 10 7M90 75V65h20v10M86 65h28" />
      <path d="M89 65c0-14 5-20 11-21 6 1 11 7 11 21" />
      <path d="M100 44v-8M98 38h4" />
      <path d="M64 82c0-6 2-9 4-10 2 1 4 4 4 10M128 82c0-6 2-9 4-10 2 1 4 4 4 10" />
      <path d="M96 112v-8h8v8" />
      <path d="M152 112V52h14v60M156 58h6M156 66h6M156 74h6M156 82h6M156 90h6M156 98h6" />
      <path d="M170 112V66h12v46M173 72h6M173 80h6M173 88h6M173 96h6" />
      <path d="M186 112V80h10v32" />
      <circle cx="146" cy="102" r="5" />
      <path d="M146 107v5" />
    </svg>
  );
}

function Sidebar({ full = false, onNavigate }: { full?: boolean; onNavigate?: () => void }) {
  const { t } = useLang();
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-navy via-navy to-navy-deep text-white transition-colors duration-500"
      onClick={(e) => (e.target as HTMLElement).closest("a") && onNavigate?.()}
    >
      <span className="pointer-events-none absolute -right-16 top-24 size-48 rounded-full bg-brand/25 blur-3xl" aria-hidden />
      <Link to="/design-10" className={cn("relative mx-auto mb-4 mt-5 block", !full && "md:max-lg:mt-4")} title={ORG.name.en}>
        <img
          src={asset("images/bda-logo.jpg")}
          alt={ORG.name.en}
          className={cn("rounded-full bg-white object-contain p-1 shadow-[0_0_0_4px_rgba(255,255,255,0.15)]", full ? "size-20" : "size-20 md:max-lg:size-12")}
        />
      </Link>
      <motion.nav {...stagger(0.05, 0.15, false)} aria-label="Primary" className={cn("relative flex flex-col gap-1 overflow-y-auto px-3", !full && "md:max-lg:px-2")}>
        <motion.div variants={ITEM_X}>
          <SideLink icon={House} label={t(TEXT.home)} to="/design-10" active full={full} />
        </motion.div>
        {NAV_AREAS.map(({ key }) => (
          <motion.div key={key} variants={ITEM_X}>
            <AreaSideLink areaKey={key} full={full} />
          </motion.div>
        ))}
        <motion.div variants={ITEM_X} className="mt-2">
        <Link
          to="/sitemap"
          title={t(TEXT.sitemap)}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand to-brand-bright px-3 py-2.5 text-[13.5px] font-bold text-white shadow-md ring-2 ring-amber-300/80 transition-colors hover:from-white hover:to-white hover:text-brand",
            !full && "md:max-lg:justify-center md:max-lg:px-0",
          )}
        >
          <TreeStructure size={21} weight="bold" className="shrink-0" />
          <span className={cn("flex-1 leading-snug", !full && "md:max-lg:sr-only")}>{t(TEXT.sitemap)}</span>
          <NewBadge className={cn(!full && "md:max-lg:absolute md:max-lg:-right-2 md:max-lg:-top-2 md:max-lg:px-1.5")} />
        </Link>
        </motion.div>
        <span className="my-2 h-px shrink-0 bg-white/12" aria-hidden />
        <motion.div variants={ITEM_X}>
          <SideLink icon={Headset} label={t(TEXT.support)} href={svc("contact")} full={full} small />
        </motion.div>
      </motion.nav>
      <div className={cn("relative mt-auto px-4 pb-6 pt-6 text-center", !full && "md:max-lg:hidden")}>
        <Landmarks />
        <p className="mt-3 font-display text-xl font-bold tracking-[0.2em]">BDA</p>
        <p className="mx-auto mt-1 max-w-[9rem] text-[10.5px] font-semibold uppercase leading-relaxed tracking-[0.22em] text-white/75 [&:lang(kn)]:tracking-normal">
          {t(TEXT.builds)}
        </p>
      </div>
    </div>
  );
}

export function TopSearch({ className }: { className?: string }) {
  const { t } = useLang();
  const { query, setQuery } = usePrefs();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <form
      role="search"
      className={cn("relative min-w-0", className)}
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
    >
      <MagnifyingGlass size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
      <input
        ref={ref}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t(TEXT.search)}
        aria-label={t(TEXT.search)}
        className="w-full rounded-full border border-white bg-white/95 py-2.5 pl-11 pr-14 text-[13px] text-ink shadow-[0_10px_30px_-16px_rgba(15,31,61,0.5)] outline-none transition-colors duration-300 placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-page px-1.5 py-0.5 text-[11px] font-semibold text-muted sm:block">
        ⌘K
      </kbd>
    </form>
  );
}

const ICON_BTN =
  "relative grid size-10 shrink-0 place-items-center rounded-full border border-white bg-white/90 text-navy shadow-[0_8px_20px_-12px_rgba(15,31,61,0.45)] transition-colors duration-300 hover:border-brand hover:bg-brand hover:text-white";

function DashTopBar({ onMenu }: { onMenu: () => void }) {
  const { t, lang, setLang } = useLang();
  const { setPicker } = useDashTheme();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled ? "bg-white/85 shadow-[0_10px_30px_-20px_rgba(15,31,61,0.5)] backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 md:px-7">
        <button type="button" onClick={onMenu} aria-label={t(TEXT.menu)} className={cn(ICON_BTN, "md:hidden")}>
          <List size={20} weight="bold" />
        </button>
        <Link to="/design-10" className="flex min-w-0 items-center gap-3">
          <img src={asset("images/karnataka-emblem.png")} alt="" className="h-12 w-auto shrink-0 drop-shadow" />
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-[11px] font-bold uppercase tracking-wide text-navy sm:text-[13px]">{ORG.name.en}</span>
            <span className="block font-display text-[15px] font-bold text-navy sm:text-[19px]">{ORG.nameKn}</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <TopSearch className="hidden w-[260px] lg:block xl:w-[320px]" />
          <Link
            to="/sitemap"
            className="relative hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-brand-bright px-4 py-2 text-[12.5px] font-bold text-white shadow-md ring-2 ring-amber-300/80 transition-colors hover:from-navy hover:to-navy sm:inline-flex"
          >
            <TreeStructure size={16} weight="bold" />
            {t(TEXT.sitemap)}
            <NewBadge className="absolute -right-2 -top-2.5 px-1.5 py-0 text-[9px]" />
          </Link>
          <a href={areaOf("news").href} {...external(areaOf("news").href)} title={t(TEXT.updates)} aria-label={t(TEXT.updates)} className={cn(ICON_BTN, "hidden sm:grid")}>
            <Bell size={18} weight="bold" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-new ring-2 ring-white" />
          </a>
          <button type="button" onClick={() => setPicker(true)} title={t(TEXT.colours)} aria-label={t(TEXT.colours)} className={ICON_BTN}>
            <Palette size={18} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "kn" : "en")}
            aria-label={lang === "en" ? "ಕನ್ನಡ" : "English"}
            title={lang === "en" ? "ಕನ್ನಡ" : "English"}
            className={cn(ICON_BTN, "text-[13px] font-bold")}
          >
            {lang === "en" ? "ಕ" : "EN"}
          </button>
          <div className="hidden rounded-full bg-white/90 text-[12.5px] shadow-[0_8px_20px_-12px_rgba(15,31,61,0.45)] sm:block">
            <LoginMenu light />
          </div>
        </div>
      </div>
      <div className="px-4 pb-3 lg:hidden">
        <TopSearch />
      </div>
    </header>
  );
}

/** Skyline photo behind the header and hero; tinted towards the active theme. */
function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden sm:h-[640px]" aria-hidden>
      <motion.span className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}>
        <HeroSlides imgClassName="object-[60%_60%]" />
      </motion.span>
      <span className="absolute inset-0 bg-brand opacity-15 mix-blend-color transition-colors duration-500" />
      <span className="absolute inset-0 bg-gradient-to-r from-page from-10% via-page/75 via-35% to-page/0 to-60% transition-colors duration-500 max-lg:via-page/85 max-lg:to-page/40" />
      <span className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-page/80 to-transparent transition-colors duration-500" />
      <span className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-page via-page/70 to-transparent transition-colors duration-500" />
    </div>
  );
}

export function ThemePicker() {
  const { t } = useLang();
  const { theme, setTheme, picker, setPicker } = useDashTheme();
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!picker) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setPicker(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPicker(false);
    const id = window.setTimeout(() => document.addEventListener("mousedown", onDown));
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [picker, setPicker]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  return (
    <>
      <AnimatePresence>
        {picker && (
          <motion.div
            ref={ref}
            role="dialog"
            aria-label={t(TEXT.pick)}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed right-4 top-[72px] z-[60] w-[min(340px,calc(100vw-2rem))] origin-top-right rounded-2xl border border-line bg-white p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[15px] font-semibold text-navy">{t(TEXT.pick)}</p>
                <p className="text-[12px] text-muted">{t(TEXT.pickSub)}</p>
              </div>
              <button type="button" onClick={() => setPicker(false)} aria-label={t(TEXT.close)} className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-brand hover:text-white">
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {DASH_THEMES.map((th) => {
                const active = th.id === theme;
                const p = th.palette;
                return (
                  <button
                    key={th.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setTheme(th.id);
                      setToast(`${t(th.label)} ${t(TEXT.applied)}`);
                    }}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border-2 p-2.5 text-left transition-all duration-300 hover:-translate-y-0.5",
                      active ? "border-brand" : "border-line hover:border-brand",
                    )}
                  >
                    <span className="flex h-12 overflow-hidden rounded-lg" aria-hidden>
                      <span className="w-1/4" style={{ background: p.navy }} />
                      <span className="flex flex-1 flex-col gap-1 p-1.5" style={{ background: p.page }}>
                        <span className="h-2 w-3/4 rounded-full" style={{ background: p.brand }} />
                        <span className="h-2 w-1/2 rounded-full" style={{ background: p.soft }} />
                      </span>
                    </span>
                    <span className="mt-2 block text-[12.5px] font-semibold text-ink">{t(th.label)}</span>
                    {active && (
                      <motion.span layoutId="dash-theme-check" className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-brand text-white">
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
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-navy px-4 py-2 text-[13px] font-semibold text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);
  return (
    <div className="flex min-h-svh bg-page transition-colors duration-500">
      <aside className="hidden shrink-0 bg-navy-deep transition-colors duration-500 md:block md:w-[80px] lg:w-[208px]">
        <div className="sticky top-0 h-svh">
          <RailFlyoutProvider>
            <Sidebar />
          </RailFlyoutProvider>
        </div>
      </aside>
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label={t(TEXT.close)} className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="relative h-full w-[260px] shadow-2xl"
            >
              <Sidebar full onNavigate={() => setDrawer(false)} />
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label={t(TEXT.close)}
                className="absolute right-3 top-4 grid size-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand"
              >
                <X size={18} weight="bold" />
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative isolate flex min-w-0 flex-1 flex-col">
        <Backdrop />
        <DashTopBar onMenu={() => setDrawer(true)} />
        <div className="relative flex flex-1 flex-col">{children}</div>
      </div>
      <ThemePicker />
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashThemeProvider>
      {(theme) => (
        <div data-shell-root style={themeStyle(theme)}>
          <Shell>{children}</Shell>
        </div>
      )}
    </DashThemeProvider>
  );
}
