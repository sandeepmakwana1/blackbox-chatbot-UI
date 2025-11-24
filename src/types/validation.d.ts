import type { ColumnDef } from "@tanstack/react-table"

export type ProCons = {
	Pros: string[]
	Cons: string[]
}

export type Evaluation = {
	category: string
	pros_cons: ProCons
	feasibility: string
	observations: string[]
	recommendations: string[]
}

export type Recommendation = {
	decision: string
	summary: string
	next_steps: string[]
}

export type TimelineAndSubmissionDetails = {
	due_date: string
	submission_type: string
	submission_details: string
	submission_instructions: string
}

export type CheckDetails = {
	evaluation: Evaluation[]
	recommendation: Recommendation
	timeline_and_submission_details: TimelineAndSubmissionDetails
}

export type RFPResponse = {
	RFP_Id: string
	RFP_Name: string
	technical_check: CheckDetails
	legal_check: CheckDetails
	score: number
	validation_checklist: Result
	created_at: string
	updated_at: string
}

export type Result = {
	result: string
}

export type ValidationItem = {
	source_id: number
	rfp_id: string
	rfp_name: string
	status: string
	due_date: string
	opp_type: string
	assignees: string[]
	teams: string[]
}

export type ValidationResponse = {
	data: ValidationItem[]
	total: number
	page: number
	page_size: number
	total_pages: number
	success: boolean
	message: string
}

export type DataTableProps<TData, TValue> = {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
}

export type ValidationTabsProps = {
	activeTabId: string
	setActiveTabId: (id: string) => void
}

export type ValidationResponse = {
	data: ValidationItem[]
	total: number
	page: number
	page_size: number
	total_pages: number
	success: boolean
	message: string
}

export type FilterResponse = {
	success: boolean
	message: string
	data: string[]
}

export type ValidationFilters = {
	opportunity_type: string | null
	date_filter: string | null
	agency_name: string | null
	state: string | null
	sourcingSearch: string
	validateSearch: string
	page: number
	page_size: number
}
