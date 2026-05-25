<template>
  <section class="advanced-grid">
    <div class="advanced-card">
      <div class="advanced-icon"><i class="ri-refresh-line"></i></div>
      <h3>数据同步</h3>
      <p>同步当前用户数据，确保本地记录与最新数据一致。</p>
      <button class="secondary-button" type="button" @click="$emit('sync')">立即同步</button>
    </div>
    <div class="advanced-card">
      <div class="advanced-icon"><i class="ri-download-cloud-2-line"></i></div>
      <h3>导出 CSV</h3>
      <p>导出历史记录数据为 CSV 文件，便于备份和分析。</p>
      <button class="secondary-button" type="button" @click="$emit('export')">导出 CSV</button>
    </div>
    <div v-if="showClear" class="advanced-card danger-zone">
      <div class="advanced-icon"><i class="ri-delete-bin-6-line"></i></div>
      <h3>清空本地数据</h3>
      <p>清空当前账号的本地基金记录，此操作不可恢复。</p>
      <button class="danger-button" type="button" @click="$emit('clear')">清空数据</button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  showClear: {
    type: Boolean,
    default: false
  }
});

defineEmits(["sync", "export", "clear"]);
</script>
