import { motion } from "motion/react";

export function ThanksScene() {
  return (
    <div className="grid h-full place-items-center rounded-2xl bg-linear-to-b from-navy-deep to-navy text-white">
      <motion.h2
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="font-display text-[length:clamp(32px,5vw,72px)] font-black"
      >
        Thank You
      </motion.h2>
    </div>
  );
}
