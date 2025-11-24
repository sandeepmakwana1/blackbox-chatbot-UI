import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useLocalStore } from "app/store/data"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Lock } from "iconsax-reactjs"

// Storage keys constants
const STORAGE_KEYS = {
	TOKEN: "token",
	REFRESH_TOKEN: "refresh_token",
	USER: "user",
}

// URL parameter keys constants
const URL_PARAMS = {
	TOKEN: "token",
	REFRESH_TOKEN: "refresh_token",
	ERROR: "error",
	ERROR_TYPE: "error_type",
	SUCCESS: "success",
}

// Error type mappings for user-friendly messages
const ERROR_MESSAGES = {
	domain_not_allowed: "Only @consultadd.com email addresses are allowed to access this application.",
	user_not_registered:
		"Your account is not registered in the system. Please contact your administrator to get access.",
	user_inactive: "Your account has been deactivated. Please contact your administrator.",
	auth_init_failed: "Failed to start the login process. Please try again.",
	token_exchange_failed: "Authentication with Google failed. Please try again.",
	userinfo_failed: "Could not retrieve your profile information. Please try again.",
	invalid_userinfo: "Invalid profile information received from Google. Please try again.",
	database_error: "A system error occurred. Please try again later or contact support.",
	token_creation_failed: "Failed to create your session. Please try again.",
	token_encoding_failed: "Session processing failed. Please try again.",
	access_forbidden: "Access denied. You don't have permission to access this application.",
	bad_request: "Invalid login request. Please try again.",
	http_error: "An authentication error occurred. Please try again.",
	unexpected_error: "An unexpected error occurred. Please try again later.",
	jwt_decode_error: "Invalid authentication data received. Please try logging in again.",
	network_error: "Network connection failed. Please check your internet connection and try again.",
}

// JWT token decoding function
const decodeJWTToken = (token) => {
	// Validate token format
	if (!token || typeof token !== "string" || token.split(".").length !== 3) {
		throw new Error("Invalid token format")
	}

	const base64Url = token.split(".")[1]
	if (!base64Url) {
		throw new Error("Invalid token structure")
	}

	const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
	const jsonPayload = decodeURIComponent(
		atob(base64)
			.split("")
			.map(function (c) {
				return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
			})
			.join("")
	)

	const payload = JSON.parse(jsonPayload)

	// Validate required fields
	if (!payload.sub) {
		throw new Error("Invalid token payload: missing user email")
	}

	const user = {
		email: payload.sub,
		name: payload.name || payload.sub.split("@")[0],
		picture: payload.picture || "",
		role: payload.role || "user",
		roleId: payload.role_id,
	}

	return { payload, user }
}

