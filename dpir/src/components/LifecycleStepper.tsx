import { motion } from "motion/react";
import { Check } from "@/lib/icons";

export const LIFECYCLE = [
  "Campaign Creation",
  "Media Selection",
  "Scheduling & Budgeting",
  "Approvals & Execution",
  "Monitoring & Verification",
  "Reporting & Analysis",
];

/** The six-stage campaign lifecycle; stages before `active` show as done. */
export function LifecycleStepper({ active }: { active: number }) {
  return (
    <ol className="relative mx-auto grid w-full max-w-[1100px] grid-cols-6">
      <span className="absolute top-[clamp(15px,2.2vh,20px)] right-[8.33%] left-[8.33%] h-[3px] rounded bg-slate-200" aria-hidden />
      <motion.span
        className="absolute top-[clamp(15px,2.2vh,20px)] left-[8.33%] h-[3px] rounded bg-[#1d4fc4]"
        initial={{ width: 0 }}
        animate={{ width: `${(active / 5) * 83.33}%` }}
        transition={{ duration: 0.8 }}
        aria-hidden
      />
      {LIFECYCLE.map((label, i) => {
        const done = i < active;
        const on = i === active;
        return (
          <li key={label} className="relative flex flex-col items-center gap-1 text-center">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: on ? 1.12 : 1, opacity: 1 }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className={
                "font-display grid size-[clamp(30px,4.4vh,40px)] place-items-center rounded-full text-[length:clamp(14px,2vh,18px)] font-bold ring-4 ring-white " +
                (on ? "bg-[#1d4fc4] text-white shadow-[0_0_0_6px_rgba(29,79,196,0.18)]" : done ? "bg-[#16a34a] text-white" : "bg-slate-300 text-white")
              }
            >
              {done ? <Check weight="bold" className="size-1/2" /> : i + 1}
            </motion.span>
            <span className={"text-[length:clamp(13px,1.7vh,15px)] leading-tight font-semibold " + (on ? "text-[#1d4fc4]" : "text-navy/70")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
