import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { AppShell, Laptop, type NavItem } from "@/components/AmtApp";
import { FeatureStrip, type Feature } from "@/components/FeatureStrip";
import { useTyped } from "@/hooks/useTyped";
import { CAMPAIGN } from "@/scenes/CampaignScene";
import {
  CaretDown,
  ChartBar,
  CheckCircle,
  Clock,
  DownloadSimple,
  FilePdf,
  Files,
  GpsFix,
  Handshake,
  Images,
  MagnifyingGlass,
  MapPin,
  Megaphone,
  Newspaper,
  Play,
  SealCheck,
  SquaresFour,
  Stack,
  Tag,
  Television,
  UploadSimple,
  UsersThree,
  X,
  type CessIcon,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import imgCity from "@/assets/title-bg.webp";
import imgOutdoor from "@/assets/photos/media-outdoor.webp";
import imgField from "@/assets/photos/act-field.webp";

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV: NavItem[] = [
  { label: "Dashboard", icon: SquaresFour },
  { label: "Campaigns", icon: Megaphone },
  { label: "Media Library", icon: Images },
  { label: "Approvals", icon: SealCheck },
  { label: "Agencies", icon: Handshake },
  { label: "Field Monitoring", icon: GpsFix },
  { label: "Reports", icon: ChartBar },
  { label: "Users & Roles", icon: UsersThree },
];

type Cat = "all" | "print" | "digital" | "outdoor" | "docs";
const CATS: { key: Cat; label: string; count: number; icon: CessIcon; color: string }[] = [
  { key: "all", label: "All Assets", count: 248, icon: Files, color: "#1d4fc4" },
  { key: "print", label: "Print", count: 86, icon: Newspaper, color: "#ea580c" },
  { key: "digital", label: "Digital", count: 102, icon: Television, color: "#7c3aed" },
  { key: "outdoor", label: "Outdoor", count: 54, icon: MapPin, color: "#16a34a" },
  { key: "docs", label: "Documents", count: 6, icon: FilePdf, color: "#dc2626" },
];

export type Kind = "en" | "kn" | "theme" | "banner" | "square" | "video" | "hoarding" | "shelter" | "doc";
type Asset = { id: string; kind: Kind; title: string; cat: Exclude<Cat, "all">; type: string; file: string; size: string; v: string; status: "Approved" | "Under Review"; date: string; usage: string; tags: string[] };

const ASSETS: Asset[] = [
  { id: "a1", kind: "en", title: "Print Ad – English", cat: "print", type: "Newspaper Advertisement", file: "JPG (A3)", size: "2.4 MB", v: "v2.0", status: "Approved", date: "12-08-2026", usage: "5 Publications", tags: ["Swachh Karnataka", "Clean City", "Print Ad"] },
  { id: "a2", kind: "kn", title: "Print Ad – Kannada", cat: "print", type: "Newspaper Advertisement", file: "JPG (A3)", size: "2.1 MB", v: "v1.0", status: "Approved", date: "12-08-2026", usage: "3 Publications", tags: ["Swachh Karnataka", "Kannada"] },
  { id: "a3", kind: "theme", title: "Print Ad – Theme 2", cat: "print", type: "Newspaper Advertisement", file: "JPG (A3)", size: "1.8 MB", v: "v1.0", status: "Under Review", date: "10-08-2026", usage: "Not yet used", tags: ["Swachh Karnataka"] },
  { id: "a4", kind: "banner", title: "Digital Banner – 728×90", cat: "digital", type: "Web Banner", file: "PNG", size: "620 KB", v: "v1.0", status: "Approved", date: "11-08-2026", usage: "2 Portals", tags: ["Swachh Karnataka", "Web"] },
  { id: "a5", kind: "square", title: "Digital Banner – 300×250", cat: "digital", type: "Web Banner", file: "PNG", size: "540 KB", v: "v1.2", status: "Approved", date: "11-08-2026", usage: "3 Platforms", tags: ["Swachh Karnataka", "Social"] },
  { id: "a6", kind: "video", title: "Campaign Video", cat: "digital", type: "Promotional Video", file: "MP4 (01:00)", size: "24 MB", v: "v1.0", status: "Approved", date: "09-08-2026", usage: "OTT and social", tags: ["Swachh Karnataka", "Video"] },
  { id: "a7", kind: "hoarding", title: "Outdoor Hoarding", cat: "outdoor", type: "Billboard Design", file: "JPG (20×10 ft)", size: "1.5 MB", v: "v1.0", status: "Approved", date: "13-08-2026", usage: "2 Locations", tags: ["Swachh Karnataka", "Hoarding"] },
  { id: "a8", kind: "shelter", title: "Bus Shelter Panel", cat: "outdoor", type: "Transit Media", file: "JPG", size: "1.2 MB", v: "v1.1", status: "Approved", date: "13-08-2026", usage: "10 Locations", tags: ["Swachh Karnataka", "Transit"] },
  { id: "a9", kind: "doc", title: "Creative Guidelines", cat: "docs", type: "Brand Guidelines", file: "PDF", size: "3.2 MB", v: "v1.0", status: "Approved", date: "05-08-2026", usage: "Reference", tags: ["Guidelines"] },
];

const VERSIONS = [
  { v: "v2.0", what: "Approved for publication", when: "12-08-2026", tone: "#16a34a" },
  { v: "v1.1", what: "Tagline and logo updated", when: "10-08-2026", tone: "#ea580c" },
  { v: "v1.0", what: "Initial creative uploaded", when: "08-08-2026", tone: "#2563eb" },
];

const GEO = [
  { place: "MG Road, Bengaluru", ll: "12.9756° N, 77.6050° E", x: 58, y: 62 },
  { place: "Hebbal Flyover, Bengaluru", ll: "13.0358° N, 77.5970° E", x: 46, y: 22 },
];

const FEATURES: Feature[] = [
  { title: "Asset Management", icon: UploadSimple, color: "#7c3aed", items: ["Upload advertisement images, documents and videos.", "Maintain a centralized asset repository.", "Organize assets by campaign and media category.", "Maintain asset descriptions and metadata."] },
  { title: "Asset Classification", icon: Stack, color: "#0d9488", items: ["Print advertisement creatives.", "Digital banners and promotional materials.", "Outdoor advertisement creatives.", "Other campaign-related media assets."] },
  { title: "Version Management", icon: Clock, color: "#ea580c", items: ["Maintain multiple versions of creative assets.", "Track updated and approved versions.", "Associate assets with the relevant campaign.", "Maintain asset history."] },
  { title: "Search and Retrieval", icon: MagnifyingGlass, color: "#2563eb", items: ["Search assets using metadata.", "Filter by campaign and media category.", "Retrieve associated creative materials.", "View asset details and usage references."] },
  { title: "Geo-tagging", icon: MapPin, color: "#dc2626", items: ["Support geo-tagging of outdoor advertising assets to associate them with relevant geographic locations."] },
];

const CYCLE: Cat[] = ["print", "digital", "outdoor"];
const SEARCH = "swachh print";

type Mode = "meta" | "versions" | "geo";
const modeAt = (beat: number): Mode => (beat === 3 ? "versions" : beat === 5 ? "geo" : "meta");
const assetAt = (beat: number) => (beat === 5 ? "a7" : "a1");
const catAt = (beat: number): Cat => (beat === 3 || beat === 4 ? "print" : beat === 5 ? "outdoor" : "all");

/**
 * Beats: 0 media library, 1 asset upload, 2 classification, 3 version management, 4 search and retrieval,
 * 5 geo-tagging, 6 expected outcome.
 */
export function AssetScene({ beat }: { beat: number }) {
  const [cat, setCat] = useState<Cat>(catAt(beat));
  const [sel, setSel] = useState(assetAt(beat));
  const [mode, setMode] = useState<Mode>(modeAt(beat));
  useEffect(() => {
    setCat(catAt(beat));
    setSel(assetAt(beat));
    setMode(modeAt(beat));
    if (beat !== 2) return;
    let i = 0;
    setCat(CYCLE[0]);
    const t = window.setInterval(() => {
      i = (i + 1) % CYCLE.length;
      setCat(CYCLE[i]);
    }, 1800);
    return () => window.clearInterval(t);
  }, [beat]);

  return (
    <div className="flex h-full flex-col gap-[clamp(6px,1vh,12px)] text-ink">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="font-display shrink-0 text-center text-[length:clamp(16px,2.4vh,23px)] font-bold text-navy"
      >
        Organized management of advertising assets <span className="text-[#1d4fc4]">across all media channels.</span>
      </motion.p>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.6fr)_minmax(0,4fr)] gap-[clamp(10px,1.2vw,20px)]">
        <InUse cat={cat} geo={beat === 5} />
        <Laptop>
          <AppShell nav={NAV} active="Media Library">
            <Library beat={beat} cat={cat} setCat={setCat} sel={sel} setSel={setSel} mode={mode} setMode={setMode} />
          </AppShell>
        </Laptop>
      </div>

      <FeatureStrip
        features={FEATURES}
        active={beat - 1}
        outcomeShown={beat >= 6}
        outcome={
          <>
            <span className="font-display font-bold text-[#15803d]">A centralized and searchable inventory</span> of advertisement creatives, with campaign association, metadata and version information.
          </>
        }
      />
    </div>
  );
}

