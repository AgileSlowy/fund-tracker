import request from "./request";

export const portfolioApi = {
  getPortfolios() {
    return request.get("/portfolios");
  },

  createPortfolio(data) {
    return request.post("/portfolios", data);
  },

  getPortfolioDetail(portfolioId) {
    return request.get(`/portfolios/${portfolioId}`);
  },

  updatePortfolio(portfolioId, data) {
    return request.put(`/portfolios/${portfolioId}`, data);
  },

  deletePortfolio(portfolioId) {
    return request.delete(`/portfolios/${portfolioId}`);
  }
};
