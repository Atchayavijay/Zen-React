import axios from 'axios'
import { endpoints } from './endpoints'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/' 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let refreshPromise

const requestRefreshToken = () => {
  if (!refreshPromise) {
    // Check if we have a token before attempting refresh
    const token = localStorage.getItem('token')
    if (!token || token === 'null' || token === 'undefined') {
      refreshPromise = Promise.reject(new Error('No token available for refresh'))
      setTimeout(() => {
        refreshPromise = null
      }, 100)
      return refreshPromise
    }

    refreshPromise = apiClient
      .post(endpoints.auth.refresh, null, { skipAuthRefresh: true })
      .then((response) => {
        refreshPromise = null
        return response.data
      })
      .catch((error) => {
        refreshPromise = null
        throw error
      })
  }
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error

    // Skip refresh logic for refresh token endpoint itself
    if (config?.skipAuthRefresh) {
      // Silently handle 401 on refresh endpoint - it's expected if no refresh token exists
      if (response?.status === 401 && config.url?.includes('/refresh')) {
        return Promise.reject(error)
      }
      return Promise.reject(error)
    }

    // Skip refresh logic for login endpoint
    if (config?.url?.includes('/login')) {
      return Promise.reject(error)
    }

    if (response?.status === 401 && !config?._retry) {
      config._retry = true
      try {
        const data = await requestRefreshToken()
        const newToken = data?.token || data?.accessToken
        if (newToken) {
          localStorage.setItem('token', newToken)
          config.headers = config.headers ?? {}
          config.headers.Authorization = `Bearer ${newToken}`
          return apiClient(config)
        }

        // Only redirect to login if we're not already there
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      } catch (refreshError) {
        // Silently handle refresh token failures - don't log errors for expected failures
        // Only redirect if we're not already on login page
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
