import React, { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { mergeCost, confirmCostMerge } from "~/handlers/contentGenerationHandlers"
import type { CostResponse } from "~/types/costing"
import type { Section } from "~/types/contentGeneration"
import ContentDisplay from "~/pages/contentGeneration/view/ContentDisplay"
import { toast } from "sonner"
import { Checkbox } from "~/components/ui/checkbox"
import { useContentGenerationStore } from "~/store/contentGenerationStore"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight } from "iconsax-reactjs"

interface CostMergeDialogProps {
	isOpen: boolean
	onClose: () => void
	sourceId: string
	costData: CostResponse | null
}

type ViewState = "toc" | "preview"

const CostMergeDialog: React.FC<CostMergeDialogProps> = ({ isOpen, onClose, sourceId, costData }) => {
	const [viewState, setViewState] = useState<ViewState>("toc")
	const [isLoading, setIsLoading] = useState(false)
	const [isMerging, setIsMerging] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [mergeData, setMergeData] = useState<Section[] | null>(null)
	const [selectedSections, setSelectedSections] = useState<string[]>([])
	const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(0) // New state for preview

	const { getContent, mergeSections } = useContentGenerationStore()
	const navigate = useNavigate()
	const tableOfContents = getContent(sourceId)

	// Reset state when dialog opens/closes
	const resetState = useCallback(() => {
		setViewState("toc")
		setMergeData(null)
		setError(null)
		setIsLoading(false)
		setIsMerging(false)
		setSelectedSections([])
		setSelectedSectionIndex(0) // Reset the index as well
	}, [])

	useEffect(() => {
		if (isOpen) {
			// Initialize selected sections based on cost data
			if (costData?.cost_field_name && Array.isArray(costData.cost_field_name) && tableOfContents.length > 0) {
				const defaultSectionNames = new Set(costData.cost_field_name.map((s) => s.trim().toLowerCase()))
				const defaultSections = tableOfContents
					.map((section) => section.sectionName)
					.filter((sectionName) => {
						if (!sectionName) return false
						return defaultSectionNames.has(sectionName.trim().toLowerCase())
					})
				setSelectedSections(defaultSections)
			}
		} else {
			// Reset state on close with a small delay to avoid visual glitches
			const timeoutId = setTimeout(resetState, 300)
			return () => clearTimeout(timeoutId)
		}
	}, [isOpen, costData, tableOfContents, resetState])

	const handleContinue = async () => {
		if (!sourceId || !costData) {
			setError("Missing required data to continue.")
			return
		}

		if (selectedSections.length === 0) {
			setError("Please select at least one section to continue.")
			return
		}

		setError(null)
		setIsLoading(true)

		try {
			const payload = { ...costData, cost_field_name: selectedSections }
			const response = await mergeCost(sourceId, payload)

			// Ensure response.sections is always an array
			const sectionsArray = Array.isArray(response.sections) ? response.sections : [response.sections]
			setMergeData(sectionsArray)
			setViewState("preview")
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to fetch merge preview."
			setError(message)
			toast.error(message)
		} finally {
			setIsLoading(false)
		}
	}

	const handleConfirmMerge = async () => {
		if (!sourceId || !mergeData) {
			setError("Missing required data to confirm merge.")
			return
		}

		setIsMerging(true)
		setError(null)

		try {
			const preparedData = prepareConfirmMergePayload(mergeData)
			await confirmCostMerge(sourceId, preparedData)
			mergeSections(sourceId, preparedData)

			toast.success("Costing data merged successfully!")
			onClose()
			navigate(`/content-generation/${sourceId}`)
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to confirm merge."
			setError(message)
			toast.error(message)
		} finally {
			setIsMerging(false)
		}
	}

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			onClose()
		}
	}

	const handleSectionSelection = (sectionName: string) => {
		if (!sectionName) return

		setError(null)
		setSelectedSections((prev) =>
			prev.includes(sectionName) ? prev.filter((name) => name !== sectionName) : [...prev, sectionName]
		)
	}

	const prepareConfirmMergePayload = (data: Section[] | null) => {
		return (
			data?.map(({ sectionNumber, subsections, ...rest }) => ({
				...rest,
				subsections: subsections?.map(({ subSectionNumber, ...subRest }) => subRest) || [],
			})) || []
		)
	}

	const renderTocView = () => {
		if (!tableOfContents || tableOfContents.length === 0) {
			return (
				<div className="text-center py-8 text-neutral-500">
					<p>No content is available to merge.</p>
				</div>
			)
		}

		return (
			<div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-2">
				<div className="px-4 py-2.5">
					<p className="text-base font-semibold text-neutral-900">Select sections to merge</p>
					<p className="text-xs font-medium text-neutral-700">
						Please select sections from Table of Contents to merge cost into.
					</p>
				</div>

				<div className="">
					<ul className="">
						{tableOfContents.map((section, index) => {
							const sectionKey = section.sectionNumber || `section-${index}`
							const sectionName = section.sectionName || ""

							return (
								<li key={sectionKey} className="hover:bg-neutral-400 rounded-[6px]">
									<div className="flex items-center gap-2 p-2">
										<Checkbox
											id={`section-${sectionKey}`}
											checked={selectedSections.includes(sectionName)}
											onCheckedChange={() => handleSectionSelection(sectionName)}
											disabled={!sectionName}
										/>
										<label
											htmlFor={`section-${sectionKey}`}
											className="text-15 font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
										>
											{index + 1}
											{". "} {sectionName || "Unnamed Section"}
										</label>
									</div>
									<div className="pl-8 pr-7.5">
										{section.subsections && section.subsections.length > 0 && (
											<ul className="gap-2">
												{section.subsections.map((subsection, subIndex) => {
													const subSectionKey =
														subsection.subSectionNumber || `subsection-${subIndex}`
													return (
														<li key={subSectionKey} className="text-sm text-neutral-700">
															{index + 1}
															{"."}
															{subIndex + 1} {". "}
															{subsection.subsectionName || "Unnamed Subsection"}
														</li>
													)
												})}
											</ul>
										)}
									</div>
								</li>
							)
						})}
					</ul>
				</div>
			</div>
		)
	}

	// This function replaces the old `renderPreviewView`
	const renderContent = () => {
		if (isLoading) {
			return (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
					<p className="ml-4 text-neutral-500">Generating preview...</p>
				</div>
			)
		}

		if (error && !mergeData) {
			return (
				<div className="text-center py-8 text-red-500">
					<p className="text-lg mb-2 font-semibold">An Error Occurred</p>
					<p>{error}</p>
				</div>
			)
		}

		if (!mergeData || mergeData.length === 0) {
			return (
				<div className="text-center py-8 text-neutral-500">
					<p>No preview is available for this cost data.</p>
				</div>
			)
		}

		if (mergeData.length === 1) {
			return (
				<div className="max-h-[60vh] overflow-y-auto p-1 custom-scrollbar">
					<ContentDisplay
						content={mergeData}
						source_id={parseInt(sourceId)}
						onOpenRegeneratePanel={() => {}}
						generatingSections={{}}
						isRegeneratingAll={false}
						showRegenerateButton={false}
					/>
				</div>
			)
		}

		return (
			<div className="flex gap-x-6 max-h-[60vh]">
				<div className="w-1/3 border-r pr-4">
					<h3 className="text-base font-semibold mb-3 text-neutral-800">Related sections</h3>

					<ul className="space-y-1">
						{mergeData.map((section, index) => (
							<li key={section.sectionNumber || index}>
								<button
									onClick={() => setSelectedSectionIndex(index)}
									className={`w-full text-left pl-1 py-1.5 pr-1.5 rounded-md text-sm font-medium flex justify-between items-center transition-colors ${
										selectedSectionIndex === index
											? "bg-neutral-200 text-neutral-900"
											: "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800"
									}`}
								>
									<span className="break-words">{section.sectionName}</span>
									{selectedSectionIndex === index && (
										<div className="flex-shrink-0">
											<ArrowRight size={16} className="text-neutral-600" />
										</div>
									)}
								</button>
							</li>
						))}
					</ul>
				</div>
				<div className="w-2/3 overflow-y-auto p-1 custom-scrollbar">
					{mergeData[selectedSectionIndex] && (
						<ContentDisplay
							content={[mergeData[selectedSectionIndex]]}
							source_id={parseInt(sourceId)}
							onOpenRegeneratePanel={() => {}}
							generatingSections={{}}
							isRegeneratingAll={false}
							showRegenerateButton={false}
						/>
					)}
				</div>
			</div>
		)
	}

	const canContinue = selectedSections.length > 0 && !isLoading && sourceId && costData
	const canConfirmMerge = !isMerging && mergeData && mergeData.length > 0

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-274 w-full" showCloseButton={false}>
				<DialogHeader className="flex-row items-center justify-end pr-6">
					{viewState === "toc" && (
						<Button onClick={handleContinue} disabled={!canContinue}>
							{isLoading ? "Generating..." : "Continue"}
							<ArrowRight />
						</Button>
					)}

					{viewState === "preview" && (
						<Button variant="secondary" onClick={() => setViewState("toc")} disabled={isMerging}>
							<ArrowLeft />
							Back
						</Button>
					)}
					{viewState === "preview" && (
						<Button onClick={handleConfirmMerge} disabled={!canConfirmMerge}>
							{isMerging ? "Merging..." : "Proceed with merging"}
							<ArrowRight />
						</Button>
					)}
				</DialogHeader>

				{error && viewState === "toc" && (
					<div className="px-6">
						<p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
					</div>
				)}

				{/* Updated to call the new renderContent function */}
				<div>{viewState === "toc" ? renderTocView() : renderContent()}</div>
			</DialogContent>
		</Dialog>
	)
}

export default CostMergeDialog
