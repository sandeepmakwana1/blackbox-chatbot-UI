import { useEffect, useState } from "react"
import { FolderIcon, PlusIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import AgencyReferenceTable from "./AgencyReferenceTable"
import type { AgencyReference } from "~/types/agencyReference"
import { usePreStepStore } from "~/store/preStepStore"
import { putAgencyReferences, useAgencyReferences } from "~/handlers/preStepsHandlers"
import { Loader } from "~/components/ui/loader"

export default function AgencyReferenceComponent({
	sourceId,
	onSaveAgencyReferences,
}: {
	sourceId: string
	onSaveAgencyReferences?: () => void
}) {
	const [search, setSearch] = useState("")
	const [selectedAgency, setSelectedAgency] = useState<AgencyReference[]>([])
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)
	const { setSelectedAgencyReferences } = usePreStepStore()

	const { data: agencyData, isLoading, error } = useAgencyReferences(parseInt(sourceId), true)

	const agencies = agencyData?.agency_references_db || []
	const redisRefs = agencyData?.agency_references_redis || []

	useEffect(() => {
		if (redisRefs.length > 0) {
			setSelectedAgency(redisRefs)
			setSelectedAgencyReferences(redisRefs)
		}
	}, [redisRefs, setSelectedAgencyReferences])

	useEffect(() => {
		setSelectedAgencyReferences(selectedAgency)
	}, [selectedAgency, setSelectedAgencyReferences])

	const handleRemoveAgencyReference = (id: number) => {
		setSelectedAgency((prev) => prev.filter((agency) => agency.id !== id))
	}

	const filteredAgencies = agencies.filter((agency) =>
		agency.reference_agency.toLowerCase().includes(search.toLowerCase())
	)

	const renderAddAgencyPopover = (isCustomStyle: boolean) => (
		<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
			<PopoverTrigger asChild>
				{isCustomStyle ? (
					<Button
						variant="outline"
						className="group flex items-center justify-center gap-1 px-3 py-[6px] bg-white text-[#6E7C91] border border-[#DFE5EC] rounded-md hover:text-[#121822]"
					>
						<PlusIcon className="w-4 h-4 text-[#6E7C91] group-hover:text-[#121822]" />
						<span className="text-xs font-medium">Add new agency</span>
					</Button>
				) : (
					<Button variant="tertiary" size="sm">
						<PlusIcon />
						Add new agency
					</Button>
				)}
			</PopoverTrigger>
			<PopoverContent
				className="w-[323px] h-[256px] p-[6px_4px] bg-white rounded-lg shadow-[0px_0px_6px_2px_#E9ECF0]"
				align="end"
				side="bottom"
			>
				<Card className="py-1 w-full h-full border-0 shadow-none">
					<CardContent className="flex flex-col items-start gap-2 p-0 h-full">
						<div className="flex h-[30px] items-center px-1 py-1.5 w-full border-b border-neutral-300">
							<Input
								placeholder="Search..."
								className="border-0 bg-transparent p-0 h-auto text-xs text-neutral-600 focus-visible:ring-0 focus-visible:ring-offset-0"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<div className="flex-1 w-full overflow-y-auto max-h-[calc(256px-30px-12px)] custom-scrollbar">
							<div className="flex flex-col gap-0.5 w-full">
								{filteredAgencies.map((agency) => {
									const isSelected = selectedAgency.find((a) => a.id === agency.id)
									return (
										<div
											key={agency.id}
											className={`flex items-center justify-between px-2 py-1.5 w-full rounded-md text-sm cursor-pointer ${
												isSelected
													? "bg-[#EFF1FF] text-[#121822]"
													: "hover:bg-[#F2F4F7] text-neutral-800"
											}`}
											onClick={() => {
												if (isSelected) {
													setSelectedAgency((prev) => prev.filter((a) => a.id !== agency.id))
												} else {
													setSelectedAgency((prev) => [...prev, agency])
												}
											}}
										>
											<span className="truncate">{agency.reference_agency}</span>
											{isSelected && (
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="w-4 h-4 text-[#5A5CE9] flex-shrink-0"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													strokeWidth={2}
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M5 13l4 4L19 7"
													/>
												</svg>
											)}
										</div>
									)
								})}
							</div>
						</div>
					</CardContent>
				</Card>
			</PopoverContent>
		</Popover>
	)

	// Save agency references callback
	useEffect(() => {
		if (onSaveAgencyReferences) {
			onSaveAgencyReferences()
		}
	}, [onSaveAgencyReferences])

	// Loading state
	if (isLoading) {
		return (
			<div className="flex flex-col mt-3 items-start gap-2 pt-3 pb-6 px-4 bg-white border border-neutral-300 rounded-xl">
				<div className="flex flex-col gap-2 justify-center items-center w-full h-full">
					<Loader size="xl" variant="primary" />
					<span className="text-sm text-neutral-800">Loading agency references...</span>
				</div>
			</div>
		)
	}

	// Error state
	if (error) {
		return (
			<div className="flex flex-col mt-3 items-start gap-2 pt-3 pb-6 px-4 bg-white border border-neutral-300 rounded-xl h-full">
				<div className="flex justify-center items-center w-full h-full">
					<span className="text-sm text-red-500">Error loading agency references. Please try again.</span>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-start gap-2 pt-3 pb-6 px-4 bg-white border border-neutral-300 rounded-xl h-full">
			<div className="gap-2 flex-1 rounded-xl flex flex-col items-start w-full">
				{selectedAgency.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-4 px-[336px] py-16 w-full">
						<div className="inline-flex items-center gap-2 p-2 bg-neutral-300 rounded-lg">
							<FolderIcon className="w-4 h-4" />
						</div>
						<div className="text-center text-[14px] leading-[20px] font-medium font-inter">
							<div className="text-black text-sm font-medium">No agency references added yet</div>
							<div className="text-neutral-700 text-xs">
								Start by selecting one or more agency references. Their contact details will be
								automatically fetched and listed here for review and editing.
							</div>
						</div>
						<div className="inline-flex">{renderAddAgencyPopover(false)}</div>
					</div>
				) : (
					<>
						<div className="flex justify-between items-center w-full px-1">
							<span className="text-sm font-medium text-neutral-700">
								Selected {selectedAgency.length} agency reference
								{selectedAgency.length !== 1 && "s"}
							</span>
							{renderAddAgencyPopover(true)}
						</div>
						<AgencyReferenceTable data={selectedAgency} onRemove={handleRemoveAgencyReference} />
					</>
				)}
			</div>
		</div>
	)
}

export function useAgencyReferenceSelection() {
	const { setSelectedAgencyReferences, selectedAgencyReferences } = usePreStepStore()
	const [selectedAgency, setSelectedAgency] = useState<AgencyReference[]>(selectedAgencyReferences)

	const saveAgencyReferences = (sourceId: string | number) => {
		if (selectedAgency.length > 0 && sourceId) {
			putAgencyReferences(parseInt(sourceId as string), selectedAgency)
		}
	}

	return { selectedAgency, setSelectedAgency, saveAgencyReferences }
}
