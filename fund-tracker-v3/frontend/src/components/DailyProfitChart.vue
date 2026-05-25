<template>
  <section class="panel chart-panel detail-panel" :class="{ collapsed }">
    <div class="panel-head detail-head">
      <h2><span class="section-icon"><i class="ri-bar-chart-2-line"></i></span>收益明细</h2>
      <div class="history-tools">
        <label class="month-filter">
          <span>年月</span>
          <input v-model="month" type="month">
        </label>
        <button class="text-button" type="button" @click="month = getCurrentMonth()">本月</button>
        <button class="text-button" type="button" @click="month = ''">全部</button>
        <button class="text-button" type="button" @click="toggleCollapsed">{{ collapsed ? "展开" : "收起" }}</button>
      </div>
    </div>
    <div v-show="!collapsed" class="detail-content">
      <div ref="chartEl" class="chart"></div>
    </div>
  </section>
</template>

<script setup>
import * as echarts from "echarts";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  records: {
    type: Array,
    required: true
  }
});

const chartEl = ref(null);
const chart = ref(null);
const month = ref(getCurrentMonth());
const collapsed = ref(false);

const filteredRecords = computed(() => {
  if (!month.value) return props.records;
  return props.records.filter((record) => record.date.startsWith(month.value));
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

watch([() => props.records, month], renderChart, { deep: true });

function renderChart() {
  nextTick(() => {
    if (!chart.value) return;
    const theme = getChartTheme();

    chart.value.setOption({
      tooltip: {
        trigger: "axis",
        backgroundColor: theme.tooltipBg,
        borderColor: theme.border,
        borderWidth: 1,
        padding: [8, 10],
        textStyle: { color: theme.text, fontSize: 13 },
        extraCssText: `box-shadow: ${theme.tooltipShadow}; border-radius: 10px;`,
        valueFormatter: (value) => `${Number(value).toFixed(2)} 元`
      },
      grid: { left: 56, right: 18, top: 24, bottom: 42 },
      xAxis: {
        type: "category",
        data: filteredRecords.value.map((record) => record.date),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: theme.borderLight } },
        axisLabel: { color: theme.muted }
      },
      yAxis: {
        type: "value",
        axisLabel: { color: theme.muted },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: theme.splitLine, type: "dashed" } }
      },
      series: [
        {
          name: "当日收益",
          type: "bar",
          barMaxWidth: 32,
          data: filteredRecords.value.map((record) => ({
            value: round(record.dailyProfit, 2),
            itemStyle: { color: record.dailyProfit >= 0 ? theme.profit : theme.loss }
          }))
        }
      ]
    });
  });
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
  if (!collapsed.value) {
    nextTick(resizeChart);
  }
}

function round(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function resizeChart() {
  chart.value?.resize();
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getChartTheme() {
  const styles = getComputedStyle(document.documentElement);
  const isDark = document.documentElement.dataset.theme === "dark";
  return {
    profit: styles.getPropertyValue("--color-profit").trim() || "#ef4444",
    loss: styles.getPropertyValue("--color-loss").trim() || "#10b981",
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
