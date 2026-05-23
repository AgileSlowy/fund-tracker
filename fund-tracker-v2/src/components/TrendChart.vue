<template>
  <section class="panel chart-panel">
    <div class="panel-head trend-head">
      <h2>走势分析</h2>
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
import { formatMoney, formatSignedPercent, getValueClass } from "../utils/formatter";

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
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeChart);
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

  chart.value.setOption({
    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: { type: "line" },
      formatter: (params) => formatPerformanceTooltip(params)
    },
    grid: { left: 56, right: 18, top: 24, bottom: 42 },
    xAxis: {
      type: "category",
      data: dates,
      axisTick: { show: false },
      axisLabel: { color: "#858b96" }
    },
    yAxis: {
      type: "value",
      min: axisBounds.min,
      max: axisBounds.max,
      axisLabel: {
        color: "#858b96",
        formatter: (value) => `${Number(value).toFixed(2)}%`
      },
      splitLine: { lineStyle: { color: "#edf0f3" } }
    },
    series: [
      {
        name: "涨跌幅",
        type: "line",
        data,
        smooth: false,
        symbol: "none",
        lineStyle: { width: 3, color: "#1677ff" },
        itemStyle: { color: "#1677ff" }
      },
      tradeSeries("买入", getTradeMarks(records, "buy", baseNetValue), "#e64545"),
      tradeSeries("卖出", getTradeMarks(records, "sell", baseNetValue), "#1677ff")
    ]
  }, true);
}

function renderProfitChart() {
  const records = rangedRecords.value;
  const dates = records.map((record) => record.date);
  const data = records.map((record) => round(record.cumulativeProfit, 2));
  const axisBounds = getPaddedAxisBounds(data);

  chart.value.setOption({
    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: { type: "line" },
      formatter: (params) => formatProfitTooltip(params)
    },
    grid: { left: 56, right: 18, top: 24, bottom: 42 },
    xAxis: {
      type: "category",
      data: dates,
      axisTick: { show: false },
      axisLabel: { color: "#858b96" }
    },
    yAxis: {
      type: "value",
      min: axisBounds.min,
      max: axisBounds.max,
      axisLabel: {
        color: "#858b96",
        formatter: (value) => Number(value).toFixed(0)
      },
      splitLine: { lineStyle: { color: "#edf0f3" } }
    },
    series: [
      {
        name: "累计盈亏",
        type: "line",
        data,
        smooth: false,
        symbol: "emptyCircle",
        symbolSize: 8,
        lineStyle: { width: 3, color: "#e64545" },
        itemStyle: { color: "#e64545" }
      }
    ]
  }, true);
}

function formatPerformanceTooltip(params) {
  const mainPoint = params.find((item) => item.seriesName === "涨跌幅");
  const rows = params.map((item) => {
    if (item.seriesName === "涨跌幅") {
      return `${item.marker}涨跌幅：${Number(item.value).toFixed(2)}%`;
    }

    const record = item.data?.record;
    const amount = item.seriesName === "买入" ? record?.deposit : record?.withdraw;
    const value = Array.isArray(item.value) ? item.value[1] : 0;
    return `${item.marker}${item.seriesName}：${formatMoney(amount)} 元，${Number(value).toFixed(2)}%`;
  });

  return `时间：${mainPoint?.axisValue || params[0]?.axisValue || ""}<br>${rows.join("<br>")}`;
}

function formatProfitTooltip(params) {
  const point = params.find((item) => item.seriesName === "累计盈亏") || params[0];
  return [
    `时间：${point?.axisValue || ""}`,
    `${point?.marker || ""}累计盈亏：${Number(point?.value || 0).toFixed(2)} 元`
  ].join("<br>");
}

function getTradeMarks(records, type, baseNetValue) {
  return records
    .filter((record) => type === "buy" ? record.deposit > 0 : record.withdraw > 0)
    .map((record) => ({
      value: [record.date, round((safeDivide(record.netValue, baseNetValue) - 1) * 100, 2)],
      record
    }));
}

function tradeSeries(name, data, color) {
  return {
    name,
    type: "scatter",
    data,
    symbol: "circle",
    symbolSize: 13,
    z: 4,
    itemStyle: {
      color,
      borderColor: "#ffffff",
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
</script>
