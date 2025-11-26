// src/routes/AppRoutes.jsx
import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@app/routes/ProtectedRoute";
import routeConfig from "@app/routes/config";

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

export default function AppRoutes({ setNavbarProps }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {routeConfig.map(({ path, component: Component, isPublic }) => {
          const element = isPublic ? (
            <Component setNavbarProps={setNavbarProps} />
          ) : (
            <ProtectedRoute>
              <Component setNavbarProps={setNavbarProps} />
            </ProtectedRoute>
          );

          return <Route key={path} path={path} element={element} />;
        })}
      </Routes>
    </Suspense>
  );
}
