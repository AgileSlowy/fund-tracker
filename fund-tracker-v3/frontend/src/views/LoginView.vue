<template>
  <main class="auth-page">
    <section class="auth-card">
      <h1>个人基金记录系统</h1>
      <p>登录后查看并同步你的基金记录</p>
      <form @submit.prevent="handleLogin">
        <label>
          <span>账号</span>
          <input v-model.trim="username" type="text" autocomplete="username" required>
        </label>
        <label>
          <span>密码</span>
          <input v-model="password" type="password" autocomplete="current-password" required>
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="primary-button block" type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? "登录中..." : "登录" }}
        </button>
      </form>
      <RouterLink class="auth-link" to="/register">没有账号？去注册</RouterLink>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const router = useRouter();
const authStore = useAuthStore();
const username = ref("");
const password = ref("");
const error = ref("");

async function handleLogin() {
  error.value = "";

  try {
    await authStore.login(username.value, password.value);
    router.push("/portfolios");
  } catch (loginError) {
    error.value = loginError.message || "登录失败。";
  }
}
</script>
