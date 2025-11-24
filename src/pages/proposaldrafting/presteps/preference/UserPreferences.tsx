import React, { useState, useEffect, useRef, useMemo } from "react"
import { usePreStepStore } from "~/store/preStepStore"
import type { UserPreference, UserPreferencesResponse } from "~/types/preSteps"
import { ArrowRight2 } from "iconsax-reactjs"

interface UserPreferencesProps {
	userPreferenceResponse: UserPreferencesResponse | undefined
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ userPreferenceResponse }) => {
	const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(0)
	const [answers, setAnswers] = useState<{ [key: number]: string }>({})
	const { setUserPreferences, userPreferences } = usePreStepStore()

	// Memoize the preferences to include the special instruction
	const displayPreferences = useMemo((): UserPreference[] => {
		if (userPreferences && userPreferences.length > 0) {
			return userPreferences
		}

		// Otherwise, create from API response
		const originalPreferences = userPreferenceResponse?.user_preferences || []
		const specialInstructionTemplate: UserPreference = {
			question: "special instruction",
			suggested_answer: "",
		}

		// Check if special instruction already exists in the response
		const existingSpecialIndex = originalPreferences.findIndex((pref) => pref.question === "special instruction")

		if (existingSpecialIndex !== -1) {
			// If it exists, move it to the front of the array
			const existingItem = originalPreferences[existingSpecialIndex]
			const otherItems = originalPreferences.filter((_, index) => index !== existingSpecialIndex)
			return [existingItem, ...otherItems]
		} else {
			// If it doesn't exist, add our template to the front
			return [specialInstructionTemplate, ...originalPreferences]
		}
	}, [userPreferenceResponse, userPreferences])

	const questions = displayPreferences.map((pref) => pref.question)
	const suggestedAnswers = displayPreferences.map((pref) => pref.suggested_answer)

	useEffect(() => {
		const initialAnswers: { [key: number]: string } = {}
		displayPreferences.forEach((pref, index) => {
			if (pref.suggested_answer) {
				initialAnswers[index] = pref.suggested_answer
			}
		})
		setAnswers(initialAnswers)

		// Set the initial state of the store with the processed list (only if store is empty)
		if (!userPreferences || userPreferences.length === 0) {
			setUserPreferences(displayPreferences)
		}
	}, [displayPreferences, setUserPreferences, userPreferences])

	const handleAnswerChange = (questionId: number, value: string) => {
		// Update our local state for immediate UI feedback
		const newAnswers = {
			...answers,
			[questionId]: value,
		}
		setAnswers(newAnswers)

		// Create the updated list to send to the Zustand store
		const updatedPreferences = displayPreferences.map((pref, index) => {
			if (index === questionId) {
				return { ...pref, suggested_answer: value }
			}
			return pref
		})

		setUserPreferences(updatedPreferences)
	}

	const textareaRef = useRef<HTMLTextAreaElement | null>(null)

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto"
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
		}
	}, [answers, selectedQuestionId, suggestedAnswers]) // Depend on suggestedAnswers as well

	return (
		<div className="flex flex-row mt-2 space-x-2 h-full">
			{/* Left Panel - Questions List */}
			<div className="w-1/2 overflow-y-auto rounded-lg p-2 custom-scrollbar">
				<div className="flex flex-col gap-1">
					{/* {" "} */}
					{questions.map((question, index) => {
						const isSpecialInstruction = index === 0
						const isSelected = selectedQuestionId === index

						// Define conditional class strings for clarity
						const itemClasses = isSpecialInstruction
							? isSelected
								? "bg-[#FFFBEB] border border-warning-300"
								: "bg-[#FFF7E1]"
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
								key={index}
								className={`flex items-center gap-3 p-3 rounded-[10px] cursor-pointer ${itemClasses}`}
								onClick={() => setSelectedQuestionId(index)}
							>
								<div className={`h-[6px] w-[6px] rounded-full shrink-0 ${indicatorClasses}`}></div>

								<span className={`text-sm flex-grow ${textClasses}`}>
									{isSpecialInstruction ? "Add special instructions [Optional]" : question}
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
			<div className="w-1/2 overflow-y-auto custom-scrollbar rounded-lg p-4 bg-gray-50">
				{selectedQuestionId !== null ? (
					<div className="space-y-4">
						<h3 className="text-[16px] font-medium text-[#121822]">
							{selectedQuestionId === 0 ? "Special instructions" : questions[selectedQuestionId]}
						</h3>

						<textarea
							ref={textareaRef}
							value={
								answers[selectedQuestionId] !== undefined
									? answers[selectedQuestionId]
									: suggestedAnswers[selectedQuestionId] || ""
							}
							onChange={(e) => handleAnswerChange(selectedQuestionId, e.target.value)}
							placeholder="Write your answer here..."
							className="w-full p-2 border border-[#C6D0DD] rounded-md max-h-40 focus:outline-none focus:border-blue-500 text-[14px] leading-[20px] text-[#475569] resize-none"
							rows={1}
						/>
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

export default UserPreferences
