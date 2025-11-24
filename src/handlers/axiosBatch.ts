import axios from "axios"
import { handleAxiosError } from "~/lib/utils"
import { handleTokenRefresh } from "~/handlers/axios"

const API_URL = import.meta.env.VITE_BATCH_API_URL || "https://blackboxai-dev.log1.com"

const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
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
	(error) => Promise.reject(error.response?.data || error)
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
