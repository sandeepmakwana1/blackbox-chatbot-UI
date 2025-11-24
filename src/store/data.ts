import { localStorageConfig } from "~/lib/utils"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type User = {
	email: string
	name: string
}

const STORAGE_KEYS = {
	TOKEN: "token",
	REFRESH_TOKEN: "refresh_token",
	USER: "user",
}

type AuthState = {
	user: User | null
	token: string | null
	refreshToken: string | null
	isAuthenticated: boolean
	setCredentials: (data: { user: User; token: string; refreshToken: string }) => void
	logout: () => void
	temp: string
	setTemp: (data: string) => void
}

type ThemeState = {
	darkMode: boolean
	toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
	darkMode: false,
	toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })),
}))

export const useLocalStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			token: null,
			refreshToken: null,
			isAuthenticated: false,
			temp: "",
			setCredentials: ({ user, token, refreshToken }) => {
				localStorage.setItem(STORAGE_KEYS.TOKEN, token)
				localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
				set(() => ({ user, token, refreshToken, isAuthenticated: true }))
			},
			logout: () => {
				localStorage.removeItem(STORAGE_KEYS.TOKEN)
				localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
				localStorage.removeItem(STORAGE_KEYS.USER)
				sessionStorage.removeItem(STORAGE_KEYS.TOKEN)
				sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
				set(() => ({ user: null, token: null, refreshToken: null, isAuthenticated: false }))
			},
			setTemp: (data: string) => set(() => ({ temp: data })),
		}),
		{
			name: "local-store",
			storage: localStorageConfig,
		}
	)
)
