export type AgencyReference = {
	id: number
	reference_name: string
	reference_agency: string
	reference_email: string
	reference_number: string
	isHighlighted?: boolean
}

export type AgencyReferenceResponse = {
	agency_references_db: AgencyReference[]
	agency_references_redis: AgencyReference[]
}
