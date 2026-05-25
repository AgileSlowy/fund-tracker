<template>
  <section>
    <div class="summary-grid">
      <article class="summary-card" v-for="card in cards" :key="card.label">
        <div class="summary-icon"><i :class="card.icon"></i></div>
        <span>{{ card.label }}</span>
        <strong :class="card.className">{{ card.value }}</strong>
        <small>{{ card.unit }}</small>
      </article>
    </div>
    <article class="latest-rate-strip">
      <div class="strip-icon"><i class="ri-arrow-up-down-line"></i></div>
      <span>最新交易日涨跌幅</span>
      <strong :class="getValueClass(summary.latestRate)">{{ formatSignedPercent(summary.latestRate * 100) }}</strong>
      <small>{{ summary.latestDate || "暂无记录" }}</small>
    </article>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { formatMoney, formatSignedMoney, formatSignedPercent, getValueClass } from "../utils/formatter";

const props = defineProps({
  summary: {
    type: Object,
    required: true
  }
});

const cards = computed(() => [
  { icon: "ri-wallet-3-line", label: "当前持仓金额", value: formatMoney(props.summary.currentAmount), unit: "元", className: "neutral" },
  { icon: "ri-bank-card-line", label: "累计投入金额", value: formatMoney(props.summary.totalInvested), unit: "元", className: "neutral" },
  { icon: "ri-line-chart-line", label: "累计盈亏", value: formatSignedMoney(props.summary.cumulativeProfit), unit: "元", className: getValueClass(props.summary.cumulativeProfit) },
  { icon: "ri-percent-line", label: "累计收益率", value: formatSignedPercent(props.summary.cumulativeReturn * 100), unit: "收益表现", className: getValueClass(props.summary.cumulativeReturn) },
  { icon: "ri-calendar-check-line", label: "今日收益", value: formatSignedMoney(props.summary.todayProfit), unit: "元", className: getValueClass(props.summary.todayProfit) }
]);
</script>
