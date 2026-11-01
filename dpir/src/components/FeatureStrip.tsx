import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Check, CheckCircle, SealCheck, type CessIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export type Feature = { title: string; icon: CessIcon; color: string; items: string[] };

/**
 * Bottom row of feature tiles plus the expected outcome. Tile `active` is highlighted, earlier tiles show as done.
 * Hovering a tile pops up its full feature list.
 */
export function FeatureStrip({ features, active, outcome, outcomeShown }: { features: Feature[]; active: number; outcome: ReactNode; outcomeShown: boolean }) {
  const [peek, setPeek] = useState<number | null>(null);
  const many = features.length > 5;
  const cols = many
    ? `repeat(${features.length}, minmax(0,auto)) minmax(clamp(200px,17vw,340px),1fr)`
    : `repeat(${features.length}, minmax(0,1fr)) minmax(0,${features.length > 4 ? 2.6 : 1.9}fr)`;
  return (
    <div className="relative grid shrink-0 gap-[clamp(6px,0.7vw,12px)]" style={{ gridTemplateColumns: cols }}>
      {features.map((f, i) => {
        const I = f.icon;
        const on = active === i;
        const done = active > i || outcomeShown;
        return (
          <motion.div
            key={f.title}
            onMouseEnter={() => setPeek(i)}
            onMouseLeave={() => setPeek(null)}
            initial={false}
            animate={{ opacity: on || done ? 1 : 0.45, y: on ? -3 : 0 }}
            className={cn(
              "relative flex items-center rounded-2xl border bg-white/95 py-[clamp(6px,1vh,10px)] shadow-[0_14px_30px_-24px_rgba(7,20,51,0.7)]",
              many ? "gap-2 px-2" : "gap-2.5 px-3",
            )}
            style={{ borderColor: on ? f.color : "#e2e8f0", boxShadow: on ? `0 0 0 2px ${f.color}, 0 16px 30px -20px ${f.color}` : undefined }}
          >
            <span className="grid size-[clamp(32px,4.6vh,42px)] shrink-0 place-items-center rounded-full text-white shadow" style={{ background: f.color }}>
              {done ? <Check weight="bold" className="size-1/2" /> : <I weight="fill" className="size-1/2" />}
            </span>
            <span className="font-display text-[length:clamp(14px,1.95vh,17px)] leading-tight font-bold text-balance text-navy">{f.title}</span>
            <AnimatePresence>
              {peek === i && (
                <motion.ul
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-[calc(100%+8px)] left-0 z-30 grid w-[clamp(260px,22vw,340px)] gap-1 rounded-xl border bg-white p-3 text-[length:clamp(13px,1.7vh,15px)] leading-snug text-ink shadow-[0_20px_40px_-16px_rgba(7,20,51,0.5)]"
                  style={{ borderColor: f.color }}
                >
                  {f.items.map((t) => (
                    <li key={t} className="flex gap-2">
                      <CheckCircle weight="fill" className="mt-[0.15em] size-[1.1em] shrink-0" style={{ color: f.color }} />
                      {t}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
      <motion.div
        initial={false}
        animate={outcomeShown ? { opacity: 1, scale: 1 } : { opacity: 0.12, scale: 0.98 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="flex items-center gap-3 rounded-2xl border border-[#16a34a]/30 bg-[linear-gradient(90deg,#ecfdf3,#ffffff)] px-3 py-[clamp(6px,1vh,10px)] shadow-[0_14px_30px_-24px_rgba(7,20,51,0.7)]"
      >
        <motion.span
          animate={outcomeShown ? { scale: [1, 1.1, 1] } : undefined}
          transition={{ duration: 1.6, repeat: outcomeShown ? Infinity : 0, repeatDelay: 1 }}
          className="grid size-[clamp(34px,5vh,46px)] shrink-0 place-items-center rounded-full bg-[#16a34a] text-white shadow-md"
        >
          <SealCheck weight="fill" className="size-1/2" />
        </motion.span>
        <p className="text-[length:clamp(14px,1.9vh,17px)] leading-snug text-ink">{outcome}</p>
      </motion.div>
    </div>
  );
}
