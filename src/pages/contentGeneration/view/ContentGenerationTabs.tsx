import { Arrow, Magicpen, Refresh, Send } from "iconsax-reactjs"
import { ListRestart, Upload, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import SaveChangesModal from "~/components/common/SaveEditChangesModal"
import { Button } from "~/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { contentRegenerate, contentRegenerateAll, updateContent } from "~/handlers/contentGenerationHandlers"
import { getUserSummary, useOutlineJson } from "~/handlers/preStepsHandlers"
import { RegenerateSectionPanel } from "~/pages/contentGeneration/view/RegeneratePanel"
import Costing from "~/pages/costing/Costing"
import CostMergeDialog from "~/pages/costing/CostMergeDialog"
import FileExportDialog from "~/pages/costing/FileExportDialog"
import { useContentGenerationStore } from "~/store/contentGenerationStore"
import { useCostingStore } from "~/store/costingStore"
import { usePlaygroundStore } from "~/store/playgroundStore"
import type { Section } from "~/types/contentGeneration"
import type { OutlineSection } from "~/types/preSteps"
import ContentDisplay from "./ContentDisplay"
import { ContentDisplaySkeleton, TableOfContentSkeleton } from "./ContentGenerationSkeleton"
import SummaryPreferences from "./summarySection/SummaryPreferences"
import TableOfContentDisplay from "./TableOfContentDisplay"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { useTabInfoStore } from "~/store/tabInfoStore"

export default function ContentGenerationTabs() {
	const { source_id } = useParams<{ source_id: string }>()

	const { getContentTabInfo, setContentTabInfo } = useTabInfoStore()
	const activeTab = getContentTabInfo(source_id || "")
	const [tableOfContent, setTableOfContent] = useState<OutlineSection[]>([])
	const [error, setError] = useState<string | null>(null)
	const [isMergerModalOpen, setIsMergerModalOpen] = useState<boolean>(false)
	const { closePlayground } = usePlaygroundStore()

	const [showSaveModal, setShowSaveModal] = useState(false)
	const [pendingTab, setPendingTab] = useState<string | null>(null)

	const {
		getContent,
		updateSectionContent,
		setContent,
		getSuccessfulSections,
		isRegeneratingAll,
		updateContent: updateContentInStore,
		setIsRegeneratingAll,
		setRegenerateAllMessage,
		getGeneratingSections,
		setGeneratingSection,
		setScrollToSection,
		getUnsavedChanges,
		saveEdit,
		getEditedSubsections,
		discardEdit,
		getMarkdownResponse,
		setMarkdownResponse,
		isMarkdownLoadingSelector,
		setIsMarkdownLoading,
		setIsMarkdownFetched,
		isMarkdownFetchedSelector,
	} = useContentGenerationStore()

	const { getCostingData } = useCostingStore()

	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isFileExportModalOpen, setIsFileExportModalOpen] = useState(false)
	const [customPrompt, setCustomPrompt] = useState("")
	const modalRef = useRef<HTMLDivElement>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)

	const [selectedSectionNumber, setSelectedSectionNumber] = useState<string | null>(null)

	const sourceIdStr = source_id || ""
	const content = getContent(sourceIdStr)
	const successfulSections = getSuccessfulSections(sourceIdStr)
	const generatingSections = getGeneratingSections(sourceIdStr)
	const unsavedChanges = getUnsavedChanges(sourceIdStr)
	const editedSubsections = getEditedSubsections(sourceIdStr)
	const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0
	const [isSaving, setIsSaving] = useState(false)
	const markdownResponse = getMarkdownResponse(sourceIdStr)
	const isMarkdownLoading = isMarkdownLoadingSelector(sourceIdStr)
	const hasMarkdownBeenFetched = isMarkdownFetchedSelector(sourceIdStr)

	const allSectionsGenerated = useMemo(() => {
		if (tableOfContent.length === 0) return false
		return tableOfContent.every((section) => successfulSections[section.sectionNumber])
	}, [tableOfContent, successfulSections])

	const { data: outlineData, isLoading: outlineLoading, error: outlineError } = useOutlineJson(parseInt(source_id!))

	const selectedSection = useMemo(
		() => (selectedSectionNumber ? content.find((s) => s.sectionNumber === selectedSectionNumber) : null),
		[content, selectedSectionNumber]
	)
	const sectionIdentifier = selectedSection?.sectionNumber || ""
	const isSingleSectionGenerating = generatingSections[sectionIdentifier] || false
	const isRegenPanelOpen = useContentGenerationStore((state) => state.getIsRegenPanelOpen(sourceIdStr))
	const setIsRegenPanelOpen = useContentGenerationStore((state) => state.setIsRegenPanelOpen)
	const costingRef = useRef<{ regenerateCost: () => void } | null>(null)

	const handleOpenRegenPanel = (sectionNumber: string) => {
		setSelectedSectionNumber(sectionNumber)
		closePlayground()
		setIsRegenPanelOpen(sourceIdStr, true)
	}

	const handleCloseRegenPanel = () => {
		if (!isSingleSectionGenerating) {
			setIsRegenPanelOpen(sourceIdStr, false)
			setSelectedSectionNumber(null)
		}
	}

	const handleRegenerateSection = async (feedback: string) => {
		if (!selectedSectionNumber || !source_id) return

		const sectionIndexInOutline = tableOfContent.findIndex((s) => s.sectionNumber === selectedSectionNumber)

		if (sectionIndexInOutline === -1) {
			toast.error("Error: Could not find the section in the table of contents.")
			return
		}

		const originalSection = content.find((s) => s.sectionNumber === selectedSectionNumber)
		if (!originalSection) return

		const identifier = originalSection.sectionNumber!

		try {
			setGeneratingSection(sourceIdStr, identifier, true)
			await contentRegenerate(parseInt(source_id), sectionIndexInOutline, feedback, {
				onCompleted: (sectionData) => {
					const contentIndexToUpdate = content.findIndex((s) => s.sectionNumber === selectedSectionNumber)
					if (contentIndexToUpdate === -1) return

					const newSectionData = sectionData.content as Section
					const enrichedData = {
						...newSectionData,
						sectionNumber: originalSection.sectionNumber,
						subsections: newSectionData.subsections?.map((newSub, i) => {
							const oldSub = originalSection.subsections?.find(
								(s) => s.subsectionName === newSub.subsectionName
							)
							return {
								...newSub,
								subSectionNumber:
									oldSub?.subSectionNumber || `${originalSection.sectionNumber}.${i + 1}`,
							}
						}),
					}

					updateSectionContent(sourceIdStr, contentIndexToUpdate, enrichedData)

					if (enrichedData.sectionNumber) {
						setScrollToSection(sourceIdStr, enrichedData.sectionNumber)
					}

					handleCloseRegenPanel()
				},
				onError: (error) => toast.error(`Error regenerating section: ${error}`),
			})
		} catch (error) {
			toast.error(`An unexpected error occurred during regeneration.`)
		} finally {
			toast.success("Section regenerated successfully.")
			setGeneratingSection(sourceIdStr, identifier, false)
		}
	}

	useEffect(() => {
		if (outlineData?.data?.outline_json) {
			setTableOfContent(outlineData.data.outline_json)
		}
	}, [outlineData])

	useEffect(() => {
		if (!source_id) {
			setError("Source ID is required")
			return
		}

		if (hasMarkdownBeenFetched && markdownResponse) {
			return
		}

		if (isMarkdownLoading) {
			return
		}

		const fetchMarkdownData = async () => {
			setIsMarkdownLoading(sourceIdStr, true)
			setError(null)

			const sourceIdNumber = parseInt(source_id, 10)
			if (isNaN(sourceIdNumber)) {
				setError("Invalid source ID")
				setIsMarkdownLoading(sourceIdStr, false)
				return
			}

			try {
				await getUserSummary(sourceIdNumber, {
					onProcessing: (msg) => {
						// do nothing
					},
					onCompleted: (finalSummary) => {
						const parseStringData = (data: any): string => {
							if (typeof data === "string") {
								try {
									const parsed = JSON.parse(data)
									return typeof parsed === "string" ? parsed : data
								} catch {
									return data
								}
							}
							return data
						}
						const response = parseStringData(finalSummary.summary) || ""
						setMarkdownResponse(source_id, response)
					},
					onError: (msg) => {
						setError(msg)
						toast.error(`Error: ${msg}, Please try again later.`)
						setIsMarkdownLoading(sourceIdStr, false)
					},
				})
			} catch (err) {
				console.error("Error fetching markdown ", err)
				setError(err instanceof Error ? err.message : "Failed to fetch data")
				setIsMarkdownLoading(sourceIdStr, false)
			}
		}

		if (!hasMarkdownBeenFetched) {
			setIsMarkdownFetched(sourceIdStr, true)
			fetchMarkdownData()
		}
	}, [
		source_id,
		hasMarkdownBeenFetched,
		isMarkdownLoading,
		getMarkdownResponse,
		setMarkdownResponse,
		setIsMarkdownLoading,
		setIsMarkdownFetched,
	])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setIsModalOpen(false)
			}
		}
		if (isModalOpen) {
			document.addEventListener("mousedown", handleClickOutside)
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [isModalOpen])

	const handleRegenerate = async (userFeedback: string) => {
		if (!source_id) return

		try {
			setIsRegeneratingAll(true)
			setRegenerateAllMessage("")
			setIsModalOpen(false)

			const feedbackText = userFeedback
			const totalSections = tableOfContent.length

			await contentRegenerateAll(parseInt(source_id), feedbackText, totalSections, {
				onProcessing: (message) => {
					setRegenerateAllMessage(message)
				},
				onSectionCompleted: (section, completedCount) => {
					setRegenerateAllMessage(`Regenerating sections... (${completedCount}/${totalSections} completed)`)

					updateContentInStore(sourceIdStr, (prevContent) => {
						const newContent = [...prevContent]

						const originalSection = prevContent.find((s) => s.sectionName === section.sectionName)

						if (originalSection) {
							const enrichedSection = {
								...section,
								sectionNumber: originalSection.sectionNumber,
								subsections: section.subsections?.map((newSub, i) => {
									const oldSub = originalSection.subsections?.find(
										(s) => s.subsectionName === newSub.subsectionName
									)
									return {
										...newSub,
										subSectionNumber:
											oldSub?.subSectionNumber || `${originalSection.sectionNumber}.${i + 1}`,
									}
								}),
							}

							const targetIndex = newContent.findIndex(
								(s) => s.sectionNumber === originalSection.sectionNumber
							)
							if (targetIndex !== -1) {
								newContent[targetIndex] = enrichedSection
							}
						} else {
							const fallbackIndex = completedCount - 1
							if (fallbackIndex >= 0 && fallbackIndex < newContent.length) {
								const fallbackOriginal = newContent[fallbackIndex]
								section.sectionNumber = fallbackOriginal.sectionNumber
								newContent[fallbackIndex] = section
							} else {
								newContent.push(section)
							}
						}
						return newContent
					})
				},
				onAllCompleted: (allSections) => {
					setRegenerateAllMessage("")
				},
				onError: (error) => {
					console.error(`Error regenerating all sections:`, error)
					setRegenerateAllMessage("Error occurred during regeneration. Please try again.")
				},
			})
		} catch (error) {
			console.error(`Error regenerating all sections:`, error)
			setRegenerateAllMessage("Error occurred during regeneration. Please try again.")
		} finally {
			toast.success("All sections regenerated successfully.")
			setIsRegeneratingAll(false)
		}
	}

	const handleModalRegenerate = () => {
		if (customPrompt.trim()) {
			handleRegenerate(customPrompt.trim())
			setCustomPrompt("")
		} else {
			toast.error("Please provide a custom prompt to guide the regeneration.")
		}
	}

	const handleRegenerateCost = () => {
		if (costingRef.current) {
			costingRef.current.regenerateCost()
		}
	}

	const discardAllUnsaved = () => {
		const map = getUnsavedChanges(sourceIdStr)
		const { discardEdit, stopEditing } = useContentGenerationStore.getState()

		// Discard all unsaved changes and exit edit mode
		Object.keys(map).forEach((identifier) => {
			discardEdit(sourceIdStr, identifier)
			stopEditing(sourceIdStr, identifier)
		})
	}

	const handleSaveChanges = async () => {
		if (!hasUnsavedChanges || !source_id) return

		try {
			setIsSaving(true)
			const changeIds = Object.keys(unsavedChanges)
			let savedCount = 0

			for (const changeId of changeIds) {
				const saveData = saveEdit(sourceIdStr, changeId)
				if (!saveData) continue

				const { contentToSave, isSection, sectionNumber, subSectionNumber } = saveData

				// Find the section in content
				const sectionIndex = content.findIndex((s) => s.sectionNumber === sectionNumber)
				if (sectionIndex === -1) continue

				const updatedSection = { ...content[sectionIndex] }

				if (isSection) {
					// Update section content
					updatedSection.content = contentToSave
				} else if (subSectionNumber && updatedSection.subsections) {
					// Update subsection content
					const subIndex = updatedSection.subsections.findIndex(
						(sub) =>
							sub.subSectionNumber === subSectionNumber ||
							`${sectionNumber}.${updatedSection.subsections.indexOf(sub) + 1}` === subSectionNumber
					)
					if (subIndex !== -1) {
						updatedSection.subsections[subIndex] = {
							...updatedSection.subsections[subIndex],
							content: contentToSave,
						}
					}
				}

				// Call API to update content
				await updateContent(source_id, sectionIndex, updatedSection)

				// Update local store
				updateSectionContent(sourceIdStr, sectionIndex, updatedSection)
				savedCount++
			}

			if (savedCount > 0) {
				toast.success(`Successfully saved ${savedCount} change${savedCount > 1 ? "s" : ""}`)
			}
		} catch (error) {
			console.error("Error saving changes:", error)
			toast.error("Failed to save changes. Please try again.")
		} finally {
			setIsSaving(false)
		}
	}

	const handleSaveAndProceed = async () => {
		try {
			// Save all changes
			await handleSaveChanges() // your existing save function

			// Close modal and switch tab
			setShowSaveModal(false)
			if (pendingTab) {
				setContentTabInfo(sourceIdStr, pendingTab as "summary" | "contentgeneration" | "costing")
				setIsRegenPanelOpen(sourceIdStr, false)
			}
			setPendingTab(null)
		} catch (error) {
			console.error("Failed to save changes:", error)
		}
	}

	const handleDiscardAndProceed = () => {
		discardAllUnsaved()
		setShowSaveModal(false)
		if (pendingTab) {
			setContentTabInfo(sourceIdStr, pendingTab as "summary" | "contentgeneration" | "costing")

			setIsRegenPanelOpen(sourceIdStr, false)
		}
		setPendingTab(null)
	}

	const handleModalCancel = () => {
		setShowSaveModal(false)
		setPendingTab(null)
	}

	const handleTabChange = async (newTab: string) => {
		if (newTab === activeTab) return

		const map = getUnsavedChanges(sourceIdStr)
		const hasChanged = Object.values(map).some((e: any) => e && e.editedContent !== e.originalContent)

		if (hasChanged) {
			setPendingTab(newTab)
			setShowSaveModal(true)
			return
		}

		setContentTabInfo(sourceIdStr, newTab as "summary" | "contentgeneration" | "costing")
		setIsRegenPanelOpen(sourceIdStr, false)
	}

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			const map = getUnsavedChanges(sourceIdStr)
			const hasChanged = Object.values(map as any).some((e: any) => e && e.editedContent !== e.originalContent)
			if (hasChanged) {
				event.preventDefault()
				event.returnValue = ""
			}
		}
		window.addEventListener("beforeunload", handleBeforeUnload)
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload)
		}
	}, [getUnsavedChanges, sourceIdStr])

	return (
		<>
			<SaveChangesModal
				isOpen={showSaveModal}
				onSave={handleSaveAndProceed}
				onCancel={handleDiscardAndProceed}
				onClose={handleModalCancel}
			/>
			<div className="bg-[#FFFFFF]">
				<div className="flex items-center justify-between px-3">
					<Tabs
						value={activeTab}
						onValueChange={handleTabChange}
						className="w-auto border-b-[1px] border-neutral-300 pt-2.5"
					>
						<TabsList className="">
							<TabsTrigger value="summary">
								<span>Summary</span>
							</TabsTrigger>
							<TabsTrigger value="contentgeneration">
								<span>Content generation</span>
							</TabsTrigger>
							<TabsTrigger
								value="costing"
								disabled={!allSectionsGenerated}
								className="disabled:cursor-not-allowed"
							>
								<span>Costing</span>
							</TabsTrigger>
						</TabsList>
					</Tabs>

					{activeTab === "contentgeneration" && (
						<div className="relative flex gap-2">
							<Button
								ref={buttonRef}
								size="sm"
								variant="outline"
								onClick={() => setIsModalOpen(!isModalOpen)}
								disabled={isRegeneratingAll || !allSectionsGenerated}
							>
								<ListRestart />
								<span>{isRegeneratingAll ? "Regenerating..." : "Regenerate all"}</span>
							</Button>

							{isModalOpen && (
								<div
									ref={modalRef}
									className="flex flex-col items-start bg-[#161A21] w-[374px] absolute top-full right-0 mt-1 rounded-xl z-50"
									style={{
										boxShadow: "-1px 2px 9px #E5E6E8",
									}}
								>
									<div className="flex justify-between items-center self-stretch my-2 mx-2.5">
										<div className="flex items-center p-1 bg-gradient-to-r from-[#5151D0] to-[#D4358F] rounded-[6px]">
											<Magicpen className="text-white" size={16} />
										</div>
										<button
											onClick={() => setIsModalOpen(false)}
											className="hover:opacity-70 transition-opacity"
										>
											<X className="text-neutral-600" size={16} />
										</button>
									</div>

									<span className="text-white text-xs font-bold ml-2.5">
										Regenerate content with AI
									</span>

									<span className="text-[#91A0B4] text-xs mb-5 mx-2.5">
										Provide a custom prompt to guide and reshape the proposal's tone, structure, and
										focus.
									</span>

									<div className="flex flex-col self-stretch bg-white py-2 mb-1.5 mx-1.5 rounded-[10px] h-[27vh] overflow-y-auto custom-scrollbar">
										<div className="flex flex-col flex-grow mx-2.5">
											<textarea
												value={customPrompt}
												onChange={(e) => setCustomPrompt(e.target.value)}
												placeholder="Example: Validate the content against the RFP and optimize it to increase win potential..."
												className={`flex-grow text-xs bg-transparent border-none outline-none resize-none placeholder-[#91A0B4] ${
													customPrompt ? "text-[#121822]" : "text-[#91A0B4]"
												}`}
											/>
											<div className="flex justify-end">
												<Button
													size="icon"
													variant="secondary"
													onClick={handleModalRegenerate}
													disabled={isRegeneratingAll}
													className={`flex w-8 h-8 mr-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
														customPrompt
															? "bg-[#121822] hover:bg-[#121822]"
															: "bg-[#EDF2F7] hover:bg-[#E2E8F0]"
													}`}
												>
													<Send color={customPrompt ? "#FFFFFF" : "#91A0B4"} />
												</Button>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					)}

					{activeTab === "costing" && (
						<div className="flex gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button size="icon-sm" variant="secondary" onClick={handleRegenerateCost}>
										<Refresh />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Regenerate cost</p>
								</TooltipContent>
							</Tooltip>
							<Button
								size="sm"
								variant="secondary"
								onClick={() => {
									if (getCostingData()) {
										setIsFileExportModalOpen(true)
									} else {
										toast.error("Costing Data Files are not yet Availabe.")
									}
								}}
							>
								<Upload />
								Export
							</Button>
							<Button
								size="sm"
								onClick={() => {
									if (getCostingData()) {
										setIsMergerModalOpen(true)
									} else {
										toast.error("Costing data is not yet available.")
									}
								}}
							>
								<Arrow size="16" />
								Merge to proposal
							</Button>
						</div>
					)}
				</div>

				<div>
					{activeTab === "summary" && (
						<div className="max-h-[100vh] mt-2 p-4 bg-neutral-200 rounded-lg h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
							<SummaryPreferences markdownResponse={markdownResponse} />
						</div>
					)}
					{activeTab === "contentgeneration" && (
						<>
							{outlineLoading ? (
								<div
									className={`flex bg-neutral-200 gap-x-6 min-h-[calc(100vh-120px)] ${
										isRegenPanelOpen ? "pr-6" : "pr-0"
									}`}
								>
									{/* Table of Content Skeleton */}
									<div className="hidden lg:block w-80 flex-shrink-0 max-h-[calc(100vh-136px)]">
										<TableOfContentSkeleton />
									</div>

									{/* Content Display Skeleton */}
									<div
										className={`flex-grow flex justify-center py-4 max-h-[calc(100vh-136px)] overflow-hidden transition-all duration-300 ${
											isRegenPanelOpen ? "mr-80" : "mr-0"
										}`}
									>
										<div className="overflow-y-auto custom-scrollbar h-full w-full max-w-[740px]">
											<ContentDisplaySkeleton />
										</div>
									</div>
								</div>
							) : outlineError ? (
								<div className="text-center py-8">
									<p className="text-red-500 text-lg mb-2">Error loading table of contents</p>
									<p className="text-gray-500 text-sm">Please try refreshing the page.</p>
								</div>
							) : (
								<div
									className={`flex bg-neutral-200 gap-x-6 min-h-[calc(100vh-120px)] ${
										isRegenPanelOpen ? "pr-6" : "pr-0"
									}`}
								>
									{/* Table of Content */}
									<div className="hidden lg:block w-75 flex-shrink-0 bg-white custom-scrollbar overflow-y-auto max-h-[calc(100vh-136px)] ">
										<TableOfContentDisplay
											sections={tableOfContent}
											source_id={sourceIdStr}
											executive_summary_section_number={
												outlineData?.data?.exec_summary_section_number + 1
											}
											generated_sections={outlineData?.data?.generated_sections}
										/>
									</div>

									{/* Content Display - Adjusts based on panel state */}
									<div
										className={`flex-grow flex justify-center py-4 max-h-[calc(100vh-136px)] overflow-hidden transition-all duration-300 ${
											isRegenPanelOpen ? "mr-80" : "mr-0"
										}`}
									>
										<div className="overflow-y-auto custom-scrollbar h-full w-full max-w-174">
											<ContentDisplay
												content={content}
												source_id={parseInt(source_id!)}
												onOpenRegeneratePanel={handleOpenRegenPanel}
												generatingSections={generatingSections}
												isRegeneratingAll={isRegeneratingAll}
											/>
										</div>
									</div>

									{/* Regenerate Panel - Fixed position overlay */}
									{isRegenPanelOpen && (
										<div className="hidden lg:block w-80 flex-shrink-0 pt-4 fixed right-6  h-[calc(100vh-136px)] z-10">
											<RegenerateSectionPanel
												isOpen={isRegenPanelOpen}
												onClose={handleCloseRegenPanel}
												section={selectedSection}
												onRegenerate={handleRegenerateSection}
												isGenerating={isSingleSectionGenerating}
											/>
										</div>
									)}
								</div>
							)}
						</>
					)}
					{activeTab === "costing" && <Costing ref={costingRef} />}
				</div>
				<CostMergeDialog
					isOpen={isMergerModalOpen}
					onClose={() => setIsMergerModalOpen(false)}
					sourceId={sourceIdStr}
					costData={getCostingData()}
				/>
				<FileExportDialog
					isOpen={isFileExportModalOpen}
					onClose={() => setIsFileExportModalOpen(false)}
					sourceId={sourceIdStr}
				/>
			</div>
		</>
	)
}
