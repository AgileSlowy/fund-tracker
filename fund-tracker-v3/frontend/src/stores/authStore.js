import { defineStore } from "pinia";
import { authApi } from "../api/authApi";

function readCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || "",
    currentUser: readCurrentUser(),
    loading: false,
    error: ""
  }),

  getters: {
    isLoggedIn: (state) => Boolean(state.token && state.currentUser)
  },

  actions: {
    async login(username, password) {
      this.loading = true;
      this.error = "";
      try {
        const data = await authApi.login({ username, password });
        this.token = data.token;
        this.currentUser = data.user;
        localStorage.setItem("token", data.token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        return data;
      } catch (error) {
        this.error = error.message || "登录失败。";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async register(payload) {
      this.loading = true;
      this.error = "";
      try {
        return await authApi.register(payload);
      } catch (error) {
        this.error = error.message || "注册失败。";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async loadCurrentUser() {
      if (!this.token) return null;
      this.currentUser = await authApi.getCurrentUser();
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
      return this.currentUser;
    },

    async logout() {
      await authApi.logout();
      this.token = "";
      this.currentUser = null;
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
    }
  }
});
