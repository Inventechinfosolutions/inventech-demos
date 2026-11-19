function fileBase(overview) {
    const district = overview.filters.districtId === "all" ? "all-districts" : overview.filters.districtId;
    const department = overview.filters.departmentId === "all" ? "all-departments" : overview.filters.departmentId;
    return `KBOCW-Cross-Department-Intelligence-${overview.filters.financialYear}-${district}-${department}`;
}
function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
export async function exportIntelligenceExcel(overview) {
    const XLSX = await import("xlsx");
    const notes = [
        ["Cross-Department Intelligence"],
        [overview.illustrativeNote],
        [overview.stageNote],
        [overview.projectKpiNote],
        ["Scope", overview.scopeLabel],
        ["Source", overview.source],
        ["Last synchronization", overview.lastRefreshed],
    ];
    const kpis = [["Indicator", "Value", "Note"], ...overview.kpis.map((kpi) => [kpi.label, kpi.displayValue, kpi.hint])];
    const stages = [
        ["Cess stage", "Amount"],
        ...overview.cessStages.map((stage) => [stage.label, stage.displayValue]),
        ["Collected but not remitted", overview.collectedNotRemitted ?? "Not calculated in this view"],
        ["Remitted but not credited", overview.remittedNotCredited ?? "Not calculated in this view"],
    ];
    const exceptions = [
        ["Exception ID", "Type", "Related entity", "District", "Source departments", "Priority", "Matching status", "Assigned department", "Investigation status", "Created", "Action"],
        ...overview.exceptions.map((row) => [row.id, row.type, row.entity, row.district, row.sources, row.priority, row.matching, row.assigned, row.investigation, row.created, row.action]),
    ];
    const book = XLSX.utils.book_new();
    const add = (name, rows) => {
        XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), name);
    };
    add("Notes", notes);
    add("Indicators", kpis);
    add("Cess stages", stages);
    add("Exceptions", exceptions);
    const output = XLSX.write(book, { bookType: "xlsx", type: "array" });
    download(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${fileBase(overview)}.xlsx`);
}
export async function exportIntelligencePdf(overview) {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const margin = 40;
    doc.setFontSize(16);
    doc.text("Cross-Department Intelligence", margin, 42);
    doc.setFontSize(10);
    const intro = doc.splitTextToSize(`${overview.illustrativeNote} ${overview.stageNote}`, 760);
    doc.text(intro, margin, 64);
    doc.text(`Scope: ${overview.scopeLabel}`, margin, 108);
    doc.text(`Source: ${overview.source}. Last synchronization: ${overview.lastRefreshed}.`, margin, 124);
    autoTable(doc, {
        startY: 140,
        head: [["Indicator", "Value"]],
        body: overview.kpis.map((kpi) => [kpi.label, kpi.displayValue]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [67, 56, 202] },
        margin: { left: margin, right: margin },
    });
    autoTable(doc, {
        head: [["Cess stage", "Amount"]],
        body: [
            ...overview.cessStages.map((stage) => [stage.label, stage.displayValue]),
            ["Collected but not remitted", overview.collectedNotRemitted ?? "Not calculated in this view"],
            ["Remitted but not credited", overview.remittedNotCredited ?? "Not calculated in this view"],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [67, 56, 202] },
        margin: { left: margin, right: margin },
    });
    autoTable(doc, {
        head: [["Exception", "Type", "District", "Sources", "Priority", "Status"]],
        body: overview.exceptions.map((row) => [row.id, row.type, row.district, row.sources, row.priority, row.investigation]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [67, 56, 202] },
        margin: { left: margin, right: margin },
    });
    doc.save(`${fileBase(overview)}.pdf`);
}
