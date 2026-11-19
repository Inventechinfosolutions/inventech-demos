import raw from "@/data/labour-commissionerate.json" with { type: "json" };
import { croreValue, formatCount, formatCrore, formatCroreNumber, formatInr, formatLongDate } from "@/lib/format";
import { palette } from "@/lib/palette";
const data = raw;
const categoryColors = [palette.blue, palette.teal, palette.amber, palette.indigo, palette.slate, palette.navy];
const recordNote = `${data.meta.separationNote} A link to another department is an unconfirmed match.`;
export function localLabourOptions() {
    return {
        financialYears: data.years,
        districts: data.districts,
        taluks: data.taluks,
        categories: data.categories,
        projectStatuses: data.projectStatuses,
        cessStatuses: data.cessStatuses,
        inspectionStatuses: data.inspectionStatuses,
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
function nameOf(list, id) {
    return list.find((item) => item.id === id)?.name ?? id;
}
function categoryFactor(districtIndex, category) {
    if (category === "all")
        return 1;
    const index = data.categories.findIndex((item) => item.id === category);
    return index >= 0 ? data.categoryMix[districtIndex][index] : 0;
}
function talukFactor(districtIndex, filters) {
    if (filters.talukId === "all")
        return 1;
    const taluk = data.taluks.find((item) => item.id === filters.talukId);
    if (!taluk)
        return 0;
    if (data.districts[districtIndex].id !== taluk.districtId)
        return filters.districtId === "all" ? 1 : 0;
    return taluk.weight / 100;
}
function scale(districtIndex, filters) {
    return categoryFactor(districtIndex, filters.category) * talukFactor(districtIndex, filters);
}
function sumCube(metric, year, districts, months, filters) {
    const cube = data.metrics[metric];
    let total = 0;
    for (const district of districts) {
        const weight = scale(district, filters);
        for (const month of months)
            total += cube[year][district][month] * weight;
    }
    return total;
}
function fullSum(metric) {
    return data.metrics[metric][2].reduce((total, district) => total + district.reduce((sum, value) => sum + value, 0), 0);
}
const full = {
    establishments: fullSum("establishments"),
    projects: fullSum("activeProjects"),
    assessed: fullSum("cessAssessed"),
    collected: fullSum("cessCollected"),
    inspections: fullSum("inspections"),
    pending: fullSum("pendingCompliance"),
};
const fullOutstanding = full.assessed - full.collected;
function projectShare(status) {
    if (status === "all" || status === "ongoing")
        return 1;
    const found = data.projectStatuses.find((item) => item.id === status);
    return found ? found.count / full.projects : 0;
}
function cessCountShare(status) {
    if (status === "all")
        return 1;
    return data.rules.cessSlices[status]?.countShare ?? 0;
}
function cessMoney(assessed, collected, status) {
    if (status === "all")
        return { assessed, collected, outstanding: Math.max(0, assessed - collected) };
    if (status === "no-assessment")
        return { assessed: 0, collected: 0, outstanding: 0 };
    const slice = data.rules.cessSlices[status];
    if (!slice)
        return { assessed: 0, collected: 0, outstanding: 0 };
    if (status === "collected") {
        const amount = assessed * (slice.assessedRatio ?? 0);
        return { assessed: amount, collected: amount, outstanding: 0 };
    }
    if (status === "partial") {
        const amount = assessed * (slice.assessedRatio ?? 0);
        const received = Math.min(collected * (slice.collectedRatio ?? 0), amount);
        return { assessed: amount, collected: received, outstanding: Math.max(0, amount - received) };
    }
    const amount = assessed * (slice.assessedRatio ?? 0);
    return { assessed: amount, collected: 0, outstanding: amount };
}
function inspectionFigures(inspections, violations, pending, status) {
    if (status === "all")
        return { inspections, violations, pending };
    const slice = data.rules.inspectionSlices[status];
    if (!slice)
        return { inspections: 0, violations: 0, pending: 0 };
    return {
        inspections: inspections * slice.inspectionShare,
        violations: violations * slice.violationShare,
        pending: pending * slice.pendingShare,
    };
}
function scopeLabel(filters) {
    const parts = [
        filters.financialYear,
        filters.districtId === "all" ? "All districts" : nameOf(data.districts, filters.districtId),
        `${formatLongDate(filters.fromDate)} – ${formatLongDate(filters.toDate)}`,
    ];
    if (filters.talukId !== "all")
        parts.push(nameOf(data.taluks, filters.talukId));
    if (filters.category !== "all")
        parts.push(nameOf(data.categories, filters.category));
    if (filters.projectStatus !== "all")
        parts.push(nameOf(data.projectStatuses, filters.projectStatus));
    if (filters.cessStatus !== "all")
        parts.push(nameOf(data.cessStatuses, filters.cessStatus));
    if (filters.inspectionStatus !== "all")
        parts.push(nameOf(data.inspectionStatuses, filters.inspectionStatus));
    return parts.join(" · ");
}
function topIndexes(values, limit) {
    return values
        .map((value, index) => ({ value, index }))
        .sort((a, b) => b.value - a.value || a.index - b.index)
        .slice(0, limit)
        .map((item) => item.index);
}
function inRegister(row, filters, months) {
    if (row.year !== filters.financialYear)
        return false;
    if (!months.includes(row.monthIndex))
        return false;
    if (filters.districtId !== "all" && row.districtId !== filters.districtId)
        return false;
    if (filters.talukId !== "all" && row.talukId !== filters.talukId)
        return false;
    if (filters.category !== "all" && row.category !== filters.category)
        return false;
    if (filters.projectStatus !== "all" && row.projectStatus !== filters.projectStatus)
        return false;
    if (filters.cessStatus !== "all" && row.cessStatus !== filters.cessStatus)
        return false;
    return true;
}
const registerCaption = "Illustrative extract for the selected filters. Summary figures are the full illustrative totals for this scope. They are not the number of rows in this table.";
function establishmentRegister(filters, months) {
    const rows = data.samples.establishments.filter((row) => inRegister(row, filters, months)).map((row) => ({
        id: row.id,
        Reference: row.id,
        "Establishment ID": row.establishmentId,
        "Establishment Name": row.name,
        Category: nameOf(data.categories, row.category),
        District: nameOf(data.districts, row.districtId),
        Taluk: nameOf(data.taluks, row.talukId),
        "Contractor / Employer": row.employer,
        "Project Value": formatInr(row.projectValueRupees),
        "Registration Date": formatLongDate(row.registrationDate),
        Status: row.status,
    }));
    return {
        caption: registerCaption,
        columns: [
            { key: "Establishment ID", label: "Establishment ID" },
            { key: "Establishment Name", label: "Establishment Name" },
            { key: "Category", label: "Category" },
            { key: "District", label: "District" },
            { key: "Taluk", label: "Taluk" },
            { key: "Contractor / Employer", label: "Contractor / Employer" },
            { key: "Project Value", label: "Project Value", align: "right" },
            { key: "Registration Date", label: "Registration Date" },
            { key: "Status", label: "Status" },
        ],
        rows,
    };
}
function assessmentRegister(filters, months) {
    const rows = data.samples.assessments.filter((row) => inRegister(row, filters, months)).map((row) => ({
        id: row.id,
        Reference: row.id,
        "Assessment ID": row.assessmentId,
        "Project ID": row.projectId,
        "Project Name": row.projectName,
        District: nameOf(data.districts, row.districtId),
        "Assessed Amount": formatInr(row.assessedRupees),
        "Collected Amount": formatInr(row.collectedRupees),
        "Outstanding Amount": formatInr(Math.max(0, row.assessedRupees - row.collectedRupees)),
        "Assessment Date": formatLongDate(row.assessmentDate),
        Status: nameOf(data.cessStatuses, row.cessStatus ?? ""),
    }));
    return {
        caption: registerCaption,
        columns: [
            { key: "Assessment ID", label: "Assessment ID" },
            { key: "Project ID", label: "Project ID" },
            { key: "Project Name", label: "Project Name" },
            { key: "District", label: "District" },
            { key: "Assessed Amount", label: "Assessed Amount", align: "right" },
            { key: "Collected Amount", label: "Collected Amount", align: "right" },
            { key: "Outstanding Amount", label: "Outstanding Amount", align: "right" },
            { key: "Assessment Date", label: "Assessment Date" },
            { key: "Status", label: "Status" },
        ],
        rows,
    };
}
function inspectionRegister(filters, months) {
    const rows = data.samples.inspections.filter((row) => {
        if (!inRegister(row, filters, months))
            return false;
        if (filters.inspectionStatus === "all")
            return true;
        const status = data.inspectionStatuses.find((item) => item.id === filters.inspectionStatus);
        return status?.name === row.complianceStatus;
    }).map((row) => ({
        id: row.id,
        Reference: row.id,
        "Inspection ID": row.inspectionId,
        Establishment: row.establishmentName,
        District: nameOf(data.districts, row.districtId),
        "Inspection Date": formatLongDate(row.inspectionDate),
        "Inspection Category": nameOf(data.categories, row.category),
        "Violation Count": formatCount(row.violationCount),
        "Compliance Status": row.complianceStatus,
        "Action Required": row.actionRequired,
    }));
    return {
        caption: registerCaption,
        columns: [
            { key: "Inspection ID", label: "Inspection ID" },
            { key: "Establishment", label: "Establishment" },
            { key: "District", label: "District" },
            { key: "Inspection Date", label: "Inspection Date" },
            { key: "Inspection Category", label: "Inspection Category" },
            { key: "Violation Count", label: "Violation Count", align: "right" },
            { key: "Compliance Status", label: "Compliance Status" },
            { key: "Action Required", label: "Action Required" },
        ],
        rows,
    };
}
function figuresFor(filters, districts, months) {
    const year = yearIndexOf(filters.financialYear);
    const establishments = sumCube("establishments", year, districts, months, filters);
    const projectBase = sumCube("activeProjects", year, districts, months, filters) * projectShare(filters.projectStatus);
    const projects = projectBase * cessCountShare(filters.cessStatus);
    const assessedBase = sumCube("cessAssessed", year, districts, months, filters) * projectShare(filters.projectStatus);
    const collectedBase = sumCube("cessCollected", year, districts, months, filters) * projectShare(filters.projectStatus);
    const money = cessMoney(assessedBase, collectedBase, filters.cessStatus);
    const inspectionBase = sumCube("inspections", year, districts, months, filters);
    const violationBase = sumCube("violations", year, districts, months, filters);
    const pendingBase = sumCube("pendingCompliance", year, districts, months, filters);
    const compliance = inspectionFigures(inspectionBase, violationBase, pendingBase, filters.inspectionStatus);
    return {
        establishments,
        projects,
        assessed: money.assessed,
        collected: money.collected,
        outstanding: money.outstanding,
        inspections: compliance.inspections,
        violations: compliance.violations,
        pending: compliance.pending,
        projectBase,
        inspectionBase,
    };
}
function queueFor(filters, figures) {
    const unmatched = filters.cessStatus === "collected" || filters.cessStatus === "partial" || filters.cessStatus === "assessed-only"
        ? 0
        : filters.cessStatus === "no-assessment"
            ? figures.projects
            : data.rules.exceptions["projects-without-assessment"] * (figures.projectBase / full.projects);
    const moneyShare = fullOutstanding === 0 ? 0 : figures.outstanding / fullOutstanding;
    const inspectionShare = full.inspections === 0 ? 0 : figures.inspectionBase / full.inspections;
    const followUp = filters.inspectionStatus === "all" || filters.inspectionStatus === "follow-up"
        ? data.rules.exceptions["inspection-follow-up"] * inspectionShare
        : 0;
    const items = [
        {
            id: "projects-without-assessment",
            title: "Projects without a matched cess assessment",
            description: "Construction projects with no matched assessment in the labour cess file. An unmatched record is listed for review. It is not recorded as a confirmed violation.",
            source: "Labour project file",
            severity: "high",
            countLabel: formatCount(unmatched),
        },
        {
            id: "outstanding-cases",
            title: "Outstanding assessed cess",
            description: "Assessments with an amount still to be collected. Collected cess, including cess awaiting remittance, stays out of this balance.",
            source: "Labour cess assessment file",
            severity: "high",
            countLabel: formatCount(data.rules.exceptions["outstanding-cases"] * moneyShare),
        },
        {
            id: "overdue-collection",
            title: "Overdue collection cases",
            description: "Assessments past the illustrative collection window with an amount still outstanding.",
            source: "Labour collection receipt",
            severity: "high",
            countLabel: formatCount(data.rules.exceptions["overdue-collection"] * moneyShare),
        },
        {
            id: "inspection-follow-up",
            title: "Pending inspection follow-ups",
            description: "Inspections with a follow-up still open in the inspection diary.",
            source: "Labour inspection diary",
            severity: "medium",
            countLabel: formatCount(followUp),
        },
        {
            id: "unresolved-compliance",
            title: "Unresolved compliance cases",
            description: "Compliance cases still open on recorded findings.",
            source: "Labour compliance file",
            severity: "high",
            countLabel: formatCount(figures.pending),
        },
        {
            id: "incomplete-establishments",
            title: "Incomplete establishment information",
            description: "Establishment rows in this illustrative extract with a required field still blank.",
            source: "Labour Establishment Register",
            severity: "medium",
            countLabel: formatCount(data.rules.exceptions["incomplete-establishments"] * (figures.establishments / full.establishments)),
        },
    ];
    return items;
}
function kpisFor(filters, figures) {
    const projectName = filters.projectStatus === "all" || filters.projectStatus === "ongoing" ? "Ongoing projects" : nameOf(data.projectStatuses, filters.projectStatus);
    const cessName = filters.cessStatus === "all" ? "" : nameOf(data.cessStatuses, filters.cessStatus);
    const inspectionName = filters.inspectionStatus === "all" ? "" : nameOf(data.inspectionStatuses, filters.inspectionStatus);
    const projectHint = cessName ? `${projectName} · ${cessName}` : projectName;
    const financeHint = cessName || "Assessment and collection stay separate";
    return [
        { id: "establishments", label: "Registered Establishments", hint: "On the labour establishment register", displayValue: formatCount(figures.establishments), group: "register" },
        { id: "projects", label: "Active Construction Projects", hint: projectHint, displayValue: formatCount(figures.projects), group: "register" },
        { id: "cess-assessed", label: "Cess Assessed", hint: financeHint, displayValue: formatCrore(figures.assessed), group: "finance" },
        { id: "cess-collected", label: "Cess Collected", hint: "Collection stage, before remittance", displayValue: formatCrore(figures.collected), group: "finance" },
        { id: "outstanding", label: "Outstanding Assessed Cess", hint: "Assessed minus collected", displayValue: formatCrore(figures.outstanding), group: "finance" },
        { id: "inspections", label: "Inspections Conducted", hint: inspectionName || "Inspections recorded", displayValue: formatCount(figures.inspections), group: "compliance" },
        { id: "violations", label: "Violations Identified", hint: "Findings recorded at inspection", displayValue: formatCount(figures.violations), group: "compliance" },
        { id: "pending", label: "Pending Compliance Cases", hint: "Cases still open", displayValue: formatCount(figures.pending), group: "compliance" },
    ];
}
function monthValue(metric, year, districts, month, filters) {
    return sumCube(metric, year, districts, [month], filters);
}
function chartsFor(filters, districts, months) {
    const year = yearIndexOf(filters.financialYear);
    const monthLabels = months.map((month) => data.months[month].label);
    const share = projectShare(filters.projectStatus);
    const countShare = cessCountShare(filters.cessStatus);
    const registrations = months.map((month) => Math.round(monthValue("establishments", year, districts, month, filters)));
    const fresh = months.map((month) => Math.round(monthValue("newRegistrations", year, districts, month, filters)));
    const renewed = months.map((month) => Math.round(monthValue("renewedRegistrations", year, districts, month, filters)));
    const projectTotals = data.districts.map((_, index) => {
        const raw = months.reduce((sum, month) => sum + data.metrics.activeProjects[year][index][month], 0);
        return raw * talukFactor(index, filters) * share * countShare;
    });
    const shownDistricts = topIndexes(districts.map((index) => projectTotals[index]), Math.min(8, districts.length));
    const projectCategories = shownDistricts.map((slot) => data.districts[districts[slot]].name);
    const projectSeries = data.categories.map((category, categoryIndex) => ({
        name: category.name,
        color: categoryColors[categoryIndex],
        values: shownDistricts.map((slot) => {
            const districtIndex = districts[slot];
            if (filters.category !== "all" && filters.category !== category.id)
                return 0;
            const raw = months.reduce((sum, month) => sum + data.metrics.activeProjects[year][districtIndex][month], 0);
            return Math.round(raw * data.categoryMix[districtIndex][categoryIndex] * talukFactor(districtIndex, filters) * share * countShare);
        }),
    }));
    const cessAssessed = months.map((month) => {
        const money = cessMoney(monthValue("cessAssessed", year, districts, month, filters) * share, monthValue("cessCollected", year, districts, month, filters) * share, filters.cessStatus);
        return croreValue(money.assessed);
    });
    const cessCollected = months.map((month) => {
        const money = cessMoney(monthValue("cessAssessed", year, districts, month, filters) * share, monthValue("cessCollected", year, districts, month, filters) * share, filters.cessStatus);
        return croreValue(money.collected);
    });
    const outstandingByDistrict = data.districts.map((_, index) => {
        if (!districts.includes(index))
            return 0;
        const assessed = months.reduce((sum, month) => sum + data.metrics.cessAssessed[year][index][month], 0) * scale(index, filters) * share;
        const collected = months.reduce((sum, month) => sum + data.metrics.cessCollected[year][index][month], 0) * scale(index, filters) * share;
        return cessMoney(assessed, collected, filters.cessStatus).outstanding;
    });
    const outstandingSlots = topIndexes(outstandingByDistrict, 10).filter((index) => outstandingByDistrict[index] > 0);
    const collectedTotal = cessMoney(sumCube("cessAssessed", year, districts, months, filters) * share, sumCube("cessCollected", year, districts, months, filters) * share, filters.cessStatus).collected;
    const inspectionByDistrict = data.districts.map((_, index) => {
        if (!districts.includes(index))
            return { inspections: 0, violations: 0 };
        const inspections = months.reduce((sum, month) => sum + data.metrics.inspections[year][index][month], 0) * scale(index, filters);
        const violations = months.reduce((sum, month) => sum + data.metrics.violations[year][index][month], 0) * scale(index, filters);
        const pending = months.reduce((sum, month) => sum + data.metrics.pendingCompliance[year][index][month], 0) * scale(index, filters);
        return inspectionFigures(inspections, violations, pending, filters.inspectionStatus);
    });
    const inspectionSlots = topIndexes(inspectionByDistrict.map((item) => item.inspections), Math.min(8, districts.length));
    const statusCategories = data.inspectionStatuses.map((item) => item.name);
    const statusInspections = data.inspectionStatuses.map((item) => {
        const base = sumCube("inspections", year, districts, months, filters);
        return Math.round(inspectionFigures(base, 0, 0, item.id).inspections);
    });
    const statusViolations = data.inspectionStatuses.map((item) => {
        const base = sumCube("violations", year, districts, months, filters);
        return Math.round(inspectionFigures(0, base, 0, item.id).violations);
    });
    return [
        {
            id: "registrations",
            title: "Establishment registrations",
            description: "Monthly registrations on the labour establishment register.",
            kind: "line",
            categories: monthLabels,
            series: [{ name: "Registrations", color: palette.blue, values: registrations }],
            unit: "count",
        },
        {
            id: "new-renewed",
            title: "New and renewed registrations",
            description: "New registrations and renewals for the same months. The two series add up to the monthly total.",
            kind: "grouped",
            categories: monthLabels,
            series: [
                { name: "New", color: palette.blue, values: fresh },
                { name: "Renewed", color: palette.teal, values: renewed },
            ],
            unit: "count",
        },
        {
            id: "projects-category",
            title: "Projects by district and category",
            description: "Construction projects split by work category. The largest districts in this scope are shown.",
            kind: "horizontal",
            categories: projectCategories,
            series: projectSeries,
            unit: "count",
        },
        {
            id: "cess-monthly",
            title: "Cess assessed and collected",
            description: "Assessed and collected amounts by month. Each bar is its own stage.",
            kind: "grouped",
            categories: monthLabels,
            series: [
                { name: "Cess assessed", color: palette.blue, values: cessAssessed },
                { name: "Cess collected", color: palette.teal, values: cessCollected },
            ],
            unit: "crore",
        },
        {
            id: "outstanding-district",
            title: "Outstanding assessed cess",
            description: "Assessed minus collected, by district. Collected amounts stay out of this balance.",
            emptyLabel: "No outstanding assessed cess in this scope.",
            kind: "horizontal",
            categories: outstandingSlots.map((index) => data.districts[index].name),
            series: [{ name: "Outstanding assessed cess", color: palette.amber, values: outstandingSlots.map((index) => croreValue(outstandingByDistrict[index])) }],
            unit: "crore",
        },
        {
            id: "collection-authority",
            title: "Collection by authority",
            description: "Cess collected, by the authority that received it. This is the collection stage.",
            kind: "horizontal",
            categories: data.authorities.map((item) => item.name),
            series: [{ name: "Cess collected", color: palette.teal, values: data.authorities.map((item) => croreValue(collectedTotal * item.share)) }],
            unit: "crore",
        },
        {
            id: "inspection-status",
            title: "Inspection and compliance status",
            description: "Inspections and recorded findings by compliance status.",
            kind: "grouped",
            categories: statusCategories,
            series: [
                { name: "Inspections", color: palette.blue, values: statusInspections },
                { name: "Violations", color: palette.amber, values: statusViolations },
            ],
            unit: "count",
        },
        {
            id: "inspection-district",
            title: "Inspections and violations by district",
            description: "Inspection visits and recorded findings for the districts with the most inspections in this scope.",
            kind: "horizontal",
            categories: inspectionSlots.map((index) => data.districts[index].name),
            series: [
                { name: "Inspections", color: palette.blue, values: inspectionSlots.map((index) => Math.round(inspectionByDistrict[index].inspections)) },
                { name: "Violations", color: palette.amber, values: inspectionSlots.map((index) => Math.round(inspectionByDistrict[index].violations)) },
            ],
            unit: "count",
        },
    ];
}
function mapDistricts(filters, months) {
    const openFilters = { ...filters, districtId: "all" };
    return data.districts.map((district, index) => {
        const figures = figuresFor(openFilters, [index], months);
        return {
            id: district.id,
            name: district.name,
            projects: Math.round(figures.projects),
            establishments: Math.round(figures.establishments),
            cessCollected: figures.collected,
            inspections: Math.round(figures.inspections),
            pendingCompliance: Math.round(figures.pending),
        };
    });
}
export function buildLabourOverview(filters) {
    const months = monthIndexes(filters);
    const districts = districtIndexes(filters.districtId);
    const figures = figuresFor(filters, districts, months);
    return {
        source: data.meta.source,
        lastRefreshed: data.meta.lastRefreshed,
        illustrativeNote: data.meta.illustrativeNote,
        boundaryNote: data.meta.boundaryNote,
        separationNote: data.meta.separationNote,
        stageNote: data.meta.stageNote,
        scopeLabel: scopeLabel(filters),
        filters,
        kpis: kpisFor(filters, figures),
        charts: chartsFor(filters, districts, months),
        districts: mapDistricts(filters, months),
        registers: {
            establishments: establishmentRegister(filters, months),
            assessments: assessmentRegister(filters, months),
            inspections: inspectionRegister(filters, months),
        },
        queue: queueFor(filters, figures),
    };
}
function fieldDetail(title, summary, fields) {
    return {
        title,
        summary,
        note: recordNote,
        columns: [
            { key: "Field", label: "Field" },
            { key: "Value", label: "Value" },
        ],
        rows: fields.map(([field, value]) => ({ Field: field, Value: value })),
    };
}
function districtBreakdown(filters, months, valueOf, source) {
    const allowed = new Set(districtIndexes(filters.districtId));
    const rows = data.districts.flatMap((district, index) => {
        if (!allowed.has(index))
            return [];
        const count = Math.round(valueOf(figuresFor(filters, [index], months)));
        if (count === 0)
            return [];
        return [{ District: district.name, Count: formatCount(count), Source: source }];
    });
    return {
        title: "District breakdown",
        summary: "",
        note: recordNote,
        columns: [
            { key: "District", label: "District" },
            { key: "Count", label: "Count", align: "right" },
            { key: "Source", label: "Source reference" },
        ],
        rows,
    };
}
export function buildLabourDetail(request, filters) {
    const overview = buildLabourOverview(filters);
    const months = monthIndexes(filters);
    if (request.type === "kpi") {
        const kpi = overview.kpis.find((item) => item.id === request.kpiId);
        const chartId = request.kpiId === "establishments" ? "registrations" : request.kpiId === "projects" ? "projects-category" : request.kpiId === "inspections" || request.kpiId === "violations" || request.kpiId === "pending" ? "inspection-district" : "cess-monthly";
        const chart = overview.charts.find((item) => item.id === chartId);
        const rows = request.kpiId === "outstanding" && chart
            ? chart.categories.map((category, index) => ({
                Period: category,
                "Outstanding assessed cess": formatCroreNumber(Math.max(0, (chart.series[0]?.values[index] ?? 0) - (chart.series[1]?.values[index] ?? 0))),
            }))
            : (chart?.categories ?? []).map((category, index) => ({
                Period: category,
                ...Object.fromEntries((chart?.series ?? []).map((series) => [series.name, chart?.unit === "crore" ? formatCroreNumber(series.values[index] ?? 0) : formatCount(series.values[index] ?? 0)])),
            }));
        return {
            title: kpi?.label ?? "Summary",
            summary: `${kpi?.displayValue ?? ""} · ${overview.scopeLabel}`,
            note: `${data.meta.stageNote} ${recordNote}`,
            columns: rows[0] ? Object.keys(rows[0]).map((key) => ({ key, label: key, align: key === "Period" ? "left" : "right" })) : [],
            rows,
        };
    }
    if (request.type === "chart") {
        const chart = overview.charts.find((item) => item.id === request.chartId);
        const rows = (chart?.categories ?? []).map((category, index) => ({
            Category: category,
            ...Object.fromEntries((chart?.series ?? []).map((series) => [series.name, chart?.unit === "crore" ? formatCroreNumber(series.values[index] ?? 0) : formatCount(series.values[index] ?? 0)])),
        }));
        return {
            title: chart?.title ?? "Chart",
            summary: chart?.description ?? "",
            note: recordNote,
            columns: rows[0] ? Object.keys(rows[0]).map((key) => ({ key, label: key, align: key === "Category" ? "left" : "right" })) : [],
            rows,
        };
    }
    if (request.type === "exception") {
        const item = overview.queue.find((entry) => entry.id === request.exceptionId);
        const valueOf = (figures) => {
            if (request.exceptionId === "projects-without-assessment") {
                if (filters.cessStatus === "no-assessment")
                    return figures.projects;
                if (filters.cessStatus !== "all")
                    return 0;
                return data.rules.exceptions["projects-without-assessment"] * (figures.projectBase / full.projects);
            }
            if (fullOutstanding === 0 && (request.exceptionId === "outstanding-cases" || request.exceptionId === "overdue-collection"))
                return 0;
            if (request.exceptionId === "outstanding-cases")
                return data.rules.exceptions["outstanding-cases"] * (figures.outstanding / fullOutstanding);
            if (request.exceptionId === "overdue-collection")
                return data.rules.exceptions["overdue-collection"] * (figures.outstanding / fullOutstanding);
            if (request.exceptionId === "inspection-follow-up") {
                if (filters.inspectionStatus !== "all" && filters.inspectionStatus !== "follow-up")
                    return 0;
                return data.rules.exceptions["inspection-follow-up"] * (figures.inspectionBase / full.inspections);
            }
            if (request.exceptionId === "unresolved-compliance")
                return figures.pending;
            return data.rules.exceptions["incomplete-establishments"] * (figures.establishments / full.establishments);
        };
        const breakdown = districtBreakdown(filters, months, valueOf, item?.source ?? "Labour Commissionerate");
        return {
            ...breakdown,
            title: item?.title ?? "Exception",
            summary: `${item?.countLabel ?? "0"} · ${item?.description ?? ""}`,
        };
    }
    if (request.register === "establishments") {
        const row = data.samples.establishments.find((item) => item.id === request.id);
        if (!row)
            return fieldDetail("Record unavailable", "This illustrative row is outside the current extract.", []);
        return fieldDetail(row.establishmentId, row.name, [
            ["Establishment", row.name],
            ["Category", nameOf(data.categories, row.category)],
            ["District", nameOf(data.districts, row.districtId)],
            ["Taluk", nameOf(data.taluks, row.talukId)],
            ["Contractor / Employer", row.employer],
            ["Project value", formatInr(row.projectValueRupees)],
            ["Registration date", formatLongDate(row.registrationDate)],
            ["Status", row.status],
            ["Source reference", row.source],
            ["Holding system", "Labour Commissionerate"],
        ]);
    }
    if (request.register === "assessments") {
        const row = data.samples.assessments.find((item) => item.id === request.id);
        if (!row)
            return fieldDetail("Record unavailable", "This illustrative row is outside the current extract.", []);
        return fieldDetail(row.assessmentId, row.projectName, [
            ["Project", `${row.projectId} · ${row.projectName}`],
            ["District", nameOf(data.districts, row.districtId)],
            ["Assessed", formatInr(row.assessedRupees)],
            ["Collected", formatInr(row.collectedRupees)],
            ["Outstanding assessed cess", formatInr(Math.max(0, row.assessedRupees - row.collectedRupees))],
            ["Assessment date", formatLongDate(row.assessmentDate)],
            ["Status", nameOf(data.cessStatuses, row.cessStatus ?? "")],
            ["Source reference", row.source],
            ["Holding system", "Labour Commissionerate"],
        ]);
    }
    const row = data.samples.inspections.find((item) => item.id === request.id);
    if (!row)
        return fieldDetail("Record unavailable", "This illustrative row is outside the current extract.", []);
    return fieldDetail(row.inspectionId, row.establishmentName, [
        ["Establishment", row.establishmentName],
        ["District", nameOf(data.districts, row.districtId)],
        ["Inspection date", formatLongDate(row.inspectionDate)],
        ["Category", nameOf(data.categories, row.category)],
        ["Violations recorded", formatCount(row.violationCount)],
        ["Compliance status", row.complianceStatus],
        ["Action required", row.actionRequired],
        ["Source reference", row.source],
        ["Holding system", "Labour Commissionerate"],
    ]);
}
