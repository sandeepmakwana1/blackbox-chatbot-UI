import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { GradientIcon } from "~/components/ui/gradientIcon"
import { ArrowRight, CheckCircle2, PlugZap, Settings2, Wand2 } from "lucide-react"
import {
	playgroundDefaults,
	resolvePlaygroundApiUrl,
	resolvePlaygroundUserEmail,
	resolvePlaygroundWsUrl,
	usePlaygroundConfigStore,
} from "~/store/playgroundConfigStore"

type FormState = {
	apiBaseUrl: string
	wsBaseUrl: string
	defaultSourceId: string
	userEmail: string
}

const ConfigPage = () => {
	const navigate = useNavigate()
	const {
		apiBaseUrl,
		wsBaseUrl,
		defaultSourceId,
		userEmail,
		setApiBaseUrl,
		setWsBaseUrl,
		setDefaultSourceId,
		setUserEmail,
		reset,
	} = usePlaygroundConfigStore()

	const [formState, setFormState] = useState<FormState>({
		apiBaseUrl,
		wsBaseUrl,
		defaultSourceId,
		userEmail,
	})

	// Allow scrolling on this page even though the global stylesheet hides body overflow.
	useEffect(() => {
		const prevBodyOverflow = document.body.style.overflow
		const prevHtmlOverflow = document.documentElement.style.overflow
		document.body.style.overflow = "auto"
		document.documentElement.style.overflow = "auto"
		return () => {
			document.body.style.overflow = prevBodyOverflow
			document.documentElement.style.overflow = prevHtmlOverflow
		}
	}, [])

	useEffect(() => {
		setFormState({
			apiBaseUrl,
			wsBaseUrl,
			defaultSourceId,
			userEmail,
		})
	}, [apiBaseUrl, wsBaseUrl, defaultSourceId, userEmail])

	const resolvedApiUrl = useMemo(() => resolvePlaygroundApiUrl(), [apiBaseUrl])
	const resolvedWsUrl = useMemo(() => resolvePlaygroundWsUrl(), [wsBaseUrl])
	const resolvedUser = useMemo(() => resolvePlaygroundUserEmail(), [userEmail])

	const handleChange = (key: keyof FormState, value: string) => {
		setFormState((prev) => ({ ...prev, [key]: value }))
	}

	const persistConfig = () => {
		setApiBaseUrl(formState.apiBaseUrl.trim())
		setWsBaseUrl(formState.wsBaseUrl.trim())
		setDefaultSourceId(formState.defaultSourceId.trim())
		setUserEmail(formState.userEmail.trim())
	}

	const handleSave = () => {
		persistConfig()
		toast.success("Config saved for this browser session.")
	}

	const handleReset = () => {
		reset()
		toast.success("Reverted to environment defaults.")
	}

	const handleLaunch = () => {
		const targetSource = (formState.defaultSourceId || "").trim() || "demo"
		persistConfig()
		navigate(`/playground/${encodeURIComponent(targetSource)}`)
	}

	return (
		<div className="relative min-h-screen overflow-y-auto overflow-x-hidden">
			<div className="absolute inset-0 bg-gradient-to-br from-[#0B1437] via-[#0F2B46] to-[#0A455F] opacity-90" />
			<div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
				<header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div className="space-y-2 text-white">
						<p className="text-xs uppercase tracking-[0.2em] text-[#7FD8F6]">Config page</p>
						<h1 className="text-2xl font-semibold">Playground standalone setup</h1>
						<p className="text-sm text-[#C8E5FF] max-w-3xl">
							Wire the frontend directly to your playground backend. These settings are stored locally so you
							can test different environments without rebuilding the app.
						</p>
					</div>
					<div className="flex gap-2">
						<Button variant="secondary" asChild>
							<Link to="/playground/demo" className="flex items-center gap-1">
								<GradientIcon
									Icon={Wand2}
									size={14}
									mode="stroke"
									stops={[
										{ offset: "0%", color: "#7CD2FF" },
										{ offset: "100%", color: "#7AD7B0" },
									]}
								/>
								Quick start
							</Link>
						</Button>
						<Button onClick={handleLaunch} className="bg-[#7AD7B0] text-[#0B1437] hover:bg-[#6AC7A0]">
							Open playground
							<ArrowRight size={14} className="ml-1" />
						</Button>
					</div>
				</header>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<Card className="lg:col-span-2 bg-white/95 border-[#D6E1F5] shadow-[0_10px_30px_-14px_rgba(11,20,55,0.4)]">
						<CardHeader className="pb-2">
							<div className="flex items-center gap-2">
								<div className="p-2 rounded-lg bg-[#EEF4FF] text-[#0B1437]">
									<Settings2 size={16} />
								</div>
								<div>
									<CardTitle>Backend connection</CardTitle>
									<CardDescription>API + WebSocket endpoints and identity</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="api-base">API base URL</Label>
									<Input
										id="api-base"
										placeholder={playgroundDefaults.api}
										value={formState.apiBaseUrl}
										onChange={(e) => handleChange("apiBaseUrl", e.target.value)}
									/>
									<p className="text-xxs text-neutral-500">
										Used for REST calls like chats and prompt optimization.
									</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="ws-base">WebSocket URL</Label>
									<Input
										id="ws-base"
										placeholder={playgroundDefaults.ws}
										value={formState.wsBaseUrl}
										onChange={(e) => handleChange("wsBaseUrl", e.target.value)}
									/>
									<p className="text-xxs text-neutral-500">Used for live chat streaming.</p>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="source-id">Default source ID</Label>
									<Input
										id="source-id"
										placeholder="rfp-1234"
										value={formState.defaultSourceId}
										onChange={(e) => handleChange("defaultSourceId", e.target.value)}
									/>
									<p className="text-xxs text-neutral-500">
										Used in the URL route. Leave blank to use <code>demo</code>.
									</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="user-email">User email (optional)</Label>
									<Input
										id="user-email"
										placeholder="you@company.com"
										value={formState.userEmail}
										onChange={(e) => handleChange("userEmail", e.target.value)}
									/>
									<p className="text-xxs text-neutral-500">
										Overrides the local-store user for chat ownership.
									</p>
								</div>
							</div>

							<div className="flex flex-wrap gap-2">
								<Button variant="secondary" onClick={handleReset}>
									Reset to defaults
								</Button>
								<Button onClick={handleSave} className="bg-[#0B1437] text-white hover:bg-[#101E4C]">
									Save
								</Button>
								<Button onClick={handleLaunch} className="bg-[#7AD7B0] text-[#0B1437] hover:bg-[#6AC7A0]">
									Launch playground
									<ArrowRight size={14} className="ml-1" />
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white/95 border-[#D6E1F5] shadow-[0_10px_30px_-14px_rgba(11,20,55,0.4)]">
						<CardHeader className="pb-2">
							<div className="flex items-center gap-2">
								<div className="p-2 rounded-lg bg-[#EEF4FF] text-[#0B1437]">
									<PlugZap size={16} />
								</div>
								<div>
									<CardTitle>Connection preview</CardTitle>
									<CardDescription>Effective runtime values</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="border border-[#E6ECF8] rounded-lg p-3 bg-[#F9FBFF]">
								<p className="text-xs text-neutral-600 mb-1">API base</p>
								<p className="text-sm font-mono text-[#0B1437] break-all">{resolvedApiUrl}</p>
							</div>
							<div className="border border-[#E6ECF8] rounded-lg p-3 bg-[#F9FBFF]">
								<p className="text-xs text-neutral-600 mb-1">WebSocket</p>
								<p className="text-sm font-mono text-[#0B1437] break-all">{resolvedWsUrl}</p>
							</div>
							<div className="border border-[#E6ECF8] rounded-lg p-3 bg-[#F9FBFF]">
								<p className="text-xs text-neutral-600 mb-1">User identifier</p>
								<p className="text-sm font-mono text-[#0B1437] break-all">
									{resolvedUser || "local-store user or random_user"}
								</p>
							</div>
							<div className="border border-dashed border-[#D6E1F5] rounded-lg p-3 text-xs text-neutral-700 space-y-2">
								<p className="font-medium text-[#0B1437]">Backend checklist</p>
								<ul className="list-disc list-inside space-y-1">
									<li>Allow CORS for this origin.</li>
									<li>Ensure WebSocket path expects <code>/ws/&lt;user&gt;/&lt;thread?&gt;</code>.</li>
									<li>Expose chat APIs: <code>/api/chats/:user</code> and <code>/conversation/:user/:thread</code>.</li>
									<li>Optional: <code>/api/prompt/optimize</code> for prompt enhancement.</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				</div>

				<Card className="bg-white/95 border-[#D6E1F5] shadow-[0_10px_30px_-14px_rgba(11,20,55,0.4)]">
					<CardHeader className="pb-2">
						<div className="flex items-center gap-2">
							<div className="p-2 rounded-lg bg-[#EEF4FF] text-[#0B1437]">
								<CheckCircle2 size={16} />
							</div>
							<div>
								<CardTitle>How deployment works</CardTitle>
								<CardDescription>
									Environment variables + this page = everything needed for a standalone playground build.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-1">
							<p className="text-xs uppercase tracking-wide text-neutral-500">1. Build-time</p>
							<p className="text-sm font-medium text-[#0B1437]">Set env values</p>
							<p className="text-xs text-neutral-600">
								Use <code>VITE_PLAYGROUND_API_URL</code> and <code>VITE_PLAYGROUND_WB_URL</code> for defaults.
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs uppercase tracking-wide text-neutral-500">2. Runtime</p>
							<p className="text-sm font-medium text-[#0B1437]">Override here</p>
							<p className="text-xs text-neutral-600">
								Settings persist in <code>localStorage</code> under <code>playground-config</code>.
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs uppercase tracking-wide text-neutral-500">3. Launch</p>
							<p className="text-sm font-medium text-[#0B1437]">Open the playground</p>
							<p className="text-xs text-neutral-600">
								Go to <code>/playground/&lt;source_id&gt;</code> and start chatting. Configurable user + context are
								baked into the URL.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export default ConfigPage
