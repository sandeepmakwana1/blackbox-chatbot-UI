import { useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import SourcingItemView from "~/pages/sourcing/view/SourcingItemView"

function SourcingViewPage() {
	const { source_id } = useParams()
	const navigate = useNavigate()

	useEffect(() => {
		if (!source_id) {
			navigate("/sourcing")
		}
	}, [source_id, navigate])

	return (
		<div className="flex h-full">
			<SourcingItemView />
		</div>
	)
}

export default SourcingViewPage
