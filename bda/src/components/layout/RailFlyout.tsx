import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router";
import { EASE } from "@/components/home/shared";
import { MegaContent } from "@/components/portal/PortalNav";
import { AREAS, type AreaKey } from "@/lib/ia";

type Open = { key: AreaKey; rect: DOMRect };
type Ctx = { open: Open | null; show: (key: AreaKey, el: HTMLElement) => void; hide: () => void; keep: () => void };

const FlyoutCtx = createContext<Ctx | null>(null);

const GAP = 14;
const EDGE = 12;

/** Hover/focus props for a rail item; a no-op outside a provider (e.g. the mobile drawer). */
export function useFlyoutTrigger(key: AreaKey) {
  const ctx = useContext(FlyoutCtx);
  if (!ctx) return { open: false, props: {} };
  const props = {
    onMouseEnter: (e: { currentTarget: HTMLElement }) => ctx.show(key, e.currentTarget),
    onMouseLeave: ctx.hide,
    onFocus: (e: FocusEvent<HTMLElement>) => ctx.show(key, e.currentTarget),
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (!(e.relatedTarget as HTMLElement | null)?.closest("[data-rail-flyout]")) ctx.hide();
    },
    "aria-haspopup": "true" as const,
    "aria-expanded": ctx.open?.key === key,
  };
  return { open: ctx.open?.key === key, props };
}

function Panel({ open, onEnter, onLeave }: { open: Open; onEnter: () => void; onLeave: () => void }) {
  const area = AREAS.find((a) => a.key === open.key)!;
  const { rect } = open;
  const left = rect.right + GAP;
  const width = Math.min(1000, window.innerWidth - left - EDGE);
  const top = Math.max(EDGE, Math.min(rect.top - 28, window.innerHeight - 420));
  const arrow = rect.top + rect.height / 2 - top;
  return (
    <motion.div
      data-rail-flyout
      role="region"
      initial={{ opacity: 0, x: -12, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: EASE }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && onLeave()}
      style={{ left, top, width, maxHeight: window.innerHeight - top - EDGE }}
      className="fixed z-[70] origin-left overflow-y-auto rounded-3xl border border-line bg-white p-5 shadow-[0_40px_80px_-30px_rgba(11,44,107,0.5)]"
    >
      <span
        aria-hidden
        style={{ top: arrow }}
        className="absolute -left-[7px] size-3.5 -translate-y-1/2 rotate-45 border-b border-l border-line bg-white"
      />
      <MegaContent area={area} />
    </motion.div>
  );
}

export function RailFlyoutProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const { pathname } = useLocation();
  const keep = useCallback(() => window.clearTimeout(timer.current), []);
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(null), 200);
  }, []);
  const show = useCallback((key: AreaKey, el: HTMLElement) => {
    window.clearTimeout(timer.current);
    setOpen({ key, rect: el.getBoundingClientRect() });
  }, []);
  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onResize = () => setOpen(null);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const value = useMemo(() => ({ open, show, hide, keep }), [open, show, hide, keep]);
  return (
    <FlyoutCtx.Provider value={value}>
      {children}
      {createPortal(
        <AnimatePresence>{open && <Panel key="panel" open={open} onEnter={keep} onLeave={hide} />}</AnimatePresence>,
        document.querySelector("[data-shell-root]") ?? document.body,
      )}
    </FlyoutCtx.Provider>
  );
}