/** A thumbnail of an advertisement creative; headline text scales with the thumbnail width. */
export function Creative({ kind, className }: { kind: Kind; className?: string }) {
  const head = "font-display leading-[0.95] font-black uppercase drop-shadow-sm";
  const fit = (cqw: number) => ({ fontSize: `max(13px, ${cqw}cqw)` });
  let body: ReactNode;
  switch (kind) {
    case "en":
    case "kn":
      body = (
        <>
          <img src={imgCity} alt="" className="absolute inset-0 size-full object-cover" />
          <span className={cn("absolute inset-0", kind === "en" ? "bg-linear-to-b from-white/95 via-white/40 to-transparent" : "bg-linear-to-b from-[#14532d]/90 via-[#14532d]/30 to-transparent")} />
          <span className={cn("absolute inset-x-1 top-[8%] text-center", head, kind === "en" ? "text-[#166534]" : "text-white normal-case")} style={fit(kind === "en" ? 12 : 13)}>
            {kind === "en" ? "Swachh Karnataka" : "ಸ್ವಚ್ಛ ಕರ್ನಾಟಕ"}
          </span>
        </>
      );
      break;
    case "theme":
      body = (
        <>
          <span className="absolute inset-0 bg-linear-to-b from-[#fde68a] to-[#fef9c3]" />
          <img src={imgCity} alt="" className="absolute inset-x-0 bottom-0 h-[34%] w-full object-cover" />
          <span className={cn("absolute inset-x-1 top-[7%] text-center text-[#166534]", head)} style={fit(9.5)}>
            Clean Cities, Stronger Karnataka
          </span>
        </>
      );
      break;
    case "banner":
      body = (
        <>
          <span className="absolute inset-0 bg-slate-100" />
          <span className="absolute inset-x-[6%] top-[36%] flex h-[28%] items-center overflow-hidden rounded-sm bg-linear-to-r from-[#166534] to-[#22c55e] shadow">
            <span className={cn("flex-1 px-1.5 text-white", head)} style={fit(8)}>
              Swachh Karnataka
            </span>
            <img src={imgCity} alt="" className="h-full w-[38%] object-cover" />
          </span>
        </>
      );
      break;
    case "square":
      body = (
        <>
          <span className="absolute inset-0 bg-slate-100" />
          <span className="absolute inset-y-[8%] left-1/2 aspect-[6/5] -translate-x-1/2 overflow-hidden rounded-sm shadow">
            <img src={imgCity} alt="" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-0 bg-linear-to-b from-[#166534]/90 to-transparent" />
            <span className={cn("absolute inset-x-1 top-[10%] text-center text-white", head)} style={fit(8)}>
              Cleaner Tomorrow
            </span>
          </span>
        </>
      );
      break;
    case "video":
      body = (
        <>
          <img src={imgField} alt="" className="absolute inset-0 size-full object-cover" />
          <span className="absolute inset-0 bg-black/25" />
          <span className="absolute top-1/2 left-1/2 grid size-[26%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#7c3aed] shadow">
            <Play weight="fill" className="size-1/2" />
          </span>
        </>
      );
      break;
    case "hoarding":
      body = (
        <>
          <img src={imgOutdoor} alt="" className="absolute inset-0 size-full object-cover" />
          <span className="absolute inset-x-[14%] top-[10%] h-[46%] overflow-hidden rounded-sm border-2 border-slate-700 bg-white shadow-lg">
            <img src={imgCity} alt="" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-0 bg-linear-to-b from-white/95 via-white/30 to-transparent" />
            <span className={cn("absolute inset-x-0.5 top-[6%] text-center text-[#166534]", head)} style={fit(8)}>
              Swachh Karnataka
            </span>
          </span>
        </>
      );
      break;
    case "shelter":
      body = (
        <>
          <span className="absolute inset-0 bg-linear-to-br from-[#0ea5e9] to-[#1d4fc4]" />
          <span className={cn("absolute inset-x-1 top-[8%] text-center text-white", head)} style={fit(9.5)}>
            Keep Karnataka Clean
          </span>
          <img src={imgCity} alt="" className="absolute inset-x-[10%] bottom-[6%] h-[30%] w-[80%] rounded-sm object-cover" />
        </>
      );
      break;
    default:
      body = (
        <>
          <span className="absolute inset-0 bg-red-50" />
          <FilePdf weight="duotone" className="absolute top-1/2 left-1/2 size-[40%] -translate-x-1/2 -translate-y-1/2 text-red-600" />
        </>
      );
  }
  return <span className={cn("@container relative block overflow-hidden", className)}>{body}</span>;
}

function InUse({ cat, geo }: { cat: Cat; geo: boolean }) {
  const ring = (c: Cat) => (cat === c ? CATS.find((x) => x.key === c)!.color : "transparent");
  return (
    <div className="grid min-h-0 grid-rows-3 gap-[clamp(6px,1vh,12px)]">
      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="relative overflow-hidden rounded-xl border-[3px] bg-[#f6f3ea] p-1.5 shadow-lg" style={{ borderColor: ring("print") }}>
        <div className="grid h-full grid-cols-[1fr_1.4fr] gap-1.5">
          <div className="grid content-start gap-1">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="h-1 rounded bg-slate-300" style={{ width: `${70 + ((i * 13) % 30)}%` }} />
            ))}
          </div>
          <Creative kind="en" className="rounded-sm" />
        </div>
        <Badge color="#ea580c">Print</Badge>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="relative overflow-hidden rounded-xl border-[3px] bg-[#0d1424] p-1.5 shadow-lg" style={{ borderColor: ring("digital") }}>
        <Creative kind="square" className="size-full rounded-md" />
        <Badge color="#7c3aed">Digital</Badge>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="relative overflow-hidden rounded-xl border-[3px] shadow-lg" style={{ borderColor: ring("outdoor") }}>
        <Creative kind="hoarding" className="size-full" />
        <AnimatePresence>
          {geo && (
            <motion.span initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }} className="absolute top-[52%] left-1/2 -translate-x-1/2 text-[#dc2626] drop-shadow-lg">
              <MapPin weight="fill" className="size-[clamp(26px,4vh,38px)]" />
            </motion.span>
          )}
        </AnimatePresence>
        <Badge color="#16a34a">Outdoor</Badge>
      </motion.div>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="absolute bottom-1.5 left-1.5 rounded-full px-2 text-[13px] font-bold text-white shadow" style={{ background: color }}>
      {children}
    </span>
  );
}

