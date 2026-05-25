<template>
  <section class="panel history-panel" :class="{ collapsed }">
    <div class="panel-head history-head">
      <div>
        <h2><span class="section-icon"><i class="ri-file-list-3-line"></i></span>历史记录</h2>
        <span class="record-count">{{ filteredRecords.length }} / {{ records.length }} 条</span>
      </div>
      <div class="history-tools">
        <label class="month-filter">
          <span>年月</span>
          <input v-model="month" type="month" @change="recentOnly = false">
        </label>
        <button class="text-button" type="button" @click="showRecent">最近5天</button>
        <button class="text-button" type="button" @click="showAll">全部</button>
        <button class="text-button" type="button" @click="collapsed = !collapsed">{{ collapsed ? "展开" : "收起" }}</button>
      </div>
    </div>
    <div v-show="!collapsed" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>贾-当日涨跌幅</th>
            <th>当日涨跌幅</th>
            <th>追加金额</th>
            <th>赎回金额</th>
            <th>当日收益</th>
            <th>当前持仓金额</th>
            <th>累计盈亏</th>
            <th>累计收益率</th>
            <th>备注</th>
            <th v-if="canEdit">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredRecords.length === 0">
            <td :colspan="canEdit ? 11 : 10" class="empty-cell">{{ emptyText }}</td>
          </tr>
          <tr v-for="record in reversedRecords" :key="record.id">
            <td>{{ record.date }}</td>
            <td :class="getValueClass(record.dailyRate)">{{ formatSignedPercentFixed(record.dailyRate * 200, 2) }}</td>
            <td :class="getValueClass(record.dailyRate)">{{ formatSignedPercentFixed(record.dailyRate * 100, 3) }}</td>
            <td>{{ formatMoney(record.deposit) }}</td>
            <td>{{ formatMoney(record.withdraw) }}</td>
            <td :class="getValueClass(record.dailyProfit)">{{ formatSignedMoney(record.dailyProfit) }}</td>
            <td>{{ formatMoney(record.currentAmount) }}</td>
            <td :class="getValueClass(record.cumulativeProfit)">{{ formatSignedMoney(record.cumulativeProfit) }}</td>
            <td :class="getValueClass(record.cumulativeReturn)">{{ formatSignedPercent(record.cumulativeReturn * 100) }}</td>
            <td class="note-cell" :title="record.note">{{ record.note || "-" }}</td>
            <td v-if="canEdit">
              <div class="action-cell">
                <button type="button" @click="$emit('edit', record)">编辑</button>
                <button class="delete" type="button" @click="$emit('delete', record)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import { formatMoney, formatSignedMoney, formatSignedPercent, formatSignedPercentFixed, getValueClass } from "../utils/formatter";

const props = defineProps({
  records: {
    type: Array,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: true
  }
});

defineEmits(["edit", "delete"]);

const month = ref("");
const recentOnly = ref(true);
const collapsed = ref(false);

const filteredRecords = computed(() => {
  if (month.value) return props.records.filter((record) => record.date.startsWith(month.value));
  if (recentOnly.value) return props.records.slice(-5);
  return props.records;
});

const reversedRecords = computed(() => [...filteredRecords.value].reverse());

const emptyText = computed(() => {
  if (!props.records.length) return "暂无记录";
  if (month.value) return "当前年月暂无记录";
  return "暂无最近记录";
});

function showRecent() {
  month.value = "";
  recentOnly.value = true;
}

function showAll() {
  month.value = "";
  recentOnly.value = false;
}
</script>
