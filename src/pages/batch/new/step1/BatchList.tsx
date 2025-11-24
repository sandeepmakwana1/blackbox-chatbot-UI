import { ArrowRight, Calendar2, Eye, SearchNormal1 } from "iconsax-reactjs"
import { format, parseISO } from "date-fns"
import { useBatchStore } from "~/store/batchStore"
import { useBatchItems, initiateBatchProcessing } from "~/handlers/batchHandler"
import type { BatchItem } from "~/types/batch"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Badge } from "~/components/ui/badge"
import { BatchListSkeleton } from "~/pages/batch/BatchSkeleton"
import { Input } from "~/components/ui/input"
import { useEffect, useState } from "react"
import IconWrapper from "~/components/ui/iconWrapper"
import { SelectedTags } from "~/components/common/selectedTags"
import { Loader } from "~/components/ui/loader"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { useNavigate } from "react-router-dom"
import { queryClient } from "~/root"

export default function BatchList() {
	const { filters, setBatchSearch } = useBatchStore()
	const [searchValue, setSearchValue] = useState(filters.batchSearch || "")
	const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)

	const { data: batchData, isLoading, isFetching, isError, error } = useBatchItems(filters)

	useEffect(() => {
		if (filters.batchSearch !== searchValue) {
			setSearchValue(filters.batchSearch || "")
		}
	}, [filters.batchSearch])

	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchValue !== filters.batchSearch) {
				setBatchSearch(searchValue)
			}
		}, 500)
		return () => clearTimeout(timer)
	}, [searchValue, setBatchSearch, filters.batchSearch])

	const items = batchData?.bulked_rfps || []

	const handleItemSelection = (sourceId: number, isSelected: boolean) => {
		setSelectedItems((prev) => {
			const newSet = new Set(prev)
			if (isSelected) {
				if (newSet.size >= (batchData?.rfp_batched_numbers || 0)) {
					return newSet
				}
				newSet.add(sourceId)
			} else {
				newSet.delete(sourceId)
			}
			return newSet
		})
	}

	const handleNextStep = async () => {
		if (!batchData) return
		setLoading(true)
		try {
			const selectedIds = Array.from(selectedItems)
			const { batch_id } = await initiateBatchProcessing(selectedIds)
			queryClient.removeQueries({ queryKey: ["batchHistory"] })
			navigate(`/batch/${batch_id}`)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex-1 flex flex-col h-full overflow-y-auto min-h-0 custom-scrollbar pb-12 gap-6">
			{/* Main container with grid width */}
			<div className="flex flex-col items-center gap-6">
				<div className="grid grid-cols-3 gap-3 w-fit">
					{/* Header row - spans all 3 columns */}
					<div className="col-span-3 flex justify-between items-center">
						<div className="flex gap-2 items-center">
							<Badge variant="pinkTransparent">Step 1 of 4</Badge>
							<div className="text-sm text-neutral-900">Select Proposals</div>
						</div>
						{isLoading || isFetching ? (
							<Loader />
						) : (
							<SelectedTags
								selectedCount={selectedItems.size}
								max={batchData?.rfp_batched_numbers || 0}
							/>
						)}
					</div>

					{/* Search and button row - spans all 3 columns */}
					<div className="col-span-3 flex gap-1.5">
						<div className="flex flex-1 items-center bg-white p-2 gap-1.5 rounded-lg border border-solid border-neutral-400 min-w-80">
							<SearchNormal1 size={14} className="text-neutral-600" />
							<Input
								type="search"
								placeholder="Search opportunities"
								value={searchValue}
								onChange={(e) => setSearchValue(e.target.value)}
								className="flex-1 placeholder:text-neutral-600 text-neutral-900 bg-transparent text-xs border-hidden focus-visible:ring-0 focus-visible:ring-offset-0 selection:bg-neutral-400"
							/>
						</div>
						<Button
							onClick={handleNextStep}
							disabled={selectedItems.size === 0 || loading}
							className="whitespace-nowrap"
						>
							{loading ? (
								<Loader size="md" variant="neutral" />
							) : (
								<>
									Next step
									<ArrowRight />
								</>
							)}
						</Button>
					</div>

					{/* Content area - spans all 3 columns when showing error/loading/empty states */}
					{isError ? (
						<div className="col-span-3 p-6">
							<div className="bg-red-100 border border-red-400 text-red-700 rounded-md p-6 text-center">
								Error fetching proposals: {error instanceof Error ? error.message : "Unknown error"}
							</div>
						</div>
					) : isLoading || isFetching ? (
						<div className="col-span-3">
							<BatchListSkeleton />
						</div>
					) : !isLoading && items.length === 0 ? (
						<div className="col-span-3 p-6">
							<div className="bg-white border border-[#e2e8f0] rounded-md p-6 text-center text-[#64748b]">
								No Assigned RFPs found.
							</div>
						</div>
					) : (
						/* Grid items - each takes 1 column */
						<>
							{items.map((item: BatchItem) => (
								<InnerBatchItem
									key={item.source_id}
									item={item}
									isSelected={selectedItems.has(item.source_id)}
									onSelectionChange={(isSelected) => handleItemSelection(item.source_id, isSelected)}
									isDisabled={
										!selectedItems.has(item.source_id) &&
										selectedItems.size >= (batchData?.rfp_batched_numbers || 0)
									}
								/>
							))}
						</>
					)}
				</div>
			</div>
		</div>
	)
}

