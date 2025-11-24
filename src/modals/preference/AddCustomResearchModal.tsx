import { Add, CloseSquare, Trash } from "iconsax-reactjs"
import React, { useState } from "react"
import Blurbg from "~/components/ui/blurbg"
import { Button } from "~/components/ui/button"

interface AddCustomResearchModalProps {
	onClose: () => void
	onSubmit: (topics: string[]) => void
}

const AddCustomResearchModal: React.FC<AddCustomResearchModalProps> = ({ onClose, onSubmit }) => {
	const [researchTopics, setResearchTopics] = useState<string[]>([""])

	const handleAddNewTopic = () => {
		setResearchTopics([...researchTopics, ""])
	}

	const handleTopicChange = (index: number, value: string) => {
		const updatedTopics = [...researchTopics]
		updatedTopics[index] = value
		setResearchTopics(updatedTopics)
	}

	const handleDeleteTopic = (index: number) => {
		if (researchTopics.length > 1) {
			const updatedTopics = researchTopics.filter((_, i) => i !== index)
			setResearchTopics(updatedTopics)
		}
	}

	const handleSave = () => {
		const nonEmptyTopics = researchTopics.filter((topic) => topic.trim() !== "")
		onSubmit(nonEmptyTopics)
	}

	return (
		<>
			<Blurbg />
			<div className="fixed inset-0 flex items-center justify-center z-50">
				<div
					className="relative bg-white p-6 rounded-lg shadow-lg w-[50%] min-h-[30vh] max-h-[60vh] overflow-y-auto"
					style={{
						height: `${Math.min(30 + researchTopics.length * 5, 60)}vh`,
					}}
				>
					<button
						className="absolute top-4 right-4 text-[#92A0B5] hover:text-[#121822] transition-colors"
						onClick={onClose}
					>
						<CloseSquare size={20} />
					</button>

					<h2 className="text-[16px] font-medium text-[#121822] mb-4">Add Custom Research</h2>

					{researchTopics.map((topic, index) => (
						<div
							key={index}
							className="flex items-center w-full border border-[#CBD5E1] rounded-md mb-3 px-3 py-2"
						>
							<input
								type="text"
								placeholder="Type here..."
								value={topic}
								onChange={(e) => handleTopicChange(index, e.target.value)}
								className="text-[14px] flex-grow p-1 focus:outline-none focus:border-blue-500"
							/>
							<button
								className="ml-3 text-[#92A0B5] hover:text-red-500 transition-colors"
								onClick={() => handleDeleteTopic(index)}
								disabled={researchTopics.length === 1}
							>
								<Trash size={16} />
							</button>
						</div>
					))}

					<div className="flex justify-between pt-15">
						<Button variant="tertiary" onClick={handleAddNewTopic}>
							<Add size={16} className="mr-2" />
							Add new topics
						</Button>
						<Button variant="primary" onClick={handleSave}>
							Submit
						</Button>
					</div>
				</div>
			</div>
		</>
	)
}

export default AddCustomResearchModal