function Login() {
	const navigate = useNavigate()
	const setCredentials = useLocalStore((state) => state.setCredentials)
	const [error, setError] = useState(null)
	const [isLoading, setIsLoading] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)

	useEffect(() => {
		// Check if user is already authenticated
		if (useLocalStore.getState().isAuthenticated) {
			navigate("/sourcing")
			return
		}

		// Process URL parameters
		const urlParams = new URLSearchParams(window.location.search)
		const token = urlParams.get(URL_PARAMS.TOKEN)
		const refreshToken = urlParams.get(URL_PARAMS.REFRESH_TOKEN)
		const errorParam = urlParams.get(URL_PARAMS.ERROR)
		const errorType = urlParams.get(URL_PARAMS.ERROR_TYPE)
		const success = urlParams.get(URL_PARAMS.SUCCESS)

		// Clear URL parameters immediately
		if (urlParams.toString()) {
			window.history.replaceState({}, document.title, "/login")
		}

		// Handle error from backend
		if (errorParam) {
			const errorMessage = ERROR_MESSAGES[errorType] || decodeURIComponent(errorParam)
			setError(errorMessage)
			toast.error(errorMessage)
			return
		}

		// Handle successful authentication
		if (token && success) {
			setIsProcessing(true)
			processAuthToken(token, refreshToken)
		}
	}, [setCredentials, navigate])

	const processAuthToken = async (token, refreshToken) => {
		try {
			// Store tokens immediately
			sessionStorage.setItem(STORAGE_KEYS.TOKEN, token)
			localStorage.setItem(STORAGE_KEYS.TOKEN, token)

			if (refreshToken) {
				sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
				localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
			}

			// Decode JWT token using the extracted function
			const { user } = decodeJWTToken(token)

			// Store user info
			localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))

			// Update app state
			setCredentials({ user, token, refreshToken })

			// Navigate to main app
			navigate("/sourcing")
			toast.success(`Welcome back, ${user.name}!`)
		} catch (error) {
			console.error("JWT Processing Failed:", error)

			// Clear any stored tokens on error
			sessionStorage.removeItem(STORAGE_KEYS.TOKEN)
			sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
			localStorage.removeItem(STORAGE_KEYS.TOKEN)
			localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
			localStorage.removeItem(STORAGE_KEYS.USER)

			const errorMessage = ERROR_MESSAGES.jwt_decode_error
			setError(errorMessage)
			toast.error(errorMessage)
		} finally {
			setIsProcessing(false)
		}
	}

	const handleGoogleLogin = async () => {
		if (isLoading) return

		setIsLoading(true)
		setError(null)

		try {
			const apiBaseUrl = import.meta.env.VITE_API_URL || "https://blackboxai-dev.log1.com"

			// Validate API URL
			if (!apiBaseUrl) {
				throw new Error("API URL not configured")
			}

			window.location.href = `${apiBaseUrl}/auth/google/login`
		} catch (error) {
			console.error("Google login redirect failed:", error)

			let errorMessage
			if (error.message === "network_error") {
				errorMessage = ERROR_MESSAGES.network_error
			} else {
				errorMessage = ERROR_MESSAGES.auth_init_failed
			}

			setError(errorMessage)
			toast.error(errorMessage)
			setIsLoading(false)
		}
	}

	const clearError = () => {
		setError(null)
	}

	// Error Modal Component
	const ErrorModal = ({ error, open, onClose }) => {
		if (!error) return null

		return (
			<Dialog open={open} onOpenChange={onClose}>
				<DialogContent showCloseButton={false} className=" w-93 max-w-md">
					<DialogHeader>
						<div className="flex flex-col items-left gap-y-4">
							<div className="p-2.5 bg-danger-100 h-full w-fit rounded-[10px]">
								<Lock size={24} color="#E54848" />
							</div>

							<DialogTitle className="text-md font-medium text-gray-900">Unauthorized Access</DialogTitle>
						</div>
						<DialogDescription className="text-sm text-neutral-700 text-left">{error}</DialogDescription>
					</DialogHeader>

					<Button variant="primary" onClick={onClose}>
						Ok, got it
					</Button>
				</DialogContent>
			</Dialog>
		)
	}

	if (isProcessing) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-background">
				<Card className="w-[350px]">
					<CardContent className="flex flex-col items-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						<p className="mt-4 text-sm text-muted-foreground">Processing your login...</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<>
			<ErrorModal error={error} open={error != null} onClose={clearError} />

			<div className="flex items-center justify-center min-h-screen bg-background">
				<Card className="w-[350px]">
					<CardHeader>
						<CardTitle className="font-bold text-xl">Welcome</CardTitle>
						<CardDescription>Sign in to continue to the application</CardDescription>
					</CardHeader>

					<div className="flex justify-center py-4">
						<img
							src="consultadd-logo.png"
							alt="ConsultAdd Logo"
							className="h-25 w-auto object-contain rounded-2xl"
						/>
					</div>
					<CardContent className="flex flex-col items-center">
						<button
							onClick={handleGoogleLogin}
							className="w-full h-12 relative overflow-hidden group bg-white hover:bg-gray-50 text-gray-700 border-gray-300 rounded border"
						>
							<div className="absolute left-0 top-0 bottom-0 w-12 bg-white flex items-center justify-center border-r border-gray-300">
								<svg className="h-5 w-5" viewBox="0 0 24 24">
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										fill="#4285F4"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										fill="#34A853"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
										fill="#FBBC05"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										fill="#EA4335"
									/>
								</svg>
							</div>
							<span className="ml-8 font-medium">Sign in with Google</span>
						</button>
					</CardContent>
				</Card>
			</div>
		</>
	)
}

export default Login
