export const DEFAULT_FILTERS = {
    financialYear: "2025-26",
    fromDate: "2025-04-01",
    toDate: "2026-03-31",
    districtId: "all",
};
export function financialYearBounds(financialYear) {
    const start = Number(financialYear.slice(0, 4));
    return {
        from: `${start}-04-01`,
        to: `${start + 1}-03-31`,
    };
}
export function withFinancialYear(filters, financialYear) {
    const bounds = financialYearBounds(financialYear);
    return { ...filters, financialYear, fromDate: bounds.from, toDate: bounds.to };
}
