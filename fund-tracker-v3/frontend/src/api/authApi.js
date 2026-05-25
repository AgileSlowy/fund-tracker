import request from "./request";

export const authApi = {
  register(data) {
    return request.post("/auth/register", data);
  },

  login(data) {
    return request.post("/auth/login", data);
  },

  getCurrentUser() {
    return request.get("/auth/me");
  },

  logout() {
    return Promise.resolve({ success: true });
  }
};
