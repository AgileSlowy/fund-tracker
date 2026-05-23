import { defineStore } from "pinia";
import { authApi } from "../api/authApi";
import { readJSON } from "../utils/storage";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || "",
    currentUser: readJSON("currentUser", null),
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
        const data = await authApi.login(username, password);
        this.token = data.token;
        this.currentUser = data.user;
        return data;
      } catch (error) {
        this.error = error.message || "登录失败。";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async register(username, password) {
      this.loading = true;
      this.error = "";

      try {
        return await authApi.register(username, password);
      } catch (error) {
        this.error = error.message || "注册失败。";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      await authApi.logout();
      this.token = "";
      this.currentUser = null;
    }
  }
});
