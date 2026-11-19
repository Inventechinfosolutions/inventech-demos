import raw from "@/data/welfare-board.json" with { type: "json" };
import { croreValue, formatCount, formatCrore, formatCroreNumber, formatInr, formatLakh, formatLongDate } from "@/lib/format";
import { palette } from "@/lib/palette";
const data = raw;
const recordNote = `${data.meta.separationNote} ${data.meta.stageNote}`;
const approvalStatuses = new Set(["all", "approved", "payment-processing", "disbursed"]);
function allocate(total, weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (total === 0 || sum === 0)
        return weights.map(() => 0);
    const exact = weights.map((weight) => (total * weight) / sum);
    const floors = exact.map((value) => Math.floor(value + 1e-8));
    let left = total - floors.reduce((a, b) => a + b, 0);
    const order = exact
        .map((value, index) => ({ index, frac: value - Math.floor(value + 1e-8) }))
        .sort((a, b) => b.frac - a.frac || a.index - b.index);
    let cursor = 0;
    while (left > 0) {
        floors[order[cursor % order.length].index] += 1;
        left -= 1;
        cursor += 1;
    }
    return floors;
}
export function localWelfareOptions() {
    return {
        financialYears: data.years,
        districts: data.districts,
        taluks: data.taluks,
        membershipStatuses: data.membershipStatuses.map(({ id, name }) => ({ id, name })),
        schemes: data.schemes.map(({ id, name }) => ({ id, name })),
        applicationStatuses: data.applicationStatuses.map(({ id, name }) => ({ id, name })),
        paymentStatuses: data.paymentStatuses,
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
function sumCube(metric, year, districts, months, filters) {
    const cube = data.metrics[metric];
    let total = 0;
    for (const district of districts) {
        const weight = talukFactor(district, filters);
        for (const month of months)
            total += cube[year][district][month] * weight;
    }
    return total;
}
function fullSum(metric) {
    return data.metrics[metric][2].reduce((total, district) => total + district.reduce((sum, value) => sum + value, 0), 0);
}
const full = {
    workers: fullSum("workers"),
    beneficiaries: fullSum("beneficiaries"),
    applications: fullSum("applications"),
    pending: fullSum("pendingApplications"),
    approved: fullSum("assistanceApproved"),
    disbursed: fullSum("assistanceDisbursed"),
    failed: fullSum("failedPayments"),
};
function formatPeople(value) {
    if (Math.abs(value) < 100000)
        return formatCount(value);
    return formatLakh(value).replace(/(\.\d)0(?= lakh)/, "$1");
}
function membershipParts(workers) {
    const parts = allocate(Math.max(0, Math.round(workers)), data.membershipStatuses.map((item) => item.count));
    return Object.fromEntries(data.membershipStatuses.map((item, index) => [item.id, parts[index] ?? 0]));
}
function statusParts(applications, pending) {
    const safePending = Math.min(Math.max(0, Math.round(pending)), Math.max(0, Math.round(applications)));
    const rest = Math.max(0, Math.round(applications) - safePending);
    const others = data.applicationStatuses.filter((item) => item.id !== "pending");
    const allocated = allocate(rest, others.map((item) => item.count));
    const counts = { pending: safePending };
    others.forEach((item, index) => {
        counts[item.id] = allocated[index] ?? 0;
    });
    return counts;
}
function scopeLabel(filters) {
    const parts = [
        filters.financialYear,
        filters.districtId === "all" ? "All districts" : nameOf(data.districts, filters.districtId),
        `${formatLongDate(filters.fromDate)} – ${formatLongDate(filters.toDate)}`,
    ];
    if (filters.talukId !== "all")
        parts.push(nameOf(data.taluks, filters.talukId));
    if (filters.membershipStatus !== "all")
        parts.push(nameOf(data.membershipStatuses, filters.membershipStatus));
    if (filters.scheme !== "all")
        parts.push(nameOf(data.schemes, filters.scheme));
    if (filters.applicationStatus !== "all")
        parts.push(nameOf(data.applicationStatuses, filters.applicationStatus));
    if (filters.paymentStatus !== "all")
        parts.push(nameOf(data.paymentStatuses, filters.paymentStatus));
    return parts.join(" · ");
}
function figuresFor(filters, districts, months) {
    const year = yearIndexOf(filters.financialYear);
    const workerTotal = sumCube("workers", year, districts, months, filters);
    const parts = membershipParts(workerTotal);
    const roundedWorkers = Math.round(workerTotal);
    const membershipShare = filters.membershipStatus === "all" || roundedWorkers === 0 ? 1 : (parts[filters.membershipStatus] ?? 0) / roundedWorkers;
    const workers = filters.membershipStatus === "all" ? roundedWorkers : parts[filters.membershipStatus] ?? 0;
    const active = filters.membershipStatus === "all" || filters.membershipStatus === "active" ? parts.active ?? 0 : 0;
    const expired = filters.membershipStatus === "all" || filters.membershipStatus === "expired" ? parts.expired ?? 0 : 0;
    const renewals = sumCube("renewals", year, districts, months, filters) * membershipShare;
    const geoBeneficiaries = sumCube("beneficiaries", year, districts, months, filters);
    const geoApplications = sumCube("applications", year, districts, months, filters);
    const geoPending = Math.min(sumCube("pendingApplications", year, districts, months, filters), geoApplications);
    const geoApproved = sumCube("assistanceApproved", year, districts, months, filters);
    const geoDisbursed = sumCube("assistanceDisbursed", year, districts, months, filters);
    const geoFailed = sumCube("failedPayments", year, districts, months, filters);
    const scheme = data.schemes.find((item) => item.id === filters.scheme);
    const geoRatio = full.disbursed === 0 ? 0 : geoDisbursed / full.disbursed;
    const beneficiaries = (scheme ? scheme.beneficiaries * (full.beneficiaries === 0 ? 0 : geoBeneficiaries / full.beneficiaries) : geoBeneficiaries) * membershipShare;
    const applications = (scheme ? scheme.applications * (full.applications === 0 ? 0 : geoApplications / full.applications) : geoApplications) * membershipShare;
    const pending = Math.min((scheme ? scheme.pending * (full.pending === 0 ? 0 : geoPending / full.pending) : geoPending) * membershipShare, applications);
    const approvedBase = (scheme ? scheme.approvedRupees * (full.approved === 0 ? 0 : geoApproved / full.approved) : geoApproved) * membershipShare;
    const disbursedFund = (scheme ? scheme.disbursedRupees * geoRatio : geoDisbursed) * membershipShare;
    const failedBase = (scheme && full.disbursed > 0 ? scheme.disbursedRupees / full.disbursed : 1) * geoFailed * membershipShare;
    const allocated = (scheme ? scheme.allocatedRupees * geoRatio : data.rules.allocatedRupees * geoRatio) * membershipShare;
    const available = (scheme ? data.rules.availableRupees * (scheme.allocatedRupees / data.rules.allocatedRupees) * geoRatio : data.rules.availableRupees * geoRatio) * membershipShare;
    const statuses = statusParts(applications, pending);
    let received = applications;
    let pendingKpi = pending;
    let approved = approvedBase;
    let disbursed = disbursedFund;
    if (filters.applicationStatus !== "all") {
        received = statuses[filters.applicationStatus] ?? 0;
        pendingKpi = filters.applicationStatus === "pending" ? pending : 0;
        approved = approvalStatuses.has(filters.applicationStatus) ? approvedBase : 0;
        disbursed = filters.applicationStatus === "disbursed" ? disbursedFund : 0;
    }
    const failedParts = allocate(Math.max(0, Math.round(failedBase)), data.rules.failedSplit);
    let failed = Math.round(failedBase);
    if (filters.paymentStatus === "failed") {
        disbursed = 0;
        failed = failedParts[0] ?? 0;
    }
    else if (filters.paymentStatus === "returned") {
        disbursed = 0;
        failed = failedParts[1] ?? 0;
    }
    else if (filters.paymentStatus === "processing") {
        disbursed = 0;
        failed = 0;
    }
    if (filters.applicationStatus !== "all" && filters.applicationStatus !== "disbursed")
        failed = 0;
    return {
        workers,
        active,
        expired,
        renewals,
        beneficiaries,
        applications: received,
        pending: pendingKpi,
        approved,
        approvedFund: approvedBase,
        disbursed,
        disbursedFund,
        failed,
        available,
        allocated,
        statuses,
        membershipShare,
        geoRatio,
    };
}
const registerCaption = "Illustrative extract for the selected filters. Names are masked. Summary figures are the full illustrative totals, not the number of rows in this table.";
function inMonths(monthIndex, year, filters, months) {
    return year === filters.financialYear && months.includes(monthIndex);
}
function workerRegister(filters, months) {
    const rows = data.samples.workers.filter((row) => {
        if (!inMonths(row.monthIndex, row.year, filters, months))
            return false;
        if (filters.districtId !== "all" && row.districtId !== filters.districtId)
            return false;
        if (filters.talukId !== "all" && row.talukId !== filters.talukId)
            return false;
        if (filters.membershipStatus !== "all" && row.membershipStatus !== filters.membershipStatus)
            return false;
        return true;
    }).map((row) => ({
        id: row.id,
        Reference: row.id,
        "Worker ID": row.workerId,
        "Worker name": row.displayName,
        District: nameOf(data.districts, row.districtId),
        Taluk: nameOf(data.taluks, row.talukId),
        Occupation: nameOf(data.occupations, row.occupation),
        "Registration date": formatLongDate(row.registrationDate),
        "Membership expiry": formatLongDate(row.expiryDate),
        "Membership status": nameOf(data.membershipStatuses, row.membershipStatus),
    }));
    return {
        title: "Worker registration register",
        caption: registerCaption,
        columns: [
            { key: "Worker ID", label: "Worker ID" },
            { key: "Worker name", label: "Worker name" },
            { key: "District", label: "District" },
            { key: "Taluk", label: "Taluk" },
            { key: "Occupation", label: "Occupation" },
            { key: "Registration date", label: "Registration date" },
            { key: "Membership expiry", label: "Membership expiry date" },
            { key: "Membership status", label: "Membership status" },
        ],
        rows,
    };
}
function applicationRegister(filters, months) {
    const rows = data.samples.applications.filter((row) => {
        if (!inMonths(row.monthIndex, row.year, filters, months))
            return false;
        if (filters.districtId !== "all" && row.districtId !== filters.districtId)
            return false;
        if (filters.talukId !== "all" && row.talukId !== filters.talukId)
            return false;
        if (filters.membershipStatus !== "all" && row.membershipStatus !== filters.membershipStatus)
            return false;
        if (filters.scheme !== "all" && row.schemeId !== filters.scheme)
            return false;
        if (filters.applicationStatus !== "all" && row.status !== filters.applicationStatus)
            return false;
        return true;
    }).map((row) => ({
        id: row.id,
        Reference: row.id,
        "Application ID": row.applicationId,
        "Worker ID": row.workerId,
        "Scheme ID": row.schemeId.toUpperCase(),
        "Scheme name": nameOf(data.schemes, row.schemeId),
        "Application date": formatLongDate(row.applicationDate),
        "Current status": nameOf(data.applicationStatuses, row.status),
        "Verification status": row.verificationStatus,
        "Pending duration": `${row.pendingDays} days`,
        District: nameOf(data.districts, row.districtId),
    }));
    return {
        title: "Welfare application register",
        caption: registerCaption,
        columns: [
            { key: "Application ID", label: "Application ID" },
            { key: "Worker ID", label: "Worker ID" },
            { key: "Scheme ID", label: "Scheme ID" },
            { key: "Scheme name", label: "Scheme name" },
            { key: "Application date", label: "Application date" },
            { key: "Current status", label: "Current status" },
            { key: "Verification status", label: "Verification status" },
            { key: "Pending duration", label: "Pending duration" },
            { key: "District", label: "District" },
        ],
        rows,
    };
}
function disbursementRegister(filters, months) {
    const rows = data.samples.disbursements.filter((row) => {
        if (!inMonths(row.monthIndex, row.year, filters, months))
            return false;
        const application = data.samples.applications.find((item) => item.applicationId === row.applicationId);
        if (filters.districtId !== "all" && row.districtId !== filters.districtId)
            return false;
        if (filters.talukId !== "all" && application?.talukId !== filters.talukId)
            return false;
        if (filters.membershipStatus !== "all" && row.membershipStatus !== filters.membershipStatus)
            return false;
        if (filters.scheme !== "all" && row.schemeId !== filters.scheme)
            return false;
        if (filters.applicationStatus !== "all" && application?.status !== filters.applicationStatus)
            return false;
        if (filters.paymentStatus !== "all" && row.paymentStatus !== filters.paymentStatus)
            return false;
        return true;
    }).map((row) => ({
        id: row.id,
        Reference: row.id,
        "Transaction ID": row.transactionId,
        "Application ID": row.applicationId,
        Scheme: nameOf(data.schemes, row.schemeId),
        "Approved amount": formatInr(row.approvedRupees),
        "Disbursed amount": formatInr(row.disbursedRupees),
        "Transaction date": formatLongDate(row.transactionDate),
        "Payment status": nameOf(data.paymentStatuses, row.paymentStatus),
        "Failure reason": row.failureReason,
    }));
    return {
        title: "Welfare disbursement register",
        caption: registerCaption,
        columns: [
            { key: "Transaction ID", label: "Transaction ID" },
            { key: "Application ID", label: "Application ID" },
            { key: "Scheme", label: "Scheme" },
            { key: "Approved amount", label: "Approved amount", align: "right" },
            { key: "Disbursed amount", label: "Disbursed amount", align: "right" },
            { key: "Transaction date", label: "Transaction date" },
            { key: "Payment status", label: "Payment status" },
            { key: "Failure reason", label: "Failure reason" },
        ],
        rows,
    };
}
function kpisFor(filters, figures) {
    const membershipHint = filters.membershipStatus === "all" ? "" : nameOf(data.membershipStatuses, filters.membershipStatus);
    const schemeHint = filters.scheme === "all" ? "" : nameOf(data.schemes, filters.scheme);
    return [
        { id: "workers", group: "membership", label: "Total Registered Workers", hint: membershipHint || "Workers on the Board register", displayValue: formatPeople(figures.workers) },
        { id: "active", group: "membership", label: "Active Memberships", hint: "Members with a current membership", displayValue: formatPeople(figures.active) },
        { id: "expired", group: "membership", label: "Expired Memberships", hint: "Memberships past the expiry date", displayValue: formatPeople(figures.expired) },
        { id: "beneficiaries", group: "coverage", label: "Total Beneficiaries", hint: schemeHint ? `People assisted under ${schemeHint}` : "Each person counted once", displayValue: formatPeople(figures.beneficiaries) },
        { id: "received", group: "coverage", label: "Applications Received", hint: filters.applicationStatus === "all" ? "Applications, counted apart from unique workers" : nameOf(data.applicationStatuses, filters.applicationStatus), displayValue: formatPeople(figures.applications) },
        { id: "pending", group: "coverage", label: "Applications Pending", hint: "Applications still open", displayValue: formatPeople(figures.pending) },
        { id: "approved", group: "assistance", label: "Assistance Approved", hint: "Sanctioned assistance", displayValue: formatCrore(figures.approved) },
        { id: "disbursed", group: "assistance", label: "Amount Disbursed", hint: filters.paymentStatus === "all" ? "Successful payments" : nameOf(data.paymentStatuses, filters.paymentStatus), displayValue: formatCrore(figures.disbursed) },
        { id: "failed", group: "assistance", label: "Failed / Returned Payments", hint: "Kept apart from successful payments", displayValue: formatCount(figures.failed) },
    ];
}
function chartsFor(filters, districts, months, figures) {
    const year = yearIndexOf(filters.financialYear);
    const labels = months.map((month) => data.months[month].label);
    const monthWorkers = months.map((month) => Math.round(sumCube("workers", year, districts, [month], filters) * figures.membershipShare));
    const monthRenewals = months.map((month) => Math.round(sumCube("renewals", year, districts, [month], filters) * figures.membershipShare));
    const members = membershipParts(sumCube("workers", year, districts, months, filters));
    const memberCategories = data.membershipStatuses.map((item) => item.name);
    const memberValues = data.membershipStatuses.map((item) => (filters.membershipStatus === "all" || filters.membershipStatus === item.id ? members[item.id] ?? 0 : 0));
    const workerBase = figures.workers;
    const occupations = allocate(workerBase, data.occupations.map((item) => item.share));
    const ages = allocate(workerBase, data.ageGroups.map((item) => item.share));
    const visibleSchemes = data.schemes.filter((scheme) => filters.scheme === "all" || scheme.id === filters.scheme);
    const scale = figures.geoRatio * figures.membershipShare;
    const statusSeries = [
        { name: "Disbursed", key: "disbursedApplications", color: palette.teal },
        { name: "Approved", key: "approvedApplications", color: palette.blue },
        { name: "Payment processing", key: "paymentProcessing", color: palette.indigo },
        { name: "Pending", key: "pending", color: palette.amber },
        { name: "Under verification", key: "underVerification", color: palette.slate },
        { name: "Rejected", key: "rejected", color: "var(--c-series-8c2f39)" },
    ];
    return [
        {
            id: "registrations",
            title: "New registrations",
            description: "Workers added to the Board register in each month.",
            kind: "line",
            categories: labels,
            series: [{ name: "New registrations", color: palette.blue, values: monthWorkers }],
            unit: "count",
        },
        {
            id: "renewals",
            title: "Membership renewals",
            description: "Renewal events. A renewal is not added again to the registered-worker total.",
            kind: "line",
            categories: labels,
            series: [{ name: "Renewals", color: palette.teal, values: monthRenewals }],
            unit: "count",
        },
        {
            id: "membership",
            title: "Active and expired memberships",
            description: "The register splits into active memberships, expired memberships, and workers not yet active.",
            kind: "horizontal",
            categories: memberCategories,
            series: [{ name: "Workers", color: palette.navy, values: memberValues }],
            unit: "count",
        },
        {
            id: "occupation",
            title: "Occupation",
            description: "Illustrative occupation mix of workers in this scope.",
            kind: "horizontal",
            categories: data.occupations.map((item) => item.name),
            series: [{ name: "Workers", color: palette.blue, values: occupations }],
            unit: "count",
        },
        {
            id: "age",
            title: "Age group",
            description: "Illustrative age mix where an age group is recorded.",
            kind: "horizontal",
            categories: data.ageGroups.map((item) => item.name),
            series: [{ name: "Workers", color: palette.indigo, values: ages }],
            unit: "count",
        },
        {
            id: "scheme-status",
            title: "Applications by scheme and status",
            description: "Current application status under each scheme in the illustrative scheme master.",
            kind: "horizontal",
            stack: true,
            categories: visibleSchemes.map((scheme) => scheme.name),
            series: statusSeries.map((series) => ({
                name: series.name,
                color: series.color,
                values: visibleSchemes.map((scheme) => Math.round(scheme[series.key] * scale)),
            })),
            unit: "count",
        },
        {
            id: "scheme-people",
            title: "People assisted by scheme",
            description: "A person assisted under two schemes appears in both bars. The beneficiary total counts that person once.",
            kind: "horizontal",
            categories: visibleSchemes.map((scheme) => scheme.name),
            series: [{ name: "People assisted", color: palette.teal, values: visibleSchemes.map((scheme) => Math.round(scheme.beneficiaries * (full.beneficiaries === 0 ? 0 : sumCube("beneficiaries", year, districts, months, filters) / full.beneficiaries) * figures.membershipShare)) }],
            unit: "count",
        },
        {
            id: "scheme-money",
            title: "Approved and disbursed assistance",
            description: "Approved assistance and successful disbursement for each scheme. The two amounts stay separate.",
            kind: "horizontal",
            categories: visibleSchemes.map((scheme) => scheme.name),
            series: [
                { name: "Approved", color: palette.blue, values: visibleSchemes.map((scheme) => croreValue(scheme.approvedRupees * (full.approved === 0 ? 0 : sumCube("assistanceApproved", year, districts, months, filters) / full.approved) * figures.membershipShare)) },
                { name: "Disbursed", color: palette.teal, values: visibleSchemes.map((scheme) => croreValue(scheme.disbursedRupees * figures.geoRatio * figures.membershipShare)) },
            ],
            unit: "crore",
        },
        {
            id: "processing-days",
            title: "Processing time",
            description: `Illustrative average days at each stage. Pending beyond ${data.rules.slaDays} days is listed in the action panel.`,
            kind: "horizontal",
            categories: data.applicationStatuses.map((item) => item.name),
            series: [{ name: "Average days", color: palette.amber, values: data.applicationStatuses.map((item) => item.averageDays) }],
            unit: "count",
        },
        {
            id: "utilization",
            title: "Scheme fund utilization",
            description: "Utilization compares successful disbursement with the amount allocated to the scheme.",
            kind: "horizontal",
            categories: visibleSchemes.map((scheme) => scheme.name),
            series: [
                { name: "Allocated", color: palette.slate, values: visibleSchemes.map((scheme) => croreValue(scheme.allocatedRupees * figures.geoRatio * figures.membershipShare)) },
                { name: "Disbursed", color: palette.teal, values: visibleSchemes.map((scheme) => croreValue(scheme.disbursedRupees * figures.geoRatio * figures.membershipShare)) },
            ],
            unit: "crore",
        },
    ];
}
function mapDistricts(filters, months) {
    const open = { ...filters, districtId: "all" };
    return data.districts.map((district, index) => {
        const figures = figuresFor(open, [index], months);
        return {
            id: district.id,
            name: district.name,
            workers: figures.workers,
            activeMemberships: figures.active,
            beneficiaries: Math.round(figures.beneficiaries),
            pendingApplications: Math.round(figures.pending),
            disbursed: figures.disbursedFund,
        };
    });
}
function actionsFor(filters, figures) {
    const activeBase = filters.membershipStatus === "expired" || filters.membershipStatus === "not-yet-active" ? 0 : figures.active;
    const renewalsDue = data.rules.renewalsDue * (full.workers === 0 ? 0 : activeBase / data.membershipStatuses[0].count);
    const beyondSla = filters.applicationStatus !== "all" && filters.applicationStatus !== "pending" ? 0 : data.rules.pendingBeyondSla * (full.pending === 0 ? 0 : figures.pending / full.pending);
    const incomplete = data.rules.incompleteDocs * (full.applications === 0 ? 0 : (filters.applicationStatus === "all" ? figures.statuses.pending + figures.statuses["under-verification"] + figures.statuses.approved + figures.statuses.disbursed + figures.statuses["payment-processing"] + figures.statuses.rejected : figures.applications) / full.applications);
    const coverageIds = filters.districtId === "all" ? data.rules.lowCoverageDistricts : data.rules.lowCoverageDistricts.filter((id) => id === filters.districtId);
    const lowSchemes = data.schemes.filter((scheme) => scheme.lowUtilization && (filters.scheme === "all" || scheme.id === filters.scheme));
    return [
        { id: "renewal-due", title: "Memberships due for renewal", description: "Active memberships inside the illustrative renewal window.", source: "KBOCW membership register", severity: "medium", countLabel: formatCount(renewalsDue) },
        { id: "beyond-sla", title: "Applications pending beyond SLA", description: `Applications open longer than the illustrative ${data.rules.slaDays}-day processing time.`, source: "KBOCW application file", severity: "high", countLabel: formatCount(beyondSla) },
        { id: "failed-payments", title: "Failed or returned payments", description: "Payment attempts that failed or were returned. They are not counted as disbursed.", source: "KBOCW disbursement ledger", severity: "high", countLabel: formatCount(figures.failed) },
        { id: "incomplete-docs", title: "Incomplete documentation", description: "Applications with a document still missing in this illustrative extract.", source: "KBOCW verification file", severity: "medium", countLabel: formatCount(incomplete) },
        { id: "low-coverage", title: "Districts with low registration coverage", description: "Districts in the lowest registration band of this illustrative extract.", source: "KBOCW membership register", severity: "medium", countLabel: formatCount(coverageIds.length) },
        { id: "low-utilization", title: "Schemes with low fund utilization", description: "Schemes where successful disbursement is under 70 percent of the allocation.", source: "KBOCW fund allocation file", severity: "low", countLabel: formatCount(lowSchemes.length) },
    ];
}
export function buildWelfareOverview(filters) {
    const months = monthIndexes(filters);
    const districts = districtIndexes(filters.districtId);
    const figures = figuresFor(filters, districts, months);
    const stageOrder = ["under-verification", "approved", "rejected", "pending", "payment-processing", "disbursed"];
    const stages = [
        { id: "received", label: "Received", displayValue: formatCount(Object.values(figures.statuses).reduce((sum, value) => sum + value, 0)) },
        ...stageOrder.map((id) => {
            const status = data.applicationStatuses.find((item) => item.id === id);
            return { id, label: status?.name ?? id, displayValue: formatCount(figures.statuses[id] ?? 0) };
        }),
    ];
    return {
        source: data.meta.source,
        lastRefreshed: data.meta.lastRefreshed,
        illustrativeNote: data.meta.illustrativeNote,
        boundaryNote: data.meta.boundaryNote,
        separationNote: data.meta.separationNote,
        stageNote: data.meta.stageNote,
        schemeNote: data.meta.schemeNote,
        scopeLabel: scopeLabel(filters),
        filters,
        kpis: kpisFor(filters, figures),
        stages,
        finance: {
            available: formatCrore(figures.available),
            allocated: formatCrore(figures.allocated),
            approved: formatCrore(figures.approvedFund),
            disbursed: formatCrore(figures.disbursedFund),
            remaining: formatCrore(Math.max(0, figures.available - figures.disbursedFund)),
            definition: "Remaining balance is available funds minus successful disbursement. Approved assistance is shown on its own and is not added to disbursement. Failed and returned payments stay out of disbursement, so they remain in the balance.",
        },
        charts: chartsFor(filters, districts, months, figures),
        districts: mapDistricts(filters, months),
        actions: actionsFor(filters, figures),
        registers: {
            workers: workerRegister(filters, months),
            applications: applicationRegister(filters, months),
            disbursements: disbursementRegister(filters, months),
        },
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
function chartTable(chart, title, summary) {
    const rows = (chart?.categories ?? []).map((category, index) => ({
        Category: category,
        ...Object.fromEntries((chart?.series ?? []).map((series) => [series.name, chart?.unit === "crore" ? formatCroreNumber(series.values[index] ?? 0) : formatCount(series.values[index] ?? 0)])),
    }));
    return {
        title,
        summary,
        note: recordNote,
        columns: rows[0] ? Object.keys(rows[0]).map((key) => ({ key, label: key, align: key === "Category" ? "left" : "right" })) : [],
        rows,
    };
}
export function buildWelfareDetail(request, filters) {
    const overview = buildWelfareOverview(filters);
    if (request.type === "kpi" || request.type === "chart" || request.type === "stage") {
        const chartId = request.type === "chart" ? request.chartId : request.type === "stage" ? "scheme-status" : request.kpiId === "workers" || request.kpiId === "active" || request.kpiId === "expired" ? "membership" : request.kpiId === "approved" || request.kpiId === "disbursed" ? "scheme-money" : request.kpiId === "failed" ? "utilization" : "scheme-people";
        const chart = overview.charts.find((item) => item.id === chartId);
        const kpi = request.type === "kpi" ? overview.kpis.find((item) => item.id === request.kpiId) : undefined;
        const stage = request.type === "stage" ? overview.stages.find((item) => item.id === request.stageId) : undefined;
        return chartTable(chart, kpi?.label ?? stage?.label ?? chart?.title ?? "Detail", kpi ? `${kpi.displayValue} · ${overview.scopeLabel}` : stage ? `${stage.displayValue} · ${overview.scopeLabel}` : chart?.description ?? "");
    }
    if (request.type === "exception") {
        const item = overview.actions.find((entry) => entry.id === request.exceptionId);
        return {
            title: item?.title ?? "Action",
            summary: `${item?.countLabel ?? "0"} · ${item?.description ?? ""}`,
            note: `${recordNote} Source reference: ${item?.source ?? "KBOCW Welfare Board"}.`,
            columns: [
                { key: "District", label: "District" },
                { key: "Note", label: "Note" },
            ],
            rows: (filters.districtId === "all" ? data.districts : data.districts.filter((district) => district.id === filters.districtId)).slice(0, 8).map((district) => ({
                District: district.name,
                Note: item?.source ?? "KBOCW Welfare Board",
            })),
        };
    }
    if (request.register === "workers") {
        const row = data.samples.workers.find((item) => item.id === request.id);
        if (!row)
            return fieldDetail("Record unavailable", "This illustrative row is outside the current extract.", []);
        const dependents = data.samples.dependents.filter((item) => item.workerId === row.workerId);
        return fieldDetail(row.workerId, row.displayName, [
            ["District", nameOf(data.districts, row.districtId)],
            ["Taluk", nameOf(data.taluks, row.talukId)],
            ["Occupation", nameOf(data.occupations, row.occupation)],
            ["Registration date", formatLongDate(row.registrationDate)],
            ["Membership expiry", formatLongDate(row.expiryDate)],
            ["Membership status", nameOf(data.membershipStatuses, row.membershipStatus)],
            ["Dependents linked", dependents.length === 0 ? "None in this extract" : dependents.map((item) => `${item.relationship}: ${item.displayName}`).join("; ")],
            ["Source reference", row.source],
            ["Holding system", "KBOCW Welfare Board"],
        ]);
    }
    if (request.register === "applications") {
        const row = data.samples.applications.find((item) => item.id === request.id);
        if (!row)
            return fieldDetail("Record unavailable", "This illustrative row is outside the current extract.", []);
        const history = data.samples.statusHistory.filter((item) => item.applicationId === row.applicationId);
        return fieldDetail(row.applicationId, nameOf(data.schemes, row.schemeId), [
            ["Worker", row.workerId],
            ["Scheme", `${row.schemeId.toUpperCase()} · ${nameOf(data.schemes, row.schemeId)}`],
            ["Application date", formatLongDate(row.applicationDate)],
            ["Current status", nameOf(data.applicationStatuses, row.status)],
            ["Verification", row.verificationStatus],
            ["Pending duration", `${row.pendingDays} days`],
            ["District", nameOf(data.districts, row.districtId)],
            ["Status history", history.map((item) => `${formatLongDate(item.eventDate)} ${item.status}`).join("; ")],
            ["Source reference", row.source],
            ["Holding system", "KBOCW Welfare Board"],
        ]);
    }
    const row = data.samples.disbursements.find((item) => item.id === request.id);
    if (!row)
        return fieldDetail("Record unavailable", "This illustrative row is outside the current extract.", []);
    return fieldDetail(row.transactionId, nameOf(data.schemes, row.schemeId), [
        ["Application", row.applicationId],
        ["Scheme", nameOf(data.schemes, row.schemeId)],
        ["Approved assistance", formatInr(row.approvedRupees)],
        ["Disbursed assistance", formatInr(row.disbursedRupees)],
        ["Transaction date", formatLongDate(row.transactionDate)],
        ["Payment status", nameOf(data.paymentStatuses, row.paymentStatus)],
        ["Failure reason", row.failureReason],
        ["Source reference", row.source],
        ["Holding system", "KBOCW Welfare Board"],
    ]);
}
