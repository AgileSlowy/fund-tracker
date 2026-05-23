import request, { USE_MOCK_API, getCurrentUsername } from "./request";
import { createId, getUserRecordsKey, readJSON, writeJSON } from "../utils/storage";

export const fundApi = {
  async getRecords() {
    if (!USE_MOCK_API) {
      const { data } = await request.get("/fund-records");
      return data;
    }

    return readUserRecords();
  },

  async createRecord(record) {
    if (!USE_MOCK_API) {
      const { data } = await request.post("/fund-records", record);
      return data;
    }

    const records = readUserRecords();
    const nextRecord = { ...record, id: record.id || createId() };
    const nextRecords = records.filter((item) => item.date !== nextRecord.date);
    nextRecords.push(nextRecord);
    saveUserRecords(nextRecords);
    return nextRecord;
  },

  async updateRecord(id, record) {
    if (!USE_MOCK_API) {
      const { data } = await request.put(`/fund-records/${id}`, record);
      return data;
    }

    const records = readUserRecords();
    const nextRecords = records
      .filter((item) => item.id !== id && item.date !== record.date)
      .concat({ ...record, id });

    saveUserRecords(nextRecords);
    return { ...record, id };
  },

  async deleteRecord(id) {
    if (!USE_MOCK_API) {
      const { data } = await request.delete(`/fund-records/${id}`);
      return data;
    }

    const records = readUserRecords().filter((item) => item.id !== id);
    saveUserRecords(records);
    return { success: true };
  },

  async importRecords(records, duplicateStrategy = "cover") {
    if (!USE_MOCK_API) {
      const { data } = await request.post("/fund-records/import", { records, duplicateStrategy });
      return data;
    }

    if (duplicateStrategy === "cancel") {
      return readUserRecords();
    }

    const existingRecords = readUserRecords();
    const existingDateSet = new Set(existingRecords.map((item) => item.date));
    const importedDateSet = new Set();
    const normalizedImportRecords = records.map((record) => ({
      ...record,
      id: record.id || createId()
    }));

    const filteredImportRecords = normalizedImportRecords.filter((record) => {
      if (importedDateSet.has(record.date) && duplicateStrategy === "skip") return false;
      importedDateSet.add(record.date);
      return duplicateStrategy === "cover" || !existingDateSet.has(record.date);
    });
    const nextImportRecords = duplicateStrategy === "cover"
      ? keepLastRecordByDate(filteredImportRecords)
      : filteredImportRecords;

    const importDates = new Set(nextImportRecords.map((record) => record.date));
    const baseRecords = duplicateStrategy === "cover"
      ? existingRecords.filter((record) => !importDates.has(record.date))
      : existingRecords;

    const nextRecords = baseRecords.concat(nextImportRecords);
    saveUserRecords(nextRecords);
    return nextRecords;
  },

  async syncRecords(records) {
    if (!USE_MOCK_API) {
      const { data } = await request.post("/fund-records/sync", { records });
      return data;
    }

    saveUserRecords(records);
    return { records: readUserRecords(), message: "同步成功" };
  },

  async exportRecords() {
    if (!USE_MOCK_API) {
      const { data } = await request.get("/fund-records/export");
      return data;
    }

    return readUserRecords();
  }
};

function readUserRecords() {
  const username = getCurrentUsername();
  if (!username) return [];
  return readJSON(getUserRecordsKey(username), []);
}

function saveUserRecords(records) {
  const username = getCurrentUsername();
  if (!username) return;
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
  writeJSON(getUserRecordsKey(username), sortedRecords);
}

function keepLastRecordByDate(records) {
  const map = new Map();
  records.forEach((record) => {
    map.set(record.date, record);
  });
  return [...map.values()];
}
