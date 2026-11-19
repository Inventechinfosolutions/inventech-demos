import { buildSecretaryDetail, buildSecretaryOverview, localFilterOptions } from "@/services/aggregate";
const apiBase = () => import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
function query(filters, extra) {
    const params = new URLSearchParams({
        financialYear: filters.financialYear,
        from: filters.fromDate,
        to: filters.toDate,
        districtId: filters.districtId,
    });
    if (extra) {
        for (const [key, value] of Object.entries(extra)) {
            if (value)
                params.set(key, value);
        }
    }
    return params;
}
async function getJson(path) {
    const response = await fetch(path);
    if (!response.ok)
        throw new Error("The dashboard service did not return the requested figures.");
    return response.json();
}
export async function loadFilterOptions() {
    const base = apiBase();
    if (!base)
        return localFilterOptions();
    return getJson(`${base}/api/secretary/filters`);
}
export async function getSecretaryOverview(filters) {
    const base = apiBase();
    if (!base)
        return buildSecretaryOverview(filters);
    return getJson(`${base}/api/secretary/overview?${query(filters)}`);
}
export async function getSecretaryDetail(request, filters) {
    const base = apiBase();
    if (!base)
        return buildSecretaryDetail(request, filters);
    const extra = { topic: request.type };
    if (request.type === "kpi")
        extra.kpiId = request.kpiId;
    if (request.type === "chart") {
        extra.chartId = request.chartId;
        extra.category = request.category;
        extra.series = request.series;
    }
    if (request.type === "exception")
        extra.exceptionId = request.exceptionId;
    if (request.type === "department")
        extra.departmentId = request.departmentId;
    return getJson(`${base}/api/secretary/details?${query(filters, extra)}`);
}
