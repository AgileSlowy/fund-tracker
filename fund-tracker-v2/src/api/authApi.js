import request, { USE_MOCK_API } from "./request";
import { readJSON, removeItem, writeJSON } from "../utils/storage";

const USERS_KEY = "users";

export const authApi = {
  async register(username, password) {
    if (!USE_MOCK_API) {
      const { data } = await request.post("/auth/register", { username, password });
      return data;
    }

    const users = readJSON(USERS_KEY, []);
    if (users.some((user) => user.username === username)) {
      throw new Error("该用户名已存在。");
    }

    users.push({ username, password });
    writeJSON(USERS_KEY, users);
    return { success: true };
  },

  async login(username, password) {
    if (!USE_MOCK_API) {
      const { data } = await request.post("/auth/login", { username, password });
      return data;
    }

    const users = readJSON(USERS_KEY, []);
    const matchedUser = users.find((user) => user.username === username && user.password === password);

    if (!matchedUser) {
      throw new Error("账号或密码错误。");
    }

    const token = `mock_token_${username}_${Date.now()}`;
    const currentUser = { username };

    localStorage.setItem("token", token);
    writeJSON("currentUser", currentUser);

    return { token, user: currentUser };
  },

  async logout() {
    if (!USE_MOCK_API) {
      await request.post("/auth/logout");
    }

    removeItem("token");
    removeItem("currentUser");
    return { success: true };
  }
};
