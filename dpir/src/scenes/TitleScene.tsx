import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { KaMark } from "@/components/SlideKit";
import titleBg from "@/assets/title-bg.webp";
import inventechLogo from "@/assets/inventech-logo.png";
import { COMPANY, DEPT } from "@/lib/deck";
import { MapPin, Newspaper, Television, DeviceMobile, type CessIcon } from "@/lib/icons";

const EASE = [0.22, 1, 0.36, 1] as const;

const CHANNELS: { icon: CessIcon; label: string; tone: string }[] = [
  { icon: Newspaper, label: "Print", tone: "#f0c14a" },
  { icon: Television, label: "Digital", tone: "#14c4d4" },
  { icon: MapPin, label: "Outdoor", tone: "#ff8a5b" },
];

export function TitleScene({ beat }: { beat: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative isolate h-full overflow-hidden bg-navy-deep text-white">
      <motion.img
        src={titleBg}
        alt=""
        aria-hidden
        initial={{ scale: 1.12, opacity: 0 }}
        animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [1.04, 1.12] }}
        transition={{ opacity: { duration: 1.4 }, scale: { duration: 40, ease: "linear" } }}
        className="absolute inset-0 -z-20 size-full object-cover object-[50%_40%]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,20,51,0.97)_0%,rgba(7,20,51,0.9)_38%,rgba(7,20,51,0.55)_62%,rgba(7,20,51,0.25)_100%)]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-linear-to-t from-navy-deep/90 to-transparent" />

      <div className="flex h-full flex-col justify-between px-[clamp(20px,5vw,80px)] py-[clamp(20px,5vh,56px)]">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="flex items-center gap-4"
        >
          <KaMark className="size-[clamp(52px,6vh,72px)]" />
          <div className="leading-tight">
            <p className="text-[length:clamp(11px,1.5vh,13px)] font-medium tracking-[0.22em] text-white/70 uppercase">{DEPT.gov}</p>
            <p className="font-display mt-1 text-[length:clamp(15px,2.3vh,22px)] font-bold">
              {DEPT.name} <span className="text-gold">({DEPT.short})</span>
            </p>
            <p className="mt-1 text-[length:clamp(13px,1.6vh,14px)] text-white/70">{DEPT.address}</p>
          </div>
        </motion.div>

        <div className="max-w-[min(860px,64vw)]">
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.5em" }}
            animate={{ opacity: 1, letterSpacing: "0.28em" }}
            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
            className="text-[length:clamp(11px,1.6vh,14px)] font-bold text-teal-bright uppercase"
          >
            Technical Presentation
          </motion.p>
          <h1 className="font-display mt-3 text-[length:clamp(36px,7vh,76px)] leading-[1.02] font-black tracking-[-0.02em]">
            {["Advertisement", "Monitoring Tool"].map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <motion.span
                  className={i === 1 ? "inline-block rounded-lg bg-gold px-[0.18em] text-navy-deep" : "block"}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.35 + i * 0.14 }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <AnimatePresence>
            {beat >= 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
                <div className="flex flex-wrap gap-3">
                  {CHANNELS.map((c, i) => {
                    const I = c.icon;
                    return (
                      <motion.div
                        key={c.label}
                        initial={{ opacity: 0, y: 18, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.55, ease: EASE, delay: i * 0.12 }}
                        whileHover={{ y: -4 }}
                        className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 py-2.5 pr-5 pl-2.5 backdrop-blur-md"
                      >
                        <span className="grid size-10 place-items-center rounded-xl" style={{ background: `${c.tone}26`, color: c.tone }}>
                          <I weight="duotone" className="size-6" />
                        </span>
                        <span className="font-display text-[17px] font-bold">{c.label}</span>
                      </motion.div>
                    );
                  })}
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy-deep/60 px-4 py-2 text-[14px] text-white/85 ring-1 ring-white/15"
                >
                  <DeviceMobile weight="bold" className="size-3.5 text-teal-bright" />
                  Web and mobile platform · E-Tender No. {DEPT.tender} · Dated {DEPT.tenderDate}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex min-h-[86px] items-end justify-between gap-6">
          <AnimatePresence>
            {beat >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 26 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="flex items-center gap-5"
              >
                <span className="text-[11px] font-bold tracking-[0.24em] text-white/60 uppercase">Presented by</span>
                <div className="flex items-center gap-4 rounded-2xl bg-white py-3 pr-6 pl-4 text-navy shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]">
                  <img src={inventechLogo} alt="Inventech" className="h-[clamp(30px,4.6vh,44px)] w-auto" />
                  <span className="h-10 w-px bg-navy/15" />
                  <span className="leading-tight">
                    <span className="font-display block text-[length:clamp(13px,1.9vh,17px)] font-bold">{COMPANY.name}</span>
                    <span className="mt-0.5 block text-[14px] text-ink/70">{COMPANY.address}</span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
