import { useEffect } from "react"
import { usePreStepStore } from "~/store/preStepStore"
import { useDeepResearchStatus } from "~/handlers/preStepsHandlers"
import { toast } from "sonner"
import { Loader } from "~/components/ui/loader"

interface DeepResearchPillProps {
	sourceId: string | undefined
}

const DeepResearchPill: React.FC<DeepResearchPillProps> = ({ sourceId }) => {
	const { isDeepResearchPolling, setDeepResearchPolling } = usePreStepStore()

	const { data: deepResearchStatusData } = useDeepResearchStatus(
		parseInt(sourceId ?? "0"),
		true,
		isDeepResearchPolling
	)

	useEffect(() => {
		if (deepResearchStatusData?.status === "COMPLETED") {
			setDeepResearchPolling(false)
			toast.success("Deep research has been completed successfully.")
		}
	}, [deepResearchStatusData, setDeepResearchPolling])

	if (!isDeepResearchPolling) {
		return null
	}

	// Format the progress text
	const getProgressText = () => {
		if (deepResearchStatusData?.total_tasks && deepResearchStatusData?.completed_tasks !== undefined) {
			return `Deep research in progress (${deepResearchStatusData.completed_tasks}/${deepResearchStatusData.total_tasks})`
		}
		return "Deep research in progress"
	}

	return (
		<div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
			<div
				className="flex select-none items-center gap-1 rounded-full px-3 py-2 text-sm font-normal text-warning-300"
				style={{
					backgroundColor: "#20252D",
					border: "2px solid #FABC37",
					boxShadow: "2px 4px 14.1px 0 #B5AEBA",
				}}
			>
				<Loader size="sm" className="border-warning-300 border-t-warning-200" />
				<span>{getProgressText()}</span>
			</div>
		</div>
	)
}

export default DeepResearchPill
