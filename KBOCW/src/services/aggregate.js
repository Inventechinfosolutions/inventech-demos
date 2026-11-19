import raw from "@/data/secretary-overview.json" with { type: "json" };
import { croreValue, formatCount, formatCrore, formatLakh, formatLongDate, formatShare } from "@/lib/format";
import { palette } from "@/lib/palette";
const data = raw;
const moneyKeys = new Set(["cessAssessed", "cessCollected", "cessRemitted", "cessCredited", "disbursement"]);
const lakhKeys = new Set(["workers", "beneficiaries", "pendingApplications"]);
const kpiDefs = [
    { id: "projects", label: "Construction Projects", hint: "Projects recorded", metric: "projects", lowerIsBetter: false },
    { id: "workers", label: "Registered Workers", hint: "Workers registered", metric: "workers", lowerIsBetter: false },
    { id: "cessAssessed", label: "Cess Assessed", hint: "Assessment stage", metric: "cessAssessed", lowerIsBetter: false },
    { id: "cessCollected", label: "Cess Collected", hint: "Collection stage", metric: "cessCollected", lowerIsBetter: false },
    { id: "cessRemitted", label: "Cess Remitted", hint: "Remittance stage", metric: "cessRemitted", lowerIsBetter: false },
    { id: "beneficiaries", label: "Welfare Beneficiaries", hint: "Benefits delivered", metric: "beneficiaries", lowerIsBetter: false },
    { id: "disbursement", label: "Welfare Disbursement", hint: "Amount released", metric: "disbursement", lowerIsBetter: false },
    { id: "pending", label: "Pending Applications", hint: "Awaiting decision", metric: "pendingApplications", lowerIsBetter: true },
];
const cessSeries = [
    { name: "Cess assessed", metric: "cessAssessed", color: palette.blue },
    { name: "Cess collected", metric: "cessCollected", color: palette.teal },
    { name: "Cess remitted", metric: "cessRemitted", color: palette.amber },
    { name: "Cess credited", metric: "cessCredited", color: palette.indigo },
];
const flowSeries = [
    { name: "Applications sanctioned", metric: "applicationsSanctioned", color: palette.teal },
    { name: "Applications pending", metric: "pendingApplications", color: palette.amber },
    { name: "Applications returned", metric: "applicationsReturned", color: palette.slate },
];
export function localFilterOptions() {
    return {
        financialYears: data.years,
        districts: data.districts,
    };
}
function yearIndexOf(financialYear) {
    const index = data.years.indexOf(financialYear);
    return index >= 0 ? index : data.years.length - 1;
}
function monthIndexes(filters) {
    const startYear = Number(filters.financialYear.slice(0, 4));
    const from = Date.parse(`${filters.fromDate}T00:00:00Z`);
    const to = Date.parse(`${filters.toDate}T00:00:00Z`);
    const indexes = [];
    for (let month = 0; month < 12; month += 1) {
        const monthStart = Date.UTC(startYear, 3 + month, 1);
        const monthEnd = Date.UTC(startYear, 4 + month, 0);
        if (monthEnd >= from && monthStart <= to)
            indexes.push(month);
    }
    return indexes;
}
function districtIndexes(districtId) {
    if (districtId === "all")
        return data.districts.map((_, index) => index);
    const index = data.districts.findIndex((district) => district.id === districtId);
    return index >= 0 ? [index] : [];
}
function allDistrictIndexes() {
    return data.districts.map((_, index) => index);
}
function allMonths() {
    return data.months.map((month) => month.index);
}
function sumMetric(metric, year, districts, months) {
    let total = 0;
    const cube = data.metrics[metric];
    for (const district of districts) {
        for (const month of months)
            total += cube[year][district][month];
    }
    return total;
}
function displayMetric(metric, value) {
    if (moneyKeys.has(metric))
        return formatCrore(value);
    if (lakhKeys.has(metric) && Math.abs(value) >= 100000)
        return formatLakh(value);
    return formatCount(value);
}
function change(current, previous) {
    if (previous == null || previous === 0)
        return null;
    return ((current - previous) / previous) * 100;
}
function districtName(id) {
    return data.districts.find((district) => district.id === id)?.name ?? "All districts";
}
function scopeLabel(filters) {
    const district = filters.districtId === "all" ? "All districts" : districtName(filters.districtId);
    return `${filters.financialYear} · ${district} · ${formatLongDate(filters.fromDate)} – ${formatLongDate(filters.toDate)}`;
}
function schemeAmount(schemeIndex, year, districts, months) {
    const scheme = data.schemes[schemeIndex];
    let total = 0;
    for (const district of districts) {
        const annual = data.metrics.disbursement[year][district].reduce((sum, value) => sum + value, 0);
        const inScope = months.reduce((sum, month) => sum + data.metrics.disbursement[year][district][month], 0);
        const share = annual === 0 ? 0 : inScope / annual;
        total += scheme.byDistrict[year][district] * share;
    }
    return total;
}
function buildKpis(year, previousYear, districts, months) {
    return kpiDefs.map((item) => {
        const current = sumMetric(item.metric, year, districts, months);
        const previous = previousYear == null ? null : sumMetric(item.metric, previousYear, districts, months);
        return {
            id: item.id,
            label: item.label,
            hint: item.hint,
            displayValue: displayMetric(item.metric, current),
            change: change(current, previous),
            lowerIsBetter: item.lowerIsBetter,
        };
    });
}
function monthLabels(months) {
    return months.map((month) => data.months[month].label);
}
function buildCharts(year, districts, months) {
    const categories = monthLabels(months);
    const across = (metric, month) => sumMetric(metric, year, districts, [month]);
    const construction = {
        id: "construction",
        title: "Monthly construction activity",
        description: "Projects recorded in each month of the selected period.",
        kind: "line",
        categories,
        unit: "count",
        series: [
            {
                name: "Construction projects",
                color: palette.blue,
                values: months.map((month) => across("projects", month)),
            },
        ],
    };
    const cess = {
        id: "cess",
        title: "Cess assessed, collected, remitted and credited",
        description: "Each series is a separate stage of the cess pipeline. Stages are not added together.",
        kind: "grouped",
        categories,
        unit: "crore",
        series: cessSeries.map((series) => ({
            name: series.name,
            color: series.color,
            values: months.map((month) => croreValue(across(series.metric, month))),
        })),
    };
    const welfare = {
        id: "welfare",
        title: "Worker registration and welfare application status",
        description: "Bars show welfare application outcomes. The line shows workers registered, on its own scale.",
        kind: "stacked-line",
        categories,
        unit: "count",
        series: flowSeries.map((series) => ({
            name: series.name,
            color: series.color,
            values: months.map((month) => across(series.metric, month)),
        })),
        line: {
            name: "Registrations recorded",
            color: palette.navy,
            values: months.map((month) => across("workers", month) / 100000),
        },
        lineUnit: "lakh",
    };
    const schemes = {
        id: "schemes",
        title: "Scheme-wise financial performance",
        description: "Welfare amount released under each scheme. This is disbursement, not a cess stage.",
        kind: "horizontal",
        categories: data.schemes.map((scheme) => scheme.name),
        unit: "crore",
        series: [
            {
                name: "Amount released",
                color: palette.blue,
                values: data.schemes.map((_, index) => croreValue(schemeAmount(index, year, districts, months))),
            },
        ],
    };
    return [construction, cess, welfare, schemes];
}
function buildDistricts(year, months) {
    return data.districts.map((district, index) => ({
        id: district.id,
        name: district.name,
        projects: sumMetric("projects", year, [index], months),
        workers: sumMetric("workers", year, [index], months),
        cessAssessed: sumMetric("cessAssessed", year, [index], months),
        cessCollected: sumMetric("cessCollected", year, [index], months),
        cessRemitted: sumMetric("cessRemitted", year, [index], months),
        cessCredited: sumMetric("cessCredited", year, [index], months),
        beneficiaries: sumMetric("beneficiaries", year, [index], months),
        disbursement: sumMetric("disbursement", year, [index], months),
        pendingApplications: sumMetric("pendingApplications", year, [index], months),
    }));
}
export function buildSecretaryOverview(filters) {
    const year = yearIndexOf(filters.financialYear);
    const months = monthIndexes(filters);
    const districts = districtIndexes(filters.districtId);
    const previousYear = year > 0 ? year - 1 : null;
    return {
        source: data.meta.source,
        lastRefreshed: data.meta.lastRefreshed,
        illustrativeNote: data.meta.illustrativeNote,
        boundaryNote: data.meta.boundaryNote,
        stageNote: data.meta.stageNote,
        scopeLabel: scopeLabel(filters),
        filters,
        kpis: buildKpis(year, previousYear, districts, months),
        charts: buildCharts(year, districts, months),
        districts: buildDistricts(year, months),
        departments: data.departments.map((department) => {
            const full = sumMetric(department.shareMetric, year, allDistrictIndexes(), allMonths());
            const scoped = sumMetric(department.shareMetric, year, districts, months);
            const records = full === 0 ? 0 : Math.round(department.recordsByYear[year] * (scoped / full));
            return {
                id: department.id,
                name: department.name,
                category: department.category,
                records: formatCount(records),
                lastUpdated: department.lastUpdated,
                status: department.status,
            };
        }),
        exceptions: data.exceptions.map((item) => {
            const count = sumMetricCounts(item.counts, year, districts, months);
            return {
                id: item.id,
                title: item.title,
                description: item.description,
                sourceDepartment: item.sourceDepartment,
                priority: item.priority,
                countLabel: formatCount(count),
            };
        }),
    };
}
function sumMetricCounts(cube, year, districts, months) {
    let total = 0;
    for (const district of districts) {
        for (const month of months)
            total += cube[year][district][month];
    }
    return total;
}
function monthIndexFromLabel(label) {
    return data.months.find((month) => month.label === label)?.index;
}
function inScope(row, filters, months) {
    return row.year === filters.financialYear && months.includes(row.monthIndex) && (filters.districtId === "all" || row.districtId === filters.districtId);
}
function districtRows(metric, year, months, districts) {
    const rows = districts.map((index) => {
        const value = sumMetric(metric, year, [index], months);
        return { name: data.districts[index].name, value };
    });
    rows.sort((a, b) => b.value - a.value);
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return {
        total,
        rows: rows.map((row) => ({
            District: row.name,
            Value: displayMetric(metric, row.value),
            Share: formatShare(row.value, total),
        })),
    };
}
function monthRows(metric, year, months, districts) {
    const rows = months.map((month) => ({
        name: data.months[month].full,
        value: sumMetric(metric, year, districts, [month]),
    }));
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return {
        total,
        rows: rows.map((row) => ({
            Month: row.name,
            Value: displayMetric(metric, row.value),
            Share: formatShare(row.value, total),
        })),
    };
}
const valueColumns = [
    { key: "District", label: "District" },
    { key: "Value", label: "Value", align: "right" },
    { key: "Share", label: "Share", align: "right" },
];
const monthColumns = [
    { key: "Month", label: "Month" },
    { key: "Value", label: "Value", align: "right" },
    { key: "Share", label: "Share", align: "right" },
];
function kpiMetric(kpiId) {
    return kpiDefs.find((item) => item.id === kpiId)?.metric;
}
function breakdown(metric, year, months, filters) {
    const districts = districtIndexes(filters.districtId);
    if (filters.districtId === "all") {
        const result = districtRows(metric, year, months, districts);
        return { columns: valueColumns, rows: result.rows, total: displayMetric(metric, result.total) };
    }
    const result = monthRows(metric, year, months, districts);
    return { columns: monthColumns, rows: result.rows, total: displayMetric(metric, result.total) };
}
export function buildSecretaryDetail(request, filters) {
    const year = yearIndexOf(filters.financialYear);
    const months = monthIndexes(filters);
    const note = `${data.meta.illustrativeNote} ${data.meta.stageNote}`;
    const scope = scopeLabel(filters);
    if (request.type === "kpi") {
        const metric = kpiMetric(request.kpiId);
        const definition = kpiDefs.find((item) => item.id === request.kpiId);
        if (!metric || !definition) {
            return emptyDetail("This indicator is not available.", scope, note);
        }
        const result = breakdown(metric, year, months, filters);
        return {
            title: definition.label,
            summary: `${definition.hint} in the selected scope: ${result.total}.`,
            note,
            columns: result.columns,
            rows: result.rows,
        };
    }
    if (request.type === "chart") {
        return chartDetail(request, filters, year, months, scope, note);
    }
    if (request.type === "exception") {
        const item = data.exceptions.find((exception) => exception.id === request.exceptionId);
        if (!item)
            return emptyDetail("This exception is not available.", scope, note);
        const count = sumMetricCounts(item.counts, year, districtIndexes(filters.districtId), months);
        const samples = data.samples.exceptions.filter((row) => row.exceptionId === item.id && inScope(row, filters, months));
        const incidentRows = item.id === "safety-incidents"
            ? data.samples.incidents.filter((row) => inScope(row, filters, months)).map((row) => ({
                Reference: row.reference,
                District: districtName(row.districtId),
                Month: data.months[row.monthIndex].full,
                Detail: row.incidentType,
                Records: "1",
            }))
            : samples.map((row) => ({
                Reference: row.reference,
                District: districtName(row.districtId),
                Month: data.months[row.monthIndex].full,
                Detail: row.detail,
                Records: formatCount(row.records),
            }));
        return {
            title: item.title,
            summary: `${formatCount(count)} records in this scope. Source: ${item.sourceDepartment}. ${item.description}`,
            note: "The table is an illustrative sample. It is not the full record set, and it is not a confirmed violation.",
            columns: [
                { key: "Reference", label: "Reference" },
                { key: "District", label: "District" },
                { key: "Month", label: "Month" },
                { key: "Detail", label: "Detail" },
                { key: "Records", label: "Sample records", align: "right" },
            ],
            rows: incidentRows,
        };
    }
    const department = data.departments.find((item) => item.id === request.departmentId);
    if (!department)
        return emptyDetail("This department feed is not available.", scope, note);
    const samples = data.samples.departments.filter((row) => row.departmentId === department.id && inScope(row, filters, months));
    return {
        title: department.name,
        summary: `${department.category}. Feed status: ${department.status}. Last updated ${department.lastUpdated}.`,
        note: "Sample feed rows for the selected scope. Integration status describes the departmental feed, not an individual record.",
        columns: [
            { key: "Reference", label: "Reference" },
            { key: "District", label: "District" },
            { key: "Month", label: "Month" },
            { key: "Records", label: "Records", align: "right" },
            { key: "Status", label: "Status", kind: "status" },
        ],
        rows: samples.map((row) => ({
            Reference: row.reference,
            District: districtName(row.districtId),
            Month: data.months[row.monthIndex].full,
            Records: formatCount(row.records),
            Status: row.status,
        })),
    };
}
function chartDetail(request, filters, year, months, scope, note) {
    const selectedMonth = request.category ? monthIndexFromLabel(request.category) : undefined;
    const period = selectedMonth == null ? months : [selectedMonth];
    if (request.chartId === "construction" || (request.chartId === "welfare" && request.series === "Registrations recorded")) {
        const metric = request.chartId === "construction" ? "projects" : "workers";
        const result = breakdown(metric, year, period, filters);
        return {
            title: request.chartId === "construction" ? "Construction projects" : "Workers registered",
            summary: `${request.category ? data.months[selectedMonth ?? 0].full : "Selected period"}: ${result.total}.`,
            note,
            columns: result.columns,
            rows: result.rows,
        };
    }
    if (request.chartId === "cess") {
        if (request.series) {
            const series = cessSeries.find((item) => item.name === request.series);
            if (!series)
                return emptyDetail("This cess stage is not available.", scope, note);
            const result = breakdown(series.metric, year, period, filters);
            return {
                title: series.name,
                summary: `${request.category ?? "Selected period"}: ${result.total}. This stage is not added to the other cess stages.`,
                note,
                columns: result.columns,
                rows: result.rows,
            };
        }
        const districts = filters.districtId === "all" ? allDistrictIndexes() : districtIndexes(filters.districtId);
        const rows = districts.map((index) => {
            const record = { District: data.districts[index].name };
            for (const series of cessSeries) {
                record[series.name] = formatCrore(sumMetric(series.metric, year, [index], period));
            }
            return record;
        });
        return {
            title: "Cess stages by district",
            summary: "Assessed, collected, remitted and credited are shown in separate columns.",
            note,
            columns: [
                { key: "District", label: "District" },
                ...cessSeries.map((series) => ({ key: series.name, label: series.name, align: "right" })),
            ],
            rows,
        };
    }
    if (request.chartId === "welfare") {
        if (request.series) {
            const series = flowSeries.find((item) => item.name === request.series);
            if (!series)
                return emptyDetail("This status is not available.", scope, note);
            const result = breakdown(series.metric, year, period, filters);
            return {
                title: series.name,
                summary: `${request.category ?? "Selected period"}: ${result.total}.`,
                note,
                columns: result.columns,
                rows: result.rows,
            };
        }
        const districts = filters.districtId === "all" ? allDistrictIndexes() : districtIndexes(filters.districtId);
        return {
            title: "Registration and application status",
            summary: "Registrations and application outcomes for the selected period.",
            note,
            columns: [
                { key: "District", label: "District" },
                { key: "Registrations", label: "Registrations", align: "right" },
                { key: "Sanctioned", label: "Sanctioned", align: "right" },
                { key: "Pending", label: "Pending", align: "right" },
                { key: "Returned", label: "Returned", align: "right" },
            ],
            rows: districts.map((index) => ({
                District: data.districts[index].name,
                Registrations: formatCount(sumMetric("workers", year, [index], period)),
                Sanctioned: formatCount(sumMetric("applicationsSanctioned", year, [index], period)),
                Pending: formatCount(sumMetric("pendingApplications", year, [index], period)),
                Returned: formatCount(sumMetric("applicationsReturned", year, [index], period)),
            })),
        };
    }
    if (request.chartId === "schemes") {
        const schemeIndex = request.category ? data.schemes.findIndex((scheme) => scheme.name === request.category) : -1;
        if (schemeIndex >= 0) {
            const districts = filters.districtId === "all" ? allDistrictIndexes() : districtIndexes(filters.districtId);
            const rows = districts.map((index) => ({
                name: data.districts[index].name,
                value: schemeAmount(schemeIndex, year, [index], months),
            }));
            rows.sort((a, b) => b.value - a.value);
            const total = rows.reduce((sum, row) => sum + row.value, 0);
            return {
                title: data.schemes[schemeIndex].name,
                summary: `Amount released in the selected scope: ${formatCrore(total)}.`,
                note,
                columns: valueColumns,
                rows: rows.map((row) => ({
                    District: row.name,
                    Value: formatCrore(row.value),
                    Share: formatShare(row.value, total),
                })),
            };
        }
        return {
            title: "Scheme-wise disbursement",
            summary: "Welfare released under each scheme. These amounts are not cess.",
            note,
            columns: [
                { key: "Scheme", label: "Scheme" },
                { key: "Amount", label: "Amount released", align: "right" },
            ],
            rows: data.schemes.map((scheme, index) => ({
                Scheme: scheme.name,
                Amount: formatCrore(schemeAmount(index, year, districtIndexes(filters.districtId), months)),
            })),
        };
    }
    return emptyDetail("This breakdown is not available.", scope, note);
}
function emptyDetail(title, scope, note) {
    return { title, summary: scope, note, columns: [], rows: [] };
}
