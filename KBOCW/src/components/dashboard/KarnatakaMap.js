import { setThemedOption } from "@/theme/chartTheme";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MapChart } from "echarts/charts";
import { TooltipComponent, VisualMapComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef, useState } from "react";
import { formatCount, formatCrore, formatLakh } from "@/lib/format";
echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer]);
let mapReady = null;
export function loadKarnatakaMap() {
    return ensureMap();
}
function ensureMap() {
    if (!mapReady) {
        mapReady = fetch(`${import.meta.env.BASE_URL}geo/karnataka-districts.geojson`)
            .then((response) => {
            if (!response.ok)
                throw new Error("The district map could not be loaded.");
            return response.json();
        })
            .then((geo) => {
            echarts.registerMap("karnataka", geo);
        });
    }
    return mapReady;
}
export function KarnatakaMap({ districts, selectedId, boundaryNote, onSelect, }) {
    const node = useRef(null);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        ensureMap()
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
        const max = Math.max(...districts.map((district) => district.projects), 1);
        const seriesData = districts.map((district) => {
            const active = selectedId === "all" || selectedId === district.id;
            return {
                ...district,
                name: district.name,
                value: active ? district.projects : null,
                itemStyle: active ? { borderColor: selectedId === district.id ? "var(--c-border-461220)" : "var(--c-border-ffffff)", borderWidth: selectedId === district.id ? 2 : 1 } : { areaColor: "var(--c-map-area)", borderColor: "var(--c-border-ffffff)" },
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
                        `Projects: ${formatCount(district.projects)}`,
                        `Registered workers: ${formatLakh(district.workers)}`,
                        `Cess assessed: ${formatCrore(district.cessAssessed)}`,
                        `Cess collected: ${formatCrore(district.cessCollected)}`,
                        `Cess remitted: ${formatCrore(district.cessRemitted)}`,
                        `Beneficiaries: ${formatLakh(district.beneficiaries)}`,
                        `Pending applications: ${formatCount(district.pendingApplications)}`,
                        "Cess stages are shown separately.",
                    ].join("<br/>");
                },
            },
            visualMap: {
                min: 0,
                max,
                text: ["More projects", "Fewer"],
                calculable: false,
                inRange: { color: ["var(--c-map-low)", "var(--c-bg-8c2f39)"] },
                left: 8,
                bottom: 8,
                textStyle: { color: "var(--c-text-744d57)", fontSize: 12 },
            },
            series: [
                {
                    type: "map",
                    map: "karnataka",
                    roam: false,
                    layoutCenter: ["50%", "48%"],
                    layoutSize: "115%",
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
    }, [districts, ready, selectedId]);
    return (_jsxs("section", { className: "flex h-full min-h-[460px] min-w-0 sm:min-h-[560px] flex-col overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-5 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)] xl:min-h-0", children: [_jsx("h2", { className: "text-base font-semibold tracking-tight text-[color:var(--c-text-461220)]", children: "District picture" }), _jsx("p", { className: "mt-1 text-sm leading-5 text-slate-500", children: "Colour shows construction projects. Select a district to filter. Select it again to clear." }), error ? _jsx("p", { className: "mt-6 text-sm text-red-700", children: error }) : _jsx("div", { ref: node, className: "mt-3 min-h-[340px] w-full min-w-0 flex-1 sm:min-h-[420px]" }), _jsx("p", { className: "mt-2 text-xs leading-5 text-slate-400", children: boundaryNote })] }));
}
