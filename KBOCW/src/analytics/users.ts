import { BOARD } from "@/analytics/catalog"
import type { RoleId, User } from "@/analytics/types"

// Synthetic users. Each one stands for a role in the demonstration and is not a real person.
// A board role sees only the datasets of its own board. The district role sees one district across
// every board. The Secretary and the analyst see all five boards.

export const USERS: User[] = [
  {
    id: "u-secretary",
    name: "Secretary, Labour Department",
    title: "Secretary",
    department: "Labour Department",
    role: "secretary",
    districtScope: null,
    departmentScope: null,
    canDeleteAny: true,
    canViewAudit: true,
  },
  {
    id: "u-labour",
    name: "Labour Commissioner",
    title: "Labour Commissioner",
    department: BOARD.labour,
    role: "labour",
    districtScope: null,
    departmentScope: BOARD.labour,
    canDeleteAny: false,
    canViewAudit: false,
  },
  {
    id: "u-welfare",
    name: "Secretary, KBOCW Welfare Board",
    title: "Board Secretary",
    department: BOARD.welfare,
    role: "welfare",
    districtScope: null,
    departmentScope: BOARD.welfare,
    canDeleteAny: false,
    canViewAudit: false,
  },
  {
    id: "u-factories",
    name: "Director, Factories & Boilers",
    title: "Director",
    department: BOARD.factories,
    role: "factories",
    districtScope: null,
    departmentScope: BOARD.factories,
    canDeleteAny: false,
    canViewAudit: false,
  },
  {
    id: "u-gig",
    name: "Executive Officer, Gig Workers Welfare Board",
    title: "Executive Officer",
    department: BOARD.gig,
    role: "gig",
    districtScope: null,
    departmentScope: BOARD.gig,
    canDeleteAny: false,
    canViewAudit: false,
  },
  {
    id: "u-ksu",
    name: "Executive Officer, Unorganised Workers Board",
    title: "Executive Officer",
    department: BOARD.ksu,
    role: "ksu",
    districtScope: null,
    departmentScope: BOARD.ksu,
    canDeleteAny: false,
    canViewAudit: false,
  },
  {
    id: "u-district",
    name: "District Labour Officer, Mysuru",
    title: "District Labour Officer",
    department: BOARD.labour,
    role: "district",
    districtScope: "Mysuru",
    departmentScope: null,
    canDeleteAny: false,
    canViewAudit: false,
  },
  {
    id: "u-analyst",
    name: "Intelligence Analyst",
    title: "Intelligence analyst",
    department: "Cross-Department Intelligence",
    role: "analyst",
    districtScope: null,
    departmentScope: null,
    canDeleteAny: false,
    canViewAudit: true,
  },
]

export const ROLE_LABEL: Record<RoleId, string> = {
  secretary: "Secretary",
  labour: BOARD.labour,
  welfare: BOARD.welfare,
  factories: BOARD.factories,
  gig: BOARD.gig,
  ksu: "Unorganised Workers Board",
  district: "District office",
  analyst: "Intelligence analyst",
}

export const userById = (id: string) => USERS.find((user) => user.id === id)
export const DEFAULT_USER_ID = "u-secretary"
