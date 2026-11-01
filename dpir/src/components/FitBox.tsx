import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Renders children on a fixed design canvas, scaled to fit the available space like an image. */
export function FitBox({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth < 2 || el.clientHeight < 2) return;
      setScale(Math.min(el.clientWidth / w, el.clientHeight / h));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  return (
    <div ref={ref} className="relative size-full overflow-hidden">
      <div className="absolute top-1/2 left-1/2" style={{ width: w, height: h, transform: `translate(-50%, -50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
