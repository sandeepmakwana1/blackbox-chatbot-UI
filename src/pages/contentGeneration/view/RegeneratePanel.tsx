import { Magicpen, Send } from "iconsax-reactjs"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Loader } from "~/components/ui/loader"
import type { Section } from "~/types/contentGeneration"

interface RegenerateSectionPanelProps {
	section: Section | null
	isOpen: boolean
	onClose: () => void
	onRegenerate: (feedback: string) => void
	isGenerating: boolean
}

export const RegenerateSectionPanel: React.FC<RegenerateSectionPanelProps> = ({
	section,
	isOpen,
	onClose,
	onRegenerate,
	isGenerating,
}) => {
	const [feedback, setFeedback] = useState("")

	useEffect(() => {
		if (!isOpen) {
			setFeedback("")
		}
	}, [isOpen])

	if (!isOpen || !section) return null

	const handleSubmit = () => {
		if (feedback.trim()) {
			onRegenerate(feedback.trim())
		}
	}

	return (
		<div className="flex flex-col bg-[#161A21] w-80 h-fit rounded-[12px] z-10 p-1.5 shadow-lg gap-3">
			<div className="flex flex-col gap-2 p-1">
				<div className="flex justify-between items-center self-stretch ">
					<div className="flex items-center p-1 bg-gradient-to-r from-[#5151D0] to-[#D4358F] rounded-[6px]">
						<Magicpen className="text-white" size={16} />
					</div>
					<button onClick={onClose} className="hover:opacity-70 transition-opacity" disabled={isGenerating}>
						<X className="text-neutral-600" size={14} />
					</button>
				</div>
				<div className="flex flex-col">
					<p className="text-white text-xs font-medium ">Regenerate section with AI</p>
					<p className="text-neutral-600 text-xs ">
						Provide a prompt for: {section.sectionNumber}. {section.sectionName}
					</p>
				</div>
			</div>
			<div className="flex flex-col self-stretch bg-white px-2.5 py-2 rounded-[10px]">
				<textarea
					value={feedback}
					onChange={(e) => setFeedback(e.target.value)}
					placeholder="Example: Validate the content against the RFP and optimize it to increase win potential..."
					className="text-neutral-800 text-xs bg-transparent border-none outline-none resize-none min-h-[138px] placeholder-neutral-600"
					disabled={isGenerating}
				/>
				<div className="flex flex-col items-end self-stretch">
					<Button
						size="icon-sm"
						variant="secondary"
						onClick={handleSubmit}
						disabled={isGenerating || !feedback.trim()}
						className="p-2"
					>
						{isGenerating ? <Loader size="sm" variant="neutral" /> : <Send size={16} />}
					</Button>
				</div>
			</div>
		</div>
	)
}
