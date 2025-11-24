import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import { getStageStatus } from "~/handlers/stage"
import { StageName } from "~/types/stage"
import { Loader } from "~/components/ui/loader"

export default function StageProtectedRoute() {
	const navigate = useNavigate()
	const location = useLocation()

	// Extract source_id if present
	const { source_id } = useParams<{ source_id: string }>()

	const [loading, setLoading] = useState<boolean>(true)

	useEffect(() => {
		let ignore = false

		const checkStage = async () => {
			if (!source_id) {
				setLoading(false)
				return
			}

			try {
				const res = await getStageStatus(parseInt(source_id), true)

				if (res.name === StageName.PreSteps) {
					navigate(`/presteps/${source_id}`, { replace: true })
					return
				} else if (res.name === StageName.Draft) {
					navigate(`/content-generation/${source_id}`, { replace: true })
					return
				} else {
					navigate(`/sourcing/${source_id}`, { replace: true })
				}
			} catch (err) {
				// Fail-open: allow navigation on API error
				console.error("Stage check failed", err)
			} finally {
				if (!ignore) setLoading(false)
			}
		}

		checkStage()

		return () => {
			ignore = true
		}
	}, [location.pathname])

	if (loading) {
		return (
			<div className="flex flex-col gap-2 items-center justify-center h-screen w-full">
				<Loader size="xl" variant="primary" />
				<p className="text-neutral-800">Checking stage...</p>
			</div>
		)
	}

	return <Outlet />
}
