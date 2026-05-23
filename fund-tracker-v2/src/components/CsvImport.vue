<template>
  <section class="panel csv-panel">
    <div class="panel-head">
      <h2>CSV 导入</h2>
      <button class="text-button" type="button" @click="downloadCSVTemplate">下载 CSV 模板</button>
    </div>
    <div class="csv-actions">
      <input ref="fileInput" type="file" accept=".csv,text/csv" @change="handleFileChange">
      <button class="primary-button" type="button" :disabled="parsedRecords.length === 0 || errors.length > 0" @click="handleImport('cover')">
        导入
      </button>
    </div>

    <div class="import-status" v-if="fileName || errors.length || parsedRecords.length">
      <p v-if="fileName">已选择：{{ fileName }}</p>
      <p v-if="parsedRecords.length && errors.length === 0">解析成功：{{ parsedRecords.length }} 条记录。</p>
      <div v-if="duplicateDates.length" class="duplicate-box">
        <p>检测到重复日期：{{ duplicateDates.join(", ") }}</p>
        <div class="button-row">
          <button class="secondary-button" type="button" @click="handleImport('cover')">覆盖已有记录</button>
          <button class="secondary-button" type="button" @click="handleImport('skip')">跳过重复记录</button>
          <button class="danger-button" type="button" @click="cancelImport">取消导入</button>
        </div>
      </div>
      <ul v-if="errors.length" class="error-list">
        <li v-for="error in errors" :key="error">{{ error }}</li>
      </ul>
    </div>

    <div class="rules-box">
      <h3>CSV 导入规则说明</h3>
      <p>第一行必须是表头，且包含：date,jiaDailyRate,deposit,withdraw,note。旧模板中的 dailyRate 仍兼容，但含义同“贾-当日涨跌幅”。</p>
      <p>date 支持 YYYY-MM-DD 或 YYYY/M/D，例如 2026-03-04、2026/3/4；导入后会统一保存为 YYYY-MM-DD。</p>
      <p>jiaDailyRate 输入百分比，例如 0.52 表示上涨 0.52%；导入后会先除以 2 并保留 3 位小数，作为“当日涨跌幅”参与计算。</p>
      <p>deposit 和 withdraw 可为空，空值按 0 处理且不能为负数。</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import { downloadCSVTemplate, parseCSV } from "../utils/csv";

const props = defineProps({
  existingRecords: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(["import"]);

const fileInput = ref(null);
const fileName = ref("");
const parsedRecords = ref([]);
const errors = ref([]);

const duplicateDates = computed(() => {
  const existingDates = new Set(props.existingRecords.map((record) => record.date));
  const seenDates = new Set();
  const duplicates = new Set();

  parsedRecords.value.forEach((record) => {
    if (existingDates.has(record.date) || seenDates.has(record.date)) {
      duplicates.add(record.date);
    }
    seenDates.add(record.date);
  });

  return [...duplicates];
});

async function handleFileChange(event) {
  const file = event.target.files?.[0];
  fileName.value = file?.name || "";
  parsedRecords.value = [];
  errors.value = [];

  if (!file) return;

  const result = await parseCSV(file);
  parsedRecords.value = result.records;
  errors.value = result.errors;
}

function handleImport(strategy) {
  if (errors.value.length || parsedRecords.value.length === 0) return;
  emit("import", { records: parsedRecords.value, duplicateStrategy: duplicateDates.value.length ? strategy : "cover" });
  cancelImport();
}

function cancelImport() {
  parsedRecords.value = [];
  errors.value = [];
  fileName.value = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}
</script>
