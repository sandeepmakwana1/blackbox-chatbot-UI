import { useState } from "react"
import { Dialog } from "../../../components/ui/dialog"
import { useQueryClient } from "@tanstack/react-query"
import { useLocation } from "react-router-dom"
import { useParams } from "react-router"
import { uploadNewRfp, useSourcingItemById } from "../../../handlers/sourcingHandler"
import { SharedHeader } from "../../../shared/SharedHeader"
import AddNewProposalModal from "../../../modals/sourcing/AddNewPropsalModal"

export default function SourcingHeader() {
	const [isModalOpen, setIsModalOpen] = useState(false)
	const queryClient = useQueryClient()
	const location = useLocation()
	const { source_id } = useParams<{ source_id?: string }>()
	const numericSourceId = source_id ? Number(source_id) : undefined
	const { data: sourcingItem } = useSourcingItemById(numericSourceId)

	const isSourcingPage = location.pathname === "/sourcing"
	const isSourcingListPage = /^\/sourcing\/\d+$/.test(location.pathname)
	const canValidate = sourcingItem && (sourcingItem.URLupload?.length > 0 || sourcingItem.Manualupload?.length > 0)

	const handleSaveProposal = async (rfpData: any, files: File[]) => {
		const data = await uploadNewRfp(rfpData, files)
		if (data) {
			setIsModalOpen(false)
			await queryClient.invalidateQueries({ queryKey: ["sourcingItems", "User"] })
		}
	}

	const handleOpenModal = () => setIsModalOpen(true)
	const handleCloseModal = () => setIsModalOpen(false)

	return (
		<>
			<SharedHeader
				isSourcingPage={isSourcingPage}
				isSourcingListPage={isSourcingListPage}
				isDetailPage={false}
				canValidate={!!canValidate}
				source_id={source_id}
				handleOpenModal={handleOpenModal}
			/>

			{isModalOpen && (
				<Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
					<AddNewProposalModal onSave={handleSaveProposal} />
				</Dialog>
			)}
		</>
	)
}
