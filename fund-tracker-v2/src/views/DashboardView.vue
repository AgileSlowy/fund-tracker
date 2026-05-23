<template>
  <div class="app-shell">
    <header class="top-nav">
      <div>
        <h1>个人基金记录系统</h1>
        <p>当前登录用户：{{ authStore.currentUser?.username }}</p>
      </div>
      <div class="nav-actions">
        <button class="secondary-button" type="button" @click="handleSync">同步</button>
        <button class="danger-button" type="button" @click="handleLogout">退出登录</button>
      </div>
    </header>

    <SummaryCards :summary="fundStore.summary" />

    <TrendChart :records="fundStore.calculatedRecords" />

    <DailyProfitChart :records="fundStore.calculatedRecords" />

    <RecordForm
      :editing-record="editingRecord"
      @save="handleSaveRecord"
      @cancel="editingRecord = null"
    />

    <RecordTable
      :records="fundStore.calculatedRecords"
      @edit="editingRecord = $event"
      @delete="handleDeleteRecord"
    />

    <DataActions
      @sync="handleSync"
      @export="handleExport"
      @clear="handleClear"
    />

    <CsvImport
      :existing-records="fundStore.records"
      @import="handleImport"
    />

    <section class="panel rule-panel">
      <h2>收益计算规则</h2>
      <ul>
        <li>手动输入和 CSV 导入的“贾-当日涨跌幅”会先除以 2，并保留 3 位小数，作为后续参与基金计算的“当日涨跌幅”。</li>
        <li>系统统一使用真实模式计算：当天追加金额不参与当天涨跌，从下一个交易日开始参与收益计算。</li>
        <li>当天卖出金额参与当天涨跌：当日收益先按前一交易日结束后的持仓金额计算，再扣除当天赎回金额。</li>
        <li>当日收益 = 前一交易日结束后的持仓金额 × 当日涨跌幅。</li>
        <li>当前持仓金额 = 前一交易日结束后的持仓金额 × (1 + 当日涨跌幅) + 当天追加金额 - 当天赎回金额。</li>
        <li>累计投入金额 = 历史累计追加金额 - 历史累计赎回金额。</li>
        <li>累计盈亏 = 当前持仓金额 - 累计投入金额；累计收益率 = 累计盈亏 / 累计投入金额，累计投入为 0 时显示 0%。</li>
        <li>业绩走势图使用净值口径展示，所选区间内首个交易日固定为 0%，后续点位 = 当日净值 / 区间首日净值 - 1。</li>
      </ul>
    </section>

    <p v-if="fundStore.message" class="toast success">{{ fundStore.message }}</p>
    <p v-if="fundStore.error" class="toast error">{{ fundStore.error }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import SummaryCards from "../components/SummaryCards.vue";
import TrendChart from "../components/TrendChart.vue";
import DailyProfitChart from "../components/DailyProfitChart.vue";
import RecordForm from "../components/RecordForm.vue";
import RecordTable from "../components/RecordTable.vue";
import CsvImport from "../components/CsvImport.vue";
import DataActions from "../components/DataActions.vue";
import { useAuthStore } from "../stores/authStore";
import { useFundStore } from "../stores/fundStore";

const router = useRouter();
const authStore = useAuthStore();
const fundStore = useFundStore();
const editingRecord = ref(null);

onMounted(async () => {
  await fundStore.loadRecords();
});

async function handleSaveRecord(record) {
  if (editingRecord.value) {
    await fundStore.updateRecord(editingRecord.value.id, record);
  } else {
    await fundStore.addRecord(record);
  }

  editingRecord.value = null;
}

async function handleDeleteRecord(record) {
  const confirmed = confirm(`确认删除 ${record.date} 的记录吗？`);
  if (!confirmed) return;
  await fundStore.deleteRecord(record.id);
}

async function handleImport(payload) {
  await fundStore.importCSVRecords(payload.records, payload.duplicateStrategy);
  alert("CSV 导入成功，已同步到当前用户数据。");
}

async function handleSync() {
  try {
    await fundStore.syncRecords();
    alert("同步成功");
  } catch (error) {
    alert("同步失败，请稍后重试");
  }
}

async function handleExport() {
  await fundStore.exportCSV();
}

async function handleClear() {
  const confirmed = confirm("确认清空当前用户的本地基金记录吗？此操作不可恢复。");
  if (!confirmed) return;
  await fundStore.clearLocalRecords();
  alert("本地数据已清空。");
}

async function handleLogout() {
  await authStore.logout();
  fundStore.records = [];
  router.push("/login");
}
</script>
