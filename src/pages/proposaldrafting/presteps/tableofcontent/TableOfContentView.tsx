import React, { useState, useEffect } from "react"
import { Add, Magicpen, Trash } from "iconsax-reactjs"
import { Button } from "~/components/ui/button"
import { Check, GripVertical, SquareDashedMousePointer, Star } from "lucide-react"
import { useParams } from "react-router-dom"
import type { OutlineSection } from "~/types/preSteps"
import { useOutlineJson, useTocRegenerate } from "~/handlers/preStepsHandlers"
import { usePreStepStore } from "~/store/preStepStore"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { Loader } from "~/components/ui/loader"
import AnimatedInfoBanner from "~/components/ui/animated-info-banner"

interface TableOfContentViewProps {
	setIsChanged: (changed: boolean) => void
	executiveSummaryIndex: number | null
	setExecutiveSummaryIndex: (index: number | null) => void
}

const TableOfContentView: React.FC<TableOfContentViewProps> = ({
	setIsChanged,
	executiveSummaryIndex,
	setExecutiveSummaryIndex,
}) => {
	const { source_id } = useParams<{ source_id: string }>()
	const { data: tableOfContent, isLoading, isFetching, isError, error } = useOutlineJson(parseInt(source_id), true)
	const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null)
	const [editingSubsectionIndex, setEditingSubsectionIndex] = useState<{
		section: number
		subsection: number
	} | null>(null)
	const [textAreaValue, setTextAreaValue] = useState<string>("")

	const [draggedSection, setDraggedSection] = useState<number | null>(null)
	const [draggedSubsection, setDraggedSubsection] = useState<{
		sectionIndex: number
		subsectionIndex: number
	} | null>(null)
	const [dragOverSection, setDragOverSection] = useState<number | null>(null)
	const [dragOverSubsection, setDragOverSubsection] = useState<{
		sectionIndex: number
		subsectionIndex: number
	} | null>(null)

	const [sections, setSections] = useState<OutlineSection[]>([])
	const { setOutline, setTocVersion } = usePreStepStore()

	const tocRegenerateMutation = useTocRegenerate()

	const renumberSections = (sectionsArray: OutlineSection[]): OutlineSection[] => {
		return sectionsArray.map((section, sectionIndex) => ({
			...section,
			sectionNumber: `${sectionIndex + 1}`,
			subSections: section.subSections.map((subsection, subIndex) => ({
				...subsection,
				subSectionNumber: `${sectionIndex + 1}.${subIndex + 1}`,
			})),
		}))
	}

	const updateSectionsWithNumbering = (newSections: OutlineSection[]) => {
		const numberedSections = renumberSections(newSections)
		setSections(numberedSections)
		setOutline(numberedSections)
	}

	const handleStarClick = (sectionIndex: number) => {
		if (executiveSummaryIndex === sectionIndex) {
			// Unmark if already marked
			setExecutiveSummaryIndex(null)
		} else {
			// Mark as executive summary
			setExecutiveSummaryIndex(sectionIndex)
		}
	}

	const resetDragStates = () => {
		setDraggedSection(null)
		setDraggedSubsection(null)
		setDragOverSection(null)
		setDragOverSubsection(null)
	}

	useEffect(() => {
		if (tableOfContent) {
			const numberedSections = renumberSections(tableOfContent.data?.outline_json || [])
			setTocVersion(tableOfContent.data?.toc_version || 1)
			setOutline(numberedSections)
			setSections(numberedSections)
		}
	}, [tableOfContent])

	useEffect(() => {
		if (tocRegenerateMutation.isSuccess && tocRegenerateMutation.data?.data?.outline_json) {
			const newOutline = renumberSections(tocRegenerateMutation.data.data.outline_json)
			setSections(newOutline)
			setOutline(newOutline)
		}
	}, [tocRegenerateMutation.isSuccess, tocRegenerateMutation.data])

	const handleSectionDragStart = (e: React.DragEvent, sectionIndex: number) => {
		setDraggedSection(sectionIndex)
		e.dataTransfer.effectAllowed = "move"
	}

	const handleSectionDragEnd = () => {
		resetDragStates()
	}

	const handleSectionDragOver = (e: React.DragEvent, sectionIndex: number) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = "move"

		// Only set drag over if it's different from dragged section
		if (draggedSection !== sectionIndex) {
			setDragOverSection(sectionIndex)
		}
	}

	const handleSectionDragLeave = (e: React.DragEvent) => {
		// Only clear drag over if we're actually leaving the element
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
		const x = e.clientX
		const y = e.clientY

		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			setDragOverSection(null)
		}
	}

	const handleSectionDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault()

		if (draggedSection === null || draggedSection === dropIndex) {
			resetDragStates()
			return
		}

		const newSections = [...sections]
		const draggedItem = newSections[draggedSection]

		newSections.splice(draggedSection, 1)

		const insertIndex = draggedSection < dropIndex ? dropIndex - 1 : dropIndex
		newSections.splice(insertIndex, 0, draggedItem)

		// Update executive summary index after reordering
		if (executiveSummaryIndex !== null) {
			if (executiveSummaryIndex === draggedSection) {
				setExecutiveSummaryIndex(insertIndex)
			} else if (draggedSection < executiveSummaryIndex && insertIndex >= executiveSummaryIndex) {
				setExecutiveSummaryIndex(executiveSummaryIndex - 1)
			} else if (draggedSection > executiveSummaryIndex && insertIndex <= executiveSummaryIndex) {
				setExecutiveSummaryIndex(executiveSummaryIndex + 1)
			}
		}

		updateSectionsWithNumbering(newSections)
		resetDragStates()
	}

	const handleSubsectionDragStart = (e: React.DragEvent, sectionIndex: number, subsectionIndex: number) => {
		setDraggedSubsection({ sectionIndex, subsectionIndex })
		e.dataTransfer.effectAllowed = "move"
		e.stopPropagation()
	}

	const handleSubsectionDragEnd = () => {
		resetDragStates()
	}

	const handleSubsectionDragOver = (e: React.DragEvent, sectionIndex: number, subsectionIndex: number) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = "move"
		e.stopPropagation()

		// Only set drag over if it's different from dragged subsection
		if (
			!draggedSubsection ||
			draggedSubsection.sectionIndex !== sectionIndex ||
			draggedSubsection.subsectionIndex !== subsectionIndex
		) {
			setDragOverSubsection({ sectionIndex, subsectionIndex })
		}
	}

	const handleSubsectionDragLeave = (e: React.DragEvent) => {
		// Only clear drag over if we're actually leaving the element
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
		const x = e.clientX
		const y = e.clientY

		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			setDragOverSubsection(null)
		}
	}

	const handleSubsectionDrop = (e: React.DragEvent, dropSectionIndex: number, dropSubsectionIndex: number) => {
		e.preventDefault()
		e.stopPropagation()

		if (!draggedSubsection) {
			resetDragStates()
			return
		}

		const { sectionIndex: dragSectionIndex, subsectionIndex: dragSubsectionIndex } = draggedSubsection

		// Check if dropping on the same position
		if (dragSectionIndex === dropSectionIndex && dragSubsectionIndex === dropSubsectionIndex) {
			resetDragStates()
			return
		}

		const newSections = [...sections]
		const draggedItem = newSections[dragSectionIndex].subSections[dragSubsectionIndex]

		// Remove from original position
		newSections[dragSectionIndex].subSections.splice(dragSubsectionIndex, 1)

		// Calculate correct insertion index
		let insertIndex = dropSubsectionIndex
		if (dragSectionIndex === dropSectionIndex && dragSubsectionIndex < dropSubsectionIndex) {
			insertIndex = dropSubsectionIndex - 1
		}

		// Insert at new position
		newSections[dropSectionIndex].subSections.splice(insertIndex, 0, draggedItem)

		updateSectionsWithNumbering(newSections)
		resetDragStates()
	}

	const handleAddSection = () => {
		const newSection: OutlineSection = {
			sectionNumber: "1",
			sectionTitle: `New Section`,
			subSections: [],
			agentSpecialisation: "",
			specificInstruction: "",
			relevant_sections: [],
			prompt: "",
		}
		const updatedSections = [newSection, ...sections]

		if (executiveSummaryIndex !== null) {
			setExecutiveSummaryIndex(executiveSummaryIndex + 1)
		}

		updateSectionsWithNumbering(updatedSections)
		setIsChanged(true)
	}

	const handleAddSubsection = (sectionIndex: number) => {
		const updatedSections = [...sections]
		const newSubSectionNumber = `${sectionIndex + 1}.${updatedSections[sectionIndex].subSections.length + 1}`
		updatedSections[sectionIndex].subSections.push({
			subSectionNumber: newSubSectionNumber,
			subSectionTitle: `New Subsection ${newSubSectionNumber}`,
		})
		updateSectionsWithNumbering(updatedSections)
	}

	const handleDelete = (type: "section" | "subsection", index: number, subIndex?: number) => {
		let updatedSections: OutlineSection[]

		if (type === "section") {
			updatedSections = sections.filter((_, i) => i !== index)

			// Update executive summary index after deletion
			if (executiveSummaryIndex !== null) {
				if (executiveSummaryIndex === index) {
					setExecutiveSummaryIndex(null)
				} else if (executiveSummaryIndex > index) {
					setExecutiveSummaryIndex(executiveSummaryIndex - 1)
				}
			}
		} else if (type === "subsection" && subIndex !== undefined) {
			updatedSections = [...sections]
			updatedSections[index].subSections.splice(subIndex, 1)
		} else {
			return
		}

		updateSectionsWithNumbering(updatedSections)
	}

	const handleSectionTitleChange = (sectionIndex: number, newTitle: string) => {
		const updatedSections = [...sections]
		updatedSections[sectionIndex].sectionTitle = newTitle
		setSections(updatedSections)
		setOutline(updatedSections)
	}

	const handleSubsectionTitleChange = (sectionIndex: number, subIndex: number, newTitle: string) => {
		const updatedSections = [...sections]
		updatedSections[sectionIndex].subSections[subIndex].subSectionTitle = newTitle
		setSections(updatedSections)
		setOutline(updatedSections)
	}

	const handleRegenerate = () => {
		if (!source_id || !textAreaValue.trim()) return

		tocRegenerateMutation.mutate({
			source_id: parseInt(source_id),
			toc: sections,
			userFeedback: textAreaValue.trim(),
		})
		setTextAreaValue("")
	}

	const isRegenerating = tocRegenerateMutation.isPending

	return (
		<div className="relative">
			{isRegenerating && (
				<div className="absolute inset-0 bg-white/0 backdrop-blur-[2px] flex items-center justify-center z-50 rounded-lg">
					<div className="text-center">
						<Loader size="xl" variant="primary" />
						<p className="text-gray-700 font-medium">Regenerating table of contents...</p>
						<p className="text-gray-500 text-sm mt-1">This may take a moment</p>
					</div>
				</div>
			)}

			<div className="h-screen p-4 overflow-hidden bg-white rounded-lg shadow-md pb-2 flex">
				{isLoading || isFetching ? (
					<div className="flex justify-center items-center h-64 w-full">
						<div className="text-center">
							<Loader size="xl" variant="primary" loading />
							<p className="text-neutral-800">Loading...</p>
						</div>
					</div>
				) : (
					<>
						<div className="w-[65%] flex flex-col pr-4 gap-4 border-r border-gray-200 ">
							<div className="flex items-center justify-between pl-6 ">
								<AnimatedInfoBanner delay={200} />
								<Button
									variant="tertiary"
									size="sm"
									onClick={handleAddSection}
									disabled={isRegenerating}
								>
									<Add size={16} /> Add section
								</Button>
							</div>

							<div
								className="space-y-5 overflow-y-auto custom-scrollbar"
								style={{ height: "calc(100% - 250px)" }}
							>
								{sections.map((section, sectionIndex) => (
									<div key={`section-${sectionIndex}`}>
										{executiveSummaryIndex === sectionIndex && (
											<div className="mb-1 flex items-center w-full justify-end gap-1 text-warning-400">
												<Check size={12} />
												<span className="text-xs ">Marked as Executive Summary</span>
											</div>
										)}
										<div
											className={`transition-all duration-200 ${
												draggedSection === sectionIndex ? "opacity-50 transform scale-95" : ""
											} ${
												dragOverSection === sectionIndex && draggedSection !== sectionIndex
													? "border-t-4 border-t-blue-500 pt-2"
													: ""
											}`}
											draggable={!isRegenerating}
											onDragStart={(e) => handleSectionDragStart(e, sectionIndex)}
											onDragEnd={handleSectionDragEnd}
											onDragOver={(e) => handleSectionDragOver(e, sectionIndex)}
											onDragLeave={handleSectionDragLeave}
											onDrop={(e) => handleSectionDrop(e, sectionIndex)}
										>
											<div className="flex items-center gap-2">
												<GripVertical
													size={16}
													className={`text-neutral-600 cursor-move transition-colors ${
														isRegenerating ? "cursor-not-allowed" : ""
													}`}
												/>
												<div
													className={`relative group flex items-center justify-between py-2 pl-2 pr-3 rounded-[6px] bg-white border border-solid text-neutral-900 text-sm font-semibold w-full transition-all duration-200 ${
														editingSectionIndex === sectionIndex
															? "border-primary-300"
															: "border-neutral-400 hover:border-neutral-500"
													}`}
												>
													<div className="flex items-center space-x-2 w-full">
														<span>{section.sectionNumber}</span>
														<input
															type="text"
															value={section.sectionTitle}
															onChange={(e) =>
																handleSectionTitleChange(sectionIndex, e.target.value)
															}
															className="w-full focus:outline-none bg-transparent"
															disabled={isRegenerating}
															onFocus={() => setEditingSectionIndex(sectionIndex)}
															onBlur={() => setEditingSectionIndex(null)}
														/>
													</div>
													<div className="flex items-center gap-2">
														<button
															className="hidden group-hover:block text-danger-300 hover:text-red-700 transition-colors"
															onClick={() => handleDelete("section", sectionIndex)}
															disabled={isRegenerating}
														>
															<Trash size={16} />
														</button>

														{executiveSummaryIndex === null && (
															<Tooltip>
																<TooltipTrigger asChild>
																	<button
																		className=" group-hover:block hidden text-neutral-500 hover:text-warning-400 transition-colors"
																		onClick={() => handleStarClick(sectionIndex)}
																		disabled={isRegenerating}
																		title="Mark as Executive Summary"
																	>
																		<Star size={16} />
																	</button>
																</TooltipTrigger>
																<TooltipContent>
																	Mark as Executive Summary
																</TooltipContent>
															</Tooltip>
														)}
														{executiveSummaryIndex === sectionIndex && (
															<Tooltip>
																<TooltipTrigger asChild>
																	<button
																		className="text-[#F8A008] hover:text-[#F8A008] transition-colors"
																		onClick={() => handleStarClick(sectionIndex)}
																		disabled={isRegenerating}
																		title="Unmark as Executive Summary"
																	>
																		<Star size={16} fill="#F8A008" />
																	</button>
																</TooltipTrigger>
																<TooltipContent>
																	Unmark as Executive Summary
																</TooltipContent>
															</Tooltip>
														)}
													</div>
												</div>
											</div>
											<div className="ml-6 mt-1.5 bg-neutral-200 rounded-[6px] p-2 space-y-1.5">
												{section.subSections.map((subsection, subIndex) => (
													<div
														key={`subsection-${sectionIndex}-${subIndex}`}
														className={`flex items-center gap-2 transition-all duration-200 ${
															draggedSubsection?.sectionIndex === sectionIndex &&
															draggedSubsection?.subsectionIndex === subIndex
																? "opacity-50 transform scale-95"
																: ""
														} ${
															dragOverSubsection?.sectionIndex === sectionIndex &&
															dragOverSubsection?.subsectionIndex === subIndex &&
															!(
																draggedSubsection?.sectionIndex === sectionIndex &&
																draggedSubsection?.subsectionIndex === subIndex
															)
																? "border-t-2 border-t-blue-400 pt-1"
																: ""
														}`}
														draggable={!isRegenerating}
														onDragStart={(e) =>
															handleSubsectionDragStart(e, sectionIndex, subIndex)
														}
														onDragEnd={handleSubsectionDragEnd}
														onDragOver={(e) =>
															handleSubsectionDragOver(e, sectionIndex, subIndex)
														}
														onDragLeave={handleSubsectionDragLeave}
														onDrop={(e) => handleSubsectionDrop(e, sectionIndex, subIndex)}
													>
														<GripVertical
															size={16}
															className={`text-neutral-600 cursor-move transition-colors ${
																isRegenerating ? "cursor-not-allowed" : ""
															}`}
														/>
														<div
															className={`relative group flex items-center justify-between py-2 pl-2 pr-3 rounded-[6px] bg-white border border-solid text-neutral-800 text-sm font-normal w-full transition-all duration-200 ${
																editingSubsectionIndex?.section === sectionIndex &&
																editingSubsectionIndex?.subsection === subIndex
																	? "border-primary-300"
																	: "border-neutral-400 hover:border-neutral-500"
															}`}
														>
															<div className="flex items-center space-x-2 w-full">
																<span>{subsection.subSectionNumber}</span>
																<input
																	type="text"
																	value={subsection.subSectionTitle}
																	onChange={(e) =>
																		handleSubsectionTitleChange(
																			sectionIndex,
																			subIndex,
																			e.target.value
																		)
																	}
																	className="w-full focus:outline-none bg-transparent"
																	disabled={isRegenerating}
																	onFocus={() =>
																		setEditingSubsectionIndex({
																			section: sectionIndex,
																			subsection: subIndex,
																		})
																	}
																	onBlur={() => setEditingSubsectionIndex(null)}
																/>
															</div>
															<button
																className="hidden group-hover:block text-danger-300 hover:text-red-700 transition-colors"
																onClick={() =>
																	handleDelete("subsection", sectionIndex, subIndex)
																}
																disabled={isRegenerating}
															>
																<Trash size={16} />
															</button>
														</div>
													</div>
												))}
												<button
													className="px-3 py-1 flex gap-1 rounded-md text-xs font-medium text-primary  pl-6"
													onClick={() => handleAddSubsection(sectionIndex)}
													disabled={isRegenerating}
												>
													<Add size={16} /> Add subsection
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
						<div className="w-[35%] py-3 pl-4 pr-3 flex flex-col gap-2">
							<div>
								<p className="text-sm font-semibold text-neutral-900 mb-1">
									Regenerate Table of content with AI
								</p>
								<p className="text-neutral-700 text-xs">
									Provide a prompt to tailor the and enhance the table of content to your needs.
								</p>
							</div>

							<textarea
								placeholder="Example: Validate the table of contents against the RFP and optimize it to increase win potential."
								className="w-full h-32 p-3 border text-xs border-neutral-500 rounded-[4px] focus:outline-none focus:border-primary placeholder:text-neutral-600 placeholder:text-xs disabled:bg-gray-50 disabled:cursor-not-allowed"
								value={textAreaValue}
								onChange={(e) => setTextAreaValue(e.target.value)}
								disabled={isRegenerating}
							/>
							<Button
								variant="primary"
								className={`${
									isRegenerating || !textAreaValue.trim()
										? "bg-neutral-200 cursor-not-allowed"
										: "bg-gradient-to-r from-[#5151D0] to-[#D4358F]"
								}`}
								onClick={handleRegenerate}
								disabled={isRegenerating || !textAreaValue.trim()}
							>
								<Magicpen />
								{isRegenerating ? "Regenerating..." : "Regenerate"}
							</Button>

							{tocRegenerateMutation.isError && (
								<div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
									<p className="text-red-600 text-sm">Failed to regenerate. Please try again.</p>
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	)
}

export default TableOfContentView
