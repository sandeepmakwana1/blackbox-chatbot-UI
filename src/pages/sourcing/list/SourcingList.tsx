import { Add, Calendar2, Eye, User } from "iconsax-reactjs"
import { format, parseISO } from "date-fns"
import type { AssignRfpItem, SourcingItem } from "~/types/sourcing"
import { useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { useSourcingStore } from "~/store/sourcingStore"
import { fetchSourcingItemById, useSourcingItems } from "~/handlers/sourcingHandler"
import { truncateText } from "~/lib/utils"
import PaginationComponent from "~/components/common/PaginationComponent"
import { Button } from "~/components/ui/button"
import { Skeleton } from "~/components/ui/skeleton"
import { Badge } from "~/components/ui/badge"
import IconWrapper from "~/components/ui/iconWrapper"
import { Check, ChevronDown } from "lucide-react"
import {
	useUsersSourcing,
	useAssignRfpToUserSourcingMutation,
	useUnassignRfpFromUserSourcingMutation,
} from "~/handlers/teamsHandler"
import type { UserMember } from "~/types/teams"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Input } from "~/components/ui/input"
import { Loader } from "~/components/ui/loader"
import { queryClient } from "~/root"

type SourcingListProps = {
	activeTabId: string
}

const TAB_API_PARAMS: { [key: string]: string } = {
	sourced: "HigherGov",
	validated: "User",
}

export default function SourcingList({ activeTabId }: SourcingListProps) {
	const { filters, setFilter } = useSourcingStore()
	const navigate = useNavigate()
	const scrollRef = useRef<HTMLDivElement>(null)

	const apiParam = TAB_API_PARAMS[activeTabId] || "HigherGov"
	const { data: sourcingData, isLoading, isFetching, isError, error } = useSourcingItems(filters, apiParam)

	const items = sourcingData?.data || []
	const total = sourcingData?.total || 0
	const page = sourcingData?.page || filters.page
	const totalPages = sourcingData?.total_pages || 0

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTo({ top: 0, behavior: "smooth" })
		}
	}, [page])

	const setPage = (newPage: number) => {
		setFilter("page", newPage)
	}

	const handleViewItem = (item: SourcingItem) => {
		navigate(`/sourcing/${item.source_id}`)
	}

	return (
		<div className="flex-1 flex flex-col h-full custom-scrollbar">
			{isError ? (
				<div className="flex-1 p-6">
					<div className="bg-red-100 border border-red-400 text-red-700 rounded-md p-6 text-center">
						Error fetching proposals: {error instanceof Error ? error.message : "Unknown error"}
					</div>
				</div>
			) : isLoading ? (
				<div className="flex-1 p-6">
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="bg-white border border-neutral-200 rounded-md p-4">
								<Skeleton className="h-4 w-1/4 mb-2" />
								<Skeleton className="h-6 w-3/4 mb-2" />
								<Skeleton className="h-4 w-1/2 mb-3" />
								<div className="flex gap-4">
									<Skeleton className="h-4 w-1/4" />
									<Skeleton className="h-4 w-1/4" />
								</div>
							</div>
						))}
					</div>
				</div>
			) : !isLoading && items.length === 0 ? (
				<div className="flex-1 p-6">
					<div className="bg-white border border-[#e2e8f0] rounded-md p-6 text-center text-[#64748b]">
						No proposals found matching your criteria.
					</div>
				</div>
			) : (
				<div className="grow space-y-2 overflow-y-auto custom-scrollbar" ref={scrollRef}>
					{items.map((item: SourcingItem) => (
						<InnerSourcingItem
							key={item.source_id}
							item={item}
							onView={() => handleViewItem(item)}
							filters={filters}
							apiParam={apiParam}
						/>
					))}
				</div>
			)}

			<PaginationComponent page={page} pageSize={filters.page_size} total={total} onPageChange={setPage} />
		</div>
	)
}

function InnerSourcingItem({
	item,
	onView,
	filters,
	apiParam,
}: {
	item: SourcingItem
	onView: () => void
	filters: any
	apiParam: string
}) {
	const formatDate = (dateString: string) => {
		try {
			const date = parseISO(dateString)
			return format(date, "EEEE, MMM-dd-yyyy")
		} catch {
			return "Invalid Date"
		}
	}
	return (
		<div
			className="bg-white pt-3 pb-4 pl-4 pr-3 mb-2 rounded-xl border border-neutral-300 hover:border-neutral-500 cursor-pointer"
			style={{ boxShadow: "2px 2px 6px #D0DEEB5C" }}
			onClick={onView}
		>
			<div className="self-stretch mb-3">
				<div className="flex items-center justify-between mb-[6px]">
					<div className="flex items-center gap-1.5">
						<Badge>ID :: {truncateText(item.rfp_id, 15)}</Badge>
						<Badge variant="brown">{item.opportunity_type || "RFP"}</Badge>
					</div>

					<div onClick={(e) => e.stopPropagation()}>
						<AssignRfp
							assignRfp={item.assignees[0]}
							source_id={item.source_id}
							filters={filters}
							apiParam={apiParam}
							rfp_id={item.rfp_id}
						/>
					</div>
				</div>
				<div className="flex flex-col items-start self-stretch">
					<span className="text-neutral-900 text-sm font-semibold">{truncateText(item.title, 200)}</span>
					<span className="text-neutral-600 text-xs font-medium">{item.agency_name}</span>
				</div>
			</div>
			<div className="flex items-center self-stretch">
				<div className="flex flex-1 items-start">
					<div className="flex shrink-0 items-center mr-5 gap-x-1.5">
						<IconWrapper strokeWidth={2}>
							<Calendar2 size="14" className="text-success-300" />
						</IconWrapper>
						<span className="text-neutral-600 text-xs font-medium">
							Posted: {formatDate(item.posted_date)}
						</span>
					</div>
					<div className="flex shrink-0 items-center mr-5 gap-x-1.5">
						<IconWrapper strokeWidth={2}>
							<Calendar2 size="14" className="text-danger-300" />
						</IconWrapper>
						<span className="text-neutral-600 text-xs font-medium">Due: {formatDate(item.due_date)}</span>
					</div>
				</div>
				<div onClick={(e) => e.stopPropagation()}>
					<Button variant="secondary" size="icon-sm" onClick={onView}>
						<Eye />
					</Button>
				</div>
			</div>
		</div>
	)
}
interface AssignRfpProps {
	assignRfp: AssignRfpItem | null
	source_id: number
	rfp_id: string
	filters?: any
	apiParam?: string
}

