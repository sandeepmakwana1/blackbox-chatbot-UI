import React, { useMemo, useEffect } from "react"
import { Lock1, ArrowUp2, Flash, TickCircle, Warning2 } from "iconsax-reactjs"
import { getContentForSection } from "~/handlers/contentGenerationHandlers"
import type { OutlineSection } from "~/types/preSteps"
import type { Section } from "~/types/contentGeneration"
import { useContentGenerationStore } from "~/store/contentGenerationStore"
import { Star } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { Loader } from "~/components/ui/loader"

interface TableOfContentDisplayProps {
	source_id: string
	sections: OutlineSection[]
	executive_summary_section_number?: number
	generated_sections?: string[]
}

const TableOfContentDisplay: React.FC<TableOfContentDisplayProps> = ({
	sections,
	source_id,
	executive_summary_section_number,
	generated_sections = [],
}) => {
	const {
		updateContent,
		getSuccessfulSections,
		getFailedSections,
		getExpandedSections,
		getGeneratingSections,
		getProcessingMessages,
		getActiveSubSection,
		setSuccessfulSection,
		setFailedSection,
		setExpandedSection,
		setGeneratingSection,
		setProcessingMessage,
		setScrollToSection,
		setActiveSubSection,
	} = useContentGenerationStore()

	const successfulSections = getSuccessfulSections(source_id)
	const failedSections = getFailedSections(source_id)
	const expandedSections = getExpandedSections(source_id)
	const generatingSections = getGeneratingSections(source_id)
	const processingMessages = getProcessingMessages(source_id)
	const activeSubSection = getActiveSubSection(source_id)

	const isGeneratingAnySection = useMemo(() => Object.values(generatingSections).some(Boolean), [generatingSections])

	const allOtherSectionsGenerated = useMemo(() => {
		if (executive_summary_section_number === undefined || sections.length < 2) {
			return false
		}
		const otherSectionNumbers = sections
			.filter((s) => String(s.sectionNumber) !== String(executive_summary_section_number))
			.map((s) => s.sectionNumber)

		if (otherSectionNumbers.length === 0) return true
		return otherSectionNumbers.every((sn) => successfulSections[sn])
	}, [sections, successfulSections, executive_summary_section_number])

	useEffect(() => {
		if (!generated_sections || generated_sections.length === 0) return

		const sectionsToFetch = generated_sections.filter(
			(sectionNumber) => !successfulSections[sectionNumber] && !generatingSections[sectionNumber]
		)

		if (sectionsToFetch.length === 0) return

		const fetchPreGeneratedSections = async () => {
			for (const sectionNumber of sectionsToFetch) {
				const sectionIndex = sections.findIndex((s) => s.sectionNumber === sectionNumber)
				if (sectionIndex === -1) continue

				await handleGenerateSection(source_id, sectionIndex)
			}
		}
		fetchPreGeneratedSections()
	}, [generated_sections?.join(","), source_id, sections])

	const handleGenerateSection = async (source_id: string, sectionIndex: number) => {
		const sectionNumber = sections[sectionIndex].sectionNumber
		try {
			setGeneratingSection(source_id, sectionNumber, true)
			setFailedSection(source_id, sectionNumber, false)
			setProcessingMessage(source_id, sectionNumber, "")

			const sourceIdNumber = parseInt(source_id, 10)

			await getContentForSection(sourceIdNumber, sectionIndex, {
				onProcessing: (message) => {
					setProcessingMessage(source_id, sectionNumber, message)
				},
				onCompleted: (sectionData) => {
					const baseSection = (
						Array.isArray(sectionData.content) ? sectionData.content[0] : sectionData.content
					) as Section
					const enrichedSection = {
						...baseSection,
						sectionNumber: sections[sectionIndex].sectionNumber,
						subsections: baseSection.subsections?.map((sub) => {
							const outlineSub = sections[sectionIndex].subSections.find(
								(osub) => osub.subSectionTitle === sub.subsectionName
							)
							return {
								...sub,
								subSectionNumber: outlineSub?.subSectionNumber,
							}
						}),
					}

					updateContent(source_id, (prevContent) => {
						const newContent = prevContent.filter((s) => s.sectionNumber !== enrichedSection.sectionNumber)
						newContent.push(enrichedSection)
						newContent.sort((a, b) =>
							String(a.sectionNumber).localeCompare(String(b.sectionNumber), undefined, { numeric: true })
						)
						return newContent
					})

					setSuccessfulSection(source_id, sectionNumber, true)
					setScrollToSection(source_id, sectionNumber)
					setExpandedSection(source_id, sectionNumber, true)
					setActiveSubSection(source_id, null)
				},
				onError: (error) => {
					console.error(`Error generating section ${sectionNumber}:`, error)
					setFailedSection(source_id, sectionNumber, true)
				},
			})
		} catch (error) {
			console.error(`Error in handleGenerateSection for ${sectionNumber}:`, error)
			setFailedSection(source_id, sectionNumber, true)
		} finally {
			setGeneratingSection(source_id, sectionNumber, false)
			setProcessingMessage(source_id, sectionNumber, "")
		}
	}

	const toggleAndScroll = (sectionNumber: string) => {
		setExpandedSection(source_id, sectionNumber, !expandedSections[sectionNumber])
		setScrollToSection(source_id, sectionNumber)
		setActiveSubSection(source_id, null)
	}

	const handleSubsectionClick = (parentSectionNumber: string, subSectionNumber: string) => {
		setExpandedSection(source_id, parentSectionNumber, true)
		setActiveSubSection(source_id, subSectionNumber)
		setScrollToSection(source_id, subSectionNumber)
	}

	return (
		<div className="pt-3 pb-4 px-3 overflow-y-auto p-4 bg-white custom-scrollbar">
			<h3 className="text-sm font-medium text-neutral-900 mb-2.5">Table of Content</h3>
			<ul className="space-y-1">
				{sections.map((section, index) => {
					const isGenerating = generatingSections[section.sectionNumber]
					const isSuccessful = successfulSections[section.sectionNumber]
					const hasFailed = failedSections[section.sectionNumber]
					const isExpanded = expandedSections[section.sectionNumber]

					const isExecutiveSummary =
						executive_summary_section_number !== undefined &&
						String(section.sectionNumber) === String(executive_summary_section_number)

					let canGenerate = false
					if (isExecutiveSummary) {
						canGenerate = allOtherSectionsGenerated
					} else {
						let logicalPredecessorExists = false
						let predecessorIsDone = false

						for (let i = index - 1; i >= 0; i--) {
							const prevSection = sections[i]
							if (
								executive_summary_section_number === undefined ||
								String(prevSection.sectionNumber) !== String(executive_summary_section_number)
							) {
								logicalPredecessorExists = true
								predecessorIsDone = !!successfulSections[prevSection.sectionNumber]
								break
							}
						}

						if (logicalPredecessorExists) {
							canGenerate = predecessorIsDone
						} else {
							canGenerate = true
						}
					}

					const showGenerateButton = (!isSuccessful && (canGenerate || hasFailed)) || isGenerating

					const showLockedTooltip = !isSuccessful && !isExecutiveSummary && !showGenerateButton

					const getTitleColorClass = () => {
						if (isSuccessful) {
							if (isExpanded) return "text-neutral-900"
							return "text-neutral-700 group-hover:text-neutral-800"
						}
						if (isGenerating || hasFailed || canGenerate) {
							return "text-neutral-900"
						}
						return "text-neutral-700"
					}

					const sectionContent = (
						<div
							className={`flex items-center justify-between space-x-2 pl-1 py-1.5 pr-1.5 rounded-md transition-colors ${
								isSuccessful ? "cursor-pointer hover:bg-neutral-200" : ""
							}`}
							onClick={() => isSuccessful && toggleAndScroll(section.sectionNumber)}
						>
							<div className="flex-shrink-0">
								{isGenerating ? (
									<Loader size="sm" variant="primary" />
								) : hasFailed ? (
									<Warning2 size={16} className="text-danger-300" variant="Bold" />
								) : isSuccessful ? (
									<TickCircle size={16} variant="Bold" className="text-success-300" />
								) : (
									<Lock1 size={16} className="text-neutral-600" />
								)}
							</div>

							<span className={`flex-grow font-medium break-words ${getTitleColorClass()}`}>
								{`${section.sectionNumber}. ${section.sectionTitle}`}
							</span>
							{isExecutiveSummary && (
								<Tooltip>
									<TooltipTrigger>
										<Star fill="#F8A008" size={16} className="text-[#F8A008]" />
									</TooltipTrigger>
									<TooltipContent> Executive summary will be generated at the end</TooltipContent>
								</Tooltip>
							)}

							{isSuccessful && section.subSections.length > 0 && (
								<div className="flex-shrink-0">
									<ArrowUp2
										size={16}
										className={`text-[#92A0B5] transition-transform ${
											isExpanded ? "rotate-180" : ""
										}`}
									/>
								</div>
							)}
						</div>
					)

					return (
						<li key={index} className="text-sm group">
							{showLockedTooltip ? (
								<Tooltip>
									<TooltipTrigger asChild>{sectionContent}</TooltipTrigger>
									<TooltipContent side="bottom" hideArrow>
										Generate previous section to unlock this.
									</TooltipContent>
								</Tooltip>
							) : (
								sectionContent
							)}

							{showGenerateButton && (
								<div className="pl-8 pt-1 pr-2 pb-2">
									<button
										className="px-3 py-1 text-sm font-medium flex items-center justify-center gap-2 bg-[#F2F4F7] text-[#121822] rounded-md hover:bg-[#E5EBF0] cursor-pointer transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
										onClick={() => handleGenerateSection(source_id, index)}
										disabled={isGeneratingAnySection || isGenerating}
									>
										<Flash size={16} className="text-[#121822]" />
										{isGenerating ? "Generating..." : "Generate Section"}
									</button>

									{hasFailed && (
										<div className="text-danger-300 text-xs">
											Failed to generate section. Please try again.
										</div>
									)}
								</div>
							)}
							{isSuccessful && isExpanded && (
								<ul className="pl-7 space-y-2">
									{section.subSections.map((subsection, subIndex) => (
										<li
											key={subIndex}
											className="group cursor-pointer"
											onClick={() =>
												handleSubsectionClick(
													section.sectionNumber,
													subsection.subSectionNumber
												)
											}
										>
											<span
												className={`text-sm font-medium transition-colors ${
													activeSubSection === subsection.subSectionNumber
														? "text-[#121822]"
														: "text-[#6E7C91]"
												}`}
											>
												{`${subsection.subSectionNumber}. ${subsection.subSectionTitle}`}
											</span>
										</li>
									))}
								</ul>
							)}
						</li>
					)
				})}
			</ul>
		</div>
	)
}

export default TableOfContentDisplay
