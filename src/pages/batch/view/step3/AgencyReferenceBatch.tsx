import { ArrowRight, ChevronLeftIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { SelectedTags } from "~/components/common/selectedTags"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Loader } from "~/components/ui/loader"
import {
	fetchValidationItems,
	useBatchHistoryInfo,
	startBatchContentGeneration,
	postBatchAgencyReferences,
} from "~/handlers/batchHandler"
import { InnerBatchItem } from "~/pages/batch/InnerBatchItem"
import { BatchListSkeleton } from "~/pages/batch/BatchSkeleton"
import { AddAgencyReferencesDialog } from "~/pages/batch/view/step3/AddAgencyReferencesDialog"
import type { BatchAgencyRequestPayload, ValidationItem } from "~/types/batch"
import type { AgencyReference } from "~/types/agencyReference"
import { Edit } from "iconsax-reactjs"
import { useQueryClient } from "@tanstack/react-query"
import { useBatchStore } from "~/store/batchStore"

export const AgencyReferenceBatch = () => {
	const { batch_id } = useParams<{ batch_id: string }>()
	const queryClient = useQueryClient()

	const { data: batchHistoryInfo, isLoading: isLoadingHistory, isFetching } = useBatchHistoryInfo(batch_id || "")
	const { addValidationItems, goToStep } = useBatchStore()

	const successSourceIds = new Set((batchHistoryInfo?.source_ids.success || []).map(Number))
	const failedSourceIds = new Set((batchHistoryInfo?.source_ids.fail || []).map(Number))
	const processingSourceIds = new Set((batchHistoryInfo?.source_ids.processing || []).map(Number))
	const extraSourceIds = new Set((batchHistoryInfo?.source_ids.extras || []).map(Number))
	const maxSelection = batchHistoryInfo?.max_count || 0

	const allSourceIds = [
		...(batchHistoryInfo?.source_ids.success || []),
		...(batchHistoryInfo?.source_ids.fail || []),
		...(batchHistoryInfo?.source_ids.processing || []),
		...(batchHistoryInfo?.source_ids.extras || []),
	].map(Number)

	const [items, setItems] = useState<ValidationItem[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isError, setIsError] = useState(false)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [agencyReferencesData, setAgencyReferencesData] = useState<Record<number, AgencyReference[]>>({})
	const [isStartingProcessing, setIsStartingProcessing] = useState(false)

	const totalReferencesCount = Object.values(agencyReferencesData).reduce((total, refs) => total + refs.length, 0)

	const hasReferences = totalReferencesCount > 0

	useEffect(() => {
		const fetchInitialItems = async () => {
			if (allSourceIds.length === 0) {
				setItems([])
				setIsLoading(false)
				return
			}
			setIsLoading(true)
			setIsError(false)
			try {
				const data = await fetchValidationItems(allSourceIds)
				setItems(data.rfps)
			} catch (err) {
				setIsError(true)
			} finally {
				setIsLoading(false)
			}
		}
		fetchInitialItems()
	}, [allSourceIds.join(",")])

	const handleSkipReferences = async () => {
		setIsStartingProcessing(true)
		try {
			const allIdsToProcess = Array.from(extraSourceIds)
			await startBatchContentGeneration(batch_id || "", allIdsToProcess)
			addValidationItems(allIdsToProcess)
			goToStep("processing")

			queryClient.removeQueries({ queryKey: ["batchItems"] })
			queryClient.removeQueries({ queryKey: ["batchHistory"] })
			queryClient.removeQueries({ queryKey: ["batchHistoryInfo", batch_id] })
		} finally {
			setIsStartingProcessing(false)
		}
	}

	const handleAddEditReferences = () => {
		setIsDialogOpen(true)
	}

	const handleStartBatchProcessing = async () => {
		setIsStartingProcessing(true)
		try {
			const payload: BatchAgencyRequestPayload = Object.entries(agencyReferencesData).map(
				([sourceId, references]) => ({
					source_id: sourceId,
					agency_references: references,
				})
			)

			await postBatchAgencyReferences(payload)
			const allIdsToProcess = Array.from(extraSourceIds)
			await startBatchContentGeneration(batch_id || "", allIdsToProcess)
			addValidationItems(allIdsToProcess)
			goToStep("processing")

			queryClient.removeQueries({ queryKey: ["batchItems"] })
			queryClient.removeQueries({ queryKey: ["batchHistory"] })
			queryClient.removeQueries({ queryKey: ["batchHistoryInfo", batch_id] })
		} finally {
			setIsStartingProcessing(false)
		}
	}

	const handleSaveReferences = (references: Record<number, AgencyReference[]>) => {
		setAgencyReferencesData(references)
		console.log("Selected references:", references)
	}

	const handleBack = () => {
		setAgencyReferencesData({})
		setIsDialogOpen(false)
		setIsStartingProcessing(false)
		goToStep("validation")
	}

	// Filter items to only get extras
	const extrasItems = items.filter((item) => extraSourceIds.has(item.source_id))

	return (
		<div className="flex-1 flex flex-col h-full custom-scrollbar pb-12 gap-6">
			<div className="flex flex-col items-center gap-6">
				<div className="flex flex-col gap-6 w-fit">
					<div className="flex justify-between items-center">
						<div className="flex gap-2 items-center">
							<Button variant="secondary" size="sm" onClick={handleBack}>
								<ChevronLeftIcon />
								Back
							</Button>
							<Badge variant="pinkTransparent">Step 3 of 4</Badge>
							<div className="text-sm text-neutral-900">Agency references</div>
						</div>
						{isLoading || isLoadingHistory || isFetching ? (
							<Loader />
						) : (
							<SelectedTags
								text="References added"
								selectedCount={Object.keys(agencyReferencesData).length}
								max={extraSourceIds.size}
								tooltipHidden
							/>
						)}
					</div>

					{isError ? (
						<div className="p-6">
							<div className="bg-red-100 border border-red-400 text-red-700 rounded-md p-6 text-center">
								Error loading items
							</div>
						</div>
					) : isLoading || isLoadingHistory || isFetching ? (
						<div>
							<BatchListSkeleton length={5} />
						</div>
					) : (
						<div className="flex flex-col gap-10 w-245">
							<div className="flex flex-col gap-4">
								{Array.from({ length: Math.ceil((maxSelection || 0) / 3) }, (_, rowIndex) => {
									const startIndex = rowIndex * 3
									const itemsInRow = Array.from({ length: 3 }, (_, i) => startIndex + i)

									return (
										<div key={`row-${rowIndex}`} className="flex justify-center gap-4">
											{itemsInRow.map((globalIndex) => {
												if (globalIndex >= (maxSelection || 0)) return null
												const item = items[globalIndex]

												if (item) {
													const isSuccess = successSourceIds.has(item.source_id)
													const isProcessingFailed = failedSourceIds.has(item.source_id)
													const isProcessing = processingSourceIds.has(item.source_id)

													return (
														<InnerBatchItem
															key={item.source_id}
															item={item}
															isLoading={isProcessing}
															isDrafting={isSuccess}
															draftingStatus={
																isSuccess
																	? "success"
																	: isProcessingFailed
																	? "failed"
																	: isProcessing
																	? "processing"
																	: undefined
															}
															isReadOnly={true}
														/>
													)
												}

												return null
											})}
										</div>
									)
								})}
							</div>

							<div className="flex justify-center gap-3">
								{!hasReferences ? (
									<>
										<Button
											variant="tertiary"
											size="large"
											className="text-danger-300 border-danger-300 hover:bg-danger-100"
											onClick={handleSkipReferences}
											disabled={isStartingProcessing}
										>
											{isStartingProcessing ? (
												<>
													<Loader size="sm" variant="neutral" />
													Please wait...
												</>
											) : (
												"Skip references & proceed"
											)}
										</Button>
										<Button
											variant="primary"
											size="large"
											onClick={handleAddEditReferences}
											disabled={isStartingProcessing}
										>
											Add agency references <ArrowRight />
										</Button>
									</>
								) : (
									<>
										<Button
											variant="tertiary"
											size="large"
											onClick={handleAddEditReferences}
											disabled={isStartingProcessing}
										>
											<Edit />
											Edit references
										</Button>
										<Button
											variant="primary"
											size="large"
											onClick={handleStartBatchProcessing}
											disabled={isStartingProcessing}
										>
											{isStartingProcessing ? (
												<>
													<Loader size="sm" variant="neutral" />
													Please wait...
												</>
											) : (
												<>
													Start batch processing <ArrowRight />
												</>
											)}
										</Button>
									</>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			<AddAgencyReferencesDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				validationItems={extrasItems}
				onSave={handleSaveReferences}
				initialReferences={agencyReferencesData}
			/>
		</div>
	)
}
