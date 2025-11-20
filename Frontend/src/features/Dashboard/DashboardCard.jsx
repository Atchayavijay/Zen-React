import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiSettings, FiBook, FiLogOut } from "react-icons/fi";

const DashboardCard = () => {
  const navigate = useNavigate();

  // Get user info from localStorage
  const token = localStorage.getItem("token");

  const tokenPayload = useMemo(() => {
    if (!token) return null;
    try {
      const [, payload] = token.split(".");
      return JSON.parse(atob(payload));
    } catch (error) {
      console.warn("Failed to decode token payload", error);
      return null;
    }
  }, [token]);

  // If no token, redirect to login
  if (!token) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1:
        return "Administrator";
      case 2:
        return "Trainer";
      case 3:
        return "Consultant";
      case 4:
        return "Student";
      case 5:
        return "Support";
      default:
        return "User";
    }
  };

  const roleId = tokenPayload?.r_id ?? tokenPayload?.role_id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Zen Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, <strong>User</strong>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* User Info Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    User
                  </h3>
                  <p className="text-sm text-gray-500">
                    {roleId ? getRoleName(roleId) : "Unknown Role"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Course Management */}
            <div
              onClick={() => navigate("/")}
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiBook className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Course Management
                    </h3>
                    <p className="text-sm text-gray-500">
                      Manage courses, types, and content
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiSettings className="w-8 h-8 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Settings
                    </h3>
                    <p className="text-sm text-gray-500">
                      Configure your preferences
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile */}
            <div className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiUser className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Profile
                    </h3>
                    <p className="text-sm text-gray-500">
                      View and edit your profile
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Development Notice */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Development Mode
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This is a development dashboard. In production, this would
                    be customized based on your specific role and permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardCard;