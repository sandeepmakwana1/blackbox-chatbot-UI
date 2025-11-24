import React from "react"

interface PreferencesHeaderProps {
	selectedButton: "user-preferences" | "deep-research" | string
	onButtonClick: (buttonName: "user-preferences" | "deep-research" | string) => void
	isUserPreferencesLoading: boolean
}

const PreferencesHeader: React.FC<PreferencesHeaderProps> = ({
	selectedButton,
	onButtonClick,
	isUserPreferencesLoading,
}) => {
	return (
		<div className="flex justify-between items-center mb-4">
			<div className="flex items-center space-x-4">
				<button
					className={`py-1.5 px-3 rounded text-sm font-medium transition-colors  ${
						selectedButton === "deep-research" ? "bg-[#121822] text-white" : "bg-[#F2F4F7] text-[#6E7C91]"
					}`}
					onClick={() => onButtonClick("deep-research")}
				>
					Deep Research
				</button>
				<button
					className={`py-1.5 px-3 rounded text-sm font-medium transition-colors ${
						selectedButton === "user-preferences"
							? "bg-[#121822] text-white"
							: isUserPreferencesLoading
							? "bg-gray-200 text-gray-400 cursor-not-allowed"
							: "bg-[#F2F4F7] text-[#6E7C91]"
					}`}
					onClick={() => !isUserPreferencesLoading && onButtonClick("user-preferences")}
					disabled={isUserPreferencesLoading}
				>
					User Preferences
					{isUserPreferencesLoading && (
						<span className="ml-2 inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></span>
					)}
				</button>
			</div>
		</div>
	)
}

export default PreferencesHeader
