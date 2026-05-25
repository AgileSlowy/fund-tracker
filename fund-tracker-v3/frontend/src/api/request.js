import axios from "axios";

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 15000
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || "请求失败";
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(new Error(message));
  }
);

export default request;
