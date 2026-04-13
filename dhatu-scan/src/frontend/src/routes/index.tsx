import {
  Navigate,
  RouterProvider,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import { useApp } from "../context/AppContext";

const AuthPage = lazy(() => import("../pages/AuthPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const ChildProfilesPage = lazy(() => import("../pages/ChildProfilesPage"));
const DashboardHome = lazy(() => import("../pages/DashboardHome"));
const ScreeningHub = lazy(() => import("../pages/ScreeningHub"));
const Camera = lazy(() => import("../pages/Camera"));
const Form = lazy(() => import("../pages/Form"));
const Results = lazy(() => import("../pages/Results"));
const History = lazy(() => import("../pages/History"));
const Gamification = lazy(() => import("../pages/Gamification"));
const Consult = lazy(() => import("../pages/Consult"));
const Privacy = lazy(() => import("../pages/Privacy"));

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    }
  >
    {children}
  </Suspense>
);

function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { state } = useApp();

  if (!state.isAuthenticated) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

const rootRoute = createRootRoute({
  component: () => <Layout />,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <PageWrapper>
      <AuthPage />
    </PageWrapper>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <ProtectedPage>
      <PageWrapper>
        <DashboardHome />
      </PageWrapper>
    </ProtectedPage>
  ),
});

const childProfilesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/children",
  component: () => (
    <ProtectedPage>
      <PageWrapper>
        <ChildProfilesPage />
      </PageWrapper>
    </ProtectedPage>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => (
    <PageWrapper>
      <LoginPage />
    </PageWrapper>
  ),
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: () => (
    <PageWrapper>
      <RegisterPage />
    </PageWrapper>
  ),
});

const screeningRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/screening",
  component: () => (
    <ProtectedPage>
      <PageWrapper>
        <ScreeningHub />
      </PageWrapper>
    </ProtectedPage>
  ),
});

const cameraRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/camera",
  component: () => (
    <ProtectedPage>
      <PageWrapper>
        <Camera />
      </PageWrapper>
    </ProtectedPage>
  ),
});

const formRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/form",
  component: () => (
    <ProtectedPage>
      <PageWrapper>
        <Form />
      </PageWrapper>
    </ProtectedPage>
  ),
});

const resultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/results",
  component: () => (
    <ProtectedPage>
      <PageWrapper>
        <Results />
      </PageWrapper>
    </ProtectedPage>
  ),
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: () => (
    <ProtectedPage>
      <PageWrapper>
        <History />
      </PageWrapper>
    </ProtectedPage>
  ),
});

const rewardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rewards",
  component: () => (
    <ProtectedPage>
      <PageWrapper>
        <Gamification />
      </PageWrapper>
    </ProtectedPage>
  ),
});

const consultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/consult",
  component: () => (
    <ProtectedPage>
      <PageWrapper>
        <Consult />
      </PageWrapper>
    </ProtectedPage>
  ),
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: () => (
    <ProtectedPage>
      <PageWrapper>
        <Privacy />
      </PageWrapper>
    </ProtectedPage>
  ),
});

const routeTree = rootRoute.addChildren([
  authRoute,
  loginRoute,
  registerRoute,
  childProfilesRoute,
  dashboardRoute,
  screeningRoute,
  cameraRoute,
  formRoute,
  resultsRoute,
  historyRoute,
  rewardsRoute,
  consultRoute,
  privacyRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
