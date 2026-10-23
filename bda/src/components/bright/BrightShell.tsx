import { Bell, CaretDoubleLeft, CaretRight, Headset, House, List, MapPin, Palette, TreeStructure, X, type Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { areaOf, ThemePicker, TopSearch } from "@/components/dashboard/DashShell";
import { ITEM_X, stagger } from "@/components/dashboard/motion";
import { RailFlyoutProvider, useFlyoutTrigger } from "@/components/layout/RailFlyout";
import { LoginMenu } from "@/components/layout/TopBar";
import { NewBadge } from "@/components/portal/SitemapCallout";
import { ORG, SERVICES } from "@/lib/content";
import { DashThemeProvider, themeStyle, useDashTheme } from "@/lib/dashTheme";
import type { AreaKey } from "@/lib/ia";
import { useLang, type Text } from "@/lib/i18n";
import { asset, cn, external } from "@/lib/utils";

const t2 = (en: string, kn: string): Text => ({ en, kn });
const svc = (icon: (typeof SERVICES)[number]["icon"]) => SERVICES.find((s) => s.icon === icon)!.href;

const TEXT = {
  home: t2("Home", "ಮುಖಪುಟ"),
  map: t2("Map", "ನಕ್ಷೆ"),
  help: t2("Help", "ಸಹಾಯ"),
  sitemap: t2("Sitemap", "ಸೈಟ್‌ಮ್ಯಾಪ್"),
  colours: t2("Colours", "ಬಣ್ಣಗಳು"),
  changeColours: t2("Change Colours", "ಬಣ್ಣ ಬದಲಿಸಿ"),
  updates: t2("Latest updates", "ಇತ್ತೀಚಿನ ಅಪ್‌ಡೇಟ್‌ಗಳು"),
  menu: t2("Open menu", "ಮೆನು ತೆರೆಯಿರಿ"),
  close: t2("Close menu", "ಮೆನು ಮುಚ್ಚಿ"),
  collapse: t2("Show labels", "ಹೆಸರುಗಳನ್ನು ತೋರಿಸಿ"),
};

const RAIL: { key: AreaKey; label: Text }[] = [
  { key: "property", label: t2("Property & Land", "ಆಸ್ತಿ ಮತ್ತು ಭೂಮಿ") },
  { key: "planning", label: t2("Planning", "ಯೋಜನೆ") },
  { key: "services", label: t2("Services", "ಸೇವೆಗಳು") },
  { key: "departments", label: t2("Departments", "ವಿಭಾಗಗಳು") },
  { key: "information", label: t2("Information", "ಮಾಹಿತಿ") },
  { key: "news", label: t2("News & Updates", "ಸುದ್ದಿ ಮತ್ತು ಅಪ್‌ಡೇಟ್‌ಗಳು") },
];

function RailItem({ icon: I, label, href, to, onClick, active, wide, open, menu }: { icon: Icon; label: string; href?: string; to?: string; onClick?: () => void; active?: boolean; wide: boolean; open?: boolean; menu?: object }) {
  const cls = cn(
    "group flex items-center rounded-2xl text-navy transition-colors duration-300 hover:bg-brand hover:text-white",
    wide ? "gap-3 px-3 py-2.5 text-[13.5px] font-medium" : "flex-col gap-1 px-1 py-2 text-center text-[10.5px] font-semibold leading-tight",
    open && "bg-brand text-white",
  );
  const icon = (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl transition-colors duration-300",
        wide ? "size-9" : "size-10",
        active ? "bg-brand text-white shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] group-hover:bg-white group-hover:text-brand" : open ? "text-white" : "text-navy group-hover:text-white",
      )}
    >
      <I size={22} weight={active ? "fill" : "duotone"} />
    </span>
  );
  const body = (
    <>
      {icon}
      <span className={cn(active && "text-brand group-hover:text-white", wide && "flex-1")}>{label}</span>
      {menu && wide && <CaretRight size={12} weight="bold" className={cn("shrink-0 opacity-50 transition-transform duration-300", open && "translate-x-0.5 opacity-100")} />}
    </>
  );
  const el = to ? (
    <Link to={to} className={cls} aria-current={active ? "page" : undefined}>
      {body}
    </Link>
  ) : href ? (
    <a href={href} {...external(href)} className={cls} {...menu}>
      {body}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cn(cls, "w-full", wide && "text-left")}>
      {body}
    </button>
  );
  return (
    <motion.div variants={ITEM_X} className="grid">
      {el}
    </motion.div>
  );
}

