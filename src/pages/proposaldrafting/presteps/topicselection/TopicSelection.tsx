import { Clock, Edit, Trash, Warning2 } from "iconsax-reactjs"
import { CircleCheck, CircleX, Plus } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Input } from "~/components/ui/input"
import { Loader } from "~/components/ui/loader"
import { Switch } from "~/components/ui/switch"
import { useDeepResearchStatus, useTopicSelection } from "~/handlers/preStepsHandlers"
import { truncateText } from "~/lib/utils"
import { usePreStepStore } from "~/store/preStepStore"
import type { Question, TopicSelection } from "~/types/preSteps"

// Status display component for non-NOT_STARTED states
const DeepResearchStatusDisplay: React.FC<{
	status: "COMPLETED" | "IN_PROGRESS" | "FAILED"
	message: string
	totalTasks?: number
	completedTasks?: number
	startedAt?: string
	updatedAt?: string
	completedAt?: string | null
}> = ({ status, message, totalTasks, completedTasks, startedAt, updatedAt, completedAt }) => {
	const getStatusIcon = () => {
		switch (status) {
			case "COMPLETED":
				return <CircleCheck size={24} className="text-green-500" />
			case "IN_PROGRESS":
				return <Clock size={24} className="text-blue-500" />
			case "FAILED":
				return <CircleX size={24} className="text-red-500" />
			default:
				return null
		}
	}

	const getStatusColor = () => {
		switch (status) {
			case "COMPLETED":
				return "text-green-600"
			case "IN_PROGRESS":
				return "text-blue-600"
			case "FAILED":
				return "text-red-600"
			default:
				return "text-neutral-600"
		}
	}

	const getStatusBadgeVariant = () => {
		switch (status) {
			case "COMPLETED":
				return "success"
			case "IN_PROGRESS":
				return "blue"
			case "FAILED":
				return "danger"
			default:
				return "primary"
		}
	}

	return (
		<div className="pt-6 pb-6 px-6 bg-white mt-2 flex flex-col gap-4 shadow-md rounded-lg">
			<div className="flex items-center justify-center">
				<div className="flex flex-col items-center gap-4 text-center max-w-md">
					{getStatusIcon()}
					<div className="flex flex-col gap-2">
						<Badge variant={getStatusBadgeVariant()} className="self-center">
							{status.replace("_", " ")}
						</Badge>
						<h3 className={`text-lg font-semibold ${getStatusColor()}`}>
							{status === "COMPLETED" && "Deep Research Completed"}
							{status === "IN_PROGRESS" && "Deep Research In Progress"}
							{status === "FAILED" && "Deep Research Failed"}
						</h3>
						<p className="text-sm text-neutral-600">{message}</p>
					</div>

					{/* Progress information for IN_PROGRESS */}
					{status === "IN_PROGRESS" && totalTasks && completedTasks !== undefined && (
						<div className="w-full">
							<div className="flex justify-between text-xs text-neutral-500 mb-1">
								<span>Progress</span>
								<span>
									{completedTasks}/{totalTasks}
								</span>
							</div>
							<div className="w-full bg-neutral-200 rounded-full h-2">
								<div
									className="bg-blue-500 h-2 rounded-full transition-all duration-300"
									style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
								></div>
							</div>
						</div>
					)}

					{/* Timestamps */}
					{(startedAt || updatedAt || completedAt) && (
						<div className="text-xs text-neutral-500 space-y-1">
							{startedAt && <div>Started: {new Date(startedAt).toLocaleString()}</div>}
							{status === "IN_PROGRESS" && updatedAt && (
								<div>Last updated: {new Date(updatedAt).toLocaleString()}</div>
							)}
							{status === "COMPLETED" && completedAt && (
								<div>Completed: {new Date(completedAt).toLocaleString()}</div>
							)}
						</div>
					)}

					<div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
						{status === "COMPLETED" &&
							"The deep research has been completed successfully. You cannot modify the topic selection anymore."}
						{status === "IN_PROGRESS" &&
							"Deep research is currently running. Please wait for it to complete before making any changes."}
						{status === "FAILED" &&
							"The deep research process encountered an error. Please contact support if this issue persists."}
					</div>
				</div>
			</div>
		</div>
	)
}

