<template>
  <section class="panel chart-panel">
    <div class="panel-head trend-head">
      <h2><span class="section-icon"><i class="ri-line-chart-line"></i></span>走势分析</h2>
      <div class="trend-controls">
        <div class="chart-switch">
          <button :class="{ active: chartType === 'performance' }" type="button" @click="chartType = 'performance'">业绩走势</button>
          <button :class="{ active: chartType === 'profit' }" type="button" @click="chartType = 'profit'">累计盈亏</button>
        </div>
        <div class="range-tabs">
          <button
            v-for="item in ranges"
            :key="item.value"
            :class="{ active: activeRange === item.value }"
            type="button"
            @click="activeRange = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>
    <div ref="chartEl" class="chart"></div>
    <div v-if="chartType === 'performance'" class="trend-meta">
      <strong :class="getValueClass(rangeChangePercent)">区间整体涨跌幅：{{ formatSignedPercent(rangeChangePercent) }}</strong>
      <div class="trade-legend">
        <span><i class="legend-dot buy"></i>:买入</span>
        <span><i class="legend-dot sell"></i>:卖出</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import * as echarts from "echarts";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { filterRecordsByRange } from "../utils/calculator";
import { formatSignedPercent, getValueClass } from "../utils/formatter";

const props = defineProps({
  records: {
    type: Array,
    required: true
  }
});

const chartEl = ref(null);
const chart = ref(null);
const chartType = ref("performance");
const activeRange = ref("week");

const ranges = [
  { label: "近1周", value: "week" },
  { label: "近1月", value: "month" },
  { label: "近3月", value: "threeMonths" },
  { label: "今年来", value: "year" },
  { label: "全部", value: "all" }
];

const rangedRecords = computed(() => filterRecordsByRange(props.records, activeRange.value));
const rangeChangePercent = computed(() => {
  const records = rangedRecords.value;
  if (records.length === 0) return 0;

  const baseNetValue = records[0].netValue || 1;
  const latestNetValue = records.at(-1)?.netValue || baseNetValue;
  return round((safeDivide(latestNetValue, baseNetValue) - 1) * 100, 2);
});

onMounted(() => {
  chart.value = echarts.init(chartEl.value);
  renderChart();
  window.addEventListener("resize", resizeChart);
  window.addEventListener("fund-theme-change", renderChart);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeChart);
  window.removeEventListener("fund-theme-change", renderChart);
  chart.value?.dispose();
});

watch([() => props.records, chartType, activeRange], renderChart, { deep: true });

function renderChart() {
  nextTick(() => {
    if (!chart.value) return;

    if (chartType.value === "performance") {
      renderPerformanceChart();
    } else {
      renderProfitChart();
    }
  });
}

function renderPerformanceChart() {
  const records = rangedRecords.value;
  const dates = records.map((record) => record.date);
  const baseNetValue = records[0]?.netValue || 1;
  const data = records.map((record) => round((safeDivide(record.netValue, baseNetValue) - 1) * 100, 2));
  const axisBounds = getPaddedAxisBounds(data);
  const theme = getChartTheme();

  chart.value.setOption({
    tooltip: {
      trigger: "item",
      confine: true,
      backgroundColor: theme.tooltipBg,
      borderColor: theme.border,
      borderWidth: 1,
      padding: [8, 10],
      textStyle: { color: theme.text, fontSize: 13 },
      extraCssText: `box-shadow: ${theme.tooltipShadow}; border-radius: 10px;`,
      position: getTooltipPosition,
      formatter: (params) => formatPerformanceTooltip(params)
    },
    grid: { left: 56, right: 18, top: 24, bottom: 42 },
    xAxis: {
      type: "category",
      data: dates,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.borderLight } },
      axisLabel: { color: theme.muted }
    },
    yAxis: {
      type: "value",
      min: axisBounds.min,
      max: axisBounds.max,
      axisLabel: {
        color: theme.muted,
        formatter: (value) => `${Number(value).toFixed(2)}%`
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: theme.splitLine, type: "dashed" } }
    },
    series: [
      {
        name: "涨跌幅",
        type: "line",
        data,
        smooth: false,
        symbol: "emptyCircle",
        symbolSize: 8,
        showSymbol: true,
        lineStyle: { width: 3, color: theme.primary },
        itemStyle: { color: theme.primary },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59, 130, 246, 0.16)" },
              { offset: 1, color: "rgba(59, 130, 246, 0.02)" }
            ]
          }
        }
      },
      tradeSeries("买入", getTradeMarks(records, "buy", baseNetValue), theme.profit, theme.card),
      tradeSeries("卖出", getTradeMarks(records, "sell", baseNetValue), theme.primary, theme.card)
    ]
  }, true);
}

