import { Button } from "~/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Trash2 } from "lucide-react"
import type { AgencyReference } from "~/types/agencyReference"

type AgencyReferenceTableProps = {
	references: AgencyReference[]
	onRemove: (agencyId: number) => void
}

export const AgencyReferenceTable = ({ references, onRemove }: AgencyReferenceTableProps) => {
	return (
		<div className="flex-1 overflow-y-auto custom-scrollbar">
			<Table className="table-fixed w-full">
				<TableHeader>
					<TableRow className="bg-neutral-300 rounded-md">
						<TableHead className="w-52.5 px-2 py-2.5 rounded-l-md">
							<span className="text-xs font-medium text-neutral-800">Agency name</span>
						</TableHead>
						<TableHead className="w-65.75 px-2 py-2.5">
							<span className="text-xs font-medium text-neutral-800">Reference name</span>
						</TableHead>
						<TableHead className="w-50.5 px-2 py-2.5">
							<span className="text-xs font-medium text-neutral-800">Email & contact number</span>
						</TableHead>
						<TableHead className="w-8 px-2 py-2.5 rounded-r-md">
							<span className="opacity-0">a</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{references.map((agency) => (
						<TableRow key={agency.id} className="border-b border-neutral-200">
							<TableCell className="px-2 py-2.5 text-xs font-normal text-neutral-900 truncate break-words">
								{agency.reference_agency}
							</TableCell>
							<TableCell className="px-2 py-2.5 text-xs font-normal text-neutral-700 truncate break-words">
								{agency.reference_name}
							</TableCell>
							<TableCell className="px-2 py-2.5 font-normal text-xs break-words">
								<div className="flex flex-col">
									<span className="text-neutral-900">{agency.reference_email}</span>
									<span className="text-neutral-700">{agency.reference_number}</span>
								</div>
							</TableCell>
							<TableCell className="pl-0 pr-4 py-2">
								<Button
									variant="ghost"
									size="icon-sm"
									className="[&_svg]:text-danger-300 hover:[&_svg]:text-danger-300 hover:bg-danger-100"
									onClick={() => onRemove(agency.id)}
								>
									<Trash2 />
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
