import { buildIntelligenceDetail, buildIntelligenceOverview, localIntelligenceOptions } from "@/services/intelligenceAggregate";
const apiBase = () => import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
function query(filters, extra) {
    const params = new URLSearchParams({
        financialYear: filters.financialYear,
        from: filters.fromDate,
        to: filters.toDate,
        districtId: filters.districtId,
        departmentId: filters.departmentId,
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
        throw new Error("The intelligence dashboard service did not return the requested figures.");
    return response.json();
}
export async function loadIntelligenceOptions() {
    const base = apiBase();
    if (!base)
        return localIntelligenceOptions();
    return getJson(`${base}/api/intelligence/filters`);
}
export async function getIntelligenceOverview(filters) {
    const base = apiBase();
    if (!base)
        return buildIntelligenceOverview(filters);
    return getJson(`${base}/api/intelligence/overview?${query(filters)}`);
}
export async function getIntelligenceDetail(request, filters) {
    const base = apiBase();
    if (!base)
        return buildIntelligenceDetail(request, filters);
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
    if (request.type === "entity")
        extra.entityId = request.entityId;
    return getJson(`${base}/api/intelligence/details?${query(filters, extra)}`);
}