const TopicSelectionContent: React.FC = () => {
	const { source_id } = useParams<{ source_id: string }>()
	const [selectedTopics, setSelectedTopics] = useState<string[]>([])
	const [isResearchOn, setIsResearchOn] = useState<boolean>(true)
	const [previousSelections, setPreviousSelections] = useState<string[]>([])
	const [customTopics, setCustomTopics] = useState<Question[]>([])
	const [editingIndex, setEditingIndex] = useState<number | null>(null)
	const [editValue, setEditValue] = useState<string>("")
	// New state for editing structured topics
	const [editingStructuredTopic, setEditingStructuredTopic] = useState<{
		categoryIndex: number
		subcategoryIndex: number
		questionIndex: number
	} | null>(null)
	const [editingStructuredValue, setEditingStructuredValue] = useState<string>("")

	const { setTopicSelectedQuestions, setDeepResearchEnabled } = usePreStepStore()

	// Fetch topic selection data
	const { data: topicSelectionData, isLoading, error } = useTopicSelection(parseInt(source_id), true)

	// Extract structured categories and subcategories for display
	const structuredTopics = useMemo(() => {
		if (!topicSelectionData || topicSelectionData.status !== "completed" || !topicSelectionData.data) {
			return []
		}

		const result = topicSelectionData.data.research_categories
		const structured: Array<{
			categoryName: string
			subcategories: Array<{
				subcategoryName: string
				questions: Question[]
			}>
		}> = []

		Object.entries(result).forEach(([categoryName, category]) => {
			const subcategories: Array<{
				subcategoryName: string
				questions: Question[]
			}> = []

			Object.entries(category).forEach(([subcategoryName, questions]) => {
				subcategories.push({
					subcategoryName,
					questions,
				})
			})

			structured.push({
				categoryName,
				subcategories,
			})
		})

		return structured
	}, [topicSelectionData])

	// Check if Custom Queries exist in the data
	const hasCustomQueries = useMemo(() => {
		return structuredTopics.some((category) => category.categoryName === "Custom Queries")
	}, [structuredTopics])

	// Get custom queries from structured topics
	const customQueriesFromData = useMemo(() => {
		const customCategory = structuredTopics.find((category) => category.categoryName === "Custom Queries")
		if (customCategory && customCategory.subcategories.length > 0) {
			return customCategory.subcategories[0].questions
		}
		return []
	}, [structuredTopics])

	// Initialize custom topics from data or local state
	useEffect(() => {
		if (hasCustomQueries) {
			setCustomTopics(customQueriesFromData)
		}
	}, [hasCustomQueries, customQueriesFromData])

	// Get all questions for select all functionality (including custom topics)
	const allQuestions = useMemo(() => {
		const questions: string[] = []

		// Add custom topics
		customTopics.forEach((questionObj) => {
			questions.push(questionObj.question)
		})

		// Add regular topics (excluding Custom Queries since we handle them separately)
		structuredTopics.forEach((category) => {
			if (category.categoryName !== "Custom Queries") {
				category.subcategories.forEach((subcategory) => {
					subcategory.questions.forEach((questionObj) => {
						questions.push(questionObj.question)
					})
				})
			}
		})
		return questions
	}, [structuredTopics, customTopics])

	const questionToLocationMap = useMemo(() => {
		if (!topicSelectionData || topicSelectionData.status !== "completed" || !topicSelectionData.data) {
			return new Map()
		}

		const map = new Map<string, { categoryName: string; subcategoryName: string; questionObj: Question }>()
		const result = topicSelectionData.data.research_categories

		Object.entries(result).forEach(([categoryName, category]) => {
			Object.entries(category).forEach(([subcategoryName, subcategory]) => {
				subcategory.forEach((questionObj) => {
					map.set(questionObj.question, { categoryName, subcategoryName, questionObj })
				})
			})
		})

		// Add custom topics to the map
		customTopics.forEach((questionObj) => {
			map.set(questionObj.question, {
				categoryName: "Custom Queries",
				subcategoryName: "Custom topics",
				questionObj,
			})
		})

		return map
	}, [topicSelectionData, customTopics])

	// Update deep research enabled state based on research toggle and selected topics
	useEffect(() => {
		const hasSelectedQuestions = selectedTopics.length > 0
		const deepResearchShouldBeEnabled = isResearchOn && hasSelectedQuestions

		setDeepResearchEnabled?.(deepResearchShouldBeEnabled)
	}, [isResearchOn, selectedTopics.length, setDeepResearchEnabled])

	useEffect(() => {
		if (!questionToLocationMap.size || selectedTopics.length === 0) {
			setTopicSelectedQuestions({ research_categories: {} })
			return
		}

		const selectedStructure: TopicSelection["research_categories"] = {}

		selectedTopics.forEach((selectedQuestion) => {
			const location = questionToLocationMap.get(selectedQuestion)
			if (!location) return

			const { categoryName, subcategoryName, questionObj } = location

			if (!selectedStructure[categoryName]) {
				selectedStructure[categoryName] = {}
			}

			if (!selectedStructure[categoryName][subcategoryName]) {
				selectedStructure[categoryName][subcategoryName] = []
			}

			selectedStructure[categoryName][subcategoryName].push(questionObj)
		})

		setTopicSelectedQuestions({ research_categories: selectedStructure })
	}, [selectedTopics, questionToLocationMap, setTopicSelectedQuestions])

	const handleCheckboxChange = (topic: string) => {
		if (!isResearchOn) return // Disable topic selection when research is off
		if (selectedTopics.includes(topic)) {
			setSelectedTopics(selectedTopics.filter((t) => t !== topic))
		} else {
			setSelectedTopics([...selectedTopics, topic])
		}
	}

	const handleSelectAll = () => {
		if (!isResearchOn) return
		if (selectedTopics.length === allQuestions.length) {
			setSelectedTopics([])
		} else {
			setSelectedTopics(allQuestions)
		}
	}

	const handleToggleResearch = () => {
		if (isResearchOn) {
			setPreviousSelections(selectedTopics)
			setSelectedTopics([])
		} else {
			setSelectedTopics(previousSelections)
		}
		setIsResearchOn(!isResearchOn)
	}

	// Custom topics handlers
	const handleAddCustomTopic = () => {
		const newTopic: Question = { question: "" }
		setCustomTopics([...customTopics, newTopic])
		setEditingIndex(customTopics.length)
		setEditValue("")
	}

	const handleDeleteCustomTopic = (index: number) => {
		const topicToDelete = customTopics[index]
		setCustomTopics(customTopics.filter((_, i) => i !== index))
		// Remove from selected topics if it was selected
		setSelectedTopics(selectedTopics.filter((topic) => topic !== topicToDelete.question))
		// Cancel editing if we're editing this topic
		if (editingIndex === index) {
			setEditingIndex(null)
			setEditValue("")
		}
	}

	const handleEditCustomTopic = (index: number) => {
		setEditingIndex(index)
		setEditValue(customTopics[index].question)
	}

	const handleSaveEdit = (index: number) => {
		if (editValue.trim()) {
			const oldQuestion = customTopics[index].question
			const updatedTopics = [...customTopics]
			updatedTopics[index] = { question: editValue.trim() }
			setCustomTopics(updatedTopics)

			// Update selected topics if this topic was selected
			if (selectedTopics.includes(oldQuestion)) {
				setSelectedTopics(selectedTopics.map((topic) => (topic === oldQuestion ? editValue.trim() : topic)))
			}
		}
		setEditingIndex(null)
		setEditValue("")
	}

	const handleCancelEdit = () => {
		// If we're editing a new topic with placeholder text, remove it
		if (editingIndex !== null && customTopics[editingIndex].question === "Enter here...") {
			setCustomTopics(customTopics.filter((_, i) => i !== editingIndex))
		}
		setEditingIndex(null)
		setEditValue("")
	}

	const handleKeyPress = (e: React.KeyboardEvent, index: number) => {
		if (e.key === "Enter") {
			handleSaveEdit(index)
		} else if (e.key === "Escape") {
			handleCancelEdit()
		}
	}

	// Structured topics edit handlers
	const handleEditStructuredTopic = (categoryIndex: number, subcategoryIndex: number, questionIndex: number) => {
		const question =
			structuredTopics[categoryIndex].subcategories[subcategoryIndex].questions[questionIndex].question
		setEditingStructuredTopic({ categoryIndex, subcategoryIndex, questionIndex })
		setEditingStructuredValue(question)
	}

	const handleSaveStructuredEdit = () => {
		if (!editingStructuredTopic || !editingStructuredValue.trim()) {
			setEditingStructuredTopic(null)
			setEditingStructuredValue("")
			return
		}

		const { categoryIndex, subcategoryIndex, questionIndex } = editingStructuredTopic
		const oldQuestion =
			structuredTopics[categoryIndex].subcategories[subcategoryIndex].questions[questionIndex].question

		// Update the structured topics data
		const updatedStructuredTopics = [...structuredTopics]
		updatedStructuredTopics[categoryIndex].subcategories[subcategoryIndex].questions[questionIndex] = {
			question: editingStructuredValue.trim(),
		}

		// Update selected topics if this topic was selected
		if (selectedTopics.includes(oldQuestion)) {
			setSelectedTopics(
				selectedTopics.map((topic) => (topic === oldQuestion ? editingStructuredValue.trim() : topic))
			)
		}

		setEditingStructuredTopic(null)
		setEditingStructuredValue("")
	}

	const handleCancelStructuredEdit = () => {
		setEditingStructuredTopic(null)
		setEditingStructuredValue("")
	}

	const handleStructuredKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSaveStructuredEdit()
		} else if (e.key === "Escape") {
			handleCancelStructuredEdit()
		}
	}

	// Helper function to check if a structured topic is being edited
	const isStructuredTopicBeingEdited = (categoryIndex: number, subcategoryIndex: number, questionIndex: number) => {
		return (
			editingStructuredTopic?.categoryIndex === categoryIndex &&
			editingStructuredTopic?.subcategoryIndex === subcategoryIndex &&
			editingStructuredTopic?.questionIndex === questionIndex
		)
	}

	// Loading state
	if (isLoading) {
		return (
			<div className="pt-3 pb-6 px-50 bg-white mt-2 flex flex-col gap-2 shadow-md rounded-lg max-h-full overflow-y-auto custom-scrollbar">
				<div className="flex flex-col justify-center items-center gap-2 py-8">
					<Loader size="xl" variant="primary" />
					<span className="text-sm text-neutral-800">Loading topics...</span>
				</div>
			</div>
		)
	}

	// Error state
	if (error) {
		return (
			<div className="pt-3 pb-6 px-50 bg-white mt-2 flex flex-col gap-2 shadow-md rounded-lg max-h-full overflow-y-auto custom-scrollbar">
				<div className="flex justify-center items-center py-8">
					<span className="text-sm text-red-500">Error loading topics. Please try again.</span>
				</div>
			</div>
		)
	}

	// No topics available
	if (structuredTopics.length === 0 && customTopics.length === 0) {
		return (
			<div className="pt-3 pb-6 px-50 bg-white mt-2 flex flex-col gap-2 shadow-md rounded-lg max-h-full overflow-y-auto custom-scrollbar">
				<div className="flex justify-center items-center py-8">
					<span className="text-sm text-neutral-500">No topics available.</span>
				</div>
			</div>
		)
	}

	return (
		<div className="pt-3 pb-6 px-50 bg-white flex flex-col gap-2 rounded-lg  overflow-y-auto custom-scrollbar">
			{/* Header with Select All / Warning and Deep Research Switch */}
			{isResearchOn ? (
				<div className="flex justify-between items-center px-3 py-2 ">
					<div className="flex items-center gap-3 cursor-pointer" onClick={handleSelectAll}>
						<Checkbox
							checked={selectedTopics.length === allQuestions.length}
							className="data-[state=checked]:bg-black data-[state=checked]:border-black"
						/>
						<span className="text-sm text-neutral-700">
							{selectedTopics.length === allQuestions.length ? "Deselect All" : "Select All"}
						</span>
					</div>

					<div className="flex items-center gap-2">
						<Switch checked={isResearchOn} onCheckedChange={handleToggleResearch} />
						<span className="text-xs text-neutral-600">Deep research enabled</span>
					</div>
				</div>
			) : (
				<div className="flex justify-between items-center px-3 py-2 border border-warning-200 bg-[#FFFBEF] rounded-lg">
					<div className="flex items-center gap-2  ">
						<Warning2 size={18} className="text-warning-400" />
						<span className="text-sm text-warning-400">
							Deep Research is disabled. Enable it to explore and select research topics.
						</span>
					</div>

					<div className="flex items-center gap-2">
						<Switch
							checked={isResearchOn}
							onCheckedChange={handleToggleResearch}
							className="data-[state=unchecked]:bg-[#F6DDA9]"
						/>
					</div>
				</div>
			)}

			<div className="flex flex-col justify-between gap-4">
				{/* Add custom topics button - only show if no custom queries exist */}
				{!hasCustomQueries && customTopics.length === 0 && (
					<div className="flex justify-start items-center py-1.5 px-2">
						<Button
							className="bg-primary-200 text-primary hover:opacity-90"
							variant="outline"
							size="sm"
							onClick={handleAddCustomTopic}
						>
							<Plus color="#5151D0" />
							Add custom topics
						</Button>
					</div>
				)}

				{/* Custom Queries Section - render at the top if they exist */}
				{customTopics.length > 0 && (
					<div className="flex flex-col p-1.5 gap-2 border border-neutral-300 rounded-lg bg-white">
						<Badge variant="primaryTransparent" dot>
							Custom topics
						</Badge>
						<div className="flex flex-col gap-2">
							{customTopics.map((questionObj, questionIndex) => (
								<div
									key={`custom-${questionIndex}`}
									className={`flex gap-3 p-3  items-center rounded-[10px] transition-colors ${
										!isResearchOn
											? "text-sm text-neutral-500 border-neutral-300 bg-white opacity-50"
											: selectedTopics.includes(questionObj.question)
											? "text-sm text-neutral-800 border-neutral-600 bg-neutral-100"
											: "text-sm text-neutral-700 border-neutral-300 bg-white hover:text-neutral-700 hover:border-neutral-600 hover:bg-neutral-100"
									}`}
								>
									<Checkbox
										checked={selectedTopics.includes(questionObj.question)}
										disabled={!isResearchOn}
										className="data-[state=checked]:bg-black data-[state=checked]:border-black disabled:opacity-50"
										onClick={() => handleCheckboxChange(questionObj.question)}
									/>
									{editingIndex === questionIndex ? (
										<Input
											value={editValue}
											onChange={(e) => setEditValue(e.target.value)}
											onKeyDown={(e) => handleKeyPress(e, questionIndex)}
											onBlur={() => handleSaveEdit(questionIndex)}
											className="flex-1 text-sm text-neutral-900"
											placeholder="Enter Here .."
											multiline
											autoResize
											autoFocus
										/>
									) : (
										<span
											className={`flex-1 cursor-pointer ${
												!questionObj.question ? "text-neutral-600" : ""
											}`}
											onClick={() => handleCheckboxChange(questionObj.question)}
										>
											{questionObj.question || "Enter here..."}
										</span>
									)}
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => handleDeleteCustomTopic(questionIndex)}
											className="p-1.5 h-auto"
										>
											<Trash className="text-danger-300" />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => handleEditCustomTopic(questionIndex)}
											className="p-1.5 h-auto"
										>
											<Edit className="text-neutral-600" />
										</Button>
									</div>
								</div>
							))}
							{/* Add new topic button */}
							<Button
								variant="ghost"
								size="sm"
								onClick={handleAddCustomTopic}
								className="flex items-center justify-start text-primary hover:opacity-90"
							>
								<Plus />
								Add new topic
							</Button>
						</div>
					</div>
				)}

				{/* Structured Categories and Questions Container */}
				<div className="flex flex-col gap-2">
					{structuredTopics.map((category, categoryIndex) => {
						// Skip Custom Queries as we handle them separately above
						if (category.categoryName === "Custom Queries") return null

						return (
							<div key={`${category.categoryName}-${categoryIndex}`} className="flex flex-col gap-2">
								<div className="text-sm text-neutral-900 font-semibold flex gap-2 items-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 14 14"
										fill="none"
									>
										<path
											d="M2.46134 1.80859H9.13467C9.53134 1.80859 10.0272 2.08276 10.2372 2.42109L12.6755 6.31776C12.9088 6.69693 12.8855 7.29193 12.6172 7.64776L9.59553 11.6728C9.37969 11.9586 8.91301 12.1919 8.55718 12.1919H2.46134C1.4405 12.1919 0.822196 11.0719 1.35886 10.2028L2.97467 7.61859C3.1905 7.27443 3.1905 6.71443 2.97467 6.37026L1.35886 3.78609C0.822196 2.92859 1.44634 1.80859 2.46134 1.80859Z"
											stroke="#292D32"
											strokeWidth="1.5"
											strokeMiterlimit="10"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
									{category.categoryName}
								</div>
								<div className="flex flex-col gap-2 p-1.5">
									{category.subcategories.map((subcategory, subcategoryIndex) => (
										<div
											key={`${subcategory.subcategoryName}-${subcategoryIndex}`}
											className="flex flex-col gap-2"
										>
											<Badge variant="orangeTransparent" dot>
												{truncateText(subcategory.subcategoryName, 70)}
											</Badge>
											<div className="flex flex-col gap-2 ">
												{subcategory.questions.map((questionObj, questionIndex) => (
													<div
														key={`${questionObj.question}-${questionIndex}`}
														className={`flex gap-3 p-3 border items-center rounded-[10px] transition-colors ${
															!isResearchOn
																? "text-sm text-neutral-500 border-neutral-300 bg-white opacity-50 pointer-events-none"
																: selectedTopics.includes(questionObj.question)
																? "text-sm text-neutral-800 border-neutral-600 bg-neutral-100"
																: "text-sm text-neutral-700 border-neutral-300 bg-white hover:text-neutral-700 hover:border-neutral-600 hover:bg-neutral-100"
														}`}
													>
														<Checkbox
															checked={selectedTopics.includes(questionObj.question)}
															disabled={!isResearchOn}
															className="data-[state=checked]:bg-black data-[state=checked]:border-black disabled:opacity-50"
															onClick={() => handleCheckboxChange(questionObj.question)}
														/>
														{isStructuredTopicBeingEdited(
															categoryIndex,
															subcategoryIndex,
															questionIndex
														) ? (
															<Input
																value={editingStructuredValue}
																onChange={(e) =>
																	setEditingStructuredValue(e.target.value)
																}
																onKeyDown={handleStructuredKeyPress}
																onBlur={handleSaveStructuredEdit}
																className="flex-1 text-sm text-neutral-900"
																multiline
																autoResize
																autoFocus
															/>
														) : (
															<span
																className="flex-1 cursor-pointer"
																onClick={() =>
																	handleCheckboxChange(questionObj.question)
																}
															>
																{questionObj.question}
															</span>
														)}
														<Button
															variant="ghost"
															size="icon-sm"
															onClick={() =>
																handleEditStructuredTopic(
																	categoryIndex,
																	subcategoryIndex,
																	questionIndex
																)
															}
															className="p-1.5 h-auto"
														>
															<Edit className="text-neutral-600" />
														</Button>
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

// Main wrapper component that handles status checking
const TopicSelectionWrapper: React.FC = () => {
	const { source_id } = useParams<{ source_id: string }>()
	const { setDeepResearchStatus } = usePreStepStore()

	// Fetch deep research status
	const {
		data: statusData,
		isLoading: statusLoading,
		error: statusError,
	} = useDeepResearchStatus(parseInt(source_id), true)

	useEffect(() => {
		if (statusData) {
			setDeepResearchStatus(statusData.status)
		}
	}, [statusData, setDeepResearchStatus])

	// Show loading state while checking status
	if (statusLoading) {
		return (
			<div className="pt-3 pb-6 px-50 bg-white mt-2 flex flex-col gap-2 shadow-md rounded-lg max-h-full overflow-y-auto custom-scrollbar">
				<div className="flex flex-col justify-center items-center gap-2 py-8">
					<Loader size="xl" variant="primary" />
					<span className="text-sm text-neutral-800">Checking deep research status...</span>
				</div>
			</div>
		)
	}

	// Show error state if status check failed
	if (statusError) {
		return (
			<div className="pt-3 pb-6 px-50 bg-white mt-2 flex flex-col gap-2 shadow-md rounded-lg max-h-full overflow-y-auto custom-scrollbar">
				<div className="flex justify-center items-center py-8">
					<span className="text-sm text-red-500">Error checking research status. Please try again.</span>
				</div>
			</div>
		)
	}

	// If status is not NOT_STARTED, show the status display
	if (statusData && statusData.status !== "NOT_STARTED") {
		// Update the store with the current status
		return (
			<DeepResearchStatusDisplay
				status={statusData.status}
				message={statusData.message}
				totalTasks={statusData.total_tasks}
				completedTasks={statusData.completed_tasks}
				startedAt={statusData.started_at}
				updatedAt={statusData.updated_at}
				completedAt={statusData.completed_at}
			/>
		)
	}

	// If status is NOT_STARTED, render the topic selection component
	return <TopicSelectionContent />
}

export default TopicSelectionWrapper
