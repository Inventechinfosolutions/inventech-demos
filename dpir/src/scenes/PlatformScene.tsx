import { motion } from "motion/react";
import { FitBox } from "@/components/FitBox";
import { EASE, Outcome } from "@/components/SimpleKit";
import {
  Bank,
  ChartBar,
  ClockCounterClockwise,
  Database,
  Desktop,
  DeviceMobile,
  FolderSimple,
  Handshake,
  HardDrives,
  IdentificationCard,
  Images,
  MapPin,
  MapTrifold,
  Megaphone,
  Plugs,
  Pulse,
  SealCheck,
  ShieldCheck,
  Stack,
  Users,
  UsersThree,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

type Tile = { label: string; icon: CessIcon };

const LAYERS: { name: string; icon: CessIcon; color: string; tiles: Tile[] }[] = [
  {
    name: "Users",
    icon: Users,
    color: "#0d9488",
    tiles: [
      { label: "DIPR Officials", icon: IdentificationCard },
      { label: "Empanelled Agencies", icon: Handshake },
      { label: "Field Teams", icon: UsersThree },
    ],
  },
  {
    name: "Applications",
    icon: Desktop,
    color: "#1d4fc4",
    tiles: [
      { label: "Web Application", icon: Desktop },
      { label: "Mobile Application (Android / iOS)", icon: DeviceMobile },
    ],
  },
  {
    name: "Core Modules",
    icon: Stack,
    color: "#7c3aed",
    tiles: [
      { label: "Campaign Management", icon: Megaphone },
      { label: "Asset Repository", icon: Images },
      { label: "Execution Tracking", icon: MapPin },
      { label: "Proof-of-Display", icon: SealCheck },
      { label: "Reports & Analytics", icon: ChartBar },
      { label: "User & Access Management", icon: ShieldCheck },
    ],
  },
  {
    name: "Secure Integration",
    icon: Plugs,
    color: "#16a34a",
    tiles: [
      { label: "Khajane-II (Finance)", icon: Bank },
      { label: "Document Management", icon: FolderSimple },
      { label: "User Directory / SSO", icon: IdentificationCard },
      { label: "Verification Services", icon: SealCheck },
      { label: "Maps & NIC SMS Gateway", icon: MapTrifold },
    ],
  },
  {
    name: "Hosting",
    icon: HardDrives,
    color: "#ea7a0b",
    tiles: [
      { label: "Karnataka State Data Centre / MeitY-empanelled Cloud", icon: Database },
      { label: "Backup & Recovery", icon: ClockCounterClockwise },
      { label: "Application Monitoring", icon: Pulse },
    ],
  },
];

/** Beats: 0 users, 1 applications, 2 core modules, 3 secure integration, 4 hosting, 5 expected outcome. */
export function PlatformScene({ beat }: { beat: number }) {
  return (
    <FitBox w={1440} h={744}>
      <div className="flex size-full flex-col gap-3 text-ink">
        <div className="flex min-h-0 flex-1 flex-col gap-2.5">
          {LAYERS.map((l, i) => {
            const L = l.icon;
            const shown = beat >= i;
            const focus = beat === i;
            return (
              <motion.section
                key={l.name}
                initial={{ opacity: 0, x: -16 }}
                animate={{
                  opacity: shown ? 1 : 0.3,
                  x: 0,
                  boxShadow: focus ? `0 0 0 2.5px ${l.color}, 0 20px 36px -24px ${l.color}` : "0 14px 28px -24px rgba(7,20,51,0.6)",
                }}
                transition={{ duration: 0.45, ease: EASE }}
                className="flex min-h-0 flex-1 items-stretch gap-3 rounded-2xl border border-[#c9d8ee] bg-white/95 p-2.5"
              >
                <div
                  className="font-display flex w-[250px] shrink-0 items-center gap-3 rounded-xl px-4 text-[21px] leading-tight font-bold text-white"
                  style={{ background: `linear-gradient(90deg, ${l.color}, ${l.color}cc)` }}
                >
                  <L weight="duotone" className="size-[32px] shrink-0" />
                  {l.name}
                </div>
                <div className="grid min-w-0 flex-1 gap-2.5" style={{ gridTemplateColumns: `repeat(${l.tiles.length}, minmax(0, 1fr))` }}>
                  {l.tiles.map((t, j) => {
                    const T = t.icon;
                    return (
                      <motion.div
                        key={t.label}
                        initial={false}
                        animate={{ y: focus ? [8, 0] : 0 }}
                        transition={{ delay: focus ? 0.1 + j * 0.06 : 0, duration: 0.35 }}
                        className={cn("flex min-w-0 items-center gap-3 rounded-xl border px-3.5", "border-[#d3def2] bg-linear-to-b from-white to-[#f2f6fd]")}
                      >
                        <span className="grid size-[44px] shrink-0 place-items-center rounded-lg" style={{ background: `${l.color}18`, color: l.color }}>
                          <T weight="duotone" className="size-[26px]" />
                        </span>
                        <span className="font-display text-[17px] leading-tight font-bold text-navy">{t.label}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>
        <Outcome shown={beat >= 5}>A secure, scalable platform connected to DIPR systems and authorized external services.</Outcome>
      </div>
    </FitBox>
  );
}
