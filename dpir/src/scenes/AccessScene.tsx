import { motion } from "motion/react";
import { Fragment, useState, type ReactNode } from "react";
import { FitBox } from "@/components/FitBox";
import {
  ArrowDown,
  ChartBar,
  CheckCircle,
  ClipboardText,
  ClockCounterClockwise,
  GearSix,
  Image,
  Key,
  MapPin,
  Megaphone,
  Minus,
  PencilSimple,
  SealCheck,
  ShieldCheck,
  Storefront,
  User,
  UserGear,
  UsersThree,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type RoleId = "sa" | "da" | "co" | "aa" | "fo" | "ro";
type Role = { id: RoleId; name: string; short: string; duty: string; icon: CessIcon; color: string };

const ROLES: Role[] = [
  { id: "sa", name: "Super Administrator", short: "Super Admin", duty: "Overall platform administration (user, roles, configuration, system settings).", icon: UserGear, color: "#7c3aed" },
  { id: "da", name: "DIPR Administrator", short: "DIPR Admin", duty: "Department-level administration (users, workflow, masters, permissions).", icon: UsersThree, color: "#2563eb" },
  { id: "co", name: "Campaign Officer", short: "Campaign Officer", duty: "Campaign creation and management (registration, planning, media, activities).", icon: PencilSimple, color: "#16a34a" },
  { id: "aa", name: "Approving Authority", short: "Approving Authority", duty: "Review and approval of campaigns (plans, budget, media and schedules).", icon: SealCheck, color: "#d97706" },
  { id: "fo", name: "Field Officer", short: "Field Officer", duty: "Field monitoring and evidence capture (photos, videos, GPS, offline data collection).", icon: MapPin, color: "#ea580c" },
  { id: "ro", name: "Reporting Officer", short: "Reporting Officer", duty: "Dashboards and reports (campaign, execution, expenditure and compliance).", icon: ChartBar, color: "#0891b2" },
];

const HIERARCHY: RoleId[] = ["sa", "da", "aa", "co", "fo", "ro"];

const MATRIX: { fn: string; icon: CessIcon; allow: RoleId[] }[] = [
  { fn: "User & Role Management", icon: UsersThree, allow: ["sa", "da"] },
  { fn: "Campaign Registration & Planning", icon: Megaphone, allow: ["sa", "da", "co"] },
  { fn: "Approval Workflow", icon: SealCheck, allow: ["sa", "da", "aa"] },
  { fn: "Media Execution & Agency Management", icon: Storefront, allow: ["sa", "da", "co"] },
  { fn: "Proof-of-Display (Evidence)", icon: Image, allow: ["sa", "da", "co", "fo"] },
  { fn: "Reports & Dashboards", icon: ChartBar, allow: ["sa", "da", "aa", "ro"] },
  { fn: "System Configuration", icon: GearSix, allow: ["sa", "da"] },
];

const AUDIT: { when: string; user: string; role: RoleId; action: string; icon: CessIcon; tone: string; module: string; details: string }[] = [
  { when: "30 Jul 2026, 11:24 AM", user: "Smt. Kavitha R.", role: "co", action: "Created Campaign", icon: ClipboardText, tone: "#2563eb", module: "Campaign Management", details: "DIPR-CAM-2026-0091 – “Water Conservation Drive”" },
  { when: "30 Jul 2026, 01:10 PM", user: "Shri Hemanth Kumar B.", role: "aa", action: "Approved Campaign", icon: CheckCircle, tone: "#16a34a", module: "Approval Workflow", details: "DIPR-CAM-2026-0091 – Media plan approved" },
  { when: "01 Aug 2026, 10:05 AM", user: "Shri Ravi Kumar H.", role: "fo", action: "Uploaded Evidence", icon: Image, tone: "#2563eb", module: "Proof-of-Display", details: "Outdoor Display – Location A (Photo + GPS)" },
  { when: "01 Aug 2026, 04:30 PM", user: "Smt. Deepa M.", role: "ro", action: "Generated Report", icon: ChartBar, tone: "#2563eb", module: "Reports & Analytics", details: "Campaign Execution Report (Jul 2026)" },
];

const CARDS: { title: string; icon: CessIcon; color: string; items: string[] }[] = [
  {
    title: "User & Access Management",
    icon: UsersThree,
    color: "#2563eb",
    items: ["User registration and administration.", "Role-Based Access Control (RBAC).", "Role-wise access restrictions.", "Single Sign-On (SSO).", "Multi-Factor Authentication (MFA), if requested."],
  },
  {
    title: "Security",
    icon: ShieldCheck,
    color: "#16a34a",
    items: [
      "Secure authentication mechanisms.",
      "Encryption of data in transit (e.g., HTTPS).",
      "Encryption of data at rest (e.g., database encryption).",
      "Secure and controlled API access.",
      "Data retention policies.",
      "Role-wise access controls.",
    ],
  },
  {
    title: "Audit and Accountability",
    icon: ClockCounterClockwise,
    color: "#7c3aed",
    items: ["Maintain audit trails.", "Record user activities (create, update, approve, verify, etc.).", "Track relevant administrative actions.", "Maintain records for review and inspection."],
  },
];

const roleOf = (id: RoleId) => ROLES.find((r) => r.id === id)!;

/**
 * Beats: 0 user hierarchy, 1 roles and responsibilities, 2 permission matrix, 3 user and access management,
 * 4 security, 5 audit and accountability, 6 expected outcome.
 */
export function AccessScene({ beat }: { beat: number }) {
  const [hover, setHover] = useState<RoleId | null>(null);
  const hp = { beat, hover, onHover: setHover };
  return (
    <FitBox w={1440} h={724}>
      <div className="flex size-full flex-col gap-2.5 text-[14px] text-ink">
        <div className="grid min-h-0 flex-1 grid-cols-[200px_minmax(0,1fr)] gap-3">
          <Hierarchy {...hp} />
          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto_172px] gap-2.5">
            <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1.36fr)] gap-3">
              <RolesTable {...hp} />
              <Matrix {...hp} />
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)] gap-3">
              {CARDS.map((c, i) => (
                <InfoCard key={c.title} card={c} lit={beat >= 3 + i || beat === 6} focus={beat === 3 + i} />
              ))}
            </div>
            <AuditTrail {...hp} />
          </div>
        </div>

        <Outcome shown={beat >= 6} />
      </div>
    </FitBox>
  );
}

