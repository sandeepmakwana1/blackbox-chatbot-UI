import { useState, useEffect, useMemo } from "react"
import type { Evaluation } from "~/types/validation"
import {
	TickCircle,
	CloseCircle,
	InfoCircle,
	ArrowRight2,
	ClipboardText,
	Eye,
	PercentageCircle,
	Like1,
	Dislike,
	Discover,
	Settings,
	Verify,
} from "iconsax-reactjs"
import { useValidateRfp } from "~/handlers/validationHandler"
import { toast } from "sonner"
import { Badge } from "~/components/ui/badge"
import { ValidationSkeleton } from "~/pages/validation/view/ValidationDisplaySkeleton"
import { StyledMarkdown } from "~/components/common/MarkdownComponent"
import { useTabInfoStore } from "~/store/tabInfoStore"

interface ValidationDisplayProps {
	source_id: number | undefined
}

const getStatusBadgeVariant = (decision: string | undefined) => {
	switch (decision?.toLowerCase()) {
		case "conditional yes":
			return "warning"
		case "yes":
			return "success"
		case "no":
			return "danger"
		default:
			return "neutral"
	}
}

const getStatusIcon = (decision: string | undefined) => {
	switch (decision?.toLowerCase()) {
		case "conditional yes":
			return InfoCircle
		case "yes":
			return TickCircle
		case "no":
			return CloseCircle
		default:
			return InfoCircle
	}
}

const getRelevantBadgeVariant = (score: number) => {
	if (score > 90) return "success"
	if (score > 50) return "warning"
	return "danger"
}

const getFeasibilityBadgeVariant = (feasibility: string | undefined) => {
	const lower = feasibility?.toLowerCase()
	if (lower === "yes") return "success"
	if (lower === "moderate") return "warning"
	if (lower === "no") return "danger"
	return "neutral"
}

const getFeasibilityDotColor = (feasibility: string | undefined) => {
	const lower = feasibility?.toLowerCase()
	if (lower === "yes") return "bg-success-300"
	if (lower === "moderate") return "bg-warning-300"
	if (lower === "no") return "bg-danger-300"
	return "bg-neutral-300"
}

