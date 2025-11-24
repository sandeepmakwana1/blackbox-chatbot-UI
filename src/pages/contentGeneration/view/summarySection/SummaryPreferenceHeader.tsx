import { Sparkles, Telescope, UserCog } from "lucide-react"
import React from "react"

type ButtonType = "summary" | "user-preferences" | "deep-research"

interface SummaryPreferencesHeaderProps {
	source_id: string
	selectedButton: ButtonType
	onButtonClick: (source_id: string, buttonName: ButtonType) => void
}

const SummaryPreferencesHeader: React.FC<SummaryPreferencesHeaderProps> = ({
	source_id,
	selectedButton,
	onButtonClick,
}) => {
	return (
		<div className="flex justify-between items-center mb-4 w-fit p-1 rounded-md bg-neutral-200">
			<div className="flex items-center gap-1">
				<button
					className={`py-1.5 px-3 rounded-sm text-sm font-medium transition-colors  ${
						selectedButton === "summary" ? "bg-[#121822] text-white" : "text-[#6E7C91]"
					}`}
					onClick={() => onButtonClick(source_id, "summary")}
				>
					<div className="flex items-center gap-1">
						<Sparkles className="size-4" />
						Summary
					</div>
				</button>
				<button
					className={`py-1.5 px-3 rounded-sm text-sm font-medium transition-colors  ${
						selectedButton === "deep-research" ? "bg-[#121822] text-white" : "text-[#6E7C91]"
					}`}
					onClick={() => onButtonClick(source_id, "deep-research")}
				>
					<div className="flex items-center gap-2">
						<Telescope className="size-4" />
						Deep Research
					</div>
				</button>
				<button
					className={`py-1.5 px-3 rounded-sm text-sm font-medium transition-colors ${
						selectedButton === "user-preferences" ? "bg-[#121822] text-white" : "text-[#6E7C91]"
					}`}
					onClick={() => onButtonClick(source_id, "user-preferences")}
				>
					<div className="flex items-center gap-2">
						<UserCog className="size-4" />
						User Preferences
					</div>
				</button>
			</div>
		</div>
	)
}

export default SummaryPreferencesHeader