function SectionTitle({ icon: I, children, extra }: { icon: CessIcon; children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="font-display flex items-center gap-2 rounded-r-full rounded-l-md bg-linear-to-r from-navy to-[#1d4fc4] py-1 pr-5 pl-2.5 text-[16px] font-bold text-white shadow-sm">
        <I weight="duotone" className="size-[1.2em] shrink-0" />
        {children}
      </span>
      {extra}
    </div>
  );
}

function Panel({ title, icon, on, color, className, extra, children }: { title: ReactNode; icon: CessIcon; on: boolean; color: string; className?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, boxShadow: on ? `0 0 0 2px ${color}, 0 18px 32px -22px ${color}` : "0 14px 28px -24px rgba(7,20,51,0.55)" }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn("flex min-h-0 min-w-0 flex-col gap-1.5 rounded-xl border border-[#dbe4f0] bg-white/95 p-2", className)}
    >
      <SectionTitle icon={icon} extra={extra}>
        {title}
      </SectionTitle>
      {children}
    </motion.section>
  );
}

type HoverProps = { beat: number; hover: RoleId | null; onHover: (r: RoleId | null) => void };

function Hierarchy({ beat, hover, onHover }: HoverProps) {
  return (
    <motion.section
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0, boxShadow: beat === 0 ? "0 0 0 2px #1d4fc4, 0 18px 32px -22px #1d4fc4" : "0 14px 28px -24px rgba(7,20,51,0.55)" }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#dbe4f0] bg-white/95"
    >
      <span className="font-display flex shrink-0 items-center gap-2 bg-linear-to-r from-navy to-[#1d4fc4] px-3 py-2 text-[16px] leading-tight font-bold text-white">
        <UsersThree weight="fill" className="size-[1.5em] shrink-0" />
        <span>
          User Hierarchy
          <span className="block text-[13px] font-medium text-white/80">(Illustrative)</span>
        </span>
      </span>
      <div className="flex min-h-0 flex-1 flex-col justify-between p-2.5">
        {HIERARCHY.map((id, i) => {
          const r = roleOf(id);
          const I = r.icon;
          const hot = hover === id;
          return (
            <Fragment key={id}>
              {i > 0 && <ArrowDown weight="bold" className="mx-auto size-[16px] shrink-0 text-[#1d4fc4]" />}
              <motion.div
                onMouseEnter={() => onHover(id)}
                onMouseLeave={() => onHover(null)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0, backgroundColor: hot ? `${r.color}1c` : "#eef4fc" }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-2.5 rounded-lg border px-2 py-1.5"
                style={{ borderColor: hot ? r.color : "#c9d8ee" }}
              >
                <span className="relative grid size-[44px] shrink-0 place-items-center rounded-full ring-2 ring-white" style={{ background: `${r.color}22` }}>
                  <User weight="fill" className="size-[28px]" style={{ color: r.color }} />
                  <span className="absolute -right-1 -bottom-1 grid size-[20px] place-items-center rounded-full text-white ring-2 ring-white" style={{ background: r.color }}>
                    <I weight="fill" className="size-[12px]" />
                  </span>
                </span>
                <span className="font-display text-[15px] leading-tight font-bold text-navy">{r.name}</span>
              </motion.div>
            </Fragment>
          );
        })}
      </div>
    </motion.section>
  );
}

