const department = (label, slug) => ({
    label,
    to: `/departments/${slug}`,
    implemented: false,
});
const intelligence = (label, slug) => ({
    label,
    to: `/intelligence/${slug}`,
    implemented: false,
});
export const NAV = [
    {
        label: "Executive",
        items: [{ label: "Secretary Dashboard", to: "/", implemented: true }],
    },
    {
        label: "Department Dashboards",
        items: [
            { ...department("Labour Commissionerate", "labour-commissionerate"), implemented: true },
            { ...department("KBOCW Welfare Board", "kbocw-welfare-board"), implemented: true },
            { ...department("Factories & Boilers", "factories-boilers"), implemented: true },
            { ...department("Gig Workers Welfare Board", "gig-workers-welfare-board"), implemented: true },
            { ...department("Unorganised Workers Social Security Board", "ksuwssb"), implemented: true, short: "Unorganised Workers Board" },
            department("Construction & Infrastructure", "construction-infrastructure"),
            department("Cess & Financial", "cess-financial"),
            department("Health & Social Security", "health-social-security"),
            department("ESIS", "esis"),
            department("Groundwater & Environmental", "groundwater-environmental"),
            department("Skill Development", "skill-development"),
        ],
    },
    {
        label: "Cross-Department Intelligence",
        items: [
            intelligence("Department Relationship Map", "relationship-map"),
            intelligence("Construction Project Explorer", "project-explorer"),
            intelligence("Construction-to-Cess Lifecycle", "cess-lifecycle"),
            { ...intelligence("Cross-Department Intelligence", "cross-analytics"), implemented: true },
        ],
    },
    {
        label: "Other",
        items: [
            { label: "Interactive Analytics", to: "/analytics", implemented: true },
            { label: "Data Integration Monitoring", to: "/integration", implemented: false },
        ],
    },
];
export function findNavItem(pathname) {
    const path = pathname.replace(/\/$/, "") || "/";
    for (const group of NAV) {
        for (const item of group.items) {
            if (item.to === path)
                return { group, item };
        }
    }
    return null;
}
