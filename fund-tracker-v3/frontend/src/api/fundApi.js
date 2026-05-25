import request from "./request";

export const fundApi = {
  getRecords(portfolioId) {
    return request.get(`/portfolios/${portfolioId}/records`);
  },

  createRecord(portfolioId, record) {
    return request.post(`/portfolios/${portfolioId}/records`, record);
  },

  updateRecord(portfolioId, recordId, record) {
    return request.put(`/portfolios/${portfolioId}/records/${recordId}`, record);
  },

  deleteRecord(portfolioId, recordId) {
    return request.delete(`/portfolios/${portfolioId}/records/${recordId}`);
  },

  importRecords(portfolioId, data) {
    return request.post(`/portfolios/${portfolioId}/records/import`, data);
  }
};
