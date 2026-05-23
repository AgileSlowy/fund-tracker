import axios from "axios";
import { readJSON } from "../utils/storage";

export const USE_MOCK_API = true;

const request = axios.create({
  baseURL: "/api",
  timeout: 10000
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getCurrentUsername() {
  const currentUser = readJSON("currentUser", null);
  return currentUser?.username || "";
}

export default request;
