import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";

// Lazy-load pages for code splitting
const Landing = lazy(() => import("../pages/Landing"));
const Camera = lazy(() => import("../pages/Camera"));
const Form = lazy(() => import("../pages/Form"));
const Results = lazy(() => import("../pages/Results"));
const History = lazy(() => import("../pages/History"));
const Gamification = lazy(() => import("../pages/Gamification"));
const Privacy = lazy(() => import("../pages/Privacy"));

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    }
  >
    {children}
  </Suspense>
);

// Root route with Layout wrapper
const rootRoute = createRootRoute({
  component: () => <Layout />,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <PageWrapper>
      <Landing />
    </PageWrapper>
  ),
});

const cameraRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/camera",
  component: () => (
    <PageWrapper>
      <Camera />
    </PageWrapper>
  ),
});

const formRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/form",
  component: () => (
    <PageWrapper>
      <Form />
    </PageWrapper>
  ),
});

const resultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/results",
  component: () => (
    <PageWrapper>
      <Results />
    </PageWrapper>
  ),
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: () => (
    <PageWrapper>
      <History />
    </PageWrapper>
  ),
});

const gamificationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gamification",
  component: () => (
    <PageWrapper>
      <Gamification />
    </PageWrapper>
  ),
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: () => (
    <PageWrapper>
      <Privacy />
    </PageWrapper>
  ),
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  cameraRoute,
  formRoute,
  resultsRoute,
  historyRoute,
  gamificationRoute,
  privacyRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
