import { motion } from "framer-motion"
import { ArrowRight, Lock } from "iconsax-reactjs"
import { LoaderIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { SelectedTags } from "~/components/common/selectedTags"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Loader } from "~/components/ui/loader"
import {
	fetchValidationItems,
	startBatchContentGeneration,
	startBatchValidation,
	useBatchHistoryInfo,
	deleteSourceIdFromBatch,
	addSourceIdToBatch,
} from "~/handlers/batchHandler"
import { InnerBatchItem } from "~/pages/batch/InnerBatchItem"
import { BatchListSkeleton } from "~/pages/batch/BatchSkeleton"
import { PlaceholderItem } from "~/pages/batch/view/step2/Placeholder"
import { queryClient } from "~/root"
import { useBatchStore } from "~/store/batchStore"
import type { BatchValidationSocketResponse, ValidationItem } from "~/types/batch"
import { useBatchValidationSocket } from "~/utils/batchSocketIntegration"

export const ValidationBatch = () => {
	const { batch_id } = useParams<{ batch_id: string }>()
	const { goToStep } = useBatchStore()

	const { data: batchHistoryInfo, isLoading: isLoadingHistory } = useBatchHistoryInfo(batch_id || "")

	const isReadOnly = batchHistoryInfo?.is_available === false

	// Convert all useMemos to state
	const [successSourceIds, setSuccessSourceIds] = useState<Set<number>>(new Set())
	const [failedSourceIds, setFailedSourceIds] = useState<Set<number>>(new Set())
	const [processingSourceIds, setProcessingSourceIds] = useState<Set<number>>(new Set())
	const [extraSourceIds, setExtraSourceIds] = useState<Set<number>>(new Set())
	const [allSourceIds, setAllSourceIds] = useState<number[]>([])

	const maxSelection = batchHistoryInfo?.max_count || 0

	// Initialize state from batchHistoryInfo
	useEffect(() => {
		if (!batchHistoryInfo) {
			setSuccessSourceIds(new Set())
			setFailedSourceIds(new Set())
			setProcessingSourceIds(new Set())
			setExtraSourceIds(new Set())
			setAllSourceIds([])
			return
		}

		setSuccessSourceIds(new Set((batchHistoryInfo.source_ids.success || []).map(Number)))
		setFailedSourceIds(new Set((batchHistoryInfo.source_ids.fail || []).map(Number)))
		setProcessingSourceIds(new Set((batchHistoryInfo.source_ids.processing || []).map(Number)))
		setExtraSourceIds(new Set((batchHistoryInfo.source_ids.extras || []).map(Number)))
		setAllSourceIds(
			[
				...(batchHistoryInfo.source_ids.success || []),
				...(batchHistoryInfo.source_ids.fail || []),
				...(batchHistoryInfo.source_ids.processing || []),
				...(batchHistoryInfo.source_ids.extras || []),
			].map(Number)
		)
	}, [batchHistoryInfo])

	const [items, setItems] = useState<ValidationItem[]>([])
	const [newlyAddedItems, setNewlyAddedItems] = useState<ValidationItem[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isError, setIsError] = useState(false)

	const [isProcessingValidation, setIsProcessingValidation] = useState(false)
	const [isStartingProcessing, setIsStartingProcessing] = useState(false)
	const [validatingIds, setValidatingIds] = useState<Set<number>>(new Set())
	const [validationFailedIds, setValidationFailedIds] = useState<Set<number>>(new Set())
	const [batchId, setBatchId] = useState<string | null>(null)

	const totalItemsToValidate = useRef<number>(0)
	const processedCount = useRef<number>(0)

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
	}, [allSourceIds])

	const handleAddItems = async (ids: number[]) => {
		if (isReadOnly || !batch_id) return
		try {
			await addSourceIdToBatch(batch_id, ids)
			const newData = await fetchValidationItems(ids)
			setNewlyAddedItems((prevItems) => [...prevItems, ...newData.rfps])
			setExtraSourceIds((prev) => {
				const newSet = new Set(prev)
				ids.forEach((id) => newSet.add(id))
				return newSet
			})
		} catch (e) {
			toast.error("Failed to add new items.")
		}
	}

	const handleDeleteItem = (sourceId: number) => {
		if (isReadOnly || !batch_id) return

		deleteSourceIdFromBatch(batch_id, sourceId).catch((error) => {
			console.error("Failed to delete item from batch:", error)
		})

		if (newlyAddedItems.some((item) => item.source_id === sourceId)) {
			setNewlyAddedItems((prev) => prev.filter((item) => item.source_id !== sourceId))
		} else {
			setItems((prev) => prev.filter((item) => item.source_id !== sourceId))
		}

		setExtraSourceIds((prev) => {
			const newSet = new Set(prev)
			newSet.delete(sourceId)
			return newSet
		})
	}

	const combinedItems = [...items, ...newlyAddedItems]
	const nonExtras: ValidationItem[] = []
	const extrasAndNew: ValidationItem[] = []

	combinedItems.forEach((item) => {
		const isExtra = extraSourceIds.has(item.source_id)
		const isNewlyAdded = newlyAddedItems.some((newItem) => newItem.source_id === item.source_id)

		if (isExtra || isNewlyAdded) {
			extrasAndNew.push(item)
		} else {
			nonExtras.push(item)
		}
	})

	const allItems = [...nonExtras, ...extrasAndNew]

	const itemsToValidate = allItems.filter(
		(item) =>
			extraSourceIds.has(item.source_id) ||
			newlyAddedItems.some((newItem) => newItem.source_id === item.source_id)
	)

	const validatedCount = itemsToValidate.filter((item) => item.validation_score != null).length || 0
	const totalItemsInBatch = itemsToValidate.length || 0
	const allItemsValidated = totalItemsInBatch > 0 && validatedCount === totalItemsInBatch

	const handleSocketMessage = useCallback(async (data: BatchValidationSocketResponse) => {
		if (data.action === "batch_complete") {
			console.log("[Validation] Batch completed:", data)
			setIsProcessingValidation(false)
			setBatchId(null)
			processedCount.current = 0
			totalItemsToValidate.current = 0

			if (data.status === "SUCCESS") {
				toast.success("Validation completed successfully!")
			} else if (data.status === "PARTIAL_FAILURE") {
				toast.warning("Validation completed with some failures")
			}
			return
		}

		if (data.action === "batch_progress") {
			const { source_id, status } = data
			console.log("[Validation] Progress update:", { source_id, status })
			processedCount.current += 1

			setValidatingIds((prev) => {
				const newSet = new Set(prev)
				newSet.delete(source_id)
				return newSet
			})

			if (status === "FAILED") {
				setValidationFailedIds((prev) => {
					const newSet = new Set(prev).add(source_id)
					return newSet
				})
			} else if (status === "SUCCESS") {
				try {
					const updatedItemData = await fetchValidationItems([source_id])
					if (updatedItemData.rfps && updatedItemData.rfps.length > 0) {
						const updatedItem = updatedItemData.rfps[0]
						setItems((currentItems) =>
							currentItems.map((item) => (item.source_id === source_id ? updatedItem : item))
						)
						setNewlyAddedItems((currentItems) =>
							currentItems.map((item) => (item.source_id === source_id ? updatedItem : item))
						)
					}
				} catch (error) {
					setValidationFailedIds((prev) => new Set(prev).add(source_id))
				}
			}

			if (processedCount.current >= totalItemsToValidate.current) {
				setIsProcessingValidation(false)
				setBatchId(null)
				processedCount.current = 0
				totalItemsToValidate.current = 0
			}
		}
	}, [])

	const handleSocketError = useCallback((error: Error) => {
		toast.error(`A WebSocket error occurred: ${error.message}. Please try again.`)
		setIsProcessingValidation(false)
		setValidatingIds(new Set())
		setValidationFailedIds(new Set())
		setBatchId(null)
		processedCount.current = 0
		totalItemsToValidate.current = 0
	}, [])

	const handleSocketConnect = useCallback(() => console.log("[Validation] WebSocket connected"), [])
	const handleSocketDisconnect = useCallback(() => console.log("[Validation] WebSocket disconnected"), [])

	useBatchValidationSocket({
		batchId,
		onMessage: handleSocketMessage,
		onError: handleSocketError,
		onConnect: handleSocketConnect,
		onDisconnect: handleSocketDisconnect,
	})

	const handleValidationStart = async () => {
		if (isReadOnly) return
		if (itemsToValidate.length === 0) return

		const itemsNeedingValidation = itemsToValidate.filter((item) => item.validation_score == null)
		const idsToValidate = itemsNeedingValidation.map((item) => item.source_id)

		if (idsToValidate.length === 0) {
			toast.info("All items are already validated")
			return
		}

		setIsProcessingValidation(true)
		setValidatingIds(new Set(idsToValidate))
		setValidationFailedIds(new Set())
		totalItemsToValidate.current = idsToValidate.length
		processedCount.current = 0

		try {
			const response = await startBatchValidation(batch_id, idsToValidate)
			setBatchId(response.batch_id)
		} catch (error) {
			setIsProcessingValidation(false)
			setValidatingIds(new Set())
			setValidationFailedIds(new Set())
			totalItemsToValidate.current = 0
			processedCount.current = 0
		}
	}

	const handleAgencyStart = async () => {
		if (isReadOnly) return
		queryClient.removeQueries({
			queryKey: ["batchHistoryInfo"],
		})
		goToStep("agency")
	}

	return (
		<div className="flex-1 flex flex-col h-full custom-scrollbar pb-12 gap-6">
			<div className="flex flex-col items-center gap-6">
				<div className="flex flex-col gap-6 w-fit">
					<div className="flex justify-between items-center">
						<div className="flex gap-2 items-center">
							<Badge variant="pinkTransparent">Step 2 of 4</Badge>
							<div className="text-sm text-neutral-900">Run validation</div>
							{isReadOnly && (
								<Badge variant="neutralTransparent" className="gap-1.5">
									<Lock size={12} />
									Read-only
								</Badge>
							)}
						</div>
						{isLoading || isLoadingHistory ? (
							<Loader />
						) : (
							<SelectedTags
								text="Validated"
								selectedCount={validatedCount}
								max={maxSelection}
								inProgress={validatingIds.size}
								failed={validationFailedIds.size}
							/>
						)}
					</div>

					{isError ? (
						<div className="p-6">
							<div className="bg-red-100 border border-red-400 text-red-700 rounded-md p-6 text-center">
								Error loading validation items
							</div>
						</div>
					) : isLoading || isLoadingHistory ? (
						<div>
							<BatchListSkeleton length={5} />
						</div>
					) : allItems.length === 0 && (maxSelection || 0) > 0 ? (
						<div className="flex flex-col gap-10 w-245">
							<div className="flex flex-col gap-4">
								{Array.from({ length: Math.ceil((maxSelection || 0) / 3) }, (_, rowIndex) => (
									<div key={`row-${rowIndex}`} className="flex justify-center gap-4">
										{Array.from({ length: 3 }).map((_, colIndex) => {
											const globalIndex = rowIndex * 3 + colIndex
											if (globalIndex >= (maxSelection || 0)) return null
											const existingIds = allItems.map((item) => item.source_id)
											return (
												<PlaceholderItem
													key={`placeholder-${globalIndex}`}
													existingIds={existingIds}
													maxItems={maxSelection}
													isDisabled={isProcessingValidation || isReadOnly}
													onAddItems={handleAddItems}
												/>
											)
										})}
									</div>
								))}
							</div>
						</div>
					) : (
						<div className="flex flex-col gap-10">
							<div className="flex flex-col gap-4">
								{Array.from({ length: Math.ceil((maxSelection || 0) / 3) }, (_, rowIndex) => {
									const startIndex = rowIndex * 3
									const itemsInRow = Array.from({ length: 3 }, (_, i) => startIndex + i)

									return (
										<div key={`row-${rowIndex}`} className="flex justify-center gap-4">
											{itemsInRow.map((globalIndex) => {
												if (globalIndex >= (maxSelection || 0)) return null
												const item = allItems[globalIndex]
												const existingIds = allItems.map((item) => item.source_id)

												if (item) {
													const isSuccess = successSourceIds.has(item.source_id)
													const isProcessingFailed = failedSourceIds.has(item.source_id)
													const isValidationFailed = validationFailedIds.has(item.source_id)
													const isProcessing = processingSourceIds.has(item.source_id)
													const isValidating = validatingIds.has(item.source_id)
													const isExtra = extraSourceIds.has(item.source_id)
													const isNewlyAdded = newlyAddedItems.some(
														(newItem) => newItem.source_id === item.source_id
													)

													return (
														<InnerBatchItem
															key={item.source_id}
															item={item}
															onDelete={
																!isReadOnly && (isExtra || isNewlyAdded)
																	? () => handleDeleteItem(item.source_id)
																	: undefined
															}
															isValidating={isValidating}
															isFailed={isValidationFailed}
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
															isReadOnly={isReadOnly}
														/>
													)
												}

												// Don't render placeholders in read-only mode
												if (isReadOnly) return null

												return (
													<PlaceholderItem
														key={`placeholder-${globalIndex}`}
														existingIds={existingIds}
														maxItems={maxSelection}
														isDisabled={isProcessingValidation}
														onAddItems={handleAddItems}
													/>
												)
											})}
										</div>
									)
								})}
							</div>
							{!isReadOnly && (
								<div className="flex justify-center gap-3">
									{isProcessingValidation ? (
										<motion.div
											className="flex select-none items-center gap-1 rounded-full px-3 py-2 text-sm font-normal text-warning-300"
											style={{
												backgroundColor: "#20252D",
												border: "2px solid #FABC37",
												boxShadow: "2px 4px 14.1px 0 #B5AEBA",
											}}
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ duration: 0.3 }}
										>
											<LoaderIcon size={14} className="text-warning-300 animate-spin" />
											<span>Validation in progress</span>
										</motion.div>
									) : allItemsValidated ? (
										<Button
											variant="primary"
											size="large"
											onClick={handleAgencyStart}
											className="gap-2"
											disabled={isStartingProcessing || extraSourceIds.size === 0}
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
									) : (
										<>
											<Button
												variant="tertiary"
												size="large"
												className="disabled:border-0"
												onClick={handleAgencyStart}
												disabled={
													isStartingProcessing ||
													isProcessingValidation ||
													extraSourceIds.size === 0
												}
											>
												{isStartingProcessing ? (
													<>
														<Loader size="sm" variant="neutral" />
														Please wait...
													</>
												) : (
													"Skip validation"
												)}
											</Button>
											<Button
												variant="primary"
												size="large"
												className="gap-2"
												onClick={handleValidationStart}
												disabled={
													itemsToValidate.length === 0 ||
													isStartingProcessing ||
													isProcessingValidation
												}
											>
												Start validation <ArrowRight />
											</Button>
										</>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
