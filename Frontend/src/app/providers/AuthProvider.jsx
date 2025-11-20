import { useEffect, useState, lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@app/layout/Layout";
import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";

const LoginPage = lazy(() => import("@features/auth/components/LoginPage"));

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const attemptTokenRefresh = async (shouldUpdateState = true) => {
    // Only attempt refresh if we have a token or are on a protected route
    // This prevents unnecessary 401 errors when no token exists
    const token = localStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") {
      return false;
    }

    try {
      const { data } = await apiClient.post(endpoints.auth.refresh, null, {
        skipAuthRefresh: true,
      });
      const newToken = data?.token || data?.accessToken;
      if (newToken) {
        localStorage.setItem("token", newToken);
        if (shouldUpdateState) {
          setIsAuthenticated(true);
        }
        return true;
      }
    } catch (error) {
      // Silently handle refresh token failures - 401 is expected if refresh token is invalid/expired
      // Only remove token if we're not on login page
      if (location.pathname !== "/login") {
        localStorage.removeItem("token");
      }
      // Don't log expected 401 errors from refresh endpoint
      if (error.response?.status !== 401) {
        console.error("Token refresh error:", error);
      }
    }
    return false;
  };

  useEffect(() => {
    localStorage.removeItem("user");
    let isMounted = true;

    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token && token !== "null" && token !== "undefined") {
          if (isMounted) setIsAuthenticated(true);
        } else {
          const refreshed = await attemptTokenRefresh(isMounted);
          if (!refreshed && isMounted) {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        localStorage.removeItem("token");
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const handleLoginSuccess = (token) => {
    // Store token synchronously before any navigation or API calls
    if (token && token !== "null" && token !== "undefined") {
      localStorage.setItem("token", token);
      setIsAuthenticated(true);
      // Use setTimeout to ensure token is stored before navigation triggers API calls
      setTimeout(() => {
        navigate("/dashboard");
      }, 0);
    }
  };

  const handleLogout = async () => {
    try {
      if (localStorage.getItem("token")) {
        await apiClient.post(endpoints.auth.logout);
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("profile_image");
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && location.pathname !== "/login") {
        navigate("/login", { replace: true });
      } else if (isAuthenticated && location.pathname === "/login") {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && location.pathname === "/login") {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        }
      >
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  if (!isAuthenticated && location.pathname !== "/login") {
    return null;
  }

  if (isAuthenticated && location.pathname === "/login") {
    return null;
  }

  return <Layout onLogout={handleLogout}>{children}</Layout>;
};

export default AuthProvider;
