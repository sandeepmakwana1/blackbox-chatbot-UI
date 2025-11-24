import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useNavigation } from "react-router"
import type { Route } from "./+types/root"
import "./styles/app.css"
import MainApp from "./app"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import LoadingBar, { LoadingBarContainer } from "react-top-loading-bar"
import { useEffect, useRef, useState } from "react"
import { TooltipProvider } from "~/components/ui/tooltip"
import AssetsManager from "~/lib/AssetsManager"
import { Loader } from "~/components/ui/loader"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
]

export function HydrateFallback() {
	return (
		<div className="flex items-center justify-center h-screen scale-x-[-1] bg-neutral-300">
			<img src={AssetsManager.ANIMATED_LOADER} width="64px" height="64px" />
		</div>
	)
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000, // Note: gcTime is now cacheTime in v5
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchOnReconnect: false,
		},
	},
})

export default function App() {
	const intervalRef = useRef<any>(null)
	const navigation = useNavigation()
	const [progress, setProgress] = useState<number>(0)
	const isLoading = navigation.state === "loading"

	useEffect(() => {
		const appHeight = () => {
			const doc = document.documentElement
			doc.style.setProperty("--window-height", `${window.innerHeight}px`)
		}

		appHeight()

		window.addEventListener("resize", appHeight)

		return () => {
			window.removeEventListener("resize", appHeight)
		}
	}, [])

	useEffect(() => {
		if (isLoading) {
			setProgress(0)
			intervalRef.current = setInterval(() => {
				setProgress((oldProgress) => {
					if (oldProgress >= 70) {
						clearInterval(intervalRef.current)
						return 70
					}
					return Math.min(oldProgress + 10, 70)
				})
			}, 100)
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
			setProgress(100)
		}
	}, [isLoading])

	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<LoadingBarContainer>
					<LoadingBar
						color="red"
						progress={progress}
						onLoaderFinished={() => setProgress(0)}
						height={1}
						waitingTime={500}
					/>
					<div className="relative">
						<div
							className={`transition-all duration-300 ${
								isLoading ? "blur-[2px] opacity-75 pointer-events-none" : "blur-none opacity-100"
							}`}
						>
							<MainApp />
						</div>

						{/* Loader overlay - appears in front of blurred content */}
						{isLoading && (
							<div className="absolute inset-0 flex items-center justify-center bg-transparent z-50">
								<Loader size="lg" /> {/* Adjust props as needed for your loader component */}
							</div>
						)}
					</div>
				</LoadingBarContainer>
			</TooltipProvider>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!"
	let details = "An unexpected error occurred."
	let stack: string | undefined

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error"
		details = error.status === 404 ? "The requested page could not be found." : error.statusText || details
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message
		stack = error.stack
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	)
}