function AssignRfp({ assignRfp, source_id, rfp_id, filters, apiParam }: AssignRfpProps) {
	const [open, setOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)

	const { data: usersData, isLoading: isLoadingUsers } = useUsersSourcing()

	const assignMutation = useAssignRfpToUserSourcingMutation()
	const unassignMutation = useUnassignRfpFromUserSourcingMutation()

	const isMutating = assignMutation.isPending || unassignMutation.isPending

	useEffect(() => {
		if (open) {
			setTimeout(() => inputRef.current?.focus(), 0)
		} else {
			setSearchTerm("")
		}
	}, [open])

	const handleSelect = async (user: UserMember) => {
		const fullQueryKey = ["sourcingItems", apiParam, filters]

		const mutationOptions = {
			onSuccess: () => {
				queryClient.refetchQueries({ queryKey: fullQueryKey })
			},
		}

		if (assignRfp && assignRfp.user_id === user.id) {
			unassignMutation.mutate({ source_id, user_id: user.id }, mutationOptions)
		} else {
			await fetchSourcingItemById(source_id)
			assignMutation.mutate({ rfp_id, user_id: user.id, source_id: source_id }, mutationOptions)
		}
		queryClient.removeQueries({ queryKey: ["batchItems"] })
		setOpen(false)
	}

	const filteredUsers =
		usersData?.filter((user) => `${user.name} `.toLowerCase().includes(searchTerm.toLowerCase())) || []

	const triggerContent = () => {
		if (isMutating) {
			return (
				<div className="flex items-center gap-1.5 rounded-2xl border border-neutral-400 bg-neutral-200 text-neutral-700 text-xs font-medium px-2 py-1 cursor-wait">
					<Loader className="h-3 w-3" variant="neutral" />
					Updating...
				</div>
			)
		}
		if (assignRfp) {
			return (
				<div className="group flex items-center gap-1 rounded-2xl bg-neutral-200 text-neutral-700 text-xs font-medium px-2 py-1 hover:bg-neutral-300 hover:text-neutral-800 transition-all cursor-pointer">
					<IconWrapper strokeWidth={2}>
						<User size={12} />
					</IconWrapper>
					<span className="transition-all duration-300 ease-in-out group-hover:-translate-x-0.5">
						{assignRfp.name}
					</span>
					<ChevronDown
						size={12}
						strokeWidth={2}
						className="text-neutral-700 w-0 opacity-0 -translate-x-1 transition-all duration-300 ease-in-out group-hover:w-3 group-hover:translate-x-0 group-hover:opacity-100"
					/>
				</div>
			)
		}
		return (
			<div className="flex items-center gap-1 rounded-2xl border border-dashed border-neutral-400 text-neutral-700 text-xs font-medium px-2 py-1 hover:bg-neutral-200 hover:border-neutral-600 hover:text-neutral-800 transition-all cursor-pointer">
				<IconWrapper strokeWidth={2}>
					<Add size={12} />
				</IconWrapper>
				Add assignee
			</div>
		)
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild disabled={isMutating}>
				<button type="button" disabled={isMutating}>
					{triggerContent()}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-56 bg-white p-1.5" align="end">
				<div className="flex items-center bg-white p-2 gap-1.5 rounded-[6px] border border-solid border-[#DFE5EB]">
					<Input
						ref={inputRef}
						placeholder="Search user..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="placeholder:text-[#91A0B4] text-neutral-800 bg-transparent text-[12px] border-hidden focus-visible:ring-0 focus-visible:ring-offset-0"
					/>
				</div>

				<div className="max-h-60 overflow-y-auto custom-scrollbar pt-1">
					{isLoadingUsers ? (
						<div className="flex items-center gap-2 p-2 text-sm text-neutral-500">
							<Loader />
							Loading users...
						</div>
					) : filteredUsers.length > 0 ? (
						filteredUsers.map((user) => (
							<div
								key={user.id}
								onClick={() => handleSelect(user)}
								className="cursor-pointer flex items-center justify-between p-2 rounded-sm hover:bg-neutral-100 transition-colors"
							>
								<div className="flex items-center gap-1.5">
									<User size={16} className="text-neutral-600" />
									<span className="text-neutral-800 text-[13px] font-medium">{user.name}</span>
								</div>

								{assignRfp?.user_id === user.id && (
									<Check size={12} className="text-primary" strokeWidth={2} />
								)}
							</div>
						))
					) : (
						<div className="p-2 text-sm text-neutral-500">No users found.</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	)
}
