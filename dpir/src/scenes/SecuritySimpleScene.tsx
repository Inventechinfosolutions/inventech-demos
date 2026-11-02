import { motion } from "motion/react";
import { FitBox } from "@/components/FitBox";
import { Checks, EASE, Outcome, Panel } from "@/components/SimpleKit";
import { ChartBar, ClockCounterClockwise, IdentificationCard, LockKey, MapPin, Megaphone, SealCheck, ShieldCheck, UserGear, Users, type CessIcon } from "@/lib/icons";

const ROLES: { name: string; icon: CessIcon; color: string }[] = [
  { name: "Super Administrator", icon: UserGear, color: "#7c3aed" },
  { name: "DIPR Administrator", icon: IdentificationCard, color: "#1d4fc4" },
  { name: "Campaign Officer", icon: Megaphone, color: "#16a34a" },
  { name: "Approving Authority", icon: SealCheck, color: "#ea7a0b" },
  { name: "Field Officer", icon: MapPin, color: "#e11d48" },
  { name: "Reporting Officer", icon: ChartBar, color: "#0d9488" },
];

const PILLARS: { title: string; icon: CessIcon; color: string; items: string[] }[] = [
  {
    title: "Access Control",
    icon: LockKey,
    color: "#1d4fc4",
    items: ["Role-Based Access Control (RBAC)", "Role-wise access restrictions", "Single Sign-On (SSO)", "Multi-Factor Authentication, if requested"],
  },
  {
    title: "Data Security",
    icon: ShieldCheck,
    color: "#16a34a",
    items: ["Encryption in transit (HTTPS)", "Encryption at rest", "Secure and controlled API access", "Data retention policies"],
  },
  {
    title: "Audit Trail",
    icon: ClockCounterClockwise,
    color: "#7c3aed",
    items: ["Create, approve, verify and report actions recorded", "Administrative actions tracked", "Records maintained for review and inspection"],
  },
];

/** Beats: 0 user roles, 1 access control, 2 data security, 3 audit trail, 4 expected outcome. */
export function SecuritySimpleScene({ beat }: { beat: number }) {
  return (
    <FitBox w={1440} h={744}>
      <div className="flex size-full flex-col gap-4 text-ink">
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex shrink-0 items-stretch gap-3 rounded-2xl border border-[#c9d8ee] bg-white/95 p-3 shadow-[0_14px_28px_-24px_rgba(7,20,51,0.6)]"
        >
          <div className="font-display flex w-[210px] shrink-0 items-center gap-3 rounded-xl bg-linear-to-r from-navy to-[#1d4fc4] px-4 text-[21px] leading-tight font-bold text-white">
            <Users weight="duotone" className="size-[34px] shrink-0" />
            Defined User Roles
          </div>
          {ROLES.map((r, i) => {
            const I = r.icon;
            return (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: EASE }}
                className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-[#d3def2] bg-linear-to-b from-white to-[#f2f6fd] py-4 text-center"
              >
                <span className="grid size-[58px] place-items-center rounded-full" style={{ background: `${r.color}18`, color: r.color }}>
                  <I weight="duotone" className="size-[32px]" />
                </span>
                <span className="font-display px-1 text-[17px] leading-tight font-bold text-navy">{r.name}</span>
              </motion.div>
            );
          })}
        </motion.section>

        <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
          {PILLARS.map((p, i) => (
            <Panel key={p.title} title={p.title} icon={p.icon} color={p.color} shown={beat >= i + 1} focus={beat === i + 1}>
              <Checks items={p.items} focus={beat === i + 1} spread className="p-4 text-[19px]" />
            </Panel>
          ))}
        </div>

        <Outcome shown={beat >= 4}>A controlled application environment with security, accountability and traceability.</Outcome>
      </div>
    </FitBox>
  );
}
