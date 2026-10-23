import {
  Bank,
  Buildings,
  Calculator,
  ChatCircleText,
  Coins,
  CurrencyInr,
  Desktop,
  FileText,
  Files,
  Gavel,
  Gear,
  HouseLine,
  Images,
  Leaf,
  MapPin,
  MapPinArea,
  MapTrifold,
  Monitor,
  Path,
  Scales,
  Scroll,
  SquaresFour,
  TreeEvergreen,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import { HIGHLIGHTS, ONLINE_SERVICES, SERVICES, SITE } from "@/lib/content";
import type { Text } from "@/lib/i18n";
import { PHOTOS } from "@/lib/photos";

const t = (en: string, kn: string): Text => ({ en, kn });
const svc = (icon: (typeof SERVICES)[number]["icon"]) => SERVICES.find((s) => s.icon === icon)!.href;
const online = (icon: (typeof ONLINE_SERVICES)[number]["icon"]) => ONLINE_SERVICES.find((s) => s.icon === icon)!.href;
export const dept = (key: string, name: string) => `${SITE}/departments?sectionKey=${key}&sectionName=${encodeURIComponent(name)}`;

export type Tone = { tile: string; icon: string; arrow: string };

export const TONES = {
  orange: { tile: "bg-orange-50", icon: "text-orange-500", arrow: "text-orange-500" },
  rose: { tile: "bg-rose-50", icon: "text-rose-500", arrow: "text-rose-500" },
  green: { tile: "bg-emerald-50", icon: "text-emerald-600", arrow: "text-emerald-600" },
  violet: { tile: "bg-violet-50", icon: "text-violet-600", arrow: "text-violet-600" },
  blue: { tile: "bg-blue-50", icon: "text-blue-600", arrow: "text-blue-600" },
  red: { tile: "bg-red-50", icon: "text-red-500", arrow: "text-red-500" },
  amber: { tile: "bg-amber-50", icon: "text-amber-600", arrow: "text-amber-600" },
  teal: { tile: "bg-teal-50", icon: "text-teal-600", arrow: "text-teal-600" },
  navy: { tile: "bg-slate-100", icon: "text-navy", arrow: "text-navy" },
  pink: { tile: "bg-pink-50", icon: "text-pink-500", arrow: "text-pink-500" },
} satisfies Record<string, Tone>;

export type SideItem = { icon: Icon; tone: Tone; title: Text; sub: Text; href: string; isNew?: boolean };

export const SIDE: SideItem[] = [
  { icon: Buildings, tone: TONES.orange, title: t("BDA Layouts", "ಬಿಡಿಎ ಬಡಾವಣೆಗಳು"), sub: t("Layouts, sites, flats & villas", "ಬಡಾವಣೆ, ನಿವೇಶನ, ಫ್ಲ್ಯಾಟ್ ಮತ್ತು ವಿಲ್ಲಾ"), href: svc("layouts") },
  { icon: Gavel, tone: TONES.orange, title: t("E-Auction", "ಇ-ಹರಾಜು"), sub: t("Sites, plots & properties", "ನಿವೇಶನ, ಪ್ಲಾಟ್ ಮತ್ತು ಆಸ್ತಿಗಳು"), href: svc("auction") },
  { icon: CurrencyInr, tone: TONES.green, title: t("Property Tax", "ಆಸ್ತಿ ತೆರಿಗೆ"), sub: t("Calculate & pay online", "ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಲೆಕ್ಕ ಹಾಕಿ ಮತ್ತು ಪಾವತಿಸಿ"), href: svc("tax") },
  { icon: Desktop, tone: TONES.violet, title: t("Online Services", "ಆನ್‌ಲೈನ್ ಸೇವೆಗಳು"), sub: t("Applications & citizen services", "ಅರ್ಜಿಗಳು ಮತ್ತು ನಾಗರಿಕ ಸೇವೆಗಳು"), href: svc("online") },
  { icon: FileText, tone: TONES.blue, title: t("CA Sites", "ಸಿಎ ನಿವೇಶನಗಳು"), sub: t("Details & documents", "ವಿವರಗಳು ಮತ್ತು ದಾಖಲೆಗಳು"), href: svc("casite") },
  { icon: MapPinArea, tone: TONES.red, title: t("Stray Sites", "ಬಿಡಿ ನಿವೇಶನಗಳು"), sub: t("Available sites & information", "ಲಭ್ಯವಿರುವ ನಿವೇಶನಗಳು ಮತ್ತು ಮಾಹಿತಿ"), href: svc("stray") },
  { icon: Path, tone: TONES.green, title: t("Land Acquisition", "ಭೂಸ್ವಾಧೀನ"), sub: t("Notifications & orders", "ಅಧಿಸೂಚನೆಗಳು ಮತ್ತು ಆದೇಶಗಳು"), href: dept("land-acquisition", "Land Acquisition") },
  { icon: Scroll, tone: TONES.orange, title: t("Master Plans", "ಮಾಸ್ಟರ್ ಪ್ಲಾನ್‌ಗಳು"), sub: t("Plans, projects & proposals", "ಯೋಜನೆಗಳು ಮತ್ತು ಪ್ರಸ್ತಾವನೆಗಳು"), href: dept("town-planning", "Town Planning") },
  { icon: Leaf, tone: TONES.green, title: t("Green Initiatives", "ಹಸಿರು ಉಪಕ್ರಮಗಳು"), sub: t("Sustainable Bengaluru", "ಸುಸ್ಥಿರ ಬೆಂಗಳೂರು"), href: HIGHLIGHTS.find((h) => h.key === "green")!.href, isNew: true },
  { icon: MapTrifold, tone: TONES.blue, title: t("Jurisdiction Map", "ವ್ಯಾಪ್ತಿ ನಕ್ಷೆ"), sub: t("Zones & wards", "ವಲಯಗಳು ಮತ್ತು ವಾರ್ಡ್‌ಗಳು"), href: svc("map") },
  { icon: UsersThree, tone: TONES.blue, title: t("Departments", "ವಿಭಾಗಗಳು"), sub: t("Profiles & functions", "ವಿವರ ಮತ್ತು ಕಾರ್ಯಗಳು"), href: `${SITE}/section-layout` },
  { icon: Images, tone: TONES.red, title: t("Gallery", "ಗ್ಯಾಲರಿ"), sub: t("Photos, videos & events", "ಫೋಟೋ, ವಿಡಿಯೋ ಮತ್ತು ಕಾರ್ಯಕ್ರಮಗಳು"), href: svc("gallery") },
  { icon: Files, tone: TONES.navy, title: t("RTI", "ಆರ್‌ಟಿಐ"), sub: t("Information under RTI", "ಆರ್‌ಟಿಐ ಅಡಿ ಮಾಹಿತಿ"), href: svc("rti") },
];

export const TILES: { icon: Icon; tone: Tone; bg: string; photo?: string; title: Text; sub: Text; href: string }[] = [
  { icon: Buildings, tone: TONES.orange, bg: "bg-[#fdf3e6] border-[#f6e2c6]", photo: PHOTOS.flats, title: t("BDA Layouts", "ಬಿಡಿಎ ಬಡಾವಣೆಗಳು"), sub: t("Residential, commercial and mixed-use layouts", "ವಸತಿ, ವಾಣಿಜ್ಯ ಮತ್ತು ಮಿಶ್ರ ಬಳಕೆಯ ಬಡಾವಣೆಗಳು"), href: svc("layouts") },
  { icon: Gavel, tone: TONES.rose, bg: "bg-[#fdeeee] border-[#f7d9d9]", photo: "images/tile-auction.jpg", title: t("E-Auction", "ಇ-ಹರಾಜು"), sub: t("Sites, plots and properties", "ನಿವೇಶನ, ಪ್ಲಾಟ್ ಮತ್ತು ಆಸ್ತಿಗಳು"), href: svc("auction") },
  { icon: HouseLine, tone: TONES.green, bg: "bg-[#eef7ee] border-[#d6ecd6]", photo: PHOTOS.villa, title: t("Flats & Villas", "ಫ್ಲ್ಯಾಟ್ ಮತ್ತು ವಿಲ್ಲಾ"), sub: t("BDA housing projects and allotments", "ಬಿಡಿಎ ವಸತಿ ಯೋಜನೆಗಳು ಮತ್ತು ಹಂಚಿಕೆಗಳು"), href: svc("flats") },
  { icon: SquaresFour, tone: TONES.blue, bg: "bg-[#ecf3fd] border-[#d5e4f8]", photo: PHOTOS.headOffice, title: t("Planning & Development", "ಯೋಜನೆ ಮತ್ತು ಅಭಿವೃದ್ಧಿ"), sub: t("Master plans, projects and infrastructure", "ಮಾಸ್ಟರ್ ಪ್ಲಾನ್, ಯೋಜನೆಗಳು ಮತ್ತು ಮೂಲಸೌಕರ್ಯ"), href: dept("town-planning", "Town Planning") },
  { icon: Leaf, tone: TONES.green, bg: "bg-[#f1f8ec] border-[#dcefd0]", title: t("Green Initiatives", "ಹಸಿರು ಉಪಕ್ರಮಗಳು"), sub: t("Sustainable and resilient Bengaluru", "ಸುಸ್ಥಿರ ಮತ್ತು ಸದೃಢ ಬೆಂಗಳೂರು"), href: HIGHLIGHTS.find((h) => h.key === "green")!.href },
  { icon: FileText, tone: TONES.violet, bg: "bg-[#f3effc] border-[#e3dbf7]", photo: "images/tile-land.jpg", title: t("Land Acquisition", "ಭೂಸ್ವಾಧೀನ"), sub: t("Notifications and orders", "ಅಧಿಸೂಚನೆಗಳು ಮತ್ತು ಆದೇಶಗಳು"), href: dept("land-acquisition", "Land Acquisition") },
  { icon: CurrencyInr, tone: TONES.teal, bg: "bg-[#ecf8f5] border-[#d3eee7]", photo: "images/tile-tax.jpg", title: t("Property Tax", "ಆಸ್ತಿ ತೆರಿಗೆ"), sub: t("Calculate and pay property tax online", "ಆಸ್ತಿ ತೆರಿಗೆಯನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಲೆಕ್ಕ ಹಾಕಿ ಪಾವತಿಸಿ"), href: svc("tax") },
];

export const ANNOUNCE: { date: string; tag: Text; tagTone: string; title: Text; href: string; isNew?: boolean }[] = [
  {
    date: "2026-10-22",
    tag: t("E-Auction", "ಇ-ಹರಾಜು"),
    tagTone: "bg-orange-100 text-orange-700",
    title: t("E-Auction Notification – Residential Sites (Phase 3)", "ಇ-ಹರಾಜು ಅಧಿಸೂಚನೆ – ವಸತಿ ನಿವೇಶನಗಳು (ಹಂತ 3)"),
    href: svc("auction"),
    isNew: true,
  },
  {
    date: "2026-10-20",
    tag: t("Land Acquisition", "ಭೂಸ್ವಾಧೀನ"),
    tagTone: "bg-blue-100 text-blue-700",
    title: t("Preliminary Notification – Arkavathi Layout", "ಪ್ರಾಥಮಿಕ ಅಧಿಸೂಚನೆ – ಅರ್ಕಾವತಿ ಬಡಾವಣೆ"),
    href: dept("land-acquisition", "Land Acquisition"),
  },
  {
    date: "2026-10-18",
    tag: t("Town Planning", "ನಗರ ಯೋಜನೆ"),
    tagTone: "bg-emerald-100 text-emerald-700",
    title: t("Draft Master Plan – Public Objections Invited", "ಕರಡು ಮಾಸ್ಟರ್ ಪ್ಲಾನ್ – ಸಾರ್ವಜನಿಕ ಆಕ್ಷೇಪಣೆಗಳಿಗೆ ಆಹ್ವಾನ"),
    href: dept("town-planning", "Town Planning"),
  },
  {
    date: "2026-10-15",
    tag: t("Administration", "ಆಡಳಿತ"),
    tagTone: "bg-amber-100 text-amber-700",
    title: t("Site Allotment – Provisional Seniority List", "ನಿವೇಶನ ಹಂಚಿಕೆ – ತಾತ್ಕಾಲಿಕ ಜ್ಯೇಷ್ಠತಾ ಪಟ್ಟಿ"),
    href: dept("administration", "Administration"),
  },
];

export const DEPTS: { icon: Icon; tone: string; label: Text; href: string }[] = [
  { icon: Bank, tone: "text-blue-600", label: t("Administration", "ಆಡಳಿತ"), href: dept("administration", "Administration") },
  { icon: MapPin, tone: "text-emerald-600", label: t("Land Acquisition", "ಭೂಸ್ವಾಧೀನ"), href: dept("land-acquisition", "Land Acquisition") },
  { icon: MapTrifold, tone: "text-teal-600", label: t("Town Planning", "ನಗರ ಯೋಜನೆ"), href: dept("town-planning", "Town Planning") },
  { icon: Gear, tone: "text-blue-600", label: t("Engineering", "ಎಂಜಿನಿಯರಿಂಗ್"), href: dept("engineering", "Engineering") },
  { icon: Buildings, tone: "text-rose-500", label: t("Estate", "ಎಸ್ಟೇಟ್"), href: `${SITE}/section-layout` },
  { icon: Coins, tone: "text-amber-500", label: t("Finance", "ಹಣಕಾಸು"), href: dept("finance", "Finance") },
  { icon: Scales, tone: "text-blue-700", label: t("Legal", "ಕಾನೂನು"), href: dept("legal-section", "Law Section") },
  { icon: TreeEvergreen, tone: "text-emerald-600", label: t("Forest", "ಅರಣ್ಯ"), href: dept("forest", "Forest") },
  { icon: Monitor, tone: "text-violet-600", label: t("IT & Systems", "ಐಟಿ ಮತ್ತು ವ್ಯವಸ್ಥೆಗಳು"), href: dept("edp-cell", "EDP Cell") },
];

/** Soft tile backgrounds for the departments grid in the photo variant, in DEPTS order. */
export const DEPT_BG = ["bg-orange-50", "bg-emerald-50", "bg-sky-50", "bg-blue-50", "bg-pink-50", "bg-amber-50", "bg-indigo-50", "bg-green-50", "bg-violet-50"];

export const ONLINE: { icon: Icon; tone: string; label: Text; href: string }[] = [
  { icon: CurrencyInr, tone: "bg-emerald-50 text-emerald-600", label: t("Property Tax Payment", "ಆಸ್ತಿ ತೆರಿಗೆ ಪಾವತಿ"), href: svc("tax") },
  { icon: Calculator, tone: "bg-emerald-50 text-emerald-600", label: t("Property Tax Calculator", "ಆಸ್ತಿ ತೆರಿಗೆ ಕ್ಯಾಲ್ಕುಲೇಟರ್"), href: svc("calculator") },
  { icon: Buildings, tone: "bg-rose-50 text-rose-500", label: t("BDA Flats / Villas Booking", "ಬಿಡಿಎ ಫ್ಲ್ಯಾಟ್ / ವಿಲ್ಲಾ ಬುಕಿಂಗ್"), href: online("housing") },
  { icon: FileText, tone: "bg-blue-50 text-blue-600", label: t("CA Site Information", "ಸಿಎ ನಿವೇಶನ ಮಾಹಿತಿ"), href: svc("casite") },
  { icon: ChatCircleText, tone: "bg-violet-50 text-violet-600", label: t("Grievances / Citizen Services", "ದೂರುಗಳು / ನಾಗರಿಕ ಸೇವೆಗಳು"), href: HIGHLIGHTS.find((h) => h.key === "grievance")!.href },
  { icon: SquaresFour, tone: "bg-slate-100 text-navy", label: t("More Online Services", "ಇನ್ನಷ್ಟು ಆನ್‌ಲೈನ್ ಸೇವೆಗಳು"), href: svc("online") },
];

export const GALLERY = [PHOTOS.skyline, PHOTOS.towers, PHOTOS.villa, PHOTOS.flats];

export const POPULAR: { label: Text; href: string }[] = [
  { label: t("BDA Layouts", "ಬಿಡಿಎ ಬಡಾವಣೆಗಳು"), href: svc("layouts") },
  { label: t("E-Auction", "ಇ-ಹರಾಜು"), href: svc("auction") },
  { label: t("Property Tax", "ಆಸ್ತಿ ತೆರಿಗೆ"), href: svc("tax") },
  { label: t("CA Sites", "ಸಿಎ ನಿವೇಶನಗಳು"), href: svc("casite") },
  { label: t("Land Acquisition", "ಭೂಸ್ವಾಧೀನ"), href: dept("land-acquisition", "Land Acquisition") },
  { label: t("Master Plan", "ಮಾಸ್ಟರ್ ಪ್ಲಾನ್"), href: dept("town-planning", "Town Planning") },
];
