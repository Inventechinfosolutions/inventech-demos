import { setThemedOption } from "@/theme/chartTheme";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MapChart } from "echarts/charts";
import { TooltipComponent, VisualMapComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef, useState } from "react";
import { loadKarnatakaMap } from "@/components/dashboard/KarnatakaMap";
import { formatCount, formatCrore } from "@/lib/format";
echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer]);
const metrics = [
    { id: "workers", label: "Registered workers" },
    { id: "activeMemberships", label: "Active memberships" },
    { id: "beneficiaries", label: "Welfare beneficiaries" },
    { id: "pendingApplications", label: "Pending applications" },
    { id: "disbursed", label: "Disbursed assistance" },
];
function metricValue(district, metric) {
    if (metric === "disbursed")
        return district.disbursed / 10000000;
    return district[metric];
}
export function WelfareMap({ districts, selectedId, metric, boundaryNote, onMetric, onSelect, }) {
    const node = useRef(null);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);
    const active = metrics.find((item) => item.id === metric) ?? metrics[0];
    useEffect(() => {
        let cancelled = false;
        loadKarnatakaMap()
            .then(() => {
            if (!cancelled)
                setReady(true);
        })
            .catch(() => {
            if (!cancelled)
                setError("The district map could not be loaded.");
        });
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        if (!ready || !node.current)
            return;
        const instance = echarts.init(node.current);
        const max = Math.max(...districts.map((district) => metricValue(district, metric)), 1);
        const seriesData = districts.map((district) => {
            const selected = selectedId === "all" || selectedId === district.id;
            return {
                ...district,
                name: district.name,
                value: selected ? metricValue(district, metric) : null,
                itemStyle: selected
                    ? { borderColor: selectedId === district.id ? "var(--c-border-461220)" : "var(--c-border-ffffff)", borderWidth: selectedId === district.id ? 2 : 1 }
                    : { areaColor: "var(--c-map-area)", borderColor: "var(--c-border-ffffff)" },
            };
        });
        setThemedOption(instance, {
            animation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            tooltip: {
                trigger: "item",
                formatter: (params) => {
                    const point = params;
                    const district = point.data;
                    if (!district?.name)
                        return "";
                    return [
                        `<strong>${district.name}</strong>`,
                        `Registered workers: ${formatCount(district.workers)}`,
                        `Active memberships: ${formatCount(district.activeMemberships)}`,
                        `Welfare beneficiaries: ${formatCount(district.beneficiaries)}`,
                        `Pending applications: ${formatCount(district.pendingApplications)}`,
                        `Disbursed assistance: ${formatCrore(district.disbursed)}`,
                    ].join("<br/>");
                },
            },
            visualMap: {
                min: 0,
                max,
                text: ["Higher", "Lower"],
                calculable: false,
                inRange: { color: ["var(--c-map-low)", "var(--c-bg-8c2f39)"] },
                left: 8,
                bottom: 8,
                textStyle: { color: "var(--c-text-744d57)", fontSize: 12 },
                formatter: (value) => (metric === "disbursed" ? formatCrore(value * 10000000) : formatCount(value)),
            },
            series: [
                {
                    type: "map",
                    map: "karnataka",
                    roam: false,
                    layoutCenter: ["50%", "46%"],
                    layoutSize: "112%",
                    selectedMode: false,
                    label: { show: false },
                    emphasis: { label: { show: false } },
                    data: seriesData,
                },
            ],
        });
        const onClick = (params) => {
            const point = params;
            const district = districts.find((item) => item.name === point.name);
            if (district)
                onSelectRef.current(district.id);
        };
        instance.on("click", onClick);
        const observer = new ResizeObserver(() => instance.resize());
        observer.observe(node.current);
        return () => {
            observer.disconnect();
            instance.dispose();
        };
    }, [districts, metric, ready, selectedId]);
    return (_jsxs("section", { className: "min-w-0 overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4", children: [_jsx("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between", children: _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-[color:var(--c-text-461220)]", children: "District coverage" }), _jsxs("p", { className: "mt-1 text-sm leading-6 text-slate-600", children: ["Colour shows ", active.label.toLowerCase(), ". Select a district to update the dashboard. Select it again to clear the district."] })] }) }), _jsx("div", { className: "mt-3 flex flex-wrap gap-2", role: "group", "aria-label": "Map layer", children: metrics.map((item) => (_jsx("button", { type: "button", "aria-pressed": item.id === metric, className: `rounded-full px-3 py-1.5 text-sm font-semibold ${item.id === metric ? "bg-[color:var(--c-bg-461220)] text-[color:var(--c-text-ffeee7)]" : "bg-[color:var(--c-bg-ffeee7)] text-[color:var(--c-text-461220)]"}`, onClick: () => onMetric(item.id), children: item.label }, item.id))) }), error ? _jsx("p", { className: "mt-6 text-sm text-red-700", children: error }) : _jsx("div", { ref: node, className: "mt-2 h-[360px] w-full min-w-0 sm:h-[460px]" }), _jsx("p", { className: "mt-2 text-sm text-slate-500", children: boundaryNote })] }));
}