function Library({
  beat,
  cat,
  setCat,
  sel,
  setSel,
  mode,
  setMode,
}: {
  beat: number;
  cat: Cat;
  setCat: (c: Cat) => void;
  sel: string;
  setSel: (id: string) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  const query = useTyped(SEARCH, beat === 4, 300);
  const searching = beat === 4;
  const shown = ASSETS.filter((a) => (cat === "all" ? a.cat !== "docs" : a.cat === cat)).filter((a) => !searching || query.length < SEARCH.length || a.cat === "print");
  const asset = ASSETS.find((a) => a.id === sel) ?? ASSETS[0];
  const pick = (e: MouseEvent, fn: () => void) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_clamp(200px,17vw,270px)] gap-[clamp(6px,0.7vw,12px)]">
      <div className="flex min-h-0 flex-col gap-[clamp(4px,0.7vh,8px)]">
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-display text-[length:clamp(15px,2vh,18px)] font-bold text-navy">Media Library</span>
          <span className={cn("ml-auto flex min-w-0 flex-1 items-center gap-1.5 rounded-md border bg-white px-2 py-1", searching ? "border-[#1d4fc4]" : "border-slate-300")}>
            <MagnifyingGlass className="size-[1.1em] shrink-0 text-slate-500" />
            <span className={cn("truncate", query ? "text-ink" : "text-slate-400")}>{query || "Search by campaign, title, keywords"}</span>
            {searching && query.length < SEARCH.length && <span className="h-[1.1em] w-px animate-pulse bg-ink" />}
          </span>
          <motion.span
            animate={beat === 1 ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.9, repeat: beat === 1 ? 2 : 0 }}
            className="flex shrink-0 items-center gap-1 rounded-md bg-[#1d4fc4] px-2.5 py-1 font-semibold text-white"
          >
            <UploadSimple weight="bold" className="size-[1em]" /> Upload Asset
          </motion.span>
        </div>

        <div className="grid shrink-0 grid-cols-5 gap-1.5">
          {CATS.map((c) => {
            const I = c.icon;
            const on = cat === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={(e) => pick(e, () => setCat(c.key))}
                className="flex items-center gap-2 rounded-lg border bg-white px-2 py-1 text-left transition-colors"
                style={{ borderColor: on ? c.color : "#e2e8f0", background: on ? `${c.color}10` : "#fff", boxShadow: on ? `0 0 0 1px ${c.color}` : undefined }}
              >
                <I weight={on ? "fill" : "duotone"} className="size-[clamp(18px,2.6vh,24px)] shrink-0" style={{ color: c.color }} />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate font-semibold text-navy">{c.label}</span>
                  <span className="block text-ink/65">{c.count} Assets</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Drop on={searching}>{searching ? CAMPAIGN.name.split(" –")[0] : "All Campaigns"}</Drop>
          <Drop on={cat !== "all"}>{cat === "all" ? "All Media Categories" : `${CATS.find((c) => c.key === cat)!.label} Media`}</Drop>
          <Drop>All Status</Drop>
          <Drop>All File Types</Drop>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence>
            {beat === 1 && <UploadToast />}
          </AnimatePresence>
          <motion.div layout className="grid grid-cols-4 gap-[clamp(5px,0.6vw,9px)]">
            <AnimatePresence mode="popLayout">
              {shown.map((a, i) => {
                const on = a.id === sel;
                const fresh = beat === 1 && a.id === "a1";
                return (
                  <motion.button
                    key={a.id}
                    layout
                    type="button"
                    onClick={(e) => pick(e, () => setSel(a.id))}
                    initial={{ opacity: 0, scale: fresh ? 0.6 : 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.35, delay: fresh ? 1.4 : i * 0.04 }}
                    className="flex flex-col overflow-hidden rounded-lg border bg-white text-left"
                    style={{ borderColor: on ? "#1d4fc4" : "#e2e8f0", boxShadow: on ? "0 0 0 2px #1d4fc4" : fresh ? "0 0 0 3px #7c3aed" : undefined }}
                  >
                    <span className="relative block aspect-[16/10]">
                      <Creative kind={a.kind} className="size-full" />
                      <span className="absolute right-1 bottom-1 rounded bg-navy/85 px-1 text-[13px] font-bold text-white">{a.v}</span>
                      {on && (
                        <span className="absolute top-1 left-1 grid size-5 place-items-center rounded bg-[#1d4fc4] text-white">
                          <CheckCircle weight="fill" className="size-4" />
                        </span>
                      )}
                    </span>
                    <span className="block px-1.5 pt-1 font-semibold leading-tight text-navy">{a.title}</span>
                    <span className="flex items-center justify-between gap-1 px-1.5 pb-1">
                      <span className="truncate text-ink/65">{a.file.split(" ")[0]} · {a.size}</span>
                      <span className="shrink-0 rounded-full px-1.5 font-semibold" style={{ color: a.status === "Approved" ? "#16a34a" : "#d97706", background: a.status === "Approved" ? "#16a34a18" : "#d9770618" }}>
                        {a.status === "Approved" ? "Approved" : "Review"}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <DetailPanel asset={asset} mode={mode} setMode={(m) => setMode(m)} pick={pick} />
    </div>
  );
}

function Drop({ on, children }: { on?: boolean; children: ReactNode }) {
  return (
    <span className={cn("flex items-center gap-1 rounded-md border px-2 py-0.5 whitespace-nowrap", on ? "border-[#1d4fc4] bg-[#eff4ff] font-semibold text-[#1d4fc4]" : "border-slate-300 bg-white text-navy/80")}>
      {children}
      <CaretDown className="size-[0.9em]" />
    </span>
  );
}

function UploadToast() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="absolute top-1 right-1 z-20 w-[min(320px,70%)] rounded-lg border border-[#7c3aed]/40 bg-white p-2 shadow-[0_16px_30px_-12px_rgba(7,20,51,0.45)]"
    >
      <div className="flex items-center gap-2 font-semibold text-navy">
        <UploadSimple weight="bold" className="size-[1.1em] text-[#7c3aed]" />
        <span className="truncate">Print_Ad_English_v2.jpg</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
        <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.3, ease: "easeInOut" }} className="h-full rounded-full bg-[#7c3aed]" />
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-1 flex items-center gap-1 font-semibold text-[#16a34a]">
        <CheckCircle weight="fill" className="size-[1.1em]" /> Uploaded with campaign metadata
      </motion.div>
    </motion.div>
  );
}

function DetailPanel({ asset, mode, setMode, pick }: { asset: Asset; mode: Mode; setMode: (m: Mode) => void; pick: (e: MouseEvent, fn: () => void) => void }) {
  const geoOk = asset.cat === "outdoor";
  const tabs: { key: Mode; label: string }[] = [
    { key: "meta", label: "Details" },
    { key: "versions", label: "Versions" },
    ...(geoOk ? [{ key: "geo" as const, label: "Location" }] : []),
  ];
  const view = mode === "geo" && !geoOk ? "meta" : mode;
  return (
    <div className="flex min-h-0 flex-col gap-[clamp(3px,0.6vh,7px)] rounded-lg border bg-white p-[clamp(5px,0.6vw,9px)]">
      <div className="flex shrink-0 items-center justify-between">
        <span className="font-display font-bold text-navy">Asset Details</span>
        <X className="size-[1.1em] text-navy/50" />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={asset.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="shrink-0">
          <Creative kind={asset.kind} className="aspect-[2/1] w-full rounded-md" />
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="truncate font-bold text-navy">{asset.title}</span>
            <span className="shrink-0 rounded-full px-1.5 font-semibold" style={{ color: asset.status === "Approved" ? "#16a34a" : "#d97706", background: asset.status === "Approved" ? "#16a34a18" : "#d9770618" }}>
              {asset.status}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex shrink-0 gap-1 border-b">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={(e) => pick(e, () => setMode(t.key))} className={cn("relative px-2 py-0.5 font-semibold", view === t.key ? "text-[#1d4fc4]" : "text-navy/55")}>
            {t.label}
            {view === t.key && <motion.span layoutId="asset-tab" className="absolute inset-x-1 -bottom-px h-[3px] rounded bg-[#1d4fc4]" />}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={view + asset.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="h-full">
            {view === "meta" && <Meta asset={asset} />}
            {view === "versions" && <Versions asset={asset} />}
            {view === "geo" && <Geo />}
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#1d4fc4] py-1 font-semibold text-white">
        <DownloadSimple weight="bold" className="size-[1.05em]" /> Download Asset
      </span>
    </div>
  );
}

function Meta({ asset }: { asset: Asset }) {
  const rows: [string, string][] = [
    ["Campaign", "Swachh Karnataka"],
    ["Category", asset.type],
    ["File", `${asset.file}, ${asset.size}`],
    ["Uploaded", asset.date],
    ["Usage", asset.usage],
  ];
  return (
    <div className="grid content-start gap-[clamp(2px,0.45vh,5px)]">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[72px_minmax(0,1fr)] gap-1.5 leading-tight">
          <span className="text-ink/60">{k}</span>
          <span className="font-medium text-navy">{v}</span>
        </div>
      ))}
      <div className="flex flex-wrap gap-1 pt-0.5">
        <Tag weight="duotone" className="size-[1.2em] text-ink/50" />
        {asset.tags.map((t) => (
          <span key={t} className="rounded-full bg-slate-100 px-1.5 font-medium text-navy">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function Versions({ asset }: { asset: Asset }) {
  const list = asset.v === "v2.0" ? VERSIONS : [{ v: asset.v, what: "Current version", when: asset.date, tone: "#16a34a" }];
  return (
    <ol className="grid content-start gap-[clamp(3px,0.6vh,6px)]">
      {list.map((h, i) => (
        <motion.li key={h.v} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.15 }} className="flex items-center gap-2 rounded-md border px-1.5 py-1" style={{ borderColor: `${h.tone}40`, background: `${h.tone}0a` }}>
          <span className="font-display grid h-6 min-w-9 place-items-center rounded-md px-1 font-bold text-white" style={{ background: h.tone }}>
            {h.v}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-semibold text-navy">{h.what}</span>
            <span className="block text-ink/65">{h.when}</span>
          </span>
        </motion.li>
      ))}
    </ol>
  );
}

function Geo() {
  return (
    <div className="flex h-full flex-col gap-1">
      <div className="relative min-h-[44px] flex-1 overflow-hidden rounded-md border bg-[#eef6ee]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
          <path d="M0 70 C30 60 50 75 100 55" stroke="#fff" strokeWidth="5" fill="none" />
          <path d="M45 0 C48 35 40 60 50 100" stroke="#fff" strokeWidth="4" fill="none" />
          <path d="M0 30 C40 35 60 20 100 28" stroke="#fde68a" strokeWidth="3" fill="none" />
          <circle cx="75" cy="80" r="9" fill="#bfdbfe" />
        </svg>
        {GEO.map((g, i) => (
          <motion.span
            key={g.place}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.3 + i * 0.25 }}
            className="absolute -translate-x-1/2 -translate-y-full text-[#dc2626] drop-shadow"
            style={{ left: `${g.x}%`, top: `${g.y}%` }}
          >
            <MapPin weight="fill" className="size-6" />
          </motion.span>
        ))}
      </div>
      {GEO.map((g) => (
        <div key={g.place} className="flex shrink-0 items-start gap-1 leading-tight">
          <MapPin weight="fill" className="mt-[0.1em] size-[1.05em] shrink-0 text-[#dc2626]" />
          <span className="min-w-0">
            <span className="block font-semibold text-navy">{g.place}</span>
            <span className="block text-ink/65">{g.ll}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
