import { useEffect, useMemo } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Playground } from "~/components/playground/Playground"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { GradientIcon } from "~/components/ui/gradientIcon"
import { Loader } from "~/components/ui/loader"
import { usePlaygroundStore } from "~/store/playgroundStore"
import {
	resolvePlaygroundApiUrl,
	resolvePlaygroundUserEmail,
	resolvePlaygroundWsUrl,
	usePlaygroundConfigStore,
} from "~/store/playgroundConfigStore"
import { PlugZap, Settings2 } from "lucide-react"

const StandalonePlaygroundPage = () => {
	const { source_id } = useParams<{ source_id: string }>()
	const navigate = useNavigate()
	const { openPlayground } = usePlaygroundStore()
	const defaultSourceId = usePlaygroundConfigStore((state) => state.defaultSourceId)
	const apiBaseUrl = usePlaygroundConfigStore((state) => state.apiBaseUrl)
	const wsBaseUrl = usePlaygroundConfigStore((state) => state.wsBaseUrl)
	const configuredUser = usePlaygroundConfigStore((state) => state.userEmail)

	useEffect(() => {
		openPlayground()
	}, [openPlayground])

	// If someone lands here without a source_id, send them to a configured default or config page
	useEffect(() => {
		if (!source_id) {
			if (defaultSourceId) {
				navigate(`/playground/${encodeURIComponent(defaultSourceId)}`, { replace: true })
			} else {
				navigate("/playground/config", { replace: true })
			}
		}
	}, [defaultSourceId, navigate, source_id])

	const resolvedApiUrl = useMemo(() => resolvePlaygroundApiUrl(), [apiBaseUrl])
	const resolvedWsUrl = useMemo(() => resolvePlaygroundWsUrl(), [wsBaseUrl])
	const resolvedUser = useMemo(() => resolvePlaygroundUserEmail(), [configuredUser])

	if (!source_id) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#0B1437] text-white">
				<Loader />
			</div>
		)
	}

	return (
		<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
			<header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				<div className="space-y-2">
					<p className="text-xs uppercase tracking-[0.2em] text-[#6AC7A0]">Playground</p>
					<h1 className="text-2xl font-semibold text-[#0B1437]">Source: {source_id}</h1>
					<p className="text-sm text-neutral-600">
						This view isolates the playground experience. Use the config page to swap environments or set a
						default source ID.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="secondary" asChild>
						<Link to="/playground/config" className="flex items-center gap-1">
							<GradientIcon
								Icon={Settings2}
								size={14}
								mode="stroke"
								stops={[
									{ offset: "0%", color: "#7CD2FF" },
									{ offset: "100%", color: "#7AD7B0" },
								]}
							/>
							Config page
						</Link>
					</Button>
				</div>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<Card className="lg:col-span-2 bg-white/95 border-[#D6E1F5] shadow-[0_10px_30px_-14px_rgba(11,20,55,0.4)]">
					<CardHeader className="pb-2 flex items-center gap-2">
						<div className="p-2 rounded-lg bg-[#EEF4FF] text-[#0B1437]">
							<PlugZap size={16} />
						</div>
						<div>
							<CardTitle>Live playground</CardTitle>
							<CardDescription>Full feature parity with the in-app playground</CardDescription>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<div className="h-[70vh] bg-white rounded-b-xl overflow-hidden border-t border-[#E6ECF8]">
							<Playground className="w-full h-full" context="content-generation" />
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white/95 border-[#D6E1F5] shadow-[0_10px_30px_-14px_rgba(11,20,55,0.4)]">
					<CardHeader className="pb-2">
						<CardTitle>Runtime wiring</CardTitle>
						<CardDescription>Current connection targets</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="border border-[#E6ECF8] rounded-lg p-3 bg-[#F9FBFF]">
							<p className="text-xs text-neutral-600 mb-1">API</p>
							<p className="text-sm font-mono text-[#0B1437] break-all">{resolvedApiUrl}</p>
						</div>
						<div className="border border-[#E6ECF8] rounded-lg p-3 bg-[#F9FBFF]">
							<p className="text-xs text-neutral-600 mb-1">WebSocket</p>
							<p className="text-sm font-mono text-[#0B1437] break-all">{resolvedWsUrl}</p>
						</div>
						<div className="border border-[#E6ECF8] rounded-lg p-3 bg-[#F9FBFF]">
							<p className="text-xs text-neutral-600 mb-1">User</p>
							<p className="text-sm font-mono text-[#0B1437] break-all">
								{resolvedUser || "local-store user or random_user"}
							</p>
						</div>
						<p className="text-xs text-neutral-600">
							Use WebSocket path <code>/ws/&lt;user&gt;/&lt;thread&gt;</code>. REST calls hit{" "}
							<code>/api/chats</code> and <code>/conversation</code> for history + replay.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export default StandalonePlaygroundPage
