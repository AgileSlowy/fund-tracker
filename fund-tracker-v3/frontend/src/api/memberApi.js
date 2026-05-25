import request from "./request";

export const memberApi = {
  getMembers(portfolioId) {
    return request.get(`/portfolios/${portfolioId}/members`);
  },

  inviteMember(portfolioId, data) {
    return request.post(`/portfolios/${portfolioId}/members`, data);
  },

  updateMemberRole(portfolioId, memberId, data) {
    return request.put(`/portfolios/${portfolioId}/members/${memberId}`, data);
  },

  removeMember(portfolioId, memberId) {
    return request.delete(`/portfolios/${portfolioId}/members/${memberId}`);
  }
};
