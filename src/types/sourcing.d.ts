export type SourcingItem = {
	source_id: number
	rfp_id: string
	rfp_id_version: string
	title: string
	opportunity_type: string
	agency_name: string
	description: string
	posted_date: string
	due_date: string
	captured_date: string
	source_path: string
	state: string
	document_path: string
	scrape_source: string
	assignees?: AssignRfpItem[]
}

export type AssignRfpItem = {
	user_id: number
	name: string
	email: string
}

export type SourcingResponse = {
	data: SourcingItem[]
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

export type SourcingFilters = {
	opportunity_type: string | null
	date_filter: string | null
	agency_name: string | null
	state: string | null
	sourcingSearch: string
	validateSearch: string
	page: number
	page_size: number
	scrape_sources?: string[]
	assignee_ids?: number[]
	released_after_date?: string
	validation_status?: string
}

export type UrlData = {
	id: number
	file_name: string
	s3_url: string
	upload_type: string
	rfp_id_version: string
}

export type GetUrlResponse = {
	source_id: number
	response: UrlData
	// success: boolean
	message: string
	captured_date: string
	description: string
	due_date: string
	pre_proposal_meeting_date?: string
	question_submission_date?: string
	naics_code: string
	agency_name: string
	opportunity_type: string
	posted_date: string
	rfp_id: string
	rfp_id_version: string
	scrape_source: string
	source_path: string
	state: string
	title: string
	URLupload: UrlData[]
	Manualupload: UrlData[]
}

export type RfpData = {
	rfp_id?: string
	rfp_id_version?: string
	agency_name: string
	// scrape_source: string;
	posted_date?: string // Should be in 'YYYY-MM-DD' format
	due_date: string // Should be in 'YYYY-MM-DD' format
	captured_date: string // Should be in 'YYYY-MM-DD' format
	source_path: string
	title: string
	state: string
	description: string
	naics_code: string
	opportunity_type: string
}

export type SourcingTabsProps = {
	activeTabId: string
	setActiveTabId: (id: string) => void
}
