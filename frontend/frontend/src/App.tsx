import { useEffect } from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createHashHistory,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initStore } from "./services/store";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PlansPage } from "./pages/PlansPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ComplaintsPage } from "./pages/ComplaintsPage";
import { OffersPage } from "./pages/OffersPage";
import { HistoryPage } from "./pages/HistoryPage";
import { OperatorPage } from "./pages/OperatorPage";
import { AdminPage } from "./pages/AdminPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { PendingPage } from "./pages/PendingPage";
import { SuccessPage } from "./pages/SuccessPage";

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Root Landing Page
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

// Login Page
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const plansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/plans",
  component: PlansPage,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  component: ProductsPage,
});

const complaintsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/complaints",
  component: ComplaintsPage,
});

const offersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/offers",
  component: OffersPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: HistoryPage,
});

const operatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/operator",
  component: OperatorPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/recharge/checkout",
  component: () => {
    const hash = window.location.hash || "";
    const searchPart = hash.includes("?") ? hash.split("?")[1] : window.location.search;
    const search = new URLSearchParams(searchPart);
    return <CheckoutPage searchPlanId={search.get("plan") || undefined} />;
  },
});

const pendingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/recharge/pending",
  component: PendingPage,
});

const successRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/recharge/success",
  component: () => {
    const search = new URLSearchParams(window.location.search);
    return <SuccessPage searchId={search.get("id") || undefined} />;
  },
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  loginRoute,
  dashboardRoute,
  plansRoute,
  productsRoute,
  complaintsRoute,
  offersRoute,
  historyRoute,
  operatorRoute,
  adminRoute,
  checkoutRoute,
  pendingRoute,
  successRoute,
]);

const hashHistory = createHashHistory();

export const router = createRouter({ routeTree, history: hashHistory });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  useEffect(() => {
    void initStore();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
