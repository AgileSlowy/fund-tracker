import { defineStore } from "pinia";
import { portfolioApi } from "../api/portfolioApi";
import { memberApi } from "../api/memberApi";

export const usePortfolioStore = defineStore("portfolio", {
  state: () => ({
    portfolios: [],
    currentPortfolio: null,
    members: [],
    loading: false,
    error: ""
  }),

  actions: {
    async loadPortfolios() {
      this.loading = true;
      this.error = "";
      try {
        this.portfolios = await portfolioApi.getPortfolios();
      } catch (error) {
        this.error = error.message || "读取组合失败。";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createPortfolio(payload) {
      await portfolioApi.createPortfolio(payload);
      await this.loadPortfolios();
    },

    async loadPortfolioDetail(portfolioId) {
      this.currentPortfolio = await portfolioApi.getPortfolioDetail(portfolioId);
      return this.currentPortfolio;
    },

    async updatePortfolio(portfolioId, payload) {
      this.currentPortfolio = await portfolioApi.updatePortfolio(portfolioId, payload);
      await this.loadPortfolios();
    },

    async deletePortfolio(portfolioId) {
      await portfolioApi.deletePortfolio(portfolioId);
      this.currentPortfolio = null;
      await this.loadPortfolios();
    },

    async loadMembers(portfolioId) {
      this.members = await memberApi.getMembers(portfolioId);
    },

    async inviteMember(portfolioId, payload) {
      await memberApi.inviteMember(portfolioId, payload);
      await this.loadMembers(portfolioId);
    },

    async updateMemberRole(portfolioId, memberId, payload) {
      await memberApi.updateMemberRole(portfolioId, memberId, payload);
      await this.loadMembers(portfolioId);
    },

    async removeMember(portfolioId, memberId) {
      await memberApi.removeMember(portfolioId, memberId);
      await this.loadMembers(portfolioId);
    }
  }
});
