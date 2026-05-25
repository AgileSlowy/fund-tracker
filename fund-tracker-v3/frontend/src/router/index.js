import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import PortfolioListView from "../views/PortfolioListView.vue";
import PortfolioDetailView from "../views/PortfolioDetailView.vue";

const routes = [
  { path: "/", redirect: "/portfolios" },
  { path: "/dashboard", redirect: "/portfolios" },
  { path: "/login", name: "login", component: LoginView, meta: { guestOnly: true } },
  { path: "/register", name: "register", component: RegisterView, meta: { guestOnly: true } },
  { path: "/portfolios", name: "portfolios", component: PortfolioListView, meta: { requiresAuth: true } },
  { path: "/portfolios/:portfolioId", name: "portfolioDetail", component: PortfolioDetailView, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { name: "login" };
  }

  if (to.meta.guestOnly && authStore.isLoggedIn) {
    return { name: "portfolios" };
  }

  return true;
});

export default router;
