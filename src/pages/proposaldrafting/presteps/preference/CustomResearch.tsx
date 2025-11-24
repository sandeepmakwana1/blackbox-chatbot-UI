import React, { useState } from "react"
import { Trash } from "iconsax-reactjs"

interface CustomResearchProps {
	topics: string[]
	onDeleteTopic: (index: number) => void
}

const CustomResearch: React.FC<CustomResearchProps> = ({ topics, onDeleteTopic }) => {
	const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)

	return (
		<div className="flex flex-row mt-2 space-x-2 h-full">
			<div className="w-1/2 overflow-y-auto rounded-lg p-2">
				<ul className="space-y-3">
					{topics.length > 0 ? (
						topics.map((topic, index) => (
							<li
								key={index}
								className={`relative flex items-center justify-between p-3 rounded-lg cursor-pointer ${
									selectedTopicId === index ? "bg-[#EFF1FF]" : "bg-white"
								}`}
								onClick={() => setSelectedTopicId(index)}
							>
								<div
									className={`absolute left-3 w-[6px] h-[6px] rounded-full ${
										selectedTopicId === index ? "bg-[#5151D0]" : "bg-[#92A0B5]"
									}`}
								></div>

								<span
									className={`text-[14px] leading-[20px] flex-grow break-words pl-10 pr-10 ${
										selectedTopicId === index ? "text-[#121822]" : "text-[#475569]"
									}`}
								>
									{topic}
								</span>

								{selectedTopicId === index && (
									<svg
										width="10"
										height="10"
										viewBox="0 0 10 10"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
										className="absolute right-3"
									>
										<path
											d="M2 2L5 5L2 8"
											stroke="#121822"
											strokeWidth="1.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								)}
							</li>
						))
					) : (
						<p className="text-[14px] leading-[20px] text-[#92A0B5]">No topics added yet.</p>
					)}
				</ul>
			</div>

			{/* Right Half: Selected Topic Content */}
			<div className="w-1/2 overflow-y-auto rounded-lg p-4">
				{selectedTopicId !== null ? (
					<div
						className="bg-[#F9FAFB] border border-[#DFE5EC] rounded-lg p-4 relative"
						style={{
							paddingTop: "12px",
							paddingRight: "16px",
							paddingBottom: "12px",
							paddingLeft: "16px",
						}}
					>
						<h3 className="text-[16px] font-medium text-[#121822] whitespace-pre-wrap">
							{topics[selectedTopicId]}
						</h3>

						<button
							className="absolute top-4 right-4 text-[#92A0B5] hover:text-red-500 transition-colors"
							onClick={() => onDeleteTopic(selectedTopicId)}
						>
							<Trash size={16} />
						</button>
					</div>
				) : (
					<p className="text-[14px] leading-[20px] text-[#92A0B5]">Select a topic to view its content.</p>
				)}
			</div>
		</div>
	)
}

export default CustomResearch
