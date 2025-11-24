import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react"
import { useParams } from "react-router-dom"
import DataTableSection from "./DataTableSection"
import CostImageUpload from "./CostImageUpload"
import Summary from "~/pages/proposaldrafting/presteps/summary/Summary"
import { useCostingStore } from "~/store/costingStore"
import { generateCost, useGenerateCost } from "~/handlers/contentGenerationHandlers" // Import the React Query hook
import { Button } from "~/components/ui/button"
import { Grid6, Arrow, Magicpen, Send } from "iconsax-reactjs"
import { Upload, RefreshCw, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CostingDataSkeleton } from "./CostSkeleton"
import { useQuery } from "@tanstack/react-query"
import { useTabInfoStore } from "~/store/tabInfoStore"

interface CostingRef {
	regenerateCost: () => void
}

const Costing = forwardRef<CostingRef>((props, ref) => {
	const { source_id } = useParams<{ source_id: string }>()
	const { getCostingTabInfo, setCostingTabInfo } = useTabInfoStore()
	const costingTabInfo = getCostingTabInfo(source_id || "")
	const [isModalOpen, setIsModalOpen] = useState(false)

	const [customPrompt, setCustomPrompt] = useState("")
	const modalRef = useRef<HTMLDivElement>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)
	const regenerateRef = useRef(false)

	// Use React Query hook instead of direct store call
	const {
		data: costData,
		isRefetching,
		isLoading,
		error,
		isError,
		refetch,
	} = useQuery({
		queryKey: ["cost", Number(source_id)],
		queryFn: () => {
			const shouldRegenerate = regenerateRef.current
			regenerateRef.current = false // Reset after use
			return generateCost(source_id.toString(), shouldRegenerate)
		},
		placeholderData: (previousData) => previousData,
	})

	const regenerateCost = async () => {
		try {
			regenerateRef.current = true
			await refetch()
			toast.success("Cost data regenerated successfully")
		} catch (error) {
			toast.error("Failed to regenerate cost data")
		}
	}

	useImperativeHandle(ref, () => ({
		regenerateCost,
	}))

	const {
		smartCostMarkdown,
		getTableData,
		resetSmartCostSheet,
		regenerateCostData,
		isRegenerating,
		setCostData, // You'll need to add this to your store
	} = useCostingStore()

	// Update the store when React Query data changes
	useEffect(() => {
		if (costData) {
			setCostData(costData)
		}
	}, [costData, setCostData])

	const tabs = [
		{ id: "human-resources", label: "Human resources", buttonLabel: "Regenerate resource cost" },
		{ id: "licenses", label: "Licenses", buttonLabel: "Regenerate license cost" },
		{ id: "infrastructure", label: "Infrastructure", buttonLabel: "Regenerate infrastructure cost" },
		{ id: "smart-cost-sheet", label: "Smart cost sheet" },
	]

	const tableData = getTableData(costingTabInfo as "human-resources" | "licenses" | "infrastructure")

	const handleModalRegenerate = async () => {
		if (!customPrompt.trim()) {
			toast.error("Please provide a custom prompt to guide the regeneration.")
			return
		}

		if (
			source_id &&
			(costingTabInfo === "human-resources" ||
				costingTabInfo === "licenses" ||
				costingTabInfo === "infrastructure")
		) {
			await regenerateCostData(source_id, costingTabInfo, customPrompt)
			if (!useCostingStore.getState().error) {
				setIsModalOpen(false)
				setCustomPrompt("")
			}
		}
	}

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setIsModalOpen(false)
			}
		}
		if (isModalOpen) {
			document.addEventListener("mousedown", handleClickOutside)
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [isModalOpen])

	const renderTabContent = () => {
		if (costingTabInfo === "smart-cost-sheet") {
			if (smartCostMarkdown) {
				return (
					<div className="flex flex-col bg-white py-3 px-46 rounded-[8px] h-[calc(100vh-200px)]">
						<div className="flex items-center justify-between self-stretch ">
							<div className="flex items-center gap-2">
								<div className="flex items-center rounded-[7px] bg-neutral-900 p-1.5">
									<Grid6 size={14} color="#ffffff" />
								</div>

								<span className="text-neutral-900 text-sm font-medium">Smart cost sheet analysis</span>
							</div>

							<div className="flex justify-center">
								<Button size="sm" variant="outline" onClick={resetSmartCostSheet}>
									<Upload size={14} />
									Clear and upload new
								</Button>
							</div>
						</div>

						<Summary markdownResponse={smartCostMarkdown} />
					</div>
				)
			}
			return <CostImageUpload source_id={Number(source_id)} />
		}

		if (isLoading || isRefetching) {
			return <CostingDataSkeleton />
		}

		if (isError || error) {
			return <div className="text-red-500 text-center py-8">{error?.message || "An error occurred"}</div>
		}

		if (tableData.columns.length > 0) {
			return (
				<DataTableSection columns={tableData.columns} rows={tableData.rows} tabId={costingTabInfo} editable />
			)
		}

		return null
	}

	return (
		<div className="bg-neutral-200 p-3 w-full h-screen flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<div className="flex gap-1 bg-white rounded-[8px] p-1 border-[1px] border-solid border-neutral-200">
					{tabs.map((tab) => {
						const isActive = costingTabInfo === tab.id
						return (
							<button
								key={tab.id}
								onClick={() => setCostingTabInfo(source_id, tab.id as any)}
								className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
									isActive ? "bg-neutral-900 text-white" : " text-neutral-700"
								}`}
								style={{ minWidth: 80 }}
							>
								<span>{tab.label}</span>
							</button>
						)
					})}
				</div>

				{costingTabInfo !== "smart-cost-sheet" && (
					<div className="relative">
						<Button
							size="sm"
							ref={buttonRef}
							onClick={() => setIsModalOpen(!isModalOpen)}
							className="bg-gradient-to-r from-[#5151D0] to-[#D4358F]"
						>
							<Magicpen size={16} />
							{tabs.find((tab) => tab.id === costingTabInfo)?.buttonLabel}
						</Button>

						{isModalOpen && (
							<div
								ref={modalRef}
								className="flex flex-col items-start bg-[#161A21] w-[374px] absolute top-full right-0 mt-1 rounded-xl z-50"
								style={{
									boxShadow: "-1px 2px 9px #E5E6E8",
								}}
							>
								<div className="flex justify-between items-center self-stretch my-2 mx-2.5">
									<div className="flex items-center p-1 bg-gradient-to-r from-[#5151D0] to-[#D4358F] rounded-[6px]">
										<Magicpen className="text-white" size={16} />
									</div>
									<button
										onClick={() => setIsModalOpen(false)}
										className="hover:opacity-70 transition-opacity"
									>
										<X className="text-neutral-600" size={16} />
									</button>
								</div>

								<span className="text-white text-xs font-bold ml-2.5">
									Regenerate {tabs.find((tab) => tab.id === costingTabInfo)?.label} with AI
								</span>

								<span className="text-[#91A0B4] text-xs mb-5 mx-2.5">
									Provide a custom prompt to guide and reshape the{" "}
									{tabs.find((tab) => tab.id === costingTabInfo)?.label.toLowerCase()} data.
								</span>

								<div className="flex flex-col self-stretch bg-white py-2 mb-1.5 mx-1.5 rounded-[10px]">
									<textarea
										value={customPrompt}
										onChange={(e) => setCustomPrompt(e.target.value)}
										placeholder={`Example: Optimize the ${tabs
											.find((tab) => tab.id === costingTabInfo)
											?.label.toLowerCase()} to be more cost-effective and align with industry standards...`}
										className="text-neutral-900 text-xs mb-[70px] mx-2.5 bg-transparent border-none outline-none resize-none min-h-[80px] placeholder-[#91A0B4]"
									/>

									<div className="flex flex-col items-end self-stretch">
										<Button
											size="icon"
											variant="secondary"
											onClick={handleModalRegenerate}
											disabled={isRegenerating}
											className="flex items-center justify-center bg-[#EDF2F7] hover:bg-[#E2E8F0] w-8 h-8 mr-2 rounded-md transition-colors  disabled:cursor-not-allowed"
										>
											{isRegenerating ? (
												<Loader2 className="animate-spin" color="#6E7C91" size={16} />
											) : (
												<Send size={16} />
											)}
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
			<div className="">{renderTabContent()}</div>
		</div>
	)
})

export default Costing