interface InnerBatchItemProps {
	item: BatchItem
	isSelected: boolean
	onSelectionChange: (isSelected: boolean) => void
	isDisabled: boolean
}

function InnerBatchItem({ item, isSelected, onSelectionChange, isDisabled }: InnerBatchItemProps) {
	const formatDate = (dateString: string) => {
		try {
			const date = parseISO(dateString)
			return format(date, "MMM dd, yyyy")
		} catch {
			return "Invalid Date"
		}
	}

	return (
		<div
			className={`bg-white pt-3 pb-4 pl-4 pr-3 rounded-2xl border border-solid cursor-pointer w-79 h-43.5 flex flex-col gap-6 transition-all duration-200 ${
				isSelected
					? "border-primary "
					: isDisabled
					? "border-neutral-200 opacity-50"
					: "border-neutral-300 hover:border-neutral-500"
			}`}
			style={{ boxShadow: isSelected ? "2px 2px 6px #3B82F650" : "2px 2px 6px #D0DEEB5C" }}
			onClick={() => !isDisabled && onSelectionChange(!isSelected)}
		>
			{/* id div */}
			<div className="flex justify-between items-center">
				<div className="font-semibold text-xs text-neutral-700 truncate">ID:: {item.rfp_id}</div>

				<div className="flex gap-1 items-center">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size="icon-batch"
								variant="ghost"
								className="[&_svg]:text-neutral-600"
								onClick={(e) => {
									e.stopPropagation()
									window.open(`/sourcing/${item.source_id}`, "_blank")
								}}
							>
								<Eye />
							</Button>
						</TooltipTrigger>
						<TooltipContent>View details</TooltipContent>
					</Tooltip>

					<Checkbox
						checked={isSelected}
						disabled={isDisabled}
						onCheckedChange={(checked) => onSelectionChange(!!checked)}
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			</div>

			{/* info div */}
			<div className="flex flex-col gap-2.5">
				<div className="flex items-center gap-1">
					<Badge variant="brown">{item.opportunity_type}</Badge>
					<Badge variant="dangerTransparent">
						<IconWrapper strokeWidth={1.5} size={12}>
							<Calendar2 />
						</IconWrapper>
						{formatDate(item.due_date)}
					</Badge>
				</div>

				<div className="flex flex-col">
					<div className="text-neutral-900 text-sm line-clamp-2">{item.title}</div>
					<div className="text-xs text-neutral-600 line-clamp-1">{item.agency_name}</div>
				</div>
			</div>
		</div>
	)
}
