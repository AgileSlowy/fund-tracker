import { defineStore } from "pinia";
import { fundApi } from "../api/fundApi";
import { calculateRecords, calculateSummary } from "../utils/calculator";
import { downloadCSV } from "../utils/csv";

export const useFundStore = defineStore("fund", {
  state: () => ({
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
    async loadRecords() {
      this.loading = true;
      this.error = "";

      try {
        this.records = await fundApi.getRecords();
      } catch (error) {
        this.error = "读取基金记录失败。";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async addRecord(record) {
      await fundApi.createRecord(record);
      await this.loadRecords();
    },

    async updateRecord(id, record) {
      await fundApi.updateRecord(id, record);
      await this.loadRecords();
    },

    async deleteRecord(id) {
      await fundApi.deleteRecord(id);
      await this.loadRecords();
    },

    async importCSVRecords(records, duplicateStrategy) {
      await fundApi.importRecords(records, duplicateStrategy);
      await this.loadRecords();
      await this.syncRecords();
    },

    async syncRecords() {
      try {
        const data = await fundApi.syncRecords(this.records);
        this.records = data.records || this.records;
        this.message = data.message || "同步成功";
        this.error = "";
      } catch (error) {
        this.error = "同步失败，请稍后重试";
        throw error;
      }
    },

    async exportCSV() {
      const records = await fundApi.exportRecords();
      const calculated = calculateRecords(records);
      downloadCSV(calculated);
    },

    async clearLocalRecords() {
      await fundApi.syncRecords([]);
      await this.loadRecords();
    },

    clearMessage() {
      this.message = "";
      this.error = "";
    }
  }
});