const ValidationDisplay: React.FC<ValidationDisplayProps> = ({ source_id }) => {
	const { data: rfpData, isLoading, isError, error: queryError } = useValidateRfp(source_id)

	// 2. Update state to include 'checklist'
	const [selectedEvaluationItem, setSelectedEvaluationItem] = useState<Evaluation | null>(null)
	const { getValidationTabInfo, setValidationTabInfo } = useTabInfoStore()
	const activeCheckType = getValidationTabInfo(source_id?.toString() || "")

	// Determine the current check data (legal or technical)
	const currentCheckData = useMemo(() => {
		if (!rfpData) return null
		if (activeCheckType === "legal") return rfpData.legal_check
		if (activeCheckType === "technical") return rfpData.technical_check
		return null // No currentCheckData for 'checklist'
	}, [rfpData, activeCheckType])

	useEffect(() => {
		if (currentCheckData && currentCheckData.evaluation.length > 0) {
			const scopeItem = currentCheckData.evaluation.find(
				(e) => e.category.toLowerCase() === "scope & feasibility"
			)
			if (scopeItem && selectedEvaluationItem?.category !== scopeItem.category) {
				setSelectedEvaluationItem(scopeItem)
			} else if (
				!scopeItem &&
				(!selectedEvaluationItem ||
					!currentCheckData.evaluation.some((e) => e.category === selectedEvaluationItem.category))
			) {
				setSelectedEvaluationItem(currentCheckData.evaluation[0])
			} else if (
				selectedEvaluationItem &&
				!currentCheckData.evaluation.some((e) => e.category === selectedEvaluationItem.category)
			) {
				setSelectedEvaluationItem(currentCheckData.evaluation[0])
			} else if (!selectedEvaluationItem) {
				setSelectedEvaluationItem(scopeItem || currentCheckData.evaluation[0])
			}
		} else {
			setSelectedEvaluationItem(null)
		}
	}, [currentCheckData])

	const feasibilityCounts = useMemo(() => {
		if (!currentCheckData) return { yes: 0, moderate: 0, no: 0 }
		return currentCheckData.evaluation.reduce(
			(acc, item) => {
				const feasibility = item.feasibility.toLowerCase()
				if (feasibility === "yes") acc.yes++
				else if (feasibility === "moderate") acc.moderate++
				else if (feasibility === "no") acc.no++
				return acc
			},
			{ yes: 0, moderate: 0, no: 0 }
		)
	}, [currentCheckData])

	const { pros: selectedPros, cons: selectedCons } = useMemo(() => {
		if (!selectedEvaluationItem || !selectedEvaluationItem.pros_cons) {
			return { pros: [], cons: [] }
		}
		return {
			pros: selectedEvaluationItem.pros_cons.Pros || [],
			cons: selectedEvaluationItem.pros_cons.Cons || [],
		}
	}, [selectedEvaluationItem])

	useEffect(() => {
		if (isError && queryError) {
			const errorMessage = queryError instanceof Error ? queryError.message : "An unknown error occurred"
			toast.error(`Failed to load validation data: ${errorMessage}`)
		}
	}, [isError, queryError])

	if (isLoading) {
		return <ValidationSkeleton />
	}

	if (isError) {
		return (
			<div className="p-8 text-center">
				<div className="bg-danger-50 border border-danger-200 text-danger-700 p-4 rounded-md">
					Error loading validation data. Please try again later.
				</div>
			</div>
		)
	}

	if (!rfpData) {
		return (
			<div className="p-8 text-center">
				<div className="bg-primary-50 border border-primary-200 text-primary-700 p-4 rounded-md">
					No validation data available.
					{source_id ? "" : " Source ID is missing."}
				</div>
			</div>
		)
	}

	const renderEvaluationGroup = (count: number, items: Evaluation[], feasibilityType: "yes" | "moderate" | "no") => {
		if (count === 0) return null

		return (
			<div className="flex flex-col gap-2">
				<Badge variant={getFeasibilityBadgeVariant(feasibilityType)}>
					{`${count} ${feasibilityType.charAt(0).toUpperCase() + feasibilityType.slice(1)}`}
				</Badge>
				<div className="flex flex-col bg-white rounded-lg border border-neutral-200">
					{items.map((item, index) => {
						const isSelected = selectedEvaluationItem?.category === item.category
						const dotColorClass = getFeasibilityDotColor(item.feasibility)

						return (
							<div
								key={`${item.category}-${index}-${feasibilityType}`}
								className={`flex items-center w-full p-3 cursor-pointer transition-colors ${
									isSelected
										? "bg-neutral-200 text-neutral-900"
										: "bg-white text-neutral-700 hover:bg-neutral-50"
								} ${index === 0 ? "rounded-t-lg" : ""} ${
									index === items.length - 1 ? "rounded-b-lg" : "border-b border-neutral-200"
								}`}
								onClick={() => setSelectedEvaluationItem(item)}
							>
								<div className={`w-1.5 h-1.5 ${dotColorClass} rounded-full mr-2 shrink-0`} />
								<span className="text-[13px] font-medium grow mr-2">{item.category}</span>
								<ArrowRight2
									size="16"
									variant="Bold"
									className={isSelected ? "text-neutral-900" : "text-neutral-500"}
								/>
							</div>
						)
					})}
				</div>
			</div>
		)
	}

	const StatusIcon = currentCheckData ? getStatusIcon(currentCheckData.recommendation?.decision) : InfoCircle

	return (
		<div className="flex flex-col gap-1.5 p-3 bg-neutral-50 h-full overflow-hidden">
			{/* Header: Toggle and Validation Score */}
			<div className="flex-shrink-0 flex justify-between items-center">
				<div className="flex items-center bg-white p-1 rounded-lg border border-neutral-200">
					<button
						className={`px-3 py-1.5 rounded-sm text-xs font-normal transition-colors ${
							activeCheckType === "legal"
								? "bg-neutral-900 text-white"
								: "bg-transparent text-neutral-700 hover:text-neutral-900"
						}`}
						onClick={() => setValidationTabInfo(source_id?.toString() || "", "legal")}
					>
						Legal
					</button>
					<button
						className={`px-3 py-1.5 rounded-sm text-xs font-normal transition-colors ${
							activeCheckType === "technical"
								? "bg-neutral-900 text-white"
								: "bg-transparent text-neutral-700 hover:text-neutral-900"
						}`}
						onClick={() => setValidationTabInfo(source_id?.toString() || "", "technical")} // Change this!
					>
						Technical
					</button>
					<button
						className={`px-3 py-1.5 rounded-sm text-xs font-normal transition-colors ${
							activeCheckType === "checklist"
								? "bg-neutral-900 text-white"
								: "bg-transparent text-neutral-700 hover:text-neutral-900"
						}`}
						onClick={() => setValidationTabInfo(source_id?.toString() || "", "checklist")} // Change this!
					>
						Proposal Checklist
					</button>
				</div>
				{rfpData.score !== undefined && (
					<Badge
						variant={getRelevantBadgeVariant(rfpData.score)}
						className="text-sm px-2 py-1 [&>svg]:size-4 rounded-[6px]"
					>
						<Verify variant="Bold" />
						{`${rfpData.score}% Relevant`}
					</Badge>
				)}
			</div>

			{/* 4. Main Content: Conditionally render based on activeCheckType */}
			<div className="flex-1 overflow-hidden">
				{activeCheckType === "checklist" ? (
					<div className="bg-white rounded-lg border border-neutral-200 p-4 h-full overflow-y-auto custom-scrollbar">
						{rfpData?.validation_checklist?.result ? (
							<StyledMarkdown>{rfpData.validation_checklist.result}</StyledMarkdown>
						) : (
							<div className="flex items-center justify-center p-10">
								<p className="text-neutral-500 text-sm">
									No checklist data available. Please revalidate once to get the checklist.
								</p>
							</div>
						)}
					</div>
				) : currentCheckData ? (
					<div className="flex gap-3 h-full">
						{/* Summary & Next Steps */}
						<div className="flex flex-col gap-4 px-3 pt-3 pb-4 bg-white rounded-lg border border-neutral-200 w-[450px] overflow-y-auto custom-scrollbar">
							<div className="flex items-center gap-2">
								<div className="flex items-center justify-center w-6 h-6 bg-neutral-900 rounded-md">
									<ClipboardText size="16" variant="Linear" color="white" />
								</div>
								<span className="text-sm text-neutral-900 font-medium capitalize">
									Summary & Next steps for {activeCheckType}
								</span>
							</div>

							<div className="flex flex-col gap-4 mb-4">
								{currentCheckData.recommendation?.decision && (
									<div className="flex flex-col gap-0.5">
										<span className="text-sm text-neutral-700">Recommendation</span>
										<Badge
											variant={getStatusBadgeVariant(currentCheckData.recommendation.decision)}
											dot
										>
											{currentCheckData.recommendation.decision}
										</Badge>
									</div>
								)}

								<div className="flex flex-col">
									<span className="text-sm text-neutral-700 gap-0.5">Summary</span>
									<span className="text-sm text-neutral-900">
										{currentCheckData.recommendation?.summary || "No summary available."}
									</span>
								</div>

								<div className="flex flex-col gap-0.5">
									<span className="text-sm text-neutral-700">Submission Type</span>
									<span className="text-sm text-neutral-900">
										{currentCheckData.timeline_and_submission_details?.submission_type ||
											"Not specified"}
									</span>
								</div>

								<div className="flex flex-col gap-0.5">
									<span className="text-sm text-neutral-700">Submission Mode</span>
									<span className="text-sm text-neutral-900">
										{currentCheckData.timeline_and_submission_details?.submission_details ||
											"Not specified"}
									</span>
								</div>

								<div className="flex flex-col gap-0.5">
									<span className="text-sm text-neutral-700">Submission Instructions</span>
									<span className="text-sm text-neutral-900">
										{currentCheckData.timeline_and_submission_details?.submission_instructions ||
											"Not specified"}
									</span>
								</div>

								<div className="flex flex-col gap-0.5">
									<span className="text-sm text-neutral-700">Submission Date</span>
									<span className="text-sm text-neutral-900">
										{currentCheckData.timeline_and_submission_details?.due_date || "Not specified"}
									</span>
								</div>
							</div>

							{currentCheckData.recommendation?.next_steps &&
								currentCheckData.recommendation.next_steps.length > 0 && (
									<div className="flex flex-col gap-2">
										<span className="text-sm text-neutral-700 font-normal">Next Steps</span>
										<div className="flex flex-col gap-4">
											{currentCheckData.recommendation.next_steps.map((step, index) => (
												<div className="flex items-start gap-3" key={index}>
													<Badge variant="neutral" className="mt-1">
														{index + 1}
													</Badge>
													<span className="text-sm text-neutral-900">{step}</span>
												</div>
											))}
										</div>
									</div>
								)}
						</div>

						{/* Checkpoints and Details */}
						<div className="flex bg-white rounded-lg border border-neutral-200 flex-1 overflow-hidden">
							{/* Checkpoints List */}
							<div className="flex flex-col gap-4 p-3 w-[400px] border-r border-neutral-200 overflow-y-auto custom-scrollbar">
								<div className="flex items-center gap-2">
									<div className="flex items-center justify-center w-6 h-6 bg-neutral-900 rounded-md">
										<Settings size="16" variant="Linear" color="white" />
									</div>
									<span className="text-sm text-neutral-900 font-medium">Checkpoints</span>
								</div>

								<div className="flex flex-col gap-4">
									{renderEvaluationGroup(
										feasibilityCounts.yes,
										currentCheckData.evaluation.filter(
											(e) => e.feasibility.toLowerCase() === "yes"
										),
										"yes"
									)}
									{renderEvaluationGroup(
										feasibilityCounts.moderate,
										currentCheckData.evaluation.filter(
											(e) => e.feasibility.toLowerCase() === "moderate"
										),
										"moderate"
									)}
									{renderEvaluationGroup(
										feasibilityCounts.no,
										currentCheckData.evaluation.filter((e) => e.feasibility.toLowerCase() === "no"),
										"no"
									)}
								</div>
							</div>

							{/* Selected Checkpoint Details */}
							{selectedEvaluationItem ? (
								<div className="flex flex-col gap-4 p-5 flex-1 overflow-y-auto custom-scrollbar">
									<div className="flex items-center gap-2">
										<Badge variant={getFeasibilityBadgeVariant(selectedEvaluationItem.feasibility)}>
											{selectedEvaluationItem.feasibility}
										</Badge>
										<span className="text-sm font-medium text-neutral-900">
											{selectedEvaluationItem.category}
										</span>
									</div>

									<div className="flex flex-col gap-6">
										{selectedPros.length > 0 && (
											<div className="flex flex-col gap-2">
												<Badge variant="neutral">
													<Like1 size="12" variant="Bold" />
													Pros
												</Badge>
												<div className="flex flex-col gap-1.5">
													{selectedPros.map((pro, i) => (
														<div className="flex items-start gap-2" key={`pro-${i}`}>
															<span className="text-neutral-800 shrink-0 text-sm leading-none mt-1">
																•
															</span>
															<span className="text-sm text-neutral-800">{pro}</span>
														</div>
													))}
												</div>
											</div>
										)}

										{selectedCons.length > 0 && (
											<div className="flex flex-col gap-1.5">
												<Badge variant="neutral">
													<Dislike size="12" variant="Bold" />
													Cons
												</Badge>
												<div className="flex flex-col gap-2">
													{selectedCons.map((con, i) => (
														<div className="flex items-start gap-2" key={`con-${i}`}>
															<span className="text-neutral-800 shrink-0 text-sm leading-none mt-1">
																•
															</span>
															<span className="text-sm text-neutral-800">{con}</span>
														</div>
													))}
												</div>
											</div>
										)}

										{selectedEvaluationItem.observations.length > 0 && (
											<div className="flex flex-col gap-1.5">
												<Badge variant="neutral">
													<Eye size="12" variant="Bold" />
													Observations
												</Badge>
												<div className="flex flex-col gap-2">
													{selectedEvaluationItem.observations.map((obs, i) => (
														<div className="flex items-start gap-2" key={`obs-${i}`}>
															<span className="text-neutral-800 shrink-0 text-sm leading-none mt-1">
																•
															</span>
															<span className="text-sm text-neutral-800">{obs}</span>
														</div>
													))}
												</div>
											</div>
										)}

										{selectedEvaluationItem.recommendations.length > 0 && (
											<div className="flex flex-col gap-1.5">
												<Badge variant="neutral">
													<Discover size="12" variant="Bold" />
													Recommendations
												</Badge>
												<div className="flex flex-col gap-2">
													{selectedEvaluationItem.recommendations.map((rec, i) => (
														<div className="flex items-start gap-2" key={`rec-${i}`}>
															<span className="text-neutral-800 shrink-0 text-sm leading-none mt-1">
																•
															</span>
															<span className="text-sm text-neutral-800">{rec}</span>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</div>
							) : (
								<div className="flex items-center justify-center p-10 flex-1">
									<p className="text-neutral-500 text-sm">
										{currentCheckData.evaluation.length === 0
											? `No checkpoints available for this ${activeCheckType} check.`
											: "Select an item from Checkpoints to see details."}
									</p>
								</div>
							)}
						</div>
					</div>
				) : (
					<div className="p-8 text-center h-full flex items-center justify-center">
						<div className="bg-primary-50 border border-primary-200 text-primary-700 p-4 rounded-md">
							{`No ${activeCheckType} validation data available.`}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default ValidationDisplay