function AreaRailItem({ item, wide }: { item: (typeof RAIL)[number]; wide: boolean }) {
  const { t } = useLang();
  const a = areaOf(item.key);
  const { open, props } = useFlyoutTrigger(item.key);
  return <RailItem icon={a.icon} label={t(item.label)} href={a.href} wide={wide} open={open} menu={"onMouseEnter" in props ? props : undefined} />;
}

function Rail({ wide, onNavigate }: { wide: boolean; onNavigate?: () => void }) {
  const { t } = useLang();
  const { setPicker } = useDashTheme();
  return (
    <motion.nav
      {...stagger(0.05, 0.15, false)}
      aria-label="Primary"
      className="flex h-full flex-col gap-1 overflow-y-auto bg-white/90 px-2.5 py-4 backdrop-blur"
      onClick={(e) => (e.target as HTMLElement).closest("a") && onNavigate?.()}
    >
      <RailItem icon={House} label={t(TEXT.home)} to="/design-11" active wide={wide} />
      {RAIL.map((r) => (
        <AreaRailItem key={r.key} item={r} wide={wide} />
      ))}
      <motion.div variants={ITEM_X} className="mt-1 grid">
      <Link
        to="/sitemap"
        className={cn(
          "group relative flex items-center rounded-2xl bg-gradient-to-br from-brand to-brand-bright text-white shadow-md ring-2 ring-amber-300/80 transition-colors hover:from-navy hover:to-navy",
          wide ? "gap-3 px-3 py-2.5 text-[13.5px] font-bold" : "flex-col gap-1 px-1 py-2 text-center text-[10.5px] font-bold",
        )}
      >
        <span className={cn("grid place-items-center", wide ? "size-9" : "size-8")}>
          <TreeStructure size={22} weight="bold" />
        </span>
        <span className={cn(wide && "flex-1")}>{t(TEXT.sitemap)}</span>
        <NewBadge className={cn(wide ? "" : "absolute -right-1.5 -top-2 px-1.5 py-0 text-[8.5px]")} />
      </Link>
      </motion.div>
      <span className="my-2 h-px shrink-0 bg-line" aria-hidden />
      <RailItem icon={MapPin} label={t(TEXT.map)} href={svc("map")} wide={wide} />
      <RailItem icon={Headset} label={t(TEXT.help)} href={svc("contact")} wide={wide} />
      <RailItem
        icon={Palette}
        label={t(TEXT.colours)}
        onClick={() => {
          onNavigate?.();
          setPicker(true);
        }}
        wide={wide}
      />
    </motion.nav>
  );
}

const ICON_BTN =
  "relative grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white text-navy transition-colors duration-300 hover:border-brand hover:bg-brand hover:text-white";

