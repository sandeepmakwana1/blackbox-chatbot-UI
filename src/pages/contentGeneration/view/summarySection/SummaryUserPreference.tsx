import { ArrowRight2 } from "iconsax-reactjs"
import React, { useEffect, useMemo, useState } from "react"
import { usePreStepStore } from "~/store/preStepStore"
import type { UserPreference, UserPreferencesResponse } from "~/types/preSteps"

interface SummaryUserPreferencesProps {
	isReadOnly?: boolean
	userPreferenceResponse: UserPreferencesResponse | undefined
}

const SummaryUserPreferences: React.FC<SummaryUserPreferencesProps> = ({ userPreferenceResponse }) => {
	const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(0)
	const [answers] = useState<{ [key: number]: string }>({})
	const { setUserPreferences } = usePreStepStore()

	const displayPreferences = useMemo<UserPreference[]>(() => {
		return userPreferenceResponse?.user_preferences || []
	}, [userPreferenceResponse])

	const questions = displayPreferences.map((p) => p.question)
	const suggestedAnswers = displayPreferences.map((p) => p.suggested_answer)

	const hasSpecial = questions[0] === "special instruction"

	const currentValue =
		selectedQuestionId === null ? "" : answers[selectedQuestionId] ?? suggestedAnswers[selectedQuestionId] ?? ""

	useEffect(() => {
		setUserPreferences(displayPreferences)
	}, [displayPreferences, setUserPreferences])

	return (
		<div className="flex flex-row mt-2 space-x-2 h-full">
			{/* Left Panel - Questions List */}
			<div className="w-1/2 overflow-y-auto rounded-lg p-2 custom-scrollbar">
				<div className="flex flex-col gap-1">
					{questions.map((question, index) => {
						const isSelected = selectedQuestionId === index

						const isSpecialInstruction = hasSpecial && index === 0

						const itemClasses = isSpecialInstruction
							? isSelected
								? "bg-[#FFFBEB]"
								: ""
							: isSelected
							? "bg-primary-100"
							: "bg-white"

						const indicatorClasses = isSpecialInstruction
							? isSelected
								? "bg-warning-400"
								: "bg-warning-300"
							: isSelected
							? "bg-primary"
							: "bg-neutral-600"

						const textClasses = isSpecialInstruction
							? "text-warning-400 font-medium"
							: isSelected
							? "text-[#121822]"
							: "text-[#475569]"

						return (
							<div
								key={`${question}-${index}`}
								className={`flex items-center gap-3 p-3 rounded-[10px] cursor-pointer ${itemClasses}`}
								onClick={() => setSelectedQuestionId(index)}
							>
								<div className={`h-[6px] w-[6px] rounded-full shrink-0 ${indicatorClasses}`} />
								<span className={`text-sm flex-grow ${textClasses}`}>
									{isSpecialInstruction ? "Special instructions" : question}
								</span>
								{isSelected && (
									<ArrowRight2
										size={16}
										variant="Bold"
										className={
											isSpecialInstruction
												? "text-warning-400 shrink-0"
												: "text-neutral-900 shrink-0"
										}
									/>
								)}
							</div>
						)
					})}
				</div>
			</div>

			{/* Right Panel - Answer Section */}
			<div className="w-1/2 overflow-y-auto custom-scrollbar rounded-lg px-4 py-2">
				{selectedQuestionId !== null ? (
					<div className="space-y-4">
						<div className="px-4 py-3 rounded-lg bg-neutral-100 border border-neutral-400">
							<h3 className="text-[16px] font-medium text-[#121822]">
								{hasSpecial && selectedQuestionId === 0
									? "Special instructions"
									: questions[selectedQuestionId]}
							</h3>
						</div>

						<div className="w-full text-sm p-2 overflow-auto break-words bg-white text-neutral-800 whitespace-pre-wrap">
							{currentValue && currentValue.trim().length > 0 ? (
								currentValue
							) : (
								<span className="text-[#94a3b8]">No answer provided</span>
							)}
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center h-64">
						<p className="text-[#64748b] text-sm">Select a question to view and edit your answer</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default SummaryUserPreferences
