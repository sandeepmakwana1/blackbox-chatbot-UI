import type { AgencyReference } from "~/types/agencyReference"

export type BatchFilter = {
	batchSearch: string
}

export type BatchItem = {
	source_id: number
	rfp_id: string
	title: string
	opportunity_type: string
	agency_name: string
	due_date: string
	scrape_source: string
}

export type GetBatchResponse = {
	bulked_rfps: BatchItem[]
	rfp_batched_numbers: number
}

export type ValidationItem = {
	source_id: number
	rfp_id: string
	title: string
	opportunity_type: string
	agency_name: string
	due_date: string
	validation_score?: number
}

export type GetValidationResponse = {
	rfps: ValidationItem[]
}

export type batchHistoryItem = {
	batch_id: string
	name: string
	create_date: string
	no_of_rfp: number
	max_count: number
	status: "inprogress" | "completed" | "failed"
	is_available?: boolean
}

export type batchHistoryResponse = {
	data: batchHistoryItem[]
	is_batch_available: boolean
}

export type BatchHistoryInfoRfpIds = {
	processing?: number[]
	success?: number[]
	fail?: number[]
	extras?: number[]
}

export type BatchProcessingResponse = {
	message: string
	batch_id: string
}

export type ContentBatchProcessingResponse = {
	batch_id: string
	status: "QUEUED" | "COMPLETED" | "FAILED" | "DUPLICATE"
}

export type BatchInfoResponse = {
	batch_id: string
	created_at: string
	status: "inprogress" | "completed" | "failed"
	source_ids: BatchHistoryInfoRfpIds
	max_count: number
	is_available?: boolean
}

export type BatchValidationSocketResponse = {
	action: "batch_complete" | "batch_progress"
	batch_id: string
	source_id: number
	status: "SUCCESS" | "FAILED" | "PARTIAL_FAILURE"
	total_files?: number
	passed_files?: number
	failed_files?: number
	passed_source_ids?: number[]
	failed_source_ids?: number[]
}

export type AgencyReferenceResponse = {
	agency_references_db: AgencyReference[]
}

export type SourceAgencyReferences = {
	source_id: string
	agency_references: AgencyReference[]
}

export type BatchAgencyRequestPayload = SourceAgencyReferences[]
