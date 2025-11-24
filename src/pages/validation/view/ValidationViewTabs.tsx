import { useEffect, useState } from "react"
import { Firstline, Verify, Flash, MessageQuestion } from "iconsax-reactjs"
import ValidationDisplay from "~/pages/validation/view/ValidationDisplay"
import SourcingItemView from "~/pages/sourcing/view/SourcingItemView"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"
import SourcingItemReadOnlyView from "~/pages/sourcing/view/SourcingItemViewReadOnly"
import { useIsFetching, useIsMutating } from "@tanstack/react-query"
import { toast } from "sonner"
import { QAView } from "./QAView"

interface ValidationTabsProps {
	source_id: number
	isBatch?: boolean
}

const TABS_DATA = [
	{
		id: "overview",
		label: "Overview",
		IconComponent: Firstline,
	},
	{
		id: "validation",
		label: "Validation summary",
		IconComponent: Verify,
	},
	{
		id: "qa",
		label: "Q&A",
		IconComponent: MessageQuestion,
	},
]

export default function ValidateViewTabs({ source_id, isBatch = false }: ValidationTabsProps) {
	const [activeTab, setActiveTab] = useState("validation")

	const isValidationFetching = useIsFetching({ queryKey: ["validation", source_id] }) > 0
	const isRevalidating = useIsMutating({ mutationKey: ["revalidateRfp"] }) > 0
	const isValidationBusy = isValidationFetching || isRevalidating

	const filteredTabs = isBatch ? TABS_DATA.filter((tab) => tab.id !== "qa") : TABS_DATA

	const handleTabClick = (tabId: string) => {
		if (tabId === "qa" && isValidationBusy) {
			toast.warning("Please wait for validation to complete before opening Q&A")
			return
		}
		setActiveTab(tabId)
	}

	useEffect(() => {
		if (activeTab === "qa" && isValidationBusy) {
			setActiveTab("validation")
		}
	}, [activeTab, isValidationBusy])

	return (
		<div className="flex flex-col h-full w-full overflow-hidden">
			{/* Tabs header - fixed height */}
			<div className="flex-shrink-0 w-full bg-[#FFFFFF] pt-[8px] pb-[8px] pl-[16px] pr-[16px]">
				<Tabs value={activeTab} onValueChange={handleTabClick} className="w-full">
					<TabsList className="h-auto bg-transparent p-0 w-full justify-start">
						{filteredTabs.map((tab) => {
							const isActive = activeTab === tab.id
							const iconColor = isActive ? "#174cbe" : "#92A0B5"
							const disabled = tab.id === "qa" && isValidationBusy

							return (
								<TabsTrigger key={tab.id} value={tab.id} disabled={disabled}>
									<tab.IconComponent
										size={16}
										variant="Linear"
										color={iconColor}
										className="mr-[4px]"
									/>
									<span>{tab.label}</span>
								</TabsTrigger>
							)
						})}
					</TabsList>
				</Tabs>
			</div>

			{/* Content area - takes remaining height */}
			<div className="flex-1 w-full overflow-hidden">
				<div className="h-full w-full" style={{ display: activeTab === "validation" ? "block" : "none" }}>
					<ValidationDisplay source_id={source_id} />
				</div>
				<div className="h-full w-full" style={{ display: activeTab === "overview" ? "block" : "none" }}>
					{isBatch ? (
						<SourcingItemReadOnlyView source_id={source_id} />
					) : (
						<SourcingItemView hideValidateButton={true} />
					)}
				</div>
				{!isBatch && activeTab === "qa" && (
					<div className="h-full w-full">
						<QAView source_id={source_id} />
					</div>
				)}
			</div>
		</div>
	)
}
