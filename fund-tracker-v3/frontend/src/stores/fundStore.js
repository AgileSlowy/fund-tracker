import { defineStore } from "pinia";
import { fundApi } from "../api/fundApi";
import { calculateRecords, calculateSummary } from "../utils/calculator";
import { downloadCSV } from "../utils/csv";

export const useFundStore = defineStore("fund", {
  state: () => ({
    portfolioId: null,
    records: [],
    loading: false,
    message: "",
    error: ""
  }),

  getters: {
    calculatedRecords: (state) => calculateRecords(state.records),
    summary() {
      return calculateSummary(this.calculatedRecords);
    }
  },

  actions: {
    async loadRecords(portfolioId = this.portfolioId) {
      if (!portfolioId) return;
      this.portfolioId = portfolioId;
      this.loading = true;
      this.error = "";
      try {
        this.records = await fundApi.getRecords(portfolioId);
      } catch (error) {
        this.error = error.message || "读取基金记录失败。";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async addRecord(record) {
      await fundApi.createRecord(this.portfolioId, record);
      await this.loadRecords();
    },

    async updateRecord(id, record) {
      await fundApi.updateRecord(this.portfolioId, id, record);
      await this.loadRecords();
    },

    async deleteRecord(id) {
      await fundApi.deleteRecord(this.portfolioId, id);
      await this.loadRecords();
    },

    async importCSVRecords(records, duplicateStrategy) {
      const strategy = duplicateStrategy === "skip" ? "SKIP" : "OVERWRITE";
      const result = await fundApi.importRecords(this.portfolioId, { records, duplicateStrategy: strategy });
      await this.loadRecords();
      this.message = `导入完成：成功 ${result.successCount} 条，跳过 ${result.skippedCount} 条，失败 ${result.failedCount} 条`;
      return result;
    },

    async syncRecords() {
      await this.loadRecords();
      this.message = "同步成功";
      this.error = "";
    },

    async exportCSV() {
      downloadCSV(this.calculatedRecords);
    },

    clearMessage() {
      this.message = "";
      this.error = "";
    }
  }
});
