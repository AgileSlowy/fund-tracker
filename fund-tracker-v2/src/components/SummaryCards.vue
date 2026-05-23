<template>
  <section class="summary-grid">
    <article class="summary-card primary">
      <span>当前持仓金额</span>
      <strong>{{ formatMoney(summary.currentAmount) }}</strong>
      <small>元</small>
    </article>
    <article class="summary-card">
      <span>累计投入金额</span>
      <strong>{{ formatMoney(summary.totalInvested) }}</strong>
      <small>元</small>
    </article>
    <article class="summary-card">
      <span>累计盈亏</span>
      <strong :class="getValueClass(summary.cumulativeProfit)">{{ formatSignedMoney(summary.cumulativeProfit) }}</strong>
      <small>元</small>
    </article>
    <article class="summary-card">
      <span>累计收益率</span>
      <strong :class="getValueClass(summary.cumulativeReturn)">{{ formatSignedPercent(summary.cumulativeReturn * 100) }}</strong>
      <small>收益表现</small>
    </article>
    <article class="summary-card">
      <span>今日收益</span>
      <strong :class="getValueClass(summary.todayProfit)">{{ formatSignedMoney(summary.todayProfit) }}</strong>
      <small>元</small>
    </article>
    <article class="summary-card">
      <span>最新交易日涨跌幅</span>
      <strong :class="getValueClass(summary.latestRate)">{{ formatSignedPercent(summary.latestRate * 100) }}</strong>
      <small>{{ summary.latestDate || "暂无记录" }}</small>
    </article>
  </section>
</template>

<script setup>
import { formatMoney, formatSignedMoney, formatSignedPercent, getValueClass } from "../utils/formatter";

defineProps({
  summary: {
    type: Object,
    required: true
  }
});
</script>
