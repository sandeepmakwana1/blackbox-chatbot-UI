import axios from "axios"
import {
	resolvePlaygroundApiUrl,
	resolvePlaygroundWsUrl,
	usePlaygroundConfigStore,
} from "~/store/playgroundConfigStore"

// Resolve base URLs from the config store (with environment fallbacks)
const api = axios.create({
	baseURL: resolvePlaygroundApiUrl(),
	headers: {
		"Content-Type": "application/json",
	},
})

// Keep axios in sync with runtime config changes
usePlaygroundConfigStore.subscribe((state) => {
	api.defaults.baseURL = (state.apiBaseUrl || "").trim() || resolvePlaygroundApiUrl()
})

api.interceptors.response.use(
	(response) => response,
	(error) => {
		console.error("[API Error]", error.response?.status, error.response?.data || error.message)
		return Promise.reject(error)
	}
)

export const getWebSocketUrl = () => resolvePlaygroundWsUrl()

export { api }