function RolesTable({ beat, hover, onHover }: HoverProps) {
  return (
    <Panel title="User Roles and Responsibilities" icon={User} on={beat === 1} color="#1d4fc4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200">
        <div className="grid shrink-0 grid-cols-[172px_minmax(0,1fr)] gap-2 bg-[#e8effa] px-2 py-1 font-semibold text-navy">
          <span className="text-center">User Role</span>
          <span className="text-center">Primary Responsibility</span>
        </div>
        <div className="grid min-h-0 flex-1 auto-rows-fr">
          {ROLES.map((r, i) => {
            const I = r.icon;
            const hot = hover === r.id;
            return (
              <motion.div
                key={r.id}
                onMouseEnter={() => onHover(r.id)}
                onMouseLeave={() => onHover(null)}
                initial={false}
                animate={{ opacity: beat >= 1 ? 1 : 0.4, backgroundColor: hot ? `${r.color}14` : "rgba(255,255,255,0)" }}
                transition={{ delay: beat === 1 ? 0.1 + i * 0.08 : 0, duration: 0.35 }}
                className="grid min-h-0 grid-cols-[172px_minmax(0,1fr)] items-center gap-2 border-t border-slate-100 px-2 leading-tight"
              >
                <span className="flex items-center gap-2 font-semibold text-navy">
                  <span className="grid size-[26px] shrink-0 place-items-center rounded-md" style={{ background: `${r.color}1f`, color: r.color }}>
                    <I weight="fill" className="size-[16px]" />
                  </span>
                  {r.name}
                </span>
                <span className="text-[13.5px] text-ink/85">{r.duty}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function Matrix({ beat, hover, onHover }: HoverProps) {
  const shown = beat >= 2;
  const cols = `minmax(0,1fr) repeat(${ROLES.length}, 64px)`;
  return (
    <Panel title="Role-Based Access Control (Illustrative Permission Matrix)" icon={Key} on={beat === 2} color="#2563eb">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#cfd9e8] bg-white">
        <div className="grid shrink-0 border-b border-[#cfd9e8] bg-[#eef2f8] font-semibold text-navy [&>*]:self-stretch [&>*+*]:border-l [&>*+*]:border-[#d6dfeb]" style={{ gridTemplateColumns: cols }}>
          <span className="flex items-center px-2">Application Function / Module</span>
          {ROLES.map((r) => {
            const I = r.icon;
            return (
              <span
                key={r.id}
                onMouseEnter={() => onHover(r.id)}
                onMouseLeave={() => onHover(null)}
                className={cn("flex flex-col items-center justify-end py-1 text-center text-[13px] leading-tight tracking-tight", hover === r.id && "bg-white")}
              >
                <span className="mb-0.5 grid size-[24px] place-items-center rounded-md" style={{ background: `${r.color}1f`, color: r.color }}>
                  <I weight="fill" className="size-[15px]" />
                </span>
                {r.short}
              </span>
            );
          })}
        </div>
        <div className="grid min-h-0 flex-1 auto-rows-fr">
          {MATRIX.map((m, i) => {
            const I = m.icon;
            return (
              <div key={m.fn} className={cn("grid min-h-0 leading-tight [&>*]:self-stretch [&>*+*]:border-l [&>*+*]:border-[#d6dfeb]", i > 0 && "border-t border-[#d6dfeb]")} style={{ gridTemplateColumns: cols }}>
                <span className="flex items-center gap-1.5 px-2 text-[13.5px] font-medium whitespace-nowrap text-navy">
                  <I weight="duotone" className="size-[17px] shrink-0 text-[#1d4fc4]" />
                  {m.fn}
                </span>
                {ROLES.map((r, j) => {
                  const ok = m.allow.includes(r.id);
                  return (
                    <span key={r.id} className={cn("grid h-full place-items-center", hover === r.id && "bg-[#eef3fb]")}>
                      <motion.span
                        initial={false}
                        animate={{ scale: shown ? 1 : 0, opacity: shown ? 1 : 0 }}
                        transition={{ delay: shown ? 0.1 + j * 0.08 + i * 0.03 : 0, type: "spring", stiffness: 320, damping: 18 }}
                      >
                        {ok ? <CheckCircle weight="fill" className="size-[19px] text-[#16a34a]" /> : <Minus weight="bold" className="size-[16px] text-slate-400" />}
                      </motion.span>
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex shrink-0 justify-center gap-6 text-ink/80">
        <span className="flex items-center gap-1.5">
          <CheckCircle weight="fill" className="size-[17px] text-[#16a34a]" /> = Access Permitted
        </span>
        <span className="flex items-center gap-1.5">
          <Minus weight="bold" className="size-[16px] text-slate-400" /> = No Access
        </span>
      </div>
    </Panel>
  );
}

function InfoCard({ card, lit, focus }: { card: (typeof CARDS)[number]; lit: boolean; focus: boolean }) {
  const I = card.icon;
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: lit ? 1 : 0.45,
        y: focus ? -3 : 0,
        boxShadow: focus ? `0 0 0 2px ${card.color}, 0 18px 32px -20px ${card.color}` : "0 14px 28px -24px rgba(7,20,51,0.55)",
      }}
      transition={{ duration: 0.45 }}
      className="flex flex-col gap-1 rounded-xl border border-[#dbe4f0] bg-linear-to-b from-[#f2f7fe] to-white px-3 py-2"
    >
      <span className="font-display flex items-center gap-2 text-[17px] font-bold text-navy">
        <I weight="duotone" className="size-[26px] shrink-0" style={{ color: card.color }} />
        {card.title}
      </span>
      <ul className="grid gap-0.5 leading-tight">
        {card.items.map((t, i) => (
          <motion.li
            key={t}
            initial={false}
            animate={{ x: focus ? [8, 0] : 0, opacity: 1 }}
            transition={{ delay: focus ? 0.1 + i * 0.07 : 0, duration: 0.35 }}
            className="flex items-start gap-1.5"
          >
            <CheckCircle weight="fill" className="mt-px size-[16px] shrink-0 text-[#16a34a]" />
            {t}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

function AuditTrail({ beat, hover, onHover }: HoverProps) {
  const shown = beat >= 5;
  const cols = "grid grid-cols-[164px_186px_150px_176px_176px_minmax(0,1fr)] whitespace-nowrap [&>*]:flex [&>*]:items-center [&>*]:px-2.5 [&>*+*]:border-l [&>*+*]:border-[#d6dfeb]";
  return (
    <Panel
      title={
        <>
          Audit Trail – Recent User Activities <span className="font-medium text-white/85">(Illustrative)</span>
        </>
      }
      icon={ClockCounterClockwise}
      on={beat === 5}
      color="#7c3aed"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#cfd9e8] bg-white">
        <div className={cn(cols, "shrink-0 border-b border-[#cfd9e8] bg-[#eef2f8] font-bold text-navy [&>*]:py-1.5")}>
          <span>Date & Time</span>
          <span>User</span>
          <span>Role</span>
          <span>Action Performed</span>
          <span>Module / Record</span>
          <span>Details</span>
        </div>
        <div className="grid min-h-0 flex-1 auto-rows-fr">
          {AUDIT.map((a, i) => {
            const r = roleOf(a.role);
            const I = a.icon;
            return (
              <motion.div
                key={a.when}
                onMouseEnter={() => onHover(a.role)}
                onMouseLeave={() => onHover(null)}
                initial={false}
                animate={{ opacity: shown ? 1 : 0.35, x: shown ? 0 : 10, backgroundColor: hover === a.role ? `${r.color}12` : "rgba(255,255,255,0)" }}
                transition={{ delay: shown ? 0.15 + i * 0.18 : 0, duration: 0.4 }}
                className={cn(cols, "min-h-0 leading-tight text-navy", i > 0 && "border-t border-[#d6dfeb]")}
              >
                <span>{a.when}</span>
                <span>{a.user}</span>
                <span>{r.name}</span>
                <span className="flex items-center gap-2">
                  <I weight={a.icon === CheckCircle ? "fill" : "duotone"} className="size-[19px] shrink-0" style={{ color: a.tone }} />
                  {a.action}
                </span>
                <span>{a.module}</span>
                <span>{a.details}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function Outcome({ shown }: { shown: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.99 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex h-[60px] shrink-0 items-center gap-5 overflow-hidden rounded-2xl border border-[#7c3aed]/25 bg-[linear-gradient(90deg,#f5f3ff,#ffffff_60%,#f5f3ff)] pr-5 shadow-[0_14px_30px_-24px_rgba(7,20,51,0.7)]"
    >
      <span className="font-display flex h-full shrink-0 items-center gap-2.5 bg-linear-to-r from-[#5b21b6] to-[#7c3aed] pr-8 pl-4 text-[19px] font-bold text-white [clip-path:polygon(0_0,calc(100%-18px)_0,100%_50%,calc(100%-18px)_100%,0_100%)]">
        <ShieldCheck weight="fill" className="size-[26px]" /> Expected Outcome
      </span>
      <span className="h-8 w-px shrink-0 bg-navy/25" />
      <p className="font-display flex-1 text-center text-[18px] leading-snug font-bold text-navy">
        A controlled application environment where authorized users can perform their assigned responsibilities while maintaining security, accountability and traceability.
      </p>
    </motion.div>
  );
}
