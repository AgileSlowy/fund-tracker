<template>
  <section class="panel data-actions">
    <div>
      <h2>数据管理</h2>
      <p>同步当前用户数据，或导出、清空本地记录。</p>
    </div>
    <div class="button-row">
      <button class="secondary-button" type="button" @click="$emit('sync')">手动同步</button>
      <button class="secondary-button" type="button" @click="$emit('export')">导出 CSV</button>
      <button class="danger-button" type="button" @click="$emit('clear')">清空本地数据</button>
    </div>
  </section>
</template>

<script setup>
defineEmits(["sync", "export", "clear"]);
</script>
