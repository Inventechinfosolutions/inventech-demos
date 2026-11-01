import { motion } from "motion/react";
import type { ReactNode } from "react";
import { KaMark } from "@/components/SlideKit";
import type { CessIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** A laptop frame whose screen stretches to fill the available height. */
export function Laptop({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="flex min-h-0 flex-col">
      <div className="min-h-0 flex-1 rounded-t-[18px] border border-slate-700 bg-[#0d1424] p-[clamp(5px,0.6vw,9px)] pb-[clamp(6px,0.8vh,10px)] shadow-[0_30px_60px_-30px_rgba(7,20,51,0.8)]">
        <div className="size-full overflow-hidden rounded-[8px] bg-white">{children}</div>
      </div>
      <div className="mx-[-3%] h-[clamp(10px,1.6vh,16px)] rounded-t-[3px] rounded-b-[16px] bg-linear-to-b from-[#d6dce6] to-[#99a3b5] shadow-[0_14px_24px_-12px_rgba(7,20,51,0.6)]">
        <div className="mx-auto h-[45%] w-[14%] rounded-b-lg bg-[#b8c0cd]" />
      </div>
    </motion.div>
  );
}

export type NavItem = { label: string; icon: CessIcon };

/** The Advertisement Monitoring Tool web app: DIPR sidebar plus a content pane. */
export function AppShell({ nav, active, children }: { nav: NavItem[]; active: string; children: ReactNode }) {
  return (
    <div className="grid size-full grid-cols-[clamp(140px,10.5vw,165px)_minmax(0,1fr)] text-[length:clamp(13px,1.55vh,14px)]">
      <aside className="flex min-h-0 flex-col gap-[clamp(1px,0.3vh,4px)] bg-[linear-gradient(180deg,#0b1f4a,#163a8a)] px-2 py-[clamp(6px,1vh,12px)] text-white">
        <div className="mb-[clamp(4px,0.8vh,10px)] flex flex-col items-center gap-1">
          <KaMark className="size-[clamp(30px,4.4vh,42px)]" />
          <span className="font-display text-[length:clamp(14px,1.9vh,17px)] leading-none font-bold">DIPR</span>
          <span className="text-center text-[13px] leading-tight text-white/80">Advertisement Monitoring Tool</span>
        </div>
        {nav.map((n) => {
          const I = n.icon;
          const on = n.label === active;
          return (
            <span key={n.label} className={cn("flex items-center gap-2 rounded-md px-2 py-[clamp(2px,0.55vh,6px)] font-medium whitespace-nowrap", on ? "bg-white/20 text-white" : "text-white/75")}>
              <I weight={on ? "fill" : "regular"} className="size-[1.15em] shrink-0" />
              {n.label}
            </span>
          );
        })}
      </aside>
      <div className="min-h-0 bg-[#f5f7fb] p-[clamp(6px,0.8vw,12px)]">{children}</div>
    </div>
  );
}
