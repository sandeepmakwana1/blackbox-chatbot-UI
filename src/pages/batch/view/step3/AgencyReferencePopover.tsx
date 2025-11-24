import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Loader } from "~/components/ui/loader"
import { Add } from "iconsax-reactjs"
import type { AgencyReference } from "~/types/agencyReference"
import { Check } from "lucide-react"

type AgencyReferencePopoverProps = {
	agencies: AgencyReference[]
	isLoading: boolean
	selectedReferences: AgencyReference[]
	onAddAgency: (agency: AgencyReference) => void
	disabled: boolean
	dialogRef: React.RefObject<HTMLDivElement>
	isOpen: boolean
	onOpenChange: (open: boolean) => void
}

export const AgencyReferencePopover = ({
	agencies,
	isLoading,
	selectedReferences,
	onAddAgency,
	disabled,
	dialogRef,
	isOpen,
	onOpenChange,
}: AgencyReferencePopoverProps) => {
	const [search, setSearch] = useState("")

	const filteredAgencies = agencies.filter((agency) =>
		agency.reference_agency.toLowerCase().includes(search.toLowerCase())
	)

	return (
		<Popover open={isOpen} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<Button variant="secondary" size="sm" disabled={disabled}>
					<Add />
					Add new agency
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-80.75 h-64 px-1 py-1.5 bg-white rounded-md shadow-[0px_0px_6px_2px_#E9ECF0]"
				align="end"
				side="bottom"
				container={dialogRef.current}
			>
				<Card className="py-0 w-full h-full border-0 shadow-none">
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
							{isLoading ? (
								<div className="flex justify-center items-center h-full">
									<Loader size="sm" variant="primary" />
								</div>
							) : (
								<div className="flex flex-col gap-0.5 w-full">
									{filteredAgencies.map((agency) => {
										const isSelected = selectedReferences.find((a) => a.id === agency.id)
										return (
											<div
												key={agency.id}
												className={`flex items-center justify-between px-2 py-1.5 w-full rounded-md text-sm cursor-pointer ${
													isSelected
														? "bg-primary-100 text-neutral-900"
														: "hover:bg-neutral-200 text-neutral-800"
												}`}
												onClick={() => onAddAgency(agency)}
											>
												<span className="truncate">{agency.reference_agency}</span>
												{isSelected && <Check size={16} className="text-primary" />}
											</div>
										)
									})}
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</PopoverContent>
		</Popover>
	)
}
