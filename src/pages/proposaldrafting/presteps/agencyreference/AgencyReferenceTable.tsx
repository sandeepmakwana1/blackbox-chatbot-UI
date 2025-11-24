import { Code, Component, Trash2 } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import type { AgencyReference } from "~/types/agencyReference"

export default function AgencyReferenceTable({
	data,
	onRemove,
}: {
	data: AgencyReference[]
	onRemove: (id: number) => void
}) {
	return (
		<div className="w-full flex flex-col overflow-y-auto max-h-[65vh] custom-scrollbar">
			<Table className="table-fixed w-full">
				<TableHeader>
					<TableRow className="bg-neutral-200 border-b border-neutral-300">
						<TableHead className="w-[304px] pl-4 pr-2 py-2.5">
							<div className="flex items-center gap-1">
								<span className="text-xs font-medium text-[#475569]">Agency name</span>
							</div>
						</TableHead>
						<TableHead className="w-[200px] px-2 py-2.5">
							<div className="flex items-center gap-1">
								<span className="text-xs font-medium text-[#475569]">Reference name</span>
							</div>
						</TableHead>
						<TableHead className="w-[247px] px-2 py-2.5">
							<div className="flex items-center gap-1">
								<span className="text-xs font-medium text-[#475569]">Email</span>
							</div>
						</TableHead>
						<TableHead className="w-[171px] px-2 py-2.5">
							<span className="text-xs font-medium text-[#475569]">Contact number</span>
						</TableHead>
						<TableHead className="w-11 px-2 py-2.5">
							<span className="opacity-0">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((agency) => (
						<TableRow
							key={agency.id}
							className={`border-b border-neutral-200 ${agency.isHighlighted ? "bg-neutral-100" : ""}`}
						>
							<TableCell className="w-[304px] pl-4 pr-0 py-2 text-sm font-normal text-[#475569] break-words">
								{agency.reference_agency}
							</TableCell>
							<TableCell className="w-[200px] px-2 py-2 text-sm font-normal text-[#121822] break-words">
								{agency.reference_name}
							</TableCell>
							<TableCell className="w-[247px] px-2 py-2 font-normal text-sm text-[#121822] break-words">
								{agency.reference_email}
							</TableCell>
							<TableCell className="w-[171px] px-2 py-2 font-normal text-sm text-[#121822] break-words">
								{agency.reference_number}
							</TableCell>
							<TableCell className="pl-0 pr-4 py-2">
								<Button
									variant="ghost"
									size="sm"
									className="h-auto p-1.5 rounded-md"
									onClick={() => onRemove(agency.id)}
								>
									<Trash2 className="w-4 h-4 text-[#E54848]" />
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
