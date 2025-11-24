import { useNavigate } from "react-router-dom"
import { Button } from "~/components/ui/button"
import BatchHistory from "./BatchHistory"

const BulkView = () => {
	const navigate = useNavigate()
	return (
		<div className="flex flex-col h-full">
			<BatchHistory />
		</div>
	)
}

export default BulkView
