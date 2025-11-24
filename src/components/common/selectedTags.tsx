import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import type { ReactNode } from "react"

export const SelectedTags = ({
	text = "Selected",
	selectedCount,
	max,
	inProgress = 0,
	failed = 0,
	isSmall = false,
	isTextHidden = false,
	tooltipHidden = false,
	tooltipContent,
}: {
	text?: string
	selectedCount: number
	max: number
	inProgress?: number
	failed?: number
	isSmall?: boolean
	isTextHidden?: boolean
	tooltipHidden?: boolean
	tooltipContent?: ReactNode
}) => {
	const getColor = (index: number) => {
		// Selected items come first
		if (index < selectedCount) {
			return "bg-[#23BE8D]" // Selected
		}

		// Calculate where in-progress and failed start (after selected)
		const inProgressStart = selectedCount
		const failedStart = selectedCount + inProgress
		const totalNonGray = selectedCount + inProgress + failed

		// In Progress items
		if (index >= inProgressStart && index < failedStart) {
			return "bg-[#FED37E]" // In Progress
		}

		// Failed items
		if (index >= failedStart && index < totalNonGray) {
			return "bg-[#F67A7A]" // Failed
		}

		// Unselected (gray) items at the end
		return "bg-neutral-500"
	}

	return !tooltipHidden ? (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="flex items-center gap-2">
					{/* Render dots based on max count */}
					<div className="flex gap-1">
						{Array.from({ length: max }, (_, index) => (
							<div
								key={index}
								className={`${isSmall ? "w-1.5 h-4" : "w-2 h-5"} rounded-sm ${getColor(index)}`}
							/>
						))}
					</div>

					{/* Selected count text */}
					{!isTextHidden && (
						<span className="text-neutral-900 font-medium text-sm">
							{selectedCount}/{max} {text}
						</span>
					)}
				</div>
			</TooltipTrigger>
			<TooltipContent>
				{tooltipContent || "You can add up to 5 proposals each day. Remaining slots shown here."}
			</TooltipContent>
		</Tooltip>
	) : (
		<div className="flex items-center gap-2">
			{/* Render dots based on max count */}
			<div className="flex gap-1">
				{Array.from({ length: max }, (_, index) => (
					<div key={index} className={`${isSmall ? "w-1.5 h-4" : "w-2 h-5"} rounded-sm ${getColor(index)}`} />
				))}
			</div>

			{/* Selected count text */}
			{!isTextHidden && (
				<span className="text-neutral-900 font-medium text-sm">
					{selectedCount}/{max} {text}
				</span>
			)}
		</div>
	)
}
