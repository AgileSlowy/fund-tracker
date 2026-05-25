<template>
  <div class="app-shell">
    <header class="top-nav">
      <div class="brand-block">
        <div class="brand-icon"><i class="ri-funds-box-line"></i></div>
        <div>
          <h1>个人基金记录系统</h1>
          <p>选择或创建一个基金组合，开始多人共享记录</p>
        </div>
      </div>
      <div class="nav-actions">
        <button class="theme-toggle" type="button" :title="themeLabel" @click="toggleTheme">
          <i :class="theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'"></i>
          <span>{{ theme === "dark" ? "明亮" : "暗夜" }}</span>
        </button>
        <div class="user-pill">
          <span class="user-avatar"><i class="ri-user-3-line"></i></span>
          <span>{{ authStore.currentUser?.username }}</span>
        </div>
        <button class="danger-button" type="button" @click="handleLogout"><i class="ri-logout-box-r-line"></i>退出登录</button>
      </div>
    </header>

    <section class="panel">
      <div class="panel-head">
        <h2><span class="section-icon"><i class="ri-folder-chart-line"></i></span>基金组合</h2>
      </div>
      <form class="portfolio-form" @submit.prevent="createPortfolio">
        <input v-model.trim="form.name" type="text" placeholder="组合名称" required>
        <input v-model.trim="form.description" type="text" placeholder="组合描述">
        <button class="primary-button" type="submit">创建组合</button>
      </form>

      <div class="portfolio-grid">
        <article v-for="portfolio in portfolioStore.portfolios" :key="portfolio.id" class="portfolio-card" @click="openPortfolio(portfolio.id)">
          <div class="advanced-icon"><i class="ri-pie-chart-2-line"></i></div>
          <h3>{{ portfolio.name }}</h3>
          <p>{{ portfolio.description || "暂无描述" }}</p>
          <span class="role-pill">{{ portfolio.role }}</span>
        </article>
        <p v-if="portfolioStore.portfolios.length === 0" class="empty-hint">暂无组合，请先创建一个基金组合。</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { usePortfolioStore } from "../stores/portfolioStore";

const router = useRouter();
const authStore = useAuthStore();
const portfolioStore = usePortfolioStore();
const theme = ref(localStorage.getItem("fund_theme") || "light");
const themeLabel = computed(() => theme.value === "dark" ? "切换到明亮模式" : "切换到暗夜模式");
const form = reactive({ name: "", description: "" });

onMounted(async () => {
  applyTheme(theme.value);
  await portfolioStore.loadPortfolios();
});

async function createPortfolio() {
  await portfolioStore.createPortfolio({ name: form.name, description: form.description });
  form.name = "";
  form.description = "";
}

function openPortfolio(portfolioId) {
  router.push(`/portfolios/${portfolioId}`);
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
