import type { DataTableProps, ValidationItem } from "~/types/validation"
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Edit } from "iconsax-reactjs"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import { Badge } from "~/components/ui/badge"

const SkeletonRow = ({ cols = 5 }: { cols?: number }) => {
	return (
		<TableRow>
			{Array.from({ length: cols }).map((_, i) => (
				<TableCell key={i}>
					<div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
				</TableCell>
			))}
		</TableRow>
	)
}

export const columns: ColumnDef<ValidationItem>[] = [
	{
		accessorKey: "rfp_name",
		header: "Title",
		cell: ({ getValue }) => {
			const title = getValue<string>()
			return (
				<span className="font-semibold text-[14px] truncate block max-w-[200px]" title={title}>
					{title}
				</span>
			)
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ getValue }) => {
			const status = getValue<string>()
			const statusStyle:
				| "neutralTransparent"
				| "warning"
				| "success"
				| "warningTransparent"
				| "dangerTransparent"
				| "primary"
				| "danger"
				| "neutral"
				| "primaryTransparent"
				| "successTransparent"
				| "warning"
				| "danger"
				| "brown"
				| "outline" =
				{
					validated: "neutralTransparent",
					draft: "warning",
					submitted: "success",
					"pre-steps": "brown",
					archived: "dangerTransparent",
					won: "primary",
					rejected: "danger",
				}[status?.toLowerCase() as keyof typeof status] || "neutral"

			return <Badge variant={statusStyle}>{status}</Badge>
		},
	},
	{
		accessorKey: "assignees",
		header: "Assignees",
		cell: ({ getValue }) => {
			const assignees = getValue<any[]>()
			if (!assignees?.length) return null

			const team = assignees[0]?.team
			const users = assignees[0]?.users || []
			const firstUser = users[0]
			const remainingUsers = users.slice(1)
			const remainingCount = remainingUsers.length

			const style = "bg-[#F5F7FA] text-[#475569] text-[12px] px-2 py-0.5 rounded-[16px] border border-[#DFE5EC]"

			return (
				<div className="flex flex-wrap gap-1 relative">
					{team && (
						<div className="bg-[#F5F7FA] text-[#475569] text-[12px] px-2 py-0.5 rounded-[16px] border border-[#DFE5EC] flex flex-nowrap items-center gap-1">
							<div
								className="w-[5px] h-[5px] rounded-full shrink-0 "
								style={{
									backgroundColor:
										team === "Team Breaking Bid"
											? "#EE5282"
											: team === "Team Alpha"
											? "#4FA4E5"
											: "#94A3B8", // default color for other teams
								}}
							/>
							{team}
						</div>
					)}
					{firstUser && <span className={style}>{firstUser.user_name}</span>}

					{remainingCount > 0 && (
						<div className="relative group">
							<span className={style + " cursor-pointer"}>+{remainingCount}</span>

							{/* Tooltip container */}
							<div className="absolute z-50 hidden group-hover:block bg-white text-gray-700 text-xs px-3 py-2 rounded-md shadow-lg border border-gray-200 whitespace-pre-wrap w-max max-w-[200px] mt-1 left-0">
								{remainingUsers.map((user, index) => (
									<div key={index}>{user.user_name}</div>
								))}
							</div>
						</div>
					)}
				</div>
			)
		},
	},
	{
		accessorKey: "due_date",
		header: "Due",
		cell: ({ getValue }) => {
			const date = getValue<string>()
			return <span className="text-[#475569] text-[14px] font-normal">{`${format(date, "dd MMM yyyy")}`}</span>
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const validation = row.original
			const navigate = useNavigate()

			const handleEdit = (item: ValidationItem) => {
				const status = item.status?.toLowerCase()
				let route = `/sourcing/${item.source_id}` // default route

				switch (status) {
					case "validated":
						route = `/validate/${item.source_id}`
						break
					case "draft":
						route = `/content-generation/${item.source_id}`
						break
					case "pre-steps":
						route = `/presteps/${item.source_id}`
						break
					// For all other statuses (submitted, archived, won, rejected, etc.), use the default sourcing route
				}

				navigate(route)
			}

			return (
				<Edit
					size={16}
					variant="Linear"
					color="#92A0B5"
					cursor="pointer"
					onClick={() => handleEdit(validation)}
				/>
			)
		},
	},
]

export function DataTable<TData, TValue>({
	columns,
	data,
	isLoading = false,
	isFetching = false,
}: DataTableProps<TData, TValue> & { isLoading?: boolean; isFetching?: boolean }) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	return (
		<div className="rounded-md border">
			<Table containerClassName="max-h-[calc(100vh-208px)]">
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id} className="bg-[#EDF2F7] text-[#475569] text-[12px]">
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								)
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{isLoading || isFetching ? (
						Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} cols={columns.length} />)
					) : table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	)
}
