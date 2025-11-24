import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "iconsax-reactjs"

export default function PreStepsHeader() {
	const navigate = useNavigate()
	const { source_id } = useParams<{ source_id: string }>()

	return (
		<header className="flex items-center justify-between px-4 py-2 border-b border-[#e2e8f0] bg-white">
			<div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/sourcing/${source_id}`)}>
				<ArrowLeft size={18} color="#92A0B5" />
				Back to proposal details
			</div>

			<div className="flex items-center gap-2"></div>
		</header>
	)
}
