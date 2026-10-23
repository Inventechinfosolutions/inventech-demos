import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { PHOTOS } from "@/lib/photos";
import { asset, cn } from "@/lib/utils";

/** Hero slider photos from bdakarnataka.in. */
export const BDA_HERO = Array.from({ length: 10 }, (_, i) => `images/bda-hero/hero-${String(i + 1).padStart(2, "0")}.webp`);
export const HERO_SLIDES = [PHOTOS.skyline, ...BDA_HERO];

export function HeroSlides({
  images = HERO_SLIDES,
  interval = 6500,
  className,
  imgClassName,
}: {
  images?: string[];
  interval?: number;
  className?: string;
  imgClassName?: string;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || images.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % images.length), interval);
    return () => window.clearInterval(id);
  }, [reduce, images.length, interval]);

  useEffect(() => {
    const next = images[(index + 1) % images.length];
    const img = new Image();
    img.src = asset(next);
  }, [index, images]);

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden", className)}>
      <AnimatePresence initial={false}>
        <motion.img
          key={images[index]}
          src={asset(images[index])}
          alt=""
          initial={reduce ? { opacity: 0 } : { x: "100%" }}
          animate={reduce ? { opacity: 1 } : { x: "0%", scale: [1.02, 1.1] }}
          exit={reduce ? { opacity: 0 } : { x: "-100%" }}
          transition={{ x: { duration: 1.6, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 1 }, scale: { duration: interval / 1000 + 2, ease: "linear" } }}
          className={cn("absolute inset-0 size-full object-cover", imgClassName)}
        />
      </AnimatePresence>
    </div>
  );
}
