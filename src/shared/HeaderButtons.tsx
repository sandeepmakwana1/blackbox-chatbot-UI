import { useState } from "react"
import { Button } from "../components/ui/button"
import { useNavigate } from "react-router-dom"
import { Add, ArchiveBox, Edit, TickCircle, Verify } from "iconsax-reactjs"
import { ConfirmationModal } from "../components/common/ConfirmationModal"
import { useRevalidateRfpMutation } from "~/handlers/validationHandler"
import { toast } from "sonner"
import { getStageStatus, updateStageStatus } from "~/handlers/stage"
import { StageName } from "~/types/stage"
import { ShieldCheck } from "lucide-react"

const HEADER_BUTTON_TEXT = {
	ADD_NEW_OPPORTUNITY: "Add new opportunity",
	ARCHIVE: "Archive",
	EDIT_DETAILS: "Edit details",
	VALIDATE_RFP: "Validate",
	DRAFT_PROPOSAL: "Draft Proposal →",
	REVALIDATE_RFP: "Revalidate",
}

export const HeaderButtons = ({
	isSourcingPage = false,
	isSourcingListPage,
	isDetailPage,
	canValidate,
	source_id,
	handleOpenModal,
	showValidateButton = true,
}: {
	isSourcingPage: boolean
	isSourcingListPage: boolean
	isDetailPage: boolean
	canValidate: boolean
	source_id?: string
	handleOpenModal?: () => void
	showValidateButton?: boolean
}) => {
	const navigate = useNavigate()
	const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false)
	const [archiveReason, setArchiveReason] = useState("")
	const [isDraftProposalLoading, setIsDraftProposalLoading] = useState(false)

	const handleOpenArchiveModal = () => setIsArchiveModalOpen(true)
	const handleCloseArchiveModal = () => {
		setIsArchiveModalOpen(false)
		setArchiveReason("")
	}

	const revalidateMutation = useRevalidateRfpMutation()

	const handleArchive = () => {
		console.log("Archiving with reason:", archiveReason)
		handleCloseArchiveModal()
		//TODO: Replace this with actual archive API call or logic
	}

	const handleRevalidate = () => {
		if (!source_id) {
			toast.error("Source ID is missing. Cannot revalidate.")
			return
		}
		revalidateMutation.mutate(parseInt(source_id))
	}

	const handleDraftProposalClick = async () => {
		if (!source_id) return

		setIsDraftProposalLoading(true)
		try {
			const stage = await updateStageStatus(parseInt(source_id), "Pre-Steps")
			const res = await getStageStatus(parseInt(source_id))

			if (res.name == StageName.PreSteps) {
				navigate(`/presteps/${source_id}`)
				return
			} else if (res.name == StageName.Draft) {
				navigate(`/content-generation/${source_id}`)
				return
			} else {
				navigate(`/sourcing/${source_id}`)
			}
		} catch (error) {
			console.error("Error in draft proposal click:", error)
			toast.error("Failed to process draft proposal. Please try again.")
		} finally {
			setIsDraftProposalLoading(false)
		}
	}

	return (
		<>
			<div className="flex items-center gap-2">
				{/* ADD_NEW_OPPORTUNITY: isSourcingListPage */}
				{isSourcingPage && handleOpenModal && (
					<Button
						variant="primary"
						size="sm"
						onClick={handleOpenModal}
						aria-label={HEADER_BUTTON_TEXT.ADD_NEW_OPPORTUNITY}
					>
						<Add />
						{HEADER_BUTTON_TEXT.ADD_NEW_OPPORTUNITY}
					</Button>
				)}

				{/* ARCHIVE and EDIT_DETAILS: isDetailPage */}
				{isDetailPage && (
					<div className="flex items-center gap-2">
						<div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
							<Button
								variant="secondary"
								size="sm"
								onClick={handleOpenArchiveModal}
								title={HEADER_BUTTON_TEXT.ARCHIVE}
								className="hover:bg-[#FFEBE9] hover:text-white transition-colors duration-200 px-2 py-1.5 border-transparent rounded-none"
								aria-label={HEADER_BUTTON_TEXT.ARCHIVE}
							>
								<ArchiveBox size="20" color="#CD2F34" variant="Linear" />
							</Button>

							<div className="h-7 w-[1px] bg-gray-300"></div>

							<Button
								variant="secondary"
								size="sm"
								onClick={() => navigate(`/edit/${source_id}`)}
								title={HEADER_BUTTON_TEXT.EDIT_DETAILS}
								className="hover:bg-gray-200 hover:text-black transition-colors duration-200 px-2 py-1 border-transparent rounded-none"
								aria-label={HEADER_BUTTON_TEXT.EDIT_DETAILS}
							>
								<Edit size="20" variant="Linear" />
							</Button>
						</div>

						{/* REVALIDATE_RFP: isDetailPage */}
						<Button
							variant="tertiary"
							size="sm"
							onClick={handleRevalidate}
							disabled={revalidateMutation.isPending}
						>
							<ShieldCheck strokeWidth={2.2} />
							{revalidateMutation.isPending ? "Revalidating..." : HEADER_BUTTON_TEXT.REVALIDATE_RFP}
						</Button>
					</div>
				)}

				{/* VALIDATE_RFP: isSourcingListPage and canValidate */}
				{isSourcingListPage && canValidate && showValidateButton && (
					<Button variant="tertiary" size="sm" onClick={() => navigate(`/validate/${source_id}`)}>
						<ShieldCheck strokeWidth={2.2} />
						{HEADER_BUTTON_TEXT.VALIDATE_RFP}
					</Button>
				)}

				{/* DRAFT_PROPOSAL: (isSourcingListPage or isDetailPage) and canValidate */}
				{(isSourcingListPage || isDetailPage) && canValidate && (
					<Button
						variant="primary"
						size="sm"
						onClick={handleDraftProposalClick}
						disabled={isDraftProposalLoading}
					>
						{isDraftProposalLoading ? "Processing..." : HEADER_BUTTON_TEXT.DRAFT_PROPOSAL}
					</Button>
				)}
			</div>

			<ConfirmationModal
				isOpen={isArchiveModalOpen}
				onClose={handleCloseArchiveModal}
				onConfirm={handleArchive}
				title="Archive Proposal?"
				icon={ArchiveBox}
				text="If you archive this proposal, it'll move to the Archived tab. You can unarchive it later."
				inputPlaceholder="Please add the reason for future reference"
				confirmLabel="Archive"
				cancelLabel="Cancel"
				inputValue={archiveReason}
				onInputChange={(value) => setArchiveReason(value)}
			/>
		</>
	)
}
