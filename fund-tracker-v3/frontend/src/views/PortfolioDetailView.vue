<template>
  <div class="app-shell">
    <header class="top-nav">
      <div class="brand-block">
        <div class="brand-icon"><i class="ri-funds-box-line"></i></div>
        <div>
          <h1>{{ portfolio?.name || "基金组合" }}</h1>
          <p>{{ portfolio?.description || "共享基金组合收益记录" }}</p>
        </div>
      </div>
      <div class="nav-actions">
        <button class="secondary-button" type="button" @click="router.push('/portfolios')"><i class="ri-arrow-left-line"></i>组合列表</button>
        <button class="theme-toggle" type="button" :title="themeLabel" @click="toggleTheme">
          <i :class="theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'"></i>
          <span>{{ theme === "dark" ? "明亮" : "暗夜" }}</span>
        </button>
        <div class="user-pill">
          <span class="user-avatar"><i class="ri-user-3-line"></i></span>
          <span>{{ authStore.currentUser?.username }} · {{ role }}</span>
        </div>
        <button class="secondary-button" type="button" @click="handleSync"><i class="ri-refresh-line"></i>同步</button>
        <button class="danger-button" type="button" @click="handleLogout"><i class="ri-logout-box-r-line"></i>退出登录</button>
      </div>
    </header>

    <SummaryCards :summary="fundStore.summary" />
    <TrendChart :records="fundStore.calculatedRecords" />
    <DailyProfitChart :records="fundStore.calculatedRecords" />

    <RecordForm
      v-if="canEdit"
      :editing-record="editingRecord"
      @save="handleSaveRecord"
      @cancel="editingRecord = null"
    />

    <RecordTable
      :records="fundStore.calculatedRecords"
      :can-edit="canEdit"
      @edit="editingRecord = $event"
      @delete="handleDeleteRecord"
    />

    <MemberManage
      :members="portfolioStore.members"
      :can-manage="canManage"
      @invite="handleInvite"
      @update-role="handleUpdateRole"
      @remove="handleRemoveMember"
    />

    <section class="panel advanced-panel">
      <div class="panel-head">
        <div>
          <h2><span class="section-icon"><i class="ri-settings-3-line"></i></span>高级功能</h2>
          <p class="panel-subtitle">当前组合的数据同步、CSV 导出和导入</p>
        </div>
      </div>
      <DataActions @sync="handleSync" @export="handleExport" />
      <CsvImport
        v-if="canImport"
        :existing-records="fundStore.records"
        @import="handleImport"
      />
      <div class="rules-box rule-panel">
        <button class="rules-toggle" type="button" @click="calculationRulesOpen = !calculationRulesOpen">
          <span>收益计算规则</span>
          <span>{{ calculationRulesOpen ? "收起" : "展开" }}</span>
        </button>
        <ul v-show="calculationRulesOpen">
          <li>收益计算仍在前端完成，后端只保存原始记录。</li>
          <li>当天追加金额不参与当天涨跌，从下一个交易日开始参与收益计算。</li>
          <li>当天卖出金额参与当天涨跌，当日收益先按前一交易日结束后的持仓金额计算，再扣除当天赎回金额。</li>
          <li>当日收益 = 前一交易日结束后的持仓金额 × 当日涨跌幅。</li>
          <li>当前持仓金额 = 前一交易日结束后的持仓金额 × (1 + 当日涨跌幅) + 当天追加金额 - 当天赎回金额。</li>
          <li>累计投入金额 = 历史累计追加金额 - 历史累计赎回金额。</li>
        </ul>
      </div>
    </section>

    <p v-if="fundStore.message" class="toast success">{{ fundStore.message }}</p>
    <p v-if="fundStore.error" class="toast error">{{ fundStore.error }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import SummaryCards from "../components/SummaryCards.vue";
import TrendChart from "../components/TrendChart.vue";
import DailyProfitChart from "../components/DailyProfitChart.vue";
import RecordForm from "../components/RecordForm.vue";
import RecordTable from "../components/RecordTable.vue";
import CsvImport from "../components/CsvImport.vue";
import DataActions from "../components/DataActions.vue";
import MemberManage from "../components/MemberManage.vue";
import { useAuthStore } from "../stores/authStore";
import { useFundStore } from "../stores/fundStore";
import { usePortfolioStore } from "../stores/portfolioStore";
import { canEditRecords, canImportRecords, canManageMembers } from "../utils/permission";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const fundStore = useFundStore();
const portfolioStore = usePortfolioStore();
const editingRecord = ref(null);
const calculationRulesOpen = ref(false);
const theme = ref(localStorage.getItem("fund_theme") || "light");
const portfolioId = computed(() => route.params.portfolioId);
const portfolio = computed(() => portfolioStore.currentPortfolio);
const role = computed(() => portfolio.value?.role || "VIEWER");
const canEdit = computed(() => canEditRecords(role.value));
const canImport = computed(() => canImportRecords(role.value));
const canManage = computed(() => canManageMembers(role.value));
const themeLabel = computed(() => theme.value === "dark" ? "切换到明亮模式" : "切换到暗夜模式");

onMounted(async () => {
  applyTheme(theme.value);
  await Promise.all([
    portfolioStore.loadPortfolioDetail(portfolioId.value),
    portfolioStore.loadMembers(portfolioId.value),
    fundStore.loadRecords(portfolioId.value)
  ]);
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
  if (!confirm(`确认删除 ${record.date} 的记录吗？`)) return;
  await fundStore.deleteRecord(record.id);
}

async function handleImport(payload) {
  await fundStore.importCSVRecords(payload.records, payload.duplicateStrategy);
}

async function handleSync() {
  await fundStore.syncRecords();
}

async function handleExport() {
  await fundStore.exportCSV();
}

async function handleInvite(payload) {
  await portfolioStore.inviteMember(portfolioId.value, payload);
}

async function handleUpdateRole({ member, role: nextRole }) {
  await portfolioStore.updateMemberRole(portfolioId.value, member.id, { role: nextRole });
}

async function handleRemoveMember(member) {
  if (!confirm(`确认移除 ${member.username} 吗？`)) return;
  await portfolioStore.removeMember(portfolioId.value, member.id);
}

async function handleLogout() {
  await authStore.logout();
  router.push("/login");
}

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  applyTheme(theme.value);
}

function applyTheme(nextTheme) {
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("fund_theme", nextTheme);
  window.dispatchEvent(new CustomEvent("fund-theme-change"));
}
</script>
