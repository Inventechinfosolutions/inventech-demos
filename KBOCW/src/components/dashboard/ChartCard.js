import { setThemedOption } from "@/theme/chartTheme";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";
import { formatCount, formatCroreNumber } from "@/lib/format";
echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);
function formatUnit(unit, value) {
    if (unit === "crore")
        return formatCroreNumber(value);
    if (unit === "lakh")
        return `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} lakh`;
    return formatCount(value);
}
export function ChartCard({ chart, onSelect, className = "", }) {
    const node = useRef(null);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    useEffect(() => {
        if (!node.current || chart.categories.length === 0)
            return;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const instance = echarts.init(node.current);
        const horizontal = chart.kind === "horizontal";
        // Reserve room for every legend row so wrapped legends never touch the axes.
        const legendEntries = (chart.kind === "line" ? 0 : chart.series.length) + (chart.line ? 1 : 0) || 1;
        const perRow = Math.max(1, Math.floor((node.current.clientWidth - 16) / 200));
        const legendTop = 16 + Math.ceil(legendEntries / perRow) * 24 + (chart.line ? 12 : 0);
        const categoryAxis = {
            type: "category",
            data: chart.categories,
            axisLabel: { color: "var(--c-text-86646d)", fontSize: 12 },
            axisLine: { lineStyle: { color: "var(--c-border-fed9c8)" } },
        };
        const valueAxis = {
            type: "value",
            axisLabel: {
                color: "var(--c-series-9d8189)",
                fontSize: 12,
                formatter: (value) => (chart.unit === "crore" ? `${value}` : formatCount(value)),
            },
            splitLine: { lineStyle: { color: "var(--c-border-ffeae1)" } },
        };
        const stacked = chart.kind === "stacked-line" || chart.stack === true;
        const barSeries = chart.series.map((series) => ({
            name: series.name,
            type: "bar",
            stack: stacked ? "status" : undefined,
            data: series.values,
            itemStyle: { color: series.color },
            barMaxWidth: horizontal ? 18 : 14,
            cursor: "pointer",
        }));
        const lineSeries = chart.line
            ? [{
                    name: chart.line.name,
                    type: "line",
                    yAxisIndex: 1,
                    data: chart.line.values,
                    itemStyle: { color: chart.line.color },
                    lineStyle: { width: 2, color: chart.line.color },
                    symbolSize: 7,
                    cursor: "pointer",
                }]
            : chart.kind === "line"
                ? [{
                        name: chart.series[0]?.name,
                        type: "line",
                        data: chart.series[0]?.values ?? [],
                        itemStyle: { color: chart.series[0]?.color },
                        lineStyle: { width: 2, color: chart.series[0]?.color },
                        symbolSize: 7,
                        cursor: "pointer",
                    }]
                : [];
        setThemedOption(instance, {
            animation: !reduceMotion,
            textStyle: { fontFamily: "Inter, sans-serif" },
            tooltip: {
                trigger: "axis",
                formatter: (params) => {
                    const points = (Array.isArray(params) ? params : [params]);
                    const title = points[0]?.name ?? "";
                    const lines = points.map((point) => {
                        const unit = point.seriesName === chart.line?.name ? "lakh" : chart.unit;
                        return `${point.marker ?? ""} ${point.seriesName}: ${formatUnit(unit, Number(point.value ?? 0))}`;
                    });
                    return [title, ...lines].join("<br/>");
                },
            },
            legend: { top: 0, itemGap: 14, itemWidth: 16, itemHeight: 10, textStyle: { color: "var(--c-text-461220)", fontSize: 12 } },
            grid: { left: 16, right: chart.line ? 48 : 16, top: legendTop, bottom: 8, containLabel: true },
            xAxis: horizontal ? valueAxis : categoryAxis,
            yAxis: chart.line
                ? [
                    valueAxis,
                    {
                        type: "value",
                        name: "lakh",
                        nameTextStyle: { color: "var(--c-text-9d8189)", fontSize: 12 },
                        axisLabel: { color: "var(--c-text-86646d)", fontSize: 12 },
                        splitLine: { show: false },
                    },
                ]
                : horizontal
                    ? { ...categoryAxis, inverse: true }
                    : valueAxis,
            series: chart.kind === "line" ? lineSeries : [...barSeries, ...lineSeries],
        });
        const onClick = (params) => {
            const point = params;
            if (point.componentType !== "series")
                return;
            onSelectRef.current(point.name, point.seriesName);
        };
        instance.on("click", onClick);
        const observer = new ResizeObserver(() => instance.resize());
        observer.observe(node.current);
        return () => {
            observer.disconnect();
            instance.dispose();
        };
    }, [chart]);
    return (_jsxs("section", { className: `min-w-0 max-w-full overflow-hidden rounded-2xl border border-[color:var(--c-border-fed9c8)] bg-[color:var(--c-bg-ffffff)] p-5 shadow-[0_12px_40px_rgb(var(--c-shadow-rgb)/0.05)] ${className}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight text-[color:var(--c-text-461220)]", children: chart.title })] }), _jsx("button", { type: "button", className: "shrink-0 text-sm font-semibold text-[color:var(--c-text-8c2f39)]", onClick: () => onSelect(), children: "View breakdown" })] }), chart.categories.length === 0 ? (_jsx("p", { className: "mt-8 text-sm text-slate-500", children: chart.emptyLabel ?? "No months fall in the selected dates." })) : (_jsx("div", { ref: node, className: "mt-2 w-full min-w-0", style: { height: chart.height ?? 320 } }))] }));
}
