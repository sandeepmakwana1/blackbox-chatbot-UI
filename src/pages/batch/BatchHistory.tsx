import { useBatchHistory } from "~/handlers/batchHandler"
import { BatchListSkeleton } from "./BatchSkeleton"
import type { batchHistoryItem } from "~/types/batch"
import { ArrowUpRight, Layers, Plus, FolderLock, Calendar } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { format, parseISO } from "date-fns"
import { useBatchStore } from "~/store/batchStore"
import { SelectedTags } from "~/components/common/selectedTags"

export default function BatchHistory() {
	const { data: history, isLoading, isFetching, isError, error } = useBatchHistory()

	return (
		<div className="flex-1 flex flex-col items-center h-full custom-scrollbar py-12 ">
			{isError ? (
				<div className="p-6">
					<div className="bg-red-100 border border-red-400 text-red-700 rounded-md p-6 text-center">
						Error fetching proposals: {error instanceof Error ? error.message : "Unknown error"}
					</div>
				</div>
			) : isLoading || isFetching ? (
				<div>
					<BatchListSkeleton />
				</div>
			) : (
				<div className="grid grid-cols-4 gap-4">
					<CreateBatch isAvailable={history?.is_batch_available ?? true} />
					{history?.data?.map((item, index) => (
						<BatchItem key={index} item={item} />
					))}
				</div>
			)}
		</div>
	)
}

interface BatchItemProps {
	item: batchHistoryItem
}

function BatchItem({ item }: BatchItemProps) {
	const navigate = useNavigate()
	const { clearStore } = useBatchStore()

	const formatDate = (dateString: string) => {
		try {
			return format(parseISO(dateString), "MMM dd, yyyy")
		} catch {
			return "Invalid Date"
		}
	}

	const isActive = item.is_available && item.no_of_rfp !== item.max_count

	const getDisplayStatus = () => {
		if (isActive) return "active"
		return item.status
	}

	const displayStatus = getDisplayStatus()

	const getStatusClasses = (status: batchHistoryItem["status"]) => {
		if (isActive) return "batch-in-progress"

		switch (status) {
			case "completed":
				return "batch-completed"
			case "failed":
				return "batch-failed"
			default:
				return "batch-in-progress"
		}
	}

	const getStatusDisplay = () => {
		switch (displayStatus) {
			case "active":
				return { text: "Active", color: "text-warning-500" }
			case "completed":
				return { text: "Completed", color: "text-success-500" }
			case "failed":
				return { text: "Failed", color: "text-danger-500" }
			default:
				return { text: "In Progress", color: "text-warning-500" }
		}
	}

	const statusDisplay = getStatusDisplay()

	return (
		<div
			onClick={() => {
				clearStore()
				navigate(`/batch/${item.batch_id}`)
			}}
			className={`group flex flex-col items-center w-78.75 px-1.5 pt-1.25 pb-2.25 gap-2.5 rounded-xl cursor-pointer ${getStatusClasses(
				item.status
			)} `}
		>
			<div className="flex flex-col gap-6  p-3 bg-white w-full rounded-xl">
				<div className="flex flex-col ">
					<div className="text-sm font-medium text-neutral-900">{item.name}</div>
					<div className="text-xs text-neutral-700">{item.batch_id}</div>
				</div>

				<div className="flex items-center justify-between">
					<Badge variant="neutralTransparent" className="rounded-2xl">
						<Calendar strokeWidth={1.5} />
						<span>{formatDate(item.create_date)}</span>
					</Badge>
					{item.is_available ? (
						<SelectedTags
							selectedCount={item.no_of_rfp}
							max={item.max_count}
							isSmall
							isTextHidden
							tooltipContent={
								<div className="flex flex-col gap-1 items-start text-white rounded-md">
									<div className="flex gap-2 items-center">
										<span className="w-2 h-2 bg-[#23BE8D] rounded-xs" />
										<span className="text-xs font-medium">In batch</span>
									</div>
									<div className="flex gap-2 items-center">
										<span className="w-2 h-2 bg-neutral-500 rounded-xs" />
										<span className="text-xs font-medium">Slots remaining</span>
									</div>
								</div>
							}
						/>
					) : (
						<Badge variant="neutralTransparent" className="rounded-2xl">
							<Layers strokeWidth={2} /> {item.no_of_rfp}
						</Badge>
					)}
				</div>
			</div>
			<div className={`flex items-center gap-1 font-semibold text-xxs ${statusDisplay.color}`}>
				<span className={`transition-all duration-300 ease-in-out group-hover:-translate-x-0.5`}>
					{statusDisplay.text}
				</span>

				<ArrowUpRight
					className="opacity-0 -translate-x-1 transition-all duration-300 ease-in-out group-hover:translate-x-0 group-hover:opacity-100"
					size={14}
				/>
			</div>
		</div>
	)
}

interface CreateBatchProps {
	isAvailable: boolean
}

function CreateBatch({ isAvailable }: CreateBatchProps) {
	const navigate = useNavigate()
	const { clearStore } = useBatchStore()

	const handleClick = () => {
		if (!isAvailable) return
		clearStore()
		navigate("/batch/new")
	}

	return (
		<div
			className={`group w-78.75 h-35.5 py-3 pr-3 pl-4 gap-2.5 flex flex-col items-center bg-[#FAFBFF] justify-center rounded-xl transition-all box-border ${
				isAvailable
					? "border border-primary-200 text-primary cursor-pointer hover:border-2 hover:rounded-2xl"
					: "border border-neutral-400 text-neutral-700 cursor-not-allowed hover:border-primary-200 hover:text-primary"
			}`}
			onClick={handleClick}
		>
			<div
				className={`flex items-center justify-center p-3.5 rounded-full transition-all box-border ${
					isAvailable
						? "bg-[#DBE1FF] border-6 border-transparent group-hover:bg-primary-300 group-hover:text-white group-hover:border-primary-200"
						: "bg-neutral-200 text-neutral-700 border-6 border-transparent group-hover:bg-primary-200 group-hover:text-primary group-hover:border-primary-100"
				}`}
			>
				{isAvailable ? <Plus size={24} /> : <FolderLock size={24} />}
			</div>
			<p className="text-sm font-medium text-center">
				{isAvailable
					? "Create new batch"
					: "You've used 5 slots for the day. Come back tomorrow to create new batch."}
			</p>
		</div>
	)
}
