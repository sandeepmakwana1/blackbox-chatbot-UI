import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import type { ValidationItem } from "~/types/batch"
import type { AgencyReference } from "~/types/agencyReference"
import { Layers3 } from "lucide-react"
import { SelectedTags } from "~/components/common/selectedTags"
import { ArrowRight, Folder, Hierarchy } from "iconsax-reactjs"
import { InnerBatchItem } from "../../InnerBatchItem"
import { useAgencyReferences } from "~/handlers/batchHandler"
import { AgencyReferencePopover } from "./AgencyReferencePopover"
import { AgencyReferenceTable } from "./AgencyReferenceTable"

type AddAgencyReferencesDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	validationItems: ValidationItem[]
	onSave: (selectedReferences: Record<number, AgencyReference[]>) => void
	initialReferences?: Record<number, AgencyReference[]>
}

export const AddAgencyReferencesDialog = ({
	open,
	onOpenChange,
	validationItems,
	onSave,
	initialReferences = {},
}: AddAgencyReferencesDialogProps) => {
	const [selectedReferences, setSelectedReferences] = useState<Record<number, AgencyReference[]>>(initialReferences)
	const [selectedSourceId, setSelectedSourceId] = useState<number | null>(
		validationItems.length > 0 ? validationItems[0].source_id : null
	)
	const [isPopoverOpen, setIsPopoverOpen] = useState(false) // Add this
	const dialogRef = useRef<HTMLDivElement>(null)

	const { data: agencyData, isLoading } = useAgencyReferences()
	const agencies = agencyData?.agency_references_db || []

	useEffect(() => {
		if (open && validationItems.length > 0) {
			setSelectedSourceId(validationItems[0].source_id)
		}
	}, [open, validationItems])

	const handleSave = () => {
		onSave(selectedReferences)
		onOpenChange(false)
	}

	const handleCancel = () => {
		setSelectedReferences({})
		setSelectedSourceId(null)
		onOpenChange(false)
	}

	const handleSourceItemClick = (sourceId: number) => {
		setSelectedSourceId(sourceId)
		setIsPopoverOpen(false)
	}

	const handleAddAgency = (agency: AgencyReference) => {
		if (selectedSourceId === null) return

		setSelectedReferences((prev) => {
			const currentRefs = prev[selectedSourceId] || []
			const exists = currentRefs.find((ref) => ref.id === agency.id)

			if (exists) {
				return {
					...prev,
					[selectedSourceId]: currentRefs.filter((ref) => ref.id !== agency.id),
				}
			}

			return {
				...prev,
				[selectedSourceId]: [...currentRefs, agency],
			}
		})
	}

	const handleRemoveAgency = (agencyId: number) => {
		if (selectedSourceId === null) return

		setSelectedReferences((prev) => ({
			...prev,
			[selectedSourceId]: (prev[selectedSourceId] || []).filter((ref) => ref.id !== agencyId),
		}))
	}

	const currentReferences = selectedSourceId !== null ? selectedReferences[selectedSourceId] || [] : []

	const totalReferencesCount = Object.values(selectedReferences).reduce((total, refs) => total + refs.length, 0)

	const selectedSourceIdsCount = Object.keys(selectedReferences).filter(
		(key) => selectedReferences[Number(key)].length > 0
	).length

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-6xl h-178.5 px-4 pt-4 pb-0 gap-2 flex flex-col" ref={dialogRef}>
				<DialogHeader className="pb-2 flex-shrink-0">
					<DialogTitle className="text-sm font-medium text-neutral-700 flex items-center gap-2">
						<Layers3 size={20} />
						<span>Add Agency References</span>
					</DialogTitle>
				</DialogHeader>

				<div className="flex gap-4 flex-1 min-h-0">
					{/* Left side - Validation Items */}
					<div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar [scrollbar-gutter:stable]">
						{validationItems.map((item) => {
							const isSelected = selectedSourceId === item.source_id

							return (
								<div
									key={item.source_id}
									className="relative cursor-pointer"
									onClick={() => handleSourceItemClick(item.source_id)}
								>
									<InnerBatchItem
										item={item}
										className={
											isSelected
												? "border-primary-300 bg-[#FAFBFF] hover:border-primary-300 border-2"
												: ""
										}
										variant="secondary"
									/>
								</div>
							)
						})}
					</div>

					{/* Right side - Agency References */}
					<div className="flex-1 border border-neutral-300 rounded-xl px-4 pt-3 pb-4 flex flex-col">
						<div className="flex flex-col gap-4 flex-1 min-h-0">
							<div className="flex items-center gap-2 flex-shrink-0">
								<div className="flex items-center p-1.5 bg-neutral-900 rounded-[7px]">
									<Hierarchy size={14} className="text-white" />
								</div>
								<span className="text-neutral-900 text-sm font-medium flex-1">
									{currentReferences.length} agency reference
									{currentReferences.length !== 1 ? "s" : ""} selected
								</span>
								{currentReferences.length !== 0 && (
									<AgencyReferencePopover
										agencies={agencies}
										isLoading={isLoading}
										selectedReferences={currentReferences}
										onAddAgency={handleAddAgency}
										disabled={selectedSourceId === null}
										dialogRef={dialogRef}
										isOpen={isPopoverOpen}
										onOpenChange={setIsPopoverOpen}
									/>
								)}
							</div>

							{currentReferences.length === 0 ? (
								<div className="flex flex-col items-center  gap-4 py-16">
									<div className="p-2 bg-neutral-300 rounded-md">
										<Folder size={16} variant="Bold" className="text-neutral-600" />
									</div>
									<div className="text-center">
										<div className="text-black text-sm font-medium">
											No agency references added yet
										</div>
										<div className="text-neutral-700 text-xs max-w-md">
											Select an agency reference to fetch its associated details for reference.
											You'll be able to remove or add more agency references later.
										</div>
									</div>
									<div className="inline-flex">
										<AgencyReferencePopover
											agencies={agencies}
											isLoading={isLoading}
											selectedReferences={currentReferences}
											onAddAgency={handleAddAgency}
											disabled={selectedSourceId === null}
											dialogRef={dialogRef}
											isOpen={isPopoverOpen}
											onOpenChange={setIsPopoverOpen}
										/>
									</div>
								</div>
							) : (
								<AgencyReferenceTable references={currentReferences} onRemove={handleRemoveAgency} />
							)}
						</div>
					</div>
				</div>

				{/* Footer Actions */}
				<DialogFooter className="py-3.5 justify-between sm:justify-between flex-shrink-0">
					<SelectedTags
						text="Selected References"
						selectedCount={selectedSourceIdsCount}
						max={validationItems.length}
						tooltipContent={
							<div className="text-sm">Total agency references added: {totalReferencesCount}</div>
						}
					/>
					<div className="flex items-center justify-end gap-2">
						<Button
							variant="secondary"
							className="text-danger-300 hover:text-danger-300"
							onClick={handleCancel}
						>
							Skip all & proceed
						</Button>
						<Button variant="primary" onClick={handleSave}>
							Save references
							<ArrowRight />
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
