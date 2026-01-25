import "./index.css";
import { AppLayout } from "@/components/layouts/app-layout";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { PublicRoute } from "@/components/public-route";
import { CategoriesPage } from "@/pages/categories-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LandingPage } from "@/pages/landing-page";
import { SettingsPage } from "@/pages/settings-page";
import { TodosPage } from "@/pages/todos-page";
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";

const routes = createRoutesFromElements(
  <>
    <Route
      path="/"
      element={
        <PublicRoute>
          <LandingPage />
        </PublicRoute>
      }
    />
    <Route
      path="/auth/sign-in/*"
      element={
        <PublicRoute>
          <AuthLayout />
        </PublicRoute>
      }
    />
    <Route
      path="/auth/sign-up/*"
      element={
        <PublicRoute>
          <AuthLayout />
        </PublicRoute>
      }
    />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/todos"
      element={
        <ProtectedRoute>
          <AppLayout>
            <TodosPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/categories"
      element={
        <ProtectedRoute>
          <AppLayout>
            <CategoriesPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        </ProtectedRoute>
      }
    />
    {/* 404 Fallback */}
    <Route
      path="*"
      element={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Page not found</p>
            <a href="/" className="text-primary hover:underline">Go back home</a>
          </div>
        </div>
      }
    />
  </>,
);

const router = createBrowserRouter(routes);

export default router;
