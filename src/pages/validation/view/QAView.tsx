import { Edit, Magicpen, MessageQuestion } from "iconsax-reactjs"
import { ArrowRight, Reply, Trash2, Upload } from "lucide-react"
import React, { useEffect, useState, useRef, type JSX } from "react"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { GradientIcon } from "~/components/ui/gradientIcon"
import { Input } from "~/components/ui/input"
import { Loader } from "~/components/ui/loader"
import {
	useGetQuestions,
	useAddQuestion,
	useEditQuestion,
	useDeleteQuestion,
	useRegenerateQuestion,
} from "~/handlers/QnAHandler"
import { exportQuestionsDocx, exportQuestionsPdf } from "~/lib/ExportQnA"

interface Question {
	id: number
	text: string
}

interface QuestionItemProps {
	question: Question
	isEditing: boolean
	onEdit: (id: number | null) => void
	onDelete: (id: number) => void
	onSave: (id: number, text: string) => void
	editingText: string
	onEditingTextChange: (text: string) => void
	onRegenerate: (id: number, prompt: string) => void
	isLast?: boolean
	onRegenerateOpen: boolean
	onRegenerateOpenChange: (open: boolean) => void
	loading: boolean
}

interface RegenerateQuestionData {
	questions: string[]
}

const QuestionItem: React.FC<QuestionItemProps> = ({
	question,
	isEditing,
	onEdit,
	onDelete,
	onSave,
	editingText,
	onEditingTextChange,
	onRegenerate,
	isLast,
	onRegenerateOpen,
	onRegenerateOpenChange,
	loading,
}) => {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)
	const regenPanelRef = useRef<HTMLDivElement | null>(null)
	const regenButtonRef = useRef<HTMLButtonElement | null>(null)

	const [regeneratePrompt, setRegeneratePrompt] = useState("")

	useEffect(() => {
		if (isEditing && textareaRef.current) {
			textareaRef.current.style.height = "auto"
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`

			const length = textareaRef.current.value.length
			textareaRef.current.setSelectionRange(length, length)
			textareaRef.current.focus()
		}
	}, [isEditing])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				onRegenerateOpen &&
				regenPanelRef.current &&
				!regenPanelRef.current.contains(event.target as Node) &&
				regenButtonRef.current &&
				!regenButtonRef.current.contains(event.target as Node)
			) {
				onRegenerateOpenChange(false)
				setRegeneratePrompt("")
			}
		}

		document.addEventListener("mousedown", handleClickOutside)
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [onRegenerateOpen, onRegenerateOpenChange])

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			onSave(question.id, editingText)
		}
		if (e.key === "Escape") onEdit(null)
	}

	const handleRegenerateClick = () => {
		onRegenerateOpenChange(!onRegenerateOpen)
		setRegeneratePrompt("")
	}

	const handleSubmitRegenerate = () => {
		if (!regeneratePrompt.trim()) return

		onRegenerate(question.id, regeneratePrompt)
		onRegenerateOpenChange(false)
		setRegeneratePrompt("")
	}

	return (
		<div
			className={`group relative flex items-start gap-1 px-4 py-2.5 w-full rounded-md transition-colors ${
				isEditing ? "bg-neutral-200" : "bg-white hover:bg-neutral-100"
			}`}
		>
			{/* Question Text */}
			<div className="flex-1 min-w-0">
				{isEditing ? (
					<Input
						multiline={true}
						autoResize={true}
						value={editingText}
						onChange={(e) => onEditingTextChange(e.target.value)}
						onKeyDown={handleKeyDown}
						onBlur={() => {
							onSave(question.id, editingText)
						}}
						autoFocus
						disabled={loading}
						className="w-full resize-none text-sm font-regular leading-5 font-inter h-auto min-h-9 bg-transparent outline-none"
						style={{ whiteSpace: "pre-wrap" }}
						aria-label="Edit question"
					/>
				) : (
					<p
						className="font-inter font-regular text-sm leading-5 tracking-normal text-neutral-700 hover:text-neutral-800 whitespace-pre-wrap break-words transition-colors cursor-text"
						onClick={() => onEdit(question.id)}
					>
						{question.text}
					</p>
				)}
			</div>

			{/* Action Buttons */}
			<div className="absolute -top-2 right-4 inline-flex items-center gap-0.5 p-1 rounded-lg border border-solid border-neutral-400 shadow-[-2px_2px_6px_#f1f3f6] bg-white z-10 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
				<Button
					variant="outline"
					size="icon-sm"
					className="p-1.5 hover:bg-primary-100 border-none"
					ref={regenButtonRef}
					onClick={handleRegenerateClick}
					aria-label="Regenerate question with AI"
				>
					<GradientIcon
						Icon={Magicpen}
						angle={90}
						stops={[
							{ offset: "0%", color: "#5151D0" },
							{ offset: "100%", color: "#D4358F" },
						]}
						size={16}
						mode="stroke"
						strokeWidth={1.5}
					/>
				</Button>

				<Button
					variant="outline"
					size="icon-sm"
					className="p-1.5 hover:bg-neutral-200 [&_svg]:text-neutral-600 hover:[&_svg]:text-neutral-800 border-none"
					onClick={(e) => {
						e.stopPropagation()
						onEdit(question.id)
					}}
					aria-label="Edit question"
					title="Edit"
				>
					<Edit />
				</Button>

				<Button
					variant="outline"
					size="icon-sm"
					className="p-1.5 hover:bg-danger-100 [&_svg]:text-danger-300 border-none"
					onClick={() => onDelete(question.id)}
					aria-label="Delete question"
				>
					<Trash2 />
				</Button>
			</div>

			{/* Regenerate Panel */}
			{onRegenerateOpen && (
				<div
					ref={regenPanelRef}
					className={`absolute ${
						isLast ? "bottom-full mb-2" : "top-6 mt-2"
					} right-3 w-[25.5rem] rounded-xl flex flex-col p-1 bg-[#20252D] z-30`}
				>
					<div className="flex items-center justify-between px-1 gap-2 mb-1">
						<p className="font-inter font-medium text-xs text-primary-200 tracking-normal leading-4">
							Regenerate question with AI
						</p>
					</div>

					<div className="relative rounded-md">
						<div className="w-full rounded-lg bg-white pt-2 pb-2 pl-2.5 pr-2.5">
							<textarea
								className={`w-full text-xs bg-white outline-none resize-none rounded-md ${
									regeneratePrompt ? "text-neutral-900" : "text-neutral-600"
								}`}
								placeholder="Write your prompt"
								value={regeneratePrompt}
								onChange={(e) => setRegeneratePrompt(e.target.value)}
								rows={3}
							/>
						</div>

						<button
							className={`absolute bottom-2 right-2 w-7 h-7 rounded-md p-1.5 cursor-pointer flex items-center justify-center ${
								regeneratePrompt ? "bg-gradient-to-r from-[#5151D0] to-[#D4358F]" : "bg-neutral-300"
							}`}
							onClick={handleSubmitRegenerate}
							aria-label="Submit regenerate"
						>
							<ArrowRight className="!w-4 !h-4 !text-white" />
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

export const QAView = ({ source_id }: { source_id: string | number }): JSX.Element => {
	const [questions, setQuestions] = useState<Question[]>([])
	const [newQuestion, setNewQuestion] = useState("")
	const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)
	const [editingText, setEditingText] = useState("")
	const [regenerateOpenId, setRegenerateOpenId] = useState<number | null>(null)

	const { data, isLoading, error } = useGetQuestions(source_id)
	const addQuestionMutation = useAddQuestion(source_id)
	const editQuestionMutation = useEditQuestion(source_id)
	const deleteQuestionMutation = useDeleteQuestion(source_id)
	const regenerateQuestionMutation = useRegenerateQuestion(source_id)

	useEffect(() => {
		if (data?.status === "error") {
			toast.error(data.message)
		} else if (data?.data?.questions) {
			setQuestions(
				data.data.questions.map((text: string, i: number) => ({
					id: i + 1,
					text,
				}))
			)
		}
	}, [data])

	const handleAddQuestion = async () => {
		if (!newQuestion.trim()) return

		addQuestionMutation.mutate(newQuestion.trim(), {
			onSuccess: (response) => {
				if (response?.status === "complete") {
					setNewQuestion("")
					toast.success(response.message)
				} else {
					toast.error(response?.message || "Failed to add question")
				}
			},
			onError: (error: any) => {
				toast.error(error?.message || "Failed to add question")
			},
		})
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleAddQuestion()
		}
	}

	const handleEdit = (id: number | null) => {
		if (id === null) {
			setEditingQuestionId(null)
			setEditingText("")
			return
		}
		const question = questions.find((q) => q.id === id)
		if (question) {
			setEditingQuestionId(id)
			setEditingText(question.text)
		}
	}

	const saveEdit = async () => {
		if (!editingQuestionId || !editingText.trim()) return

		const index = questions.findIndex((q) => q.id === editingQuestionId)
		const originalText = questions[index]?.text

		if (editingText.trim() === originalText?.trim()) {
			setEditingQuestionId(null)
			setEditingText("")
			return
		}

		editQuestionMutation.mutate(
			{ index: String(index), new_question: editingText.trim() },
			{
				onSuccess: (response) => {
					if (response?.status === "complete") {
						toast.success(response.message)
					} else {
						toast.error(response.message)
					}
					setEditingQuestionId(null)
					setEditingText("")
				},
				onError: (error: any) => {
					toast.error(error?.message || "Failed to edit question")
					setEditingQuestionId(null)
					setEditingText("")
				},
			}
		)
	}

	const handleDelete = async (id: number) => {
		deleteQuestionMutation.mutate(String(id - 1), {
			onSuccess: (response) => {
				if (response?.status === "complete") {
					toast.success(response.message)
				} else {
					toast.error(response?.message)
				}
			},
			onError: (error: any) => {
				toast.error(error?.message || "Failed to delete question")
			},
		})
	}

	const handleRegenerateOpenChange = (open: boolean) => {
		if (!open) {
			setRegenerateOpenId(null)
		}
	}

	const handleRegenerateOpenChangeWithId = (open: boolean, id: number | null) => {
		if (open) {
			setRegenerateOpenId(id)
		} else {
			setRegenerateOpenId(null)
		}
	}

	const handleRegenerate = async (id: number, prompt: string) => {
		const index = questions.findIndex((q) => q.id === id)

		regenerateQuestionMutation.mutate(
			{ index: String(index), user_feedback: prompt },
			{
				onSuccess: (response) => {
					const status = String(response?.status ?? "")
					if (status === "completed" || status === "complete") {
						toast.success(response?.message ?? "Question regenerated")
					} else {
						toast.error(response?.message ?? "Failed to regenerate question")
					}
				},
				onError: (error: any) => {
					toast.error(error?.message ?? "Failed to regenerate question")
				},
			}
		)
	}

	const getRowsForInput = () => {
		if (!newQuestion) return 1
		const lines = (newQuestion.match(/\n/g) || []).length + 1
		if (lines > 1 || newQuestion.length > 50) return 2
		return 1
	}

	const isComponentLoading =
		isLoading ||
		addQuestionMutation.isPending ||
		editQuestionMutation.isPending ||
		deleteQuestionMutation.isPending ||
		regenerateQuestionMutation.isPending

	return (
		<div className="flex h-full w-full items-center justify-center p-3 bg-neutral-200 overflow-hidden">
			<div className="relative flex flex-col w-full max-w-4xl h-full bg-white rounded-xl border border-solid border-neutral-300 shadow-[2px_2px_6px_#d0deeb5c] overflow-hidden">
				{/* Component Loading Overlay */}
				{isComponentLoading && (
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-50 rounded-xl">
						<div className="flex items-center gap-3 text-neutral-700">
							<Loader size="lg" variant="primary" className="text-primary-400" />
							<span className="text-sm">
								{isLoading
									? "Loading questions…"
									: regenerateQuestionMutation.isPending
									? "Regenerating question… please wait"
									: "Processing…"}
							</span>
						</div>
					</div>
				)}

				{/* Input Section */}
				<div className="flex flex-col gap-0.5 px-3 pt-3 pb-0 flex-shrink-0">
					<div
						className={`flex items-center gap-4 min-h-12 pt-1.5 pr-1.5 pb-1.5 pl-4 rounded-full border border-solid transition-colors ${
							newQuestion.trim() ? "border-primary-300" : "border-neutral-400"
						}`}
					>
						<div className="flex items-center gap-2 flex-1">
							<MessageQuestion
								className={`w-5 h-5 flex-shrink-0 ${
									newQuestion.trim() ? "text-primary-400" : "text-neutral-600"
								}`}
							/>
							<Input
								rows={getRowsForInput()}
								multiline={true}
								value={newQuestion}
								onChange={(e) => setNewQuestion(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Enter your question"
								disabled={isComponentLoading}
								className={`flex-1 font-inter items-center font-normal text-md leading-5 outline-none py-3 overflow-y-auto custom-scrollbar bg-transparent selection:bg-neutral-400 ${
									newQuestion.trim() ? "text-neutral-900" : "text-neutral-500"
								}`}
								aria-label="Enter your question"
							/>
						</div>

						<button
							onClick={handleAddQuestion}
							disabled={!newQuestion.trim() || isComponentLoading}
							className={`inline-flex items-center justify-center p-2.5 rounded-full flex-shrink-0 transition-opacity ${
								newQuestion.trim() && !isComponentLoading
									? "bg-primary-400 text-white cursor-pointer"
									: "bg-neutral-400 text-white pointer-events-none opacity-60"
							}`}
							aria-label="Submit question"
						>
							<ArrowRight className="w-4 h-4" />
						</button>
					</div>

					<div className="flex items-center justify-end gap-1 h-4 px-2 text-neutral-600">
						<Reply size={14} />
						<p className="font-inter font-medium text-xs leading-4 whitespace-nowrap">
							Or press &apos;Enter&apos; to add question
						</p>
					</div>
				</div>

				{/* Questions List Section */}
				<div className="flex-1 flex flex-col overflow-hidden pt-7">
					{/* Header */}
					{!isLoading && questions.length > 0 && (
						<div className="flex items-center justify-between px-4 pb-4 flex-shrink-0">
							<p className="font-medium text-sm leading-5 text-neutral-900 font-inter">All questions</p>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										size="sm"
										variant="outline"
										className="px-2.5 py-1 [&_svg:not([class*='size-'])]:size-3.5"
									>
										<Upload />
										Export
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="w-40 rounded-lg border border-gray-200 bg-white shadow-lg p-1"
								>
									<DropdownMenuItem
										disabled={isLoading || isComponentLoading || questions.length === 0}
										className="flex py-1.5 px-2 items-center gap-2 rounded-lg hover:bg-neutral-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
										onClick={() => {
											if (questions.length === 0) {
												toast.info("No questions to export")
												return
											}
											exportQuestionsPdf(
												questions.map((q) => q.text),
												`Questions-${source_id}`
											)
										}}
									>
										<span className="text-xs font-medium leading-4 font-sans text-neutral-700 hover:text-neutral-800">
											Export as PDF
										</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={isLoading || isComponentLoading || questions.length === 0}
										className="flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-neutral-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
										onClick={() => {
											if (questions.length === 0) {
												toast.info("No questions to export")
												return
											}
											exportQuestionsDocx(
												questions.map((q) => q.text),
												`Questions-${source_id}`
											)
										}}
									>
										<span className="text-xs font-medium leading-4 font-sans text-neutral-700 hover:text-neutral-800">
											Export as DOCX
										</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}

					{/* Questions Container */}
					<div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
						{!isLoading && questions.length > 0 && (
							<div className="flex flex-col gap-1.5 pb-5">
								{questions.map((question, idx, arr) => (
									<QuestionItem
										key={question.id}
										isEditing={editingQuestionId === question.id}
										question={question}
										onEdit={handleEdit}
										onDelete={handleDelete}
										onSave={saveEdit}
										editingText={editingText}
										onEditingTextChange={setEditingText}
										onRegenerate={handleRegenerate}
										loading={isComponentLoading}
										isLast={idx === arr.length - 1}
										onRegenerateOpen={regenerateOpenId === question.id}
										onRegenerateOpenChange={(open: boolean) =>
											handleRegenerateOpenChangeWithId(open, question.id)
										}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
