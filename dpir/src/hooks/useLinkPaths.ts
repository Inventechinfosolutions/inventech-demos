import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export type LinkSpec = { id: string; from: string; to: string };
export type LinkPath = { d: string; mid: { x: number; y: number } };

type Rect = { x: number; y: number; w: number; h: number };

function edgePoint(r: Rect, toward: { x: number; y: number }) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const t = Math.min(dx ? r.w / 2 / Math.abs(dx) : Infinity, dy ? r.h / 2 / Math.abs(dy) : Infinity);
  return { x: cx + dx * t, y: cy + dy * t };
}

/**
 * Curved connector paths between elements marked with `data-anchor="<name>"` inside the container.
 * Coordinates are in the container's own (unscaled) pixel space, so they stay correct inside a scaled slide.
 */
export function useLinkPaths(container: RefObject<HTMLElement | null>, links: LinkSpec[], deps: unknown[] = []) {
  const [state, setState] = useState<{ w: number; h: number; paths: Record<string, LinkPath> }>({ w: 0, h: 0, paths: {} });
  const linksRef = useRef(links);
  linksRef.current = links;

  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    const measure = () => {
      const c = el.getBoundingClientRect();
      if (c.width < 2) return;
      const k = el.offsetWidth / c.width;
      const rect = (name: string): Rect | null => {
        const n = el.querySelector(`[data-anchor="${name}"]`);
        if (!n) return null;
        const r = n.getBoundingClientRect();
        return { x: (r.left - c.left) * k, y: (r.top - c.top) * k, w: r.width * k, h: r.height * k };
      };
      const paths: Record<string, LinkPath> = {};
      for (const l of linksRef.current) {
        const a = rect(l.from);
        const b = rect(l.to);
        if (!a || !b) continue;
        const ca = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
        const cb = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
        const s = edgePoint(a, cb);
        const e = edgePoint(b, ca);
        const horizontal = Math.abs(e.x - s.x) > Math.abs(e.y - s.y);
        const c1 = horizontal ? { x: (s.x + e.x) / 2, y: s.y } : { x: s.x, y: (s.y + e.y) / 2 };
        const c2 = horizontal ? { x: (s.x + e.x) / 2, y: e.y } : { x: e.x, y: (s.y + e.y) / 2 };
        paths[l.id] = {
          d: `M${s.x.toFixed(1)} ${s.y.toFixed(1)} C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${e.x.toFixed(1)} ${e.y.toFixed(1)}`,
          mid: { x: (s.x + 3 * c1.x + 3 * c2.x + e.x) / 8, y: (s.y + 3 * c1.y + 3 * c2.y + e.y) / 8 },
        };
      }
      setState({ w: el.offsetWidth, h: el.offsetHeight, paths });
    };
    measure();
    const timers = [120, 400, 800, 1300].map((t) => window.setTimeout(measure, t));
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      timers.forEach(clearTimeout);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, ...deps]);

  return state;
}
