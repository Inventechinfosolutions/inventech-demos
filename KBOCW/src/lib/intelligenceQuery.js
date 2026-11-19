import { financialYearBounds } from "@/lib/period";
const departmentIds = new Set(["pwd", "labour", "bbmp", "kbocw", "treasury", "factories"]);
export const DEFAULT_INTELLIGENCE_FILTERS = {
    financialYear: "2025-26",
    fromDate: "2025-04-01",
    toDate: "2026-03-31",
    districtId: "all",
    departmentId: "all",
};
export function readIntelligenceFilters(params) {
    const financialYear = params.get("financialYear") || DEFAULT_INTELLIGENCE_FILTERS.financialYear;
    const year = /^\d{4}-\d{2}$/.test(financialYear) ? financialYear : DEFAULT_INTELLIGENCE_FILTERS.financialYear;
    const bounds = financialYearBounds(year);
    const fromDate = params.get("from") || bounds.from;
    const toDate = params.get("to") || bounds.to;
    const ordered = fromDate <= toDate ? { fromDate, toDate } : { fromDate: toDate, toDate: fromDate };
    const departmentId = params.get("departmentId") || "all";
    return {
        financialYear: year,
        ...ordered,
        districtId: params.get("districtId") || "all",
        departmentId: departmentId === "all" || departmentIds.has(departmentId) ? departmentId : "all",
    };
}
export function intelligenceQuery(filters) {
    const params = new URLSearchParams();
    params.set("financialYear", filters.financialYear);
    params.set("from", filters.fromDate);
    params.set("to", filters.toDate);
    if (filters.districtId !== "all")
        params.set("districtId", filters.districtId);
    if (filters.departmentId !== "all")
        params.set("departmentId", filters.departmentId);
    return params;
}
