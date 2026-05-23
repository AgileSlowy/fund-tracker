<template>
  <main class="auth-page">
    <section class="auth-card">
      <h1>注册账号</h1>
      <p>创建本地模拟账号，不同账号数据相互隔离</p>
      <form @submit.prevent="handleRegister">
        <label>
          <span>账号</span>
          <input v-model.trim="username" type="text" autocomplete="username" required>
        </label>
        <label>
          <span>密码</span>
          <input v-model="password" type="password" autocomplete="new-password" required>
        </label>
        <label>
          <span>确认密码</span>
          <input v-model="confirmPassword" type="password" autocomplete="new-password" required>
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="primary-button block" type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? "注册中..." : "注册" }}
        </button>
      </form>
      <RouterLink class="auth-link" to="/login">已有账号？去登录</RouterLink>
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
const confirmPassword = ref("");
const error = ref("");

async function handleRegister() {
  error.value = "";

  if (!username.value) {
    error.value = "用户名不能为空。";
    return;
  }

  if (!password.value) {
    error.value = "密码不能为空。";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "两次输入的密码不一致。";
    return;
  }

  try {
    await authStore.register(username.value, password.value);
    alert("注册成功，请登录。");
    router.push("/login");
  } catch (registerError) {
    error.value = registerError.message || "注册失败。";
  }
}
</script>
