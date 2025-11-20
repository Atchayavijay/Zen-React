import React, { useState } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { Sparklines, SparklinesLine } from 'react-sparklines'
import apiClient from '@shared/api/client'
import { endpoints } from '@shared/api/endpoints'
import urbancodeLogo from '@assets/Urbancode.webp'

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.post(endpoints.auth.login, {
        username,
        password,
      })
      const result = response.data

      if (response.status === 200 && result.token) {
        toast.success('Login successful!')

        // Store user info in localStorage
        if (result.username) {
          localStorage.setItem('username', result.username)
        }
        if (result.profile_image) {
          localStorage.setItem('profile_image', result.profile_image)
        }

        if (onLoginSuccess) {
          onLoginSuccess(result.token)
        }
      } else {
        toast.error(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      const message =
        error.response?.data?.error || 'Network error. Please check your connection and try again.'
      console.error('Login error:', error)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-500 to-blue-400 relative overflow-hidden">
      <Toaster position="top-right" />
      {/* Background shapes */}
      <div className="absolute inset-0 z-0">
        <svg width="100%" height="100%" viewBox="0 0 1600 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="300" cy="200" r="120" fill="#fff" fillOpacity="0.06" />
          <circle cx="1400" cy="700" r="180" fill="#fff" fillOpacity="0.08" />
          <rect x="900" y="100" width="300" height="80" rx="40" fill="#fff" fillOpacity="0.07" />
          <rect x="200" y="600" width="200" height="60" rx="30" fill="#fff" fillOpacity="0.07" />
          <path d="M200 800 Q400 700 600 800 T1000 800" stroke="#fff" strokeOpacity="0.08" strokeWidth="30" fill="none" />
        </svg>
      </div>
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="bg-white/90 rounded-3xl shadow-2xl px-10 py-10 flex flex-col items-center">
          {/* Logo */}
          <img src={urbancodeLogo} alt="UrbanCode Logo" className="w-40 mb-4 rounded-xl shadow" />
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Zen Login</h2>
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
            <div>
              <input
                type="text"
                id="username"
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100 text-gray-800 text-base placeholder-gray-400"
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100 text-gray-800 text-base placeholder-gray-400 pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-semibold text-lg bg-blue-500 hover:bg-blue-600 text-white shadow transition-all duration-200 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
