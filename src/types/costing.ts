export type HourlyJobTitleWage = {
	old_job_title: string
	Experience_level: string
	hours: number
	hourly_wage: number
	description: string
	gpt_hourly_wage: number
	GSA_Rates: number
}

export type HourlySection = {
	hourly_job_title_wages: HourlyJobTitleWage[]
}

export type License = {
	license_name: string
	license_per_unit_cost: number
	license_duration: string
	license_quantity: number
	license_scope: string
	license_minimum_purchase_requirements: string
	license_source_reference: string
	license_discount: string
}

export type LicenseList = {
	licenses: License[]
}

export type InfrastructureItem = {
	component: string
	requirement: string
	fulfillment_strategy: string
	estimated_monthly_cost: number
	estimated_annual_cost: number
	notes?: string
}

export type InfrastructureSummary = {
	items: InfrastructureItem[]
	total_monthly_cost: number
	total_annual_cost: number
	additional_notes?: string | null
}

export type CostResponse = {
	hourly_wages: HourlyJobTitleWage[]
	rfp_license: LicenseList
	rfp_infrastructure: InfrastructureSummary
	cost_field_name: string[]
}

export type ExcelSheetResponse = {
	message: string
	source_id: string
	rfp_id: string
	files: Files[]
}

export type Files = {
	file_name: string
	sheets: string[]
}

export type ExcelLinkResponse = {
	message: string
	source_id: string
	google_sheet_url: string
	download_url: string
}

export type SelectedFile = {
	file_name: string
	sheet_names: string[]
}
