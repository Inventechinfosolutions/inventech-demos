import { motion } from "motion/react";
import type { ReactNode } from "react";
import { CheckCircle, Target, type CessIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export const EASE = [0.22, 1, 0.36, 1] as const;

export function Panel({
  title,
  icon: H,
  color = "#1d4fc4",
  shown,
  focus,
  className,
  children,
}: {
  title: string;
  icon: CessIcon;
  color?: string;
  shown: boolean;
  focus?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{
        opacity: shown ? 1 : 0.35,
        y: focus ? -4 : 0,
        boxShadow: focus ? `0 0 0 2.5px ${color}, 0 24px 40px -24px ${color}` : "0 14px 28px -24px rgba(7,20,51,0.6)",
      }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#c9d8ee] bg-white/95", className)}
    >
      <div className="font-display flex shrink-0 items-center gap-3 px-4 py-3 text-[20px] leading-tight font-bold text-white" style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}>
        <H weight="duotone" className="size-[30px] shrink-0" />
        {title}
      </div>
      {children}
    </motion.section>
  );
}

export function Checks({ items, focus, spread, className }: { items: string[]; focus?: boolean; spread?: boolean; className?: string }) {
  return (
    <ul className={cn("grid gap-3 p-4 text-[18px] leading-snug text-navy", spread && "min-h-0 flex-1 auto-rows-fr", className)}>
      {items.map((t, j) => (
        <motion.li
          key={t}
          initial={false}
          animate={{ x: focus ? [10, 0] : 0 }}
          transition={{ delay: focus ? 0.08 + j * 0.07 : 0, duration: 0.35 }}
          className={cn("flex gap-2.5", spread ? "items-center rounded-xl border border-[#d3def2] bg-linear-to-b from-white to-[#f2f6fd] px-4" : "items-start")}
        >
          <CheckCircle weight="fill" className={cn("size-[22px] shrink-0 text-[#16a34a]", !spread && "mt-0.5")} />
          <span>{t}</span>
        </motion.li>
      ))}
    </ul>
  );
}

export function Outcome({ shown, children }: { shown: boolean; children: ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.99 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex h-[58px] shrink-0 items-center gap-5 overflow-hidden rounded-2xl border border-[#7c3aed]/25 bg-[linear-gradient(90deg,#f5f3ff,#ffffff_60%,#f5f3ff)] pr-5 shadow-[0_14px_30px_-24px_rgba(7,20,51,0.7)]"
    >
      <span className="font-display flex h-full shrink-0 items-center gap-2.5 bg-linear-to-r from-[#5b21b6] to-[#7c3aed] pr-8 pl-4 text-[19px] font-bold text-white [clip-path:polygon(0_0,calc(100%-18px)_0,100%_50%,calc(100%-18px)_100%,0_100%)]">
        <Target weight="duotone" className="size-[26px]" /> Expected Outcome
      </span>
      <span className="h-8 w-px shrink-0 bg-navy/25" />
      <p className="font-display flex-1 text-center text-[19px] leading-snug font-bold text-navy">{children}</p>
    </motion.div>
  );
}
