import { setThemedOption } from "@/theme/chartTheme";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MapChart } from "echarts/charts";
import { TooltipComponent, VisualMapComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef, useState } from "react";
import { loadKarnatakaMap } from "@/components/dashboard/KarnatakaMap";
import { formatCount } from "@/lib/format";
echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer]);
export function IntelligenceMap({ districts, selectedId, boundaryNote, onSelect, }) {
    const node = useRef(null);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);
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
        const max = Math.max(...districts.map((district) => district.projects), 1);
        setThemedOption(instance, {
            animation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            tooltip: {
                trigger: "item",
                formatter: (params) => {
                    const point = params;
                    if (!point.data?.name)
                        return "";
                    return `<strong>${point.data.name}</strong><br/>Projects identified: ${formatCount(point.data.projects ?? 0)}`;
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
                formatter: (value) => formatCount(value),
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
                    data: districts.map((district) => ({
                        ...district,
                        name: district.name,
                        value: selectedId === "all" || selectedId === district.id ? district.projects : null,
                        itemStyle: selectedId === "all" || selectedId === district.id
                            ? { borderColor: selectedId === district.id ? "var(--c-border-461220)" : "var(--c-border-ffffff)", borderWidth: selectedId === district.id ? 2 : 1 }
                            : { areaColor: "var(--c-map-area)", borderColor: "var(--c-border-ffffff)" },
                    })),
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
    return (_jsxs("section", { className: "min-w-0 overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-[color:var(--c-text-461220)]", children: "District-wise project coverage" }), _jsx("p", { className: "mt-1 text-sm leading-6 text-slate-600", children: "Colour shows projects identified in the selected dates. Select a district to filter the workspace. Select it again to clear the district." }), error ? _jsx("p", { className: "mt-6 text-sm text-red-700", children: error }) : _jsx("div", { ref: node, className: "mt-2 h-[360px] w-full min-w-0 sm:h-[460px]" }), _jsx("p", { className: "mt-2 text-sm text-slate-500", children: boundaryNote })] }));
}
