import { ArrowRight2 } from "iconsax-reactjs"
import { ChevronDownIcon } from "lucide-react"
import React, { useMemo, useState } from "react"
import { StyledMarkdown } from "~/components/common/MarkdownComponent"
import { Accordion, AccordionContent, AccordionItem } from "~/components/ui/accordion"
import { Badge } from "~/components/ui/badge"
import { truncateText } from "~/lib/utils"
import type { DeepResearchData } from "~/types/preSteps"

interface DeepResearchProps {
	deepResearchResponse: DeepResearchData | undefined
}

const DeepResearch: React.FC<DeepResearchProps> = ({ deepResearchResponse }) => {
	const researchCategories = useMemo(() => {
		if (!deepResearchResponse || !deepResearchResponse.research_categories) {
			return []
		}
		return Object.keys(deepResearchResponse.research_categories)
	}, [deepResearchResponse])

	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		researchCategories.length > 0 ? researchCategories[0] : null
	)

	const [isExpanded, setIsExpanded] = useState(false)

	const selectedData =
		selectedCategory && deepResearchResponse ? deepResearchResponse.research_categories[selectedCategory] : null

	if (!deepResearchResponse || researchCategories.length === 0) {
		return (
			<div className="flex items-center justify-center h-64 mt-2">
				<p className="text-[#92A0B5]">No data to show in deep research</p>
			</div>
		)
	}

	return (
		<div className="flex flex-row mt-2 space-x-8 max-h-[90%] custom-scrollbar ">
			{/* Left Panel - 3/8 width (Refactored) */}
			<div className="w-3/8 overflow-y-auto  rounded-lg p-2">
				<div className="flex flex-col gap-1">
					{" "}
					{/* Changed from ul and space-y-3 */}
					{researchCategories.map((category, index) => {
						const isSelected = selectedCategory === category

						return (
							<div // Changed from li to div
								key={index}
								className={`flex items-center gap-3 p-3 rounded-[10px] cursor-pointer ${
									isSelected ? "bg-primary-100" : "bg-white" // Updated styles
								}`}
								onClick={() => setSelectedCategory(category)}
							>
								<div // Dot element
									className={`h-1.5 w-1.5 rounded-full ${
										isSelected ? "bg-primary" : "bg-neutral-600" // Updated styles
									}`}
								></div>

								<span
									className={`text-sm flex-grow ${
										// Updated text size and removed padding
										isSelected ? "text-[#121822]" : "text-[#475569]"
									}`}
								>
									{category}
								</span>

								{isSelected && (
									<ArrowRight2 size={12} variant="Bold" className="text-neutral-900 shrink-0" />
								)}
							</div>
						)
					})}
				</div>
			</div>

			{/* Right Panel - 5/8 width */}
			<div className="w-5/8 overflow-y-auto rounded-lg custom-scrollbar ">
				{selectedCategory && selectedData ? (
					<div className="flex flex-col gap-4">
						{/* Accordion for subcategories */}
						<div className="relative">
							<button
								onClick={() => setIsExpanded(!isExpanded)}
								className="absolute top-2.5 right-2.5 z-10 p-1 rounded duration-200"
								aria-label={isExpanded ? "Collapse all" : "Expand all"}
							>
								<ChevronDownIcon
									className={`w-4 h-4 transition-transform duration-300 ease-out text-neutral-700 hover:text-neutral-900 ${
										isExpanded ? "rotate-180" : ""
									}`}
								/>
							</button>

							<Accordion
								type="multiple"
								value={isExpanded ? Object.keys(selectedData.subcategories) : []}
								className="bg-neutral-100 border border-neutral-400 rounded-[10px] pr-10 p-2.5 flex flex-col gap-2"
							>
								{Object.entries(selectedData.subcategories).map(([subcategoryName, questions]) => (
									<AccordionItem key={subcategoryName} value={subcategoryName} className="">
										<div className="">
											<div className="flex gap-1">
												<Badge variant="orangeTransparent" dot>
													{truncateText(subcategoryName, 70)}
												</Badge>
												<Badge variant="neutral">
													{questions.length} Topic{questions.length !== 1 ? "s" : ""}
												</Badge>
											</div>
										</div>

										<AccordionContent className="pt-2 pl-2">
											<div className="space-y-2">
												<ul className="space-y-1">
													{questions.map((question, questionIndex) => (
														<div key={questionIndex} className="flex items-baseline">
															<div className="h-1 w-1 rounded-full shrink-0 bg-neutral-900 mr-2"></div>
															<li className="text-xs text-neutral-900">
																{typeof question === "string"
																	? question
																	: question.question || "Question"}
															</li>
														</div>
													))}
												</ul>
											</div>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</div>

						{/* Markdown Content */}
						<div className="text-sm">
							<StyledMarkdown>{selectedData.answer}</StyledMarkdown>
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center h-full">
						<p className="text-[#92A0B5]">Select a category to view details</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default DeepResearch
