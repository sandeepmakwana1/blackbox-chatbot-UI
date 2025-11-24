import { useState, useEffect, useCallback } from "react"
import { ScanText, FolderSymlink, FileText } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Switch } from "~/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { useValidationStore } from "~/store/validationStore"
import { useTabInfoStore } from "~/store/tabInfoStore"
import type { ContextType } from "~/components/playground/types/playground"
import { getCurrentPrestepStage } from "~/lib/utils"

interface ContextSourcesDropdownProps {
	context: string
	sourceId: string
	documentContext: ContextType[]
	setdocumentContext: (contexts: ContextType[]) => void
	proposalDocsEnabled: boolean
	setProposalDocsEnabled: (enabled: boolean) => void
	currentPageEnabled: boolean
	setCurrentPageEnabled: (enabled: boolean) => void
}

const ContextSourcesDropdown = ({
	context,
	sourceId,
	documentContext,
	setdocumentContext,
	proposalDocsEnabled,
	setProposalDocsEnabled,
	currentPageEnabled,
	setCurrentPageEnabled,
}: ContextSourcesDropdownProps) => {
	const { getCostingTabInfo, getValidationTabInfo, getContentTabInfo, getSummaryTabInfo, setOnTabChangeCallback } =
		useTabInfoStore()

	// Memoized context calculation function
	const calculateContexts = useCallback(
		(
			context: string,
			sourceId: string,
			proposalDocsEnabled: boolean,
			currentPageEnabled: boolean
		): ContextType[] => {
			// Early return if neither option is enabled
			if (!proposalDocsEnabled && !currentPageEnabled) {
				return []
			}

			// Base context always included when proposal docs are enabled
			let contexts: ContextType[] = proposalDocsEnabled ? ["rfp_context"] : []

			// Only add additional contexts if current page is enabled
			if (!currentPageEnabled) {
				return contexts
			}

			switch (context) {
				case "presteps":
					const prestepStage = getCurrentPrestepStage()
					const stageTitle = prestepStage.title?.toLowerCase()

					switch (stageTitle) {
						case "table-of-content":
							contexts.push("table_of_content")
							break
						case "preferences":
							contexts.push("deep_research", "user_preference")
							break
					}
					break

				case "validation":
					const currentValidationTab = getValidationTabInfo(sourceId)
					switch (currentValidationTab) {
						case "legal":
							contexts.push("validation_legal")
							break
						case "technical":
							contexts.push("validation_technical")
							break
					}
					break

				case "content-generation":
					const currentContentTab = getContentTabInfo(sourceId)
					switch (currentContentTab) {
						case "summary":
							const summaryTab = getSummaryTabInfo(sourceId)
							switch (summaryTab) {
								case "user-preferences":
									contexts.push("user_preference")
									break
								case "deep-research":
									contexts.push("deep_research")
									break
							}
							break
						case "contentgeneration":
							contexts.push("content")
							break
						case "costing":
							const currentCostingTab = getCostingTabInfo(sourceId)
							switch (currentCostingTab) {
								case "human-resources":
									contexts.push("hourly_wages")
									break
								case "licenses":
									contexts.push("rfp_license")
									break
								case "infrastructure":
									contexts.push("rfp_infrastructure")
									break
							}
							break
					}
					break
			}

			return contexts
		},
		[getValidationTabInfo, getContentTabInfo, getCostingTabInfo]
	)

	// Handle tab change callback
	const handleTabChange = useCallback(
		(changedSourceId: string, tabType: string, newTab: string) => {
			// Only react to changes for this specific sourceId
			if (changedSourceId === sourceId) {
				const newContexts = calculateContexts(context, sourceId, proposalDocsEnabled, currentPageEnabled)
				setdocumentContext(newContexts)
			}
		},
		[sourceId, context, proposalDocsEnabled, currentPageEnabled, calculateContexts, setdocumentContext]
	)

	// Register callback on mount and update when dependencies change
	useEffect(() => {
		setOnTabChangeCallback(handleTabChange)

		// Cleanup on unmount
		return () => {
			setOnTabChangeCallback(() => {})
		}
	}, [handleTabChange, setOnTabChangeCallback])

	// Update context when toggle states change
	useEffect(() => {
		const newContexts = calculateContexts(context, sourceId, proposalDocsEnabled, currentPageEnabled)
		setdocumentContext(newContexts)
	}, [proposalDocsEnabled, currentPageEnabled, calculateContexts, context, sourceId, setdocumentContext])

	// Rest of the component remains the same...
	const handleProposalDocsToggle = (checked) => {
		setProposalDocsEnabled(checked)
		if (!checked) {
			setCurrentPageEnabled(false)
		}
	}

	const handleCurrentPageToggle = (checked) => {
		setCurrentPageEnabled(checked)
		if (checked) {
			setProposalDocsEnabled(true)
		}
	}

	// Determine which icons to show
	const getDisplayIcons = () => {
		if (proposalDocsEnabled && currentPageEnabled) {
			return [FolderSymlink, FileText]
		} else if (proposalDocsEnabled) {
			return [FolderSymlink]
		} else if (currentPageEnabled) {
			return [FileText]
		}
		return []
	}

	const displayIcons = getDisplayIcons()
	const hasSelection = displayIcons.length > 0

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="icon-sm"
					variant="ghost"
					className={` ${
						hasSelection
							? "text-primary bg-primary-100 hover:bg-[#DBDFFC] p-0.75 [&_svg:not([class*='size-'])]:size-3.5"
							: "text-neutral-600 hover:text-neutral-800 hover:bg-neutral-200 p-1.75"
					}`}
				>
					{hasSelection ? (
						<div className="flex items-center gap-0.75  rounded-sm">
							{displayIcons.map((IconComponent, index) => (
								<div key={index} className="bg-white p-1.25 rounded text-neutral-700">
									<IconComponent size={14} />
								</div>
							))}
						</div>
					) : (
						<ScanText size={16} />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-75 bg-white border border-neutral-200 shadow-lg rounded-md p-1.5"
			>
				<div className="text-xxs text-neutral-600 px-1 mb-1.5">Select sources</div>
				{/* Proposal Documents Option */}

				<DropdownMenuItem
					className="flex flex-col p-2 hover:bg-primary-100 cursor-pointer rounded group items-start gap-0"
					onClick={(e) => e.preventDefault()}
				>
					<div className="flex items-center w-full">
						<FolderSymlink size={16} className="text-neutral-700 flex-shrink-0" />
						<p className="text-xs font-medium text-neutral-900 ml-1.5 flex-1">RFP documents</p>
						<Switch
							checked={proposalDocsEnabled}
							onCheckedChange={handleProposalDocsToggle}
							className="bg-neutral-400 border border-neutral-500 ml-3"
							onClick={(e) => e.stopPropagation()}
						/>
					</div>
					<p className="text-xs text-neutral-600 ml-6">
						Search across proposal documents uploaded in the BlackBox
					</p>
				</DropdownMenuItem>

				{/* Current Page Option */}
				<DropdownMenuItem
					className="flex flex-col p-2 hover:bg-primary-100 cursor-pointer rounded group items-start gap-0"
					onClick={(e) => e.preventDefault()}
				>
					<div className="flex items-center w-full ">
						<FileText size={16} className="text-neutral-700 flex-shrink-0" />
						<p className="text-xs font-medium text-neutral-900 ml-1.5 flex-1">Current page</p>
						<Switch
							checked={currentPageEnabled}
							onCheckedChange={handleCurrentPageToggle}
							className="bg-neutral-400 border border-neutral-500 ml-3"
							onClick={(e) => e.stopPropagation()}
						/>
					</div>
					<p className="text-xs text-neutral-600 ml-6">Search across current page or tab</p>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export default ContextSourcesDropdown
