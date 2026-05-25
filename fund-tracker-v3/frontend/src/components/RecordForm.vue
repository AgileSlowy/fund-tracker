<template>
  <section class="panel">
    <div class="panel-head">
      <h2><span class="section-icon"><i class="ri-add-circle-line"></i></span>{{ editingRecord ? "编辑记录" : "新增记录" }}</h2>
      <button v-if="editingRecord" class="text-button" type="button" @click="$emit('cancel')">取消编辑</button>
    </div>
    <form class="record-form" @submit.prevent="submitForm">
      <label>
        <span>日期</span>
        <input v-model="form.date" type="date" required>
      </label>
      <label>
        <span>贾-当日涨跌幅 (%)</span>
        <input v-model.number="form.dailyRate" type="number" step="0.01" required placeholder="例如 0.52">
      </label>
      <label>
        <span>参与计算涨跌幅 (%)</span>
        <div class="computed-rate">{{ calculatedRateText }}</div>
      </label>
      <label>
        <span>追加金额 (元)</span>
        <input v-model.number="form.deposit" type="number" min="0" step="0.01">
      </label>
      <label>
        <span>赎回金额 (元)</span>
        <input v-model.number="form.withdraw" type="number" min="0" step="0.01">
      </label>
      <label class="note-field">
        <span>备注</span>
        <input v-model.trim="form.note" type="text" maxlength="80" placeholder="可选">
      </label>
      <div class="form-actions inline-save">
        <button class="primary-button" type="submit">保存记录</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
import { toInputRate } from "../utils/formatter";

const props = defineProps({
  editingRecord: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["save", "cancel"]);

const form = reactive(getEmptyForm());

watch(() => props.editingRecord, (record) => {
  if (record) {
    Object.assign(form, {
      id: record.id,
      date: record.date,
      dailyRate: Number((toInputRate(record.dailyRate) * 2).toFixed(2)),
      deposit: record.deposit,
      withdraw: record.withdraw,
      note: record.note || ""
    });
  } else {
    Object.assign(form, getEmptyForm());
  }
}, { immediate: true });

function submitForm() {
  if (!form.date || Number.isNaN(Number(form.dailyRate))) {
    alert("请填写日期和当日涨跌幅。");
    return;
  }

  if (Number(form.deposit) < 0 || Number(form.withdraw) < 0) {
    alert("追加金额和赎回金额不能为负数。");
    return;
  }

  emit("save", {
    id: form.id,
    date: form.date,
    dailyRate: getCalculatedRate(form.dailyRate) / 100,
    deposit: Number(form.deposit || 0),
    withdraw: Number(form.withdraw || 0),
    note: form.note || ""
  });
}

function getEmptyForm() {
  return {
    id: "",
    date: new Date().toISOString().slice(0, 10),
    dailyRate: "",
    deposit: 0,
    withdraw: 0,
    note: ""
  };
}

const calculatedRateText = computed(() => `${getCalculatedRate(form.dailyRate).toFixed(3)}%`);

function getCalculatedRate(inputRate) {
  const rate = Number(inputRate || 0);
  return Math.round((rate / 2 + Number.EPSILON) * 1000) / 1000;
}
</script>
