import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const authStore = useAuthStore()

  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config

    const status = error.response?.status
    const code = error.response?.data?.code
    const requestUrl = originalRequest?.url || ''

    if (status === 410) {
      authStore.logout()
      return Promise.reject(error)
    }

    if (
      status === 401 &&
      code === 'TOKEN_EXPIRED' &&
      !originalRequest?._retry
    ) {
      if (
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/refresh')
      ) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        const refreshResponse = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        )

        const newAccessToken = refreshResponse.data?.data?.accessToken

        if (!newAccessToken) {
          throw new Error('Refresh não retornou access token')
        }

        authStore.setAccessToken(newAccessToken)

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccessToken}`,
        }

        return api(originalRequest)
      } catch (refreshError) {
        authStore.logout()
        return Promise.reject(refreshError)
      }
    }

    if (
      status === 401 &&
      code === 'TOKEN_EXPIRED' &&
      originalRequest?._retry
    ) {
      authStore.logout()
    }

    return Promise.reject(error)
  },
)

export default api