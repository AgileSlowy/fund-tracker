<template>
  <section class="panel chart-panel detail-panel" :class="{ collapsed }">
    <div class="panel-head detail-head">
      <h2>收益明细</h2>
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
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeChart);
  chart.value?.dispose();
});

watch([() => props.records, month], renderChart, { deep: true });

function renderChart() {
  nextTick(() => {
    if (!chart.value) return;

    chart.value.setOption({
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => `${Number(value).toFixed(2)} 元`
      },
      grid: { left: 56, right: 18, top: 24, bottom: 42 },
      xAxis: {
        type: "category",
        data: filteredRecords.value.map((record) => record.date),
        axisTick: { show: false },
        axisLabel: { color: "#858b96" }
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#858b96" },
        splitLine: { lineStyle: { color: "#edf0f3" } }
      },
      series: [
        {
          name: "当日收益",
          type: "bar",
          barMaxWidth: 34,
          data: filteredRecords.value.map((record) => ({
            value: round(record.dailyProfit, 2),
            itemStyle: { color: record.dailyProfit >= 0 ? "#e64545" : "#16a06b" }
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
</script>