function Header({ onMenu }: { onMenu: () => void }) {
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
    <header className={cn("sticky top-0 z-30 transition-[background-color,box-shadow] duration-300", scrolled ? "bg-white/90 shadow-[0_10px_30px_-22px_rgba(15,31,61,0.6)] backdrop-blur-md" : "bg-transparent")}>
      <div className="flex items-center gap-3 px-4 py-3 md:px-8">
        <button type="button" onClick={onMenu} aria-label={t(TEXT.menu)} className={cn(ICON_BTN, "md:hidden")}>
          <List size={20} weight="bold" />
        </button>
        <Link to="/design-11" className="flex min-w-0 items-center gap-3">
          <img src={asset("images/karnataka-emblem.png")} alt="" className="h-12 w-auto shrink-0 sm:h-14" />
          <span className="min-w-0 leading-tight">
            <span className="block text-[11px] text-muted">{t(ORG.govt)}</span>
            <span className="block font-display text-[12px] font-bold uppercase tracking-wide text-navy sm:text-[15px]">{ORG.name.en}</span>
            <span className="block font-display text-[13px] font-bold text-navy sm:text-[16px]">{ORG.nameKn}</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <TopSearch className="hidden w-[280px] xl:block xl:w-[320px]" />
          <Link
            to="/sitemap"
            className="relative hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-brand-bright px-4 py-2 text-[12.5px] font-bold text-white shadow-md ring-2 ring-amber-300/80 transition-colors hover:from-navy hover:to-navy sm:inline-flex"
          >
            <TreeStructure size={16} weight="bold" />
            {t(TEXT.sitemap)}
            <NewBadge className="absolute -right-2 -top-2.5 px-1.5 py-0 text-[9px]" />
          </Link>
          <div role="group" aria-label="Language" className="hidden rounded-full border border-line bg-white p-0.5 text-[12px] font-semibold md:flex">
            {(["en", "kn"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={cn("rounded-full px-3 py-1.5 transition-colors duration-300", lang === l ? "bg-navy text-white" : "text-navy hover:bg-brand hover:text-white")}
              >
                {l === "en" ? "English" : "ಕನ್ನಡ"}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setLang(lang === "en" ? "kn" : "en")} aria-label={lang === "en" ? "ಕನ್ನಡ" : "English"} className={cn(ICON_BTN, "text-[13px] font-bold md:hidden")}>
            {lang === "en" ? "ಕ" : "EN"}
          </button>
          <a href={areaOf("news").href} {...external(areaOf("news").href)} title={t(TEXT.updates)} aria-label={t(TEXT.updates)} className={cn(ICON_BTN, "hidden sm:grid")}>
            <Bell size={18} weight="bold" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-new ring-2 ring-white" />
          </a>
          <button type="button" onClick={() => setPicker(true)} title={t(TEXT.changeColours)} aria-label={t(TEXT.changeColours)} className={ICON_BTN}>
            <Palette size={18} weight="bold" />
          </button>
          <div className="hidden text-[12.5px] sm:block">
            <LoginMenu light />
          </div>
        </div>
      </div>
      <div className="px-4 pb-3 xl:hidden">
        <TopSearch />
      </div>
    </header>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const [drawer, setDrawer] = useState(false);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);
  return (
    <div className="flex min-h-svh bg-page transition-colors duration-500">
      <aside className={cn("hidden shrink-0 border-r border-line bg-white transition-[width] duration-300 md:block", wide ? "w-[220px]" : "w-[96px]")}>
        <div className="sticky top-0 flex h-svh flex-col">
          <div className="min-h-0 flex-1">
            <RailFlyoutProvider>
              <Rail wide={wide} />
            </RailFlyoutProvider>
          </div>
          <button
            type="button"
            onClick={() => setWide((v) => !v)}
            aria-label={t(TEXT.collapse)}
            aria-expanded={wide}
            className="mx-auto mb-4 grid size-10 place-items-center rounded-full bg-navy text-white shadow-md transition-colors hover:bg-brand"
          >
            <CaretDoubleLeft size={16} weight="bold" className={cn("transition-transform duration-300", !wide && "rotate-180")} />
          </button>
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
              className="relative h-full w-[260px] bg-white shadow-2xl"
            >
              <Rail wide onNavigate={() => setDrawer(false)} />
              <button type="button" onClick={() => setDrawer(false)} aria-label={t(TEXT.close)} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-page text-navy hover:bg-brand hover:text-white">
                <X size={18} weight="bold" />
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative isolate flex min-w-0 flex-1 flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] bg-[radial-gradient(60%_50%_at_80%_20%,var(--color-brand-soft),transparent_70%),radial-gradient(40%_40%_at_10%_10%,#ffffff,transparent_70%)] transition-colors duration-500"
        />
        <Header onMenu={() => setDrawer(true)} />
        <div className="relative flex flex-1 flex-col">{children}</div>
      </div>
      <ThemePicker />
    </div>
  );
}

export function BrightShell({ children }: { children: ReactNode }) {
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
