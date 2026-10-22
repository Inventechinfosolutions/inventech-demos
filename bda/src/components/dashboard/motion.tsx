import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "@/components/home/shared";
import { cn } from "@/lib/utils";

export const ITEM: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

export const ITEM_X: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
};

export const stagger = (gap = 0.07, delay = 0.15, inView = true) =>
  ({
    initial: "hidden",
    ...(inView ? { whileInView: "show", viewport: { once: true, margin: "-40px" } } : { animate: "show" }),
    variants: { hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } },
  }) as const;

export const LIFT = { y: -4, transition: { duration: 0.25 } } as const;

export function RiseLines({ lines, delay = 0.1, className }: { lines: { text: string; className?: string }[]; delay?: number; className?: string }) {
  return (
    <span className={className}>
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className={cn("block", l.className)}
            initial={{ y: "110%", rotate: 2 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ duration: 0.85, ease: EASE, delay: delay + i * 0.12 }}
          >
            {l.text}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function IconPop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.4, rotate: -25 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: true }}
      whileHover={{ rotate: [0, -12, 10, 0], transition: { duration: 0.5 } }}
      transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
      className={className}
    >
      {children}
    </motion.span>
  );
}

export function Underline() {
  return (
    <motion.span
      aria-hidden
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
      className="mt-1 block h-0.5 w-8 origin-left rounded-full bg-brand/60"
    />
  );
}

export function Float({ children, index = 0, className }: { children: ReactNode; index?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reduce ? undefined : { y: [0, -7, 0] }}
      transition={{ duration: 3.2 + (index % 3) * 0.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export function Sheen() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent motion-safe:animate-[sheen_3.6s_ease-in-out_infinite]" />
    </span>
  );
}

export function DrawPath({ d, delay = 0, ...rest }: { d: string; delay?: number } & React.SVGProps<SVGPathElement>) {
  return (
    <motion.path
      d={d}
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.6, ease: "easeInOut", delay }}
      {...(rest as object)}
    />
  );
}
