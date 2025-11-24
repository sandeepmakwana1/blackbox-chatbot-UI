import { useState } from "react"
import {
	getOutlineJson,
	getUserPreferences,
	putUserPreferences,
	postOutlineJson,
	getTopicSelection,
	startDeepResearch,
	putAgencyReferences,
	getDeepResearchStatus,
	getOutlineJsonUpdateStatus,
} from "~/handlers/preStepsHandlers"
import { usePreStepStore } from "~/store/preStepStore"
import { toast } from "sonner"
import { Stepper } from "~/components/ui/stepper"
import { queryClient } from "~/root"
import TopicSelectionConfirmDialog from "~/pages/proposaldrafting/presteps/topicselection/TopicSelectionConfirmDialog" // Add this import
import { updateStageStatus } from "~/handlers/stage"
import { defaultSections } from "~/constants/sections"
import type { Section } from "~/constants/sections"

interface ProposalDraftingHeaderProps {
	initialSectionIndex?: number
	onSectionChange?: (section: Section) => void
	onNavigateToContentGeneration?: () => void
	isLoading?: boolean
	sourceId?: string
	executiveSummaryIndex?: number | null
	isChanged?: boolean
}

const ProposalDraftingHeader: React.FC<ProposalDraftingHeaderProps> = ({
	initialSectionIndex = 0,
	onSectionChange,
	onNavigateToContentGeneration,
	sourceId,
	executiveSummaryIndex,
	isChanged = false,
}) => {
	const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(initialSectionIndex)
	const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false)
	const [showTopicSelectionDialog, setShowTopicSelectionDialog] = useState<boolean>(false)
	const {
		userPreferences,
		table_of_contet,
		topicSelectedQuestions,
		selectedAgencyReferences,
		deepResearchEnabled,
		deepResearchStatus,
		tocVersion,
		setDeepResearchPolling,
	} = usePreStepStore()

	const [isSending, setIsSending] = useState<boolean>(false)

	const proceedFromTopicSelection = async () => {
		try {
			setIsSending(true)
			const result = await startDeepResearch(parseInt(sourceId), topicSelectedQuestions, deepResearchEnabled)

			if (deepResearchEnabled) {
				if (result?.success) {
					setDeepResearchPolling(true)
				} else if (result?.alreadyInProgress) {
					toast("Deep research is already running. You can track its progress.")
					setDeepResearchPolling(true)
				}
			}

			// This part of the logic remains the same, as we always want to advance to the next step.
			const res = await getOutlineJson(parseInt(sourceId))
			if (res.status === "completed") {
				const newIndex = currentSectionIndex + 1
				setCurrentSectionIndex(newIndex)
				onSectionChange?.(defaultSections[newIndex])
			} else if (res.status === "processing") {
				toast("Table of Contents is being created. Please wait and try again.")
				return
			} else {
				toast("An error occurred while checking Table of Contents status.")
				return
			}
		} catch (error) {
			console.error("Error in proceedFromTopicSelection:", error)
			toast.error("An unexpected error occurred while proceeding.")
		} finally {
			setShowTopicSelectionDialog(false)
			setIsCheckingStatus(false)
			setIsSending(false)
		}
	}

	const handleGenerateDraft = async () => {
		setIsCheckingStatus(true)
		if (isLoading) return // Prevent multiple submissions

		const res = await getOutlineJsonUpdateStatus(parseInt(sourceId))

		if (res.status === "UPDATING") {
			setIsCheckingStatus(false)
			toast("Table of Contents is being updated. Please wait and try again.")
			return
		}

		try {
			await putUserPreferences(parseInt(sourceId), userPreferences)
			await updateStageStatus(parseInt(sourceId), "Draft")
			queryClient.invalidateQueries({ queryKey: ["outlineJson", parseInt(sourceId)] })
			onNavigateToContentGeneration?.()
		} catch (err) {
			console.error("Error generating draft:", err)
			toast.error(`Error In updating toc: ${err.message}`)
		} finally {
			setIsCheckingStatus(false)
		}
	}

	const handleStepChange = async (newStepIndex: number) => {
		const currentSection = defaultSections[currentSectionIndex]

		// If going backwards, allow immediate navigation
		if (newStepIndex < currentSectionIndex) {
			// Save data when leaving certain sections
			if (currentSection.id === "agency-references" && sourceId) {
				await putAgencyReferences(parseInt(sourceId), selectedAgencyReferences)
			}
			if (currentSection.id === "preferences" && sourceId) {
				if (userPreferences && userPreferences.length > 0) {
					await putUserPreferences(parseInt(sourceId), userPreferences)
				}
			}
			if (currentSection.id === "table-of-content" && sourceId) {
				if (executiveSummaryIndex === null) {
					toast.error("Please select Executive Summary section using the star icon")
					return
				}
				if (executiveSummaryIndex !== null) {
					await postOutlineJson(parseInt(sourceId), table_of_contet, tocVersion, executiveSummaryIndex)
					queryClient.invalidateQueries({ queryKey: ["outlineJson", parseInt(sourceId)] })
				}
			}

			setCurrentSectionIndex(newStepIndex)
			onSectionChange?.(defaultSections[newStepIndex])
			return
		}

		// If going forwards, check if we can proceed
		if (newStepIndex > currentSectionIndex) {
			// Save data when leaving certain sections
			if (currentSection.id === "agency-references" && sourceId) {
				await putAgencyReferences(parseInt(sourceId), selectedAgencyReferences)
			}
			if (currentSection.id === "preferences" && sourceId) {
				if (userPreferences && userPreferences.length > 0) {
					await putUserPreferences(parseInt(sourceId), userPreferences)
				}
			}
			await handleNext()
			return
		}

		// If clicking on current step, do nothing
		return
	}

	const handleNext = async () => {
		const currentSection = defaultSections[currentSectionIndex]

		// If it's the final step, generate draft instead of going to next step
		if (currentSectionIndex === defaultSections.length - 1) {
			await handleGenerateDraft()
			return
		}

		// Prevent multiple simultaneous calls
		if (isCheckingStatus) {
			return
		}

		setIsCheckingStatus(true)

		try {
			let canProceed = false

			// From "Summary" to next step
			if (currentSection.id === "summary") {
				if (!sourceId) {
					toast("Source ID is missing. Cannot fetch summary.")
				} else {
					const res = await getTopicSelection(parseInt(sourceId))
					if (res.status === "completed") {
						canProceed = true
					} else if (res.status === "processing") {
						toast("Deep research questions are being generated. Please wait a moment and try again.")
					} else {
						toast("An error occurred.")
					}
				}
			}
			// From "Topic Selection" to next step
			// From "Topic Selection" to next step
			else if (currentSection.id === "topic-selection") {
				if (deepResearchStatus !== "NOT_STARTED") {
					const res = await getOutlineJson(parseInt(sourceId))
					if (res.status === "completed") {
						canProceed = true
					} else if (res.status === "processing") {
						toast("Table of Contents is being created. Please wait and try again.")
						return
					} else {
						toast("An error occurred while checking Table of Contents status.")
						return
					}
				} else {
					setShowTopicSelectionDialog(true)
					return
				}
			}
			// From "Table of Content" to next step
			else if (currentSection.id === "table-of-content") {
				if (executiveSummaryIndex === null) {
					toast.error("Please select Executive Summary section using the star icon")
					return
				}
				await postOutlineJson(parseInt(sourceId), table_of_contet, tocVersion, executiveSummaryIndex)
				queryClient.invalidateQueries({ queryKey: ["outlineJson", parseInt(sourceId)] })
				canProceed = true
			}
			// From "Agency references" to next step
			else if (currentSection.id === "agency-references") {
				if (!sourceId) {
					toast("Source ID is missing. Cannot fetch preferences.")
				} else {
					const res = await getDeepResearchStatus(parseInt(sourceId))
					if (res.status === "COMPLETED" || res.status === "FAILED" || res.status === "NOT_STARTED") {
						await putAgencyReferences(parseInt(sourceId), selectedAgencyReferences)
						canProceed = true
					} else if (res.status === "IN_PROGRESS") {
						toast("Deep research is being generated. Please wait a moment and try again.")
					} else {
						toast("An error occurred.")
					}
				}
			}
			// From "Preferences" to next step
			else if (currentSection.id === "preferences") {
				// Save preferences when moving forward from preferences section
				if (sourceId) {
					await putUserPreferences(parseInt(sourceId), userPreferences)
				}
				canProceed = true
			}
			// Other steps that don't require API checks
			else {
				canProceed = true
			}

			if (canProceed && currentSectionIndex < defaultSections.length - 1) {
				const newIndex = currentSectionIndex + 1
				setCurrentSectionIndex(newIndex)
				onSectionChange?.(defaultSections[newIndex])
			}
		} catch (error) {
			console.error("Error in handleNext:", error)
			toast("An unexpected error occurred.")
		} finally {
			setIsCheckingStatus(false)
		}
	}

	const isFinalStep = currentSectionIndex === defaultSections.length - 1
	const isLoading = isCheckingStatus

	const getNextStepText = () => {
		if (isFinalStep) {
			return "Generate Draft"
		}
		return "Next"
	}

	const steps = defaultSections.map((section) => ({
		title: section.title,
	}))

	return (
		<>
			<div className="border-b border-gray-200 px-4 py-2">
				<Stepper
					steps={steps}
					currentStep={currentSectionIndex}
					onStepChange={handleStepChange}
					isLoading={isLoading}
					// isDisabled={isSubmitting}
					nextStepText={getNextStepText()}
				/>
			</div>

			{/* Add the dialog component */}
			<TopicSelectionConfirmDialog
				open={showTopicSelectionDialog}
				onClose={() => {
					setShowTopicSelectionDialog(false)
					setIsCheckingStatus(false)
				}}
				onConfirm={proceedFromTopicSelection}
				deepResearchEnabled={deepResearchEnabled}
				isLoading={isSending}
			/>
		</>
	)
}

export default ProposalDraftingHeader
