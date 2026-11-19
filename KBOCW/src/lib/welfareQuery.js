import { financialYearBounds } from "@/lib/period";
export const DEFAULT_WELFARE_FILTERS = {
    financialYear: "2025-26",
    fromDate: "2025-04-01",
    toDate: "2026-03-31",
    districtId: "all",
    talukId: "all",
    membershipStatus: "all",
    scheme: "all",
    applicationStatus: "all",
    paymentStatus: "all",
};
export function readWelfareFilters(params) {
    const financialYear = params.get("financialYear") || DEFAULT_WELFARE_FILTERS.financialYear;
    const year = /^\d{4}-\d{2}$/.test(financialYear) ? financialYear : DEFAULT_WELFARE_FILTERS.financialYear;
    const bounds = financialYearBounds(year);
    const fromDate = params.get("from") || bounds.from;
    const toDate = params.get("to") || bounds.to;
    const ordered = fromDate <= toDate ? { fromDate, toDate } : { fromDate: toDate, toDate: fromDate };
    return {
        financialYear: year,
        ...ordered,
        districtId: params.get("districtId") || "all",
        talukId: params.get("talukId") || "all",
        membershipStatus: params.get("membershipStatus") || "all",
        scheme: params.get("scheme") || "all",
        applicationStatus: params.get("applicationStatus") || "all",
        paymentStatus: params.get("paymentStatus") || "all",
    };
}
export function welfareQuery(filters) {
    const params = new URLSearchParams();
    params.set("financialYear", filters.financialYear);
    params.set("from", filters.fromDate);
    params.set("to", filters.toDate);
    if (filters.districtId !== "all")
        params.set("districtId", filters.districtId);
    if (filters.talukId !== "all")
        params.set("talukId", filters.talukId);
    if (filters.membershipStatus !== "all")
        params.set("membershipStatus", filters.membershipStatus);
    if (filters.scheme !== "all")
        params.set("scheme", filters.scheme);
    if (filters.applicationStatus !== "all")
        params.set("applicationStatus", filters.applicationStatus);
    if (filters.paymentStatus !== "all")
        params.set("paymentStatus", filters.paymentStatus);
    return params;
}
export const WELFARE_LINKS = [
    { label: "Labour Commissionerate", to: "/departments/labour-commissionerate" },
    { label: "Cess & Financial", to: "/departments/cess-financial" },
    { label: "Health & Social Security", to: "/departments/health-social-security" },
    { label: "ESIS", to: "/departments/esis" },
    { label: "Construction & Infrastructure", to: "/departments/construction-infrastructure" },
    { label: "Skill Development", to: "/departments/skill-development" },
    { label: "Department Relationship Map", to: "/intelligence/relationship-map" },
    { label: "Cross-Department Intelligence", to: "/intelligence/cross-analytics" },
];
