import { useQuery } from "@tanstack/react-query"
import { api } from "~/handlers/axios"
import { api as batchApi } from "~/handlers/axiosBatch"
import type {
	AgencyReferenceResponse,
	BatchAgencyRequestPayload,
	BatchFilter,
	BatchInfoResponse,
	BatchProcessingResponse,
	ContentBatchProcessingResponse,
	GetBatchResponse,
	GetValidationResponse,
	batchHistoryResponse,
} from "~/types/batch"

export const fetchBatchItems = async (filters: BatchFilter): Promise<GetBatchResponse> => {
	const params: Record<string, string | number> = {}

	const search = (filters.batchSearch || "").trim()
	if (search) {
		params.search = search
	}

	const response = await api.get<GetBatchResponse>(`/bulk/validation/rfps/`, {
		params,
	})

	return response.data
}

export const fetchValidationItems = async (sourceIds: number[]): Promise<GetValidationResponse> => {
	const response = await api.get<GetValidationResponse>(`/bulk/validation/rfps/details`, {
		params: {
			source_ids: sourceIds.join(","),
		},
	})
	return response.data
}

export const startBatchValidation = async (batch_id: string, sourceIds: number[]): Promise<BatchProcessingResponse> => {
	const payload = {
		batch_id: batch_id,
		sourceIds: sourceIds.map(String),
	}
	const response = await batchApi.post<BatchProcessingResponse>(`/batches/validation`, payload)

	return response.data
}

export const fetchBatchHistoryInfo = async (batchId: string): Promise<BatchInfoResponse> => {
	const response = await batchApi.get<BatchInfoResponse>(`/batches/${batchId}`)
	return response.data
}

export const fetchBatchHistory = async (): Promise<batchHistoryResponse> => {
	const response = await batchApi.get<batchHistoryResponse>(`/batches`)
	return response.data
}

export const startBatchContentGeneration = async (
	batchId: string,
	sourceIds: number[]
): Promise<ContentBatchProcessingResponse> => {
	const payload = {
		batch_id: batchId,
		source_ids: sourceIds.map(String),
	}
	const response = await batchApi.post<ContentBatchProcessingResponse>(`/batches/content/start`, payload)

	return response.data
}

export const initiateBatchProcessing = async (sourceIds: number[]): Promise<{ batch_id: string }> => {
	const payload = {
		source_ids: sourceIds.map(String),
	}
	const response = await batchApi.post<{ batch_id: string }>(`/batches`, payload)

	return response.data
}

export const deleteSourceIdFromBatch = async (batchId: string, sourceId: number): Promise<{ message: string }> => {
	const response = await batchApi.delete(`/batches/${batchId}/${sourceId}`)
	return response.data
}

export const addSourceIdToBatch = async (batchId: string, sourceIds: number[]): Promise<{ message: string }> => {
	const payload = {
		source_ids: sourceIds.map(String),
	}
	const response = await batchApi.patch(`/batches/${batchId}`, payload)
	return response.data
}

export const getAgencyReferences = async (): Promise<AgencyReferenceResponse> => {
	const response = await batchApi.get<AgencyReferenceResponse>(`/batches/agency-references/`)
	return response.data
}

export const postBatchAgencyReferences = async (payload: BatchAgencyRequestPayload) => {
	const response = await batchApi.post(`/batches/agency-references/`, payload)
	return response.data
}

export const useBatchItems = (filters: BatchFilter) => {
	return useQuery({
		queryKey: ["batchItems", filters],
		queryFn: () => fetchBatchItems(filters),
		placeholderData: (previousData) => previousData,
		gcTime: 10 * 60 * 1000,
	})
}

export const useValidationItems = (sourceIds: number[]) => {
	return useQuery({
		queryKey: ["validationItems", [...sourceIds].sort()],
		queryFn: () => fetchValidationItems(sourceIds),
		enabled: sourceIds.length > 0,
		gcTime: 10 * 60 * 1000,
	})
}

export const useBatchHistory = () => {
	return useQuery({
		queryKey: ["batchHistory"],
		queryFn: () => fetchBatchHistory(),
		gcTime: 10 * 60 * 1000,
	})
}

export const useBatchHistoryInfo = (batchId: string) => {
	return useQuery({
		queryKey: ["batchHistoryInfo", batchId],
		queryFn: () => fetchBatchHistoryInfo(batchId),
		enabled: !!batchId,
		gcTime: 10 * 60 * 1000,
	})
}

export const useAgencyReferences = () => {
	return useQuery({
		queryKey: ["agencyReferencesBatch"],
		queryFn: () => getAgencyReferences(),
		staleTime: Number.POSITIVE_INFINITY,
	})
}
