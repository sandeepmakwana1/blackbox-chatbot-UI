import { Add, ArrowRight, Calendar2, Eye, SearchNormal1 } from "iconsax-reactjs"
import { SelectedTags } from "~/components/common/selectedTags"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	VisuallyHidden,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Loader } from "~/components/ui/loader"
import { useBatchItems } from "~/handlers/batchHandler"
import { useBatchStore } from "~/store/batchStore"
import { BatchListSkeleton } from "~/pages/batch/BatchSkeleton"
import type { BatchItem } from "~/types/batch"
import { Button } from "~/components/ui/button"
import { useEffect, useState } from "react"
import { Layers } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Checkbox } from "~/components/ui/checkbox"
import { Badge } from "~/components/ui/badge"
import IconWrapper from "~/components/ui/iconWrapper"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"

interface PlaceholderItemProps {
	existingIds: number[]
	maxItems: number
	isDisabled?: boolean
	onAddItems: (ids: number[]) => void
}

export function PlaceholderItem({ existingIds, maxItems, isDisabled, onAddItems }: PlaceholderItemProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const { filters, setBatchSearch } = useBatchStore()
	const [searchValue, setSearchValue] = useState(filters.batchSearch || "")
	const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())

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
	const currentTotalCount = existingIds.length + selectedItems.size
	const canSelectMore = currentTotalCount < maxItems

	const handleItemSelection = (sourceId: number, isSelected: boolean) => {
		setSelectedItems((prev) => {
			const newSet = new Set(prev)
			if (isSelected) {
				if (!canSelectMore) return newSet
				newSet.add(sourceId)
			} else {
				newSet.delete(sourceId)
			}
			return newSet
		})
	}

	const handleAddItems = () => {
		onAddItems(Array.from(selectedItems)) // Use passed prop instead of store
		setIsDialogOpen(false)
		setSelectedItems(new Set())
	}

	return (
		<Dialog open={isDialogOpen} onOpenChange={(open) => !isDisabled && setIsDialogOpen(open)}>
			<DialogTrigger asChild disabled={isDisabled}>
				<div
					className={`bg-neutral-200 pt-3 pb-4 pl-4 pr-3 rounded-2xl border border-neutral-500 w-79 h-53.5 flex flex-col items-center justify-center transition-all duration-200 ${
						isDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-neutral-400 cursor-pointer"
					}`}
					style={{ boxShadow: "2px 2px 6px #D0DEEB5C" }}
				>
					<div className="flex flex-col items-center gap-2 text-neutral-600">
						<Add size={48} />
					</div>
				</div>
			</DialogTrigger>
			<DialogContent className="max-w-5xl max-h-[80vh] flex flex-col">
				<VisuallyHidden>
					<DialogTitle>Select</DialogTitle>
				</VisuallyHidden>
				<DialogHeader>
					<div className="flex gap-2 items-center text-neutral-900">
						<Layers size={20} />
						Select proposals
					</div>
				</DialogHeader>

				<div className="flex flex-col gap-4 flex-1 overflow-y-auto">
					{/* Search and selection info */}
					<div className="flex gap-3 items-center">
						<div className="flex flex-1 items-center bg-white p-2 gap-1.5 rounded-lg border border-solid border-neutral-400">
							<SearchNormal1 size={14} className="text-neutral-600" />
							<Input
								type="search"
								placeholder="Search proposals"
								value={searchValue}
								onChange={(e) => setSearchValue(e.target.value)}
								className="flex-1 placeholder:text-neutral-600 text-neutral-900 bg-transparent text-xs border-hidden focus-visible:ring-0 focus-visible:ring-offset-0 selection:bg-neutral-400"
							/>
						</div>
					</div>

					{/* Content area */}
					<div className="flex-1 overflow-y-auto custom-scrollbar">
						{isError ? (
							<div className="p-6">
								<div className="bg-red-100 border border-red-400 text-red-700 rounded-md p-6 text-center">
									Error fetching proposals: {error instanceof Error ? error.message : "Unknown error"}
								</div>
							</div>
						) : isLoading || isFetching ? (
							<BatchListSkeleton />
						) : !isLoading && items.length === 0 ? (
							<div className="p-6">
								<div className="bg-white border border-[#e2e8f0] rounded-md p-6 text-center text-[#64748b]">
									No Assigned RFPs found.
								</div>
							</div>
						) : (
							<div className="grid grid-cols-3 gap-3">
								{items.map((item: BatchItem) => {
									const isAlreadyAdded = existingIds.includes(Number(item.source_id))
									return (
										<DialogBatchItem
											key={item.source_id}
											item={item}
											isSelected={selectedItems.has(item.source_id)}
											onSelectionChange={(isSelected) =>
												handleItemSelection(item.source_id, isSelected)
											}
											// Disable if already added OR if max limit is reached and it's not selected
											isDisabled={
												isAlreadyAdded || (!selectedItems.has(item.source_id) && !canSelectMore)
											}
											isAlreadyAdded={isAlreadyAdded} // Pass this for visual feedback
										/>
									)
								})}
							</div>
						)}
					</div>
				</div>

				<DialogFooter className="flex items-center sm:not-only:justify-between">
					<div>
						{isLoading || isFetching ? (
							<Loader />
						) : (
							<SelectedTags selectedCount={currentTotalCount} max={maxItems} />
						)}
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleAddItems} disabled={selectedItems.size === 0} className="gap-2">
							Add to batch
							<ArrowRight size={16} />
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// Dialog batch item component
interface DialogBatchItemProps {
	item: BatchItem
	isSelected: boolean
	onSelectionChange: (isSelected: boolean) => void
	isDisabled: boolean
	isAlreadyAdded?: boolean
}

function DialogBatchItem({ item, isSelected, onSelectionChange, isDisabled, isAlreadyAdded }: DialogBatchItemProps) {
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
			className={`bg-white pt-3 pb-4 pl-4 pr-3 rounded-2xl border border-solid cursor-pointer w-full h-43.5 flex flex-col gap-6 transition-all duration-200 ${
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
				<div className="font-semibold text-xs text-neutral-700">ID:: {item.rfp_id}</div>

				<div className="flex gap-1 items-center">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size="icon-batch"
								variant="ghost"
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
						checked={isSelected || isAlreadyAdded}
						disabled={isDisabled || isAlreadyAdded}
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
					<div className="text-xs text-neutral-600">{item.agency_name}</div>
				</div>
			</div>
		</div>
	)
}
