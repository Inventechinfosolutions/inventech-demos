import type { RoleId, User } from "@/analytics/types"

// Synthetic users. Each one stands for a role in the demonstration and is not a real person.

export const USERS: User[] = [
  {
    id: "u-secretary",
    name: "Secretary, KBOCW Board",
    title: "Secretary",
    department: "KBOCW Board",
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
    department: "Labour Commissionerate",
    role: "labour",
    districtScope: null,
    departmentScope: "Labour Commissionerate",
    canDeleteAny: false,
    canViewAudit: false,
  },
  {
    id: "u-welfare",
    name: "Board Secretary",
    title: "Board Secretary",
    department: "KBOCW Board",
    role: "welfare",
    districtScope: null,
    departmentScope: "KBOCW Board",
    canDeleteAny: false,
    canViewAudit: false,
  },
  {
    id: "u-finance",
    name: "Treasury Officer",
    title: "Treasury Officer",
    department: "Treasury",
    role: "finance",
    districtScope: null,
    departmentScope: null,
    canDeleteAny: false,
    canViewAudit: false,
  },
  {
    id: "u-district",
    name: "District Labour Officer, Mysuru",
    title: "District Labour Officer",
    department: "Labour Commissionerate",
    role: "district",
    districtScope: "Mysuru",
    departmentScope: "Labour Commissionerate",
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
  labour: "Labour Commissionerate",
  welfare: "KBOCW Board",
  finance: "Treasury",
  district: "District office",
  analyst: "Intelligence analyst",
}

export const userById = (id: string) => USERS.find((user) => user.id === id)
export const DEFAULT_USER_ID = "u-secretary"
