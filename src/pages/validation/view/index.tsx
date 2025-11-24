import { useParams } from "react-router-dom"
import ValidateViewTabs from "~/pages/validation/view/ValidationViewTabs"

function ValidateViewPage() {
	const { source_id } = useParams()

	if (!source_id) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-gray-500">No RFP selected for validation.</p>
			</div>
		)
	}

	return (
		<div className="h-full w-full overflow-hidden">
			<ValidateViewTabs source_id={Number(source_id)} />
		</div>
	)
}

export default ValidateViewPage
