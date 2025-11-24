import axios from "axios"
import { toast } from "sonner"
import { useLocalStore } from "~/store/data"
import { handleAxiosError } from "~/lib/utils"

const API_URL = import.meta.env.VITE_API_URL || "https://blackboxai-dev.log1.com"

let isRefreshing = false
let failedQueue: { resolve: (token: string) => void; reject: (error: any) => void }[] = []

const processQueue = (error: any, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error)
		} else {
			prom.resolve(token!)
		}
	})
	failedQueue = []
}

export const handleTokenRefresh = async (): Promise<string> => {
	if (isRefreshing) {
		return new Promise((resolve, reject) => {
			failedQueue.push({ resolve, reject })
		})
	}

	isRefreshing = true

	const refreshToken = localStorage.getItem("refresh_token")
	const user = useLocalStore.getState().user

	if (!refreshToken || !user) {
		const logout = useLocalStore.getState().logout
		logout()
		window.location.href = "/login"
		const error = new Error("No refresh token or user found.")
		processQueue(error, null)
		return Promise.reject(error)
	}

	try {
		const response = await axios.post(`${API_URL}/auth/refresh`, {
			email: user.email,
			refresh_token: refreshToken,
		})

		const { access_token: newToken } = response.data

		useLocalStore.getState().setCredentials({
			user,
			token: newToken,
			refreshToken,
		})

		processQueue(null, newToken)
		return newToken
	} catch (refreshError) {
		processQueue(refreshError, null)
		toast.error("Session expired. Please log in again.")
		const logout = useLocalStore.getState().logout
		logout()
		window.location.href = "/login"
		return Promise.reject(refreshError)
	} finally {
		isRefreshing = false
	}
}

const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
	paramsSerializer: {
		indexes: null, // Ensures array parameters are repeated without indices
	},
})

api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token")
		if (token && !config.headers.Authorization) {
			config.headers.Authorization = `Bearer ${token}`
		}
		return config
	},
	(error) => Promise.reject(error)
)

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config

		if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
			originalRequest._retry = true
			try {
				const newToken = await handleTokenRefresh()
				originalRequest.headers.Authorization = `Bearer ${newToken}`
				return api(originalRequest)
			} catch (refreshError) {
				return Promise.reject(refreshError)
			}
		}

		// For other errors, use the existing global handler
		if (error.response?.status !== 401 && error.response?.status !== 403) {
			const errorMessage =
				error.response?.data?.error || error.response?.data?.message || error.message || "An error occurred"

			handleAxiosError({
				...error,
				message: errorMessage,
			})
		}

		return Promise.reject(error)
	}
)

export { api }