function renderProfitChart() {
  const records = rangedRecords.value;
  const dates = records.map((record) => record.date);
  const data = records.map((record) => round(record.cumulativeProfit, 2));
  const axisBounds = getPaddedAxisBounds(data);
  const theme = getChartTheme();

  chart.value.setOption({
    tooltip: {
      trigger: "item",
      confine: true,
      backgroundColor: theme.tooltipBg,
      borderColor: theme.border,
      borderWidth: 1,
      padding: [8, 10],
      textStyle: { color: theme.text, fontSize: 13 },
      extraCssText: `box-shadow: ${theme.tooltipShadow}; border-radius: 10px;`,
      position: getTooltipPosition,
      formatter: (params) => formatProfitTooltip(params)
    },
    grid: { left: 56, right: 18, top: 24, bottom: 42 },
    xAxis: {
      type: "category",
      data: dates,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.borderLight } },
      axisLabel: { color: theme.muted }
    },
    yAxis: {
      type: "value",
      min: axisBounds.min,
      max: axisBounds.max,
      axisLabel: {
        color: theme.muted,
        formatter: (value) => Number(value).toFixed(0)
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: theme.splitLine, type: "dashed" } }
    },
    series: [
      {
        name: "累计盈亏",
        type: "line",
        data,
        smooth: false,
        symbol: "emptyCircle",
        symbolSize: 8,
        showSymbol: true,
        lineStyle: { width: 3, color: theme.profit },
        itemStyle: { color: theme.profit },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(239, 68, 68, 0.13)" },
              { offset: 1, color: "rgba(239, 68, 68, 0.02)" }
            ]
          }
        }
      }
    ]
  }, true);
}

function formatPerformanceTooltip(params) {
  const point = Array.isArray(params)
    ? params.find((item) => item.seriesName === "涨跌幅") || params[0]
    : params;
  const value = Array.isArray(point.value) ? point.value[1] : point.value;
  return [
    formatDisplayDate(point.axisValue || point.name || ""),
    `${Number(value || 0).toFixed(2)}%`
  ].join("<br>");
}

function formatProfitTooltip(params) {
  const point = Array.isArray(params)
    ? params.find((item) => item.seriesName === "累计盈亏") || params[0]
    : params;
  return [
    formatDisplayDate(point.axisValue || point.name || ""),
    `${Number(point.value || 0).toFixed(2)} 元`
  ].join("<br>");
}

function formatDisplayDate(dateString) {
  const [year, month, day] = String(dateString).split("-");
  if (!year || !month || !day) return dateString;
  return `${year}-${Number(month)}-${Number(day)}`;
}

function getTooltipPosition(point, params, dom, rect, size) {
  const viewWidth = size.viewSize[0];
  const viewHeight = size.viewSize[1];
  const boxWidth = size.contentSize[0];
  const boxHeight = size.contentSize[1];
  const x = Math.min(point[0] + 12, viewWidth - boxWidth - 8);
  const y = Math.max(Math.min(point[1] - boxHeight - 12, viewHeight - boxHeight - 8), 8);
  return [x, y];
}

function getTradeMarks(records, type, baseNetValue) {
  return records
    .filter((record) => type === "buy" ? record.deposit > 0 : record.withdraw > 0)
    .map((record) => ({
      value: [record.date, round((safeDivide(record.netValue, baseNetValue) - 1) * 100, 2)],
      record
    }));
}

function tradeSeries(name, data, color, borderColor) {
  return {
    name,
    type: "scatter",
    data,
    symbol: "circle",
    symbolSize: 13,
    z: 4,
    itemStyle: {
      color,
      borderColor,
      borderWidth: 2
    },
    label: { show: false }
  };
}

function getPaddedAxisBounds(values) {
  if (values.length === 0) return { min: -1, max: 1 };
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const padding = range === 0 ? Math.max(Math.abs(maxValue) * 0.1, 0.5) : range * 0.12;
  return { min: round(minValue - padding, 2), max: round(maxValue + padding, 2) };
}

function safeDivide(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function round(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function resizeChart() {
  chart.value?.resize();
}

function getChartTheme() {
  const styles = getComputedStyle(document.documentElement);
  const isDark = document.documentElement.dataset.theme === "dark";
  return {
    primary: styles.getPropertyValue("--color-primary").trim() || "#3b82f6",
    profit: styles.getPropertyValue("--color-profit").trim() || "#ef4444",
    card: styles.getPropertyValue("--color-card").trim() || "#ffffff",
    text: styles.getPropertyValue("--color-text-primary").trim() || "#111827",
    muted: styles.getPropertyValue("--color-text-secondary").trim() || "#6b7280",
    border: styles.getPropertyValue("--color-border").trim() || "#e5e7eb",
    borderLight: styles.getPropertyValue("--color-border-light").trim() || "#eef1f5",
    splitLine: isDark ? "#243142" : "#e8edf5",
    tooltipBg: isDark ? "#111827" : "#ffffff",
    tooltipShadow: isDark ? "0 10px 26px rgba(0, 0, 0, 0.32)" : "0 8px 24px rgba(15, 23, 42, 0.12)"
  };
}
</script>
