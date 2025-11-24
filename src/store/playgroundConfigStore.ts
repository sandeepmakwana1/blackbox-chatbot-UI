import { create } from "zustand"
import { persist } from "zustand/middleware"
import { localStorageConfig } from "~/lib/utils"

const FALLBACK_API_URL = import.meta.env.VITE_PLAYGROUND_API_URL || "https://blackbox-dev-playground.log1.com"
const FALLBACK_WS_URL = import.meta.env.VITE_PLAYGROUND_WB_URL || "ws://blackbox-dev-playground.log1.com/ws"

type PlaygroundConfigState = {
	apiBaseUrl: string
	wsBaseUrl: string
	defaultSourceId: string
	userEmail: string
	setApiBaseUrl: (url: string) => void
	setWsBaseUrl: (url: string) => void
	setDefaultSourceId: (sourceId: string) => void
	setUserEmail: (email: string) => void
	reset: () => void
}

export const usePlaygroundConfigStore = create<PlaygroundConfigState>()(
	persist(
		(set) => ({
			apiBaseUrl: "",
			wsBaseUrl: "",
			defaultSourceId: "",
			userEmail: "",
			setApiBaseUrl: (url) => set({ apiBaseUrl: url }),
			setWsBaseUrl: (url) => set({ wsBaseUrl: url }),
			setDefaultSourceId: (sourceId) => set({ defaultSourceId: sourceId }),
			setUserEmail: (email) => set({ userEmail: email }),
			reset: () => set({ apiBaseUrl: "", wsBaseUrl: "", defaultSourceId: "", userEmail: "" }),
		}),
		{
			name: "playground-config",
			storage: localStorageConfig,
		}
	)
)

export const playgroundDefaults = {
	api: FALLBACK_API_URL,
	ws: FALLBACK_WS_URL,
}

export const resolvePlaygroundApiUrl = () => {
	const { apiBaseUrl } = usePlaygroundConfigStore.getState()
	return (apiBaseUrl || "").trim() || FALLBACK_API_URL
}

export const resolvePlaygroundWsUrl = () => {
	const { wsBaseUrl } = usePlaygroundConfigStore.getState()
	return (wsBaseUrl || "").trim() || FALLBACK_WS_URL
}

export const resolvePlaygroundUserEmail = () => {
	const { userEmail } = usePlaygroundConfigStore.getState()
	return (userEmail || "").trim()
}
