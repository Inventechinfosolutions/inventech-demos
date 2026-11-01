import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/** Reveals `text` a couple of characters at a time while `on`; empty when off. */
export function useTyped(text: string, on: boolean, delay = 0) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(on ? text.length : 0);
  useEffect(() => {
    if (!on) {
      setN(0);
      return;
    }
    if (reduce) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    let timer = 0;
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        i += 2;
        setN(Math.min(i, text.length));
        if (i >= text.length) window.clearInterval(timer);
      }, 22);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [on, text, delay, reduce]);
  return text.slice(0, n);
}
