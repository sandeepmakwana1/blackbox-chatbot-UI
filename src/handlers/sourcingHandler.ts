import type { SourcingFilters, SourcingResponse, FilterResponse, GetUrlResponse, RfpData } from "~/types/sourcing"
import { useQuery } from "@tanstack/react-query"
import { api } from "~/handlers/axios"

export const fetchSourcingItems = async (
	filters: SourcingFilters,
	scrapingSource: string
): Promise<SourcingResponse> => {
	const queryParams = new URLSearchParams()

	queryParams.append("page", filters.page.toString())
	queryParams.append("page_size", filters.page_size.toString())

	const search = (filters.sourcingSearch || filters.validateSearch || "").trim()
	if (search) {
		queryParams.append("search", search)
	}

	if (filters.opportunity_type) queryParams.append("opportunity_type", filters.opportunity_type)
	if (filters.date_filter) queryParams.append("date_filter", filters.date_filter)
	if (filters.agency_name) queryParams.append("agency_name", filters.agency_name)
	if (filters.state) queryParams.append("state", filters.state)

	if (filters.scrape_sources?.length) {
		filters.scrape_sources.forEach((source) => queryParams.append("scrape_sources", source))
	}

	if (filters.assignee_ids?.length) {
		filters.assignee_ids.forEach((id) => queryParams.append("assignee_ids", id.toString()))
	}

	if (filters.released_after_date) queryParams.append("released_after_date", filters.released_after_date)
	if (filters.validation_status) queryParams.append("validation_status", filters.validation_status)

	const response = await api.get<SourcingResponse>(`/sourcing/getrfps/${scrapingSource}`, {
		params: queryParams,
	})

	return response.data
}

export const fetchSourcingItemById = async (source_id: number): Promise<GetUrlResponse> => {
	const payload = {
		source_id: source_id,
	}

	const response = await api.post<GetUrlResponse>(`/sourcing/url_upload/`, payload)

	return response.data
}

export const uploadNewRfp = async (rfpData: RfpData, files: File[]) => {
	const headers = {
		"Content-Type": "multipart/form-data",
	}

	const data = new FormData()

	if (rfpData.rfp_id?.trim()) {
		data.append("rfp_id", rfpData.rfp_id)
		if (rfpData.rfp_id_version) {
			data.append("rfp_id_version", rfpData.rfp_id_version)
		}
	}
	if (rfpData.posted_date?.trim()) {
		data.append("posted_date", rfpData.posted_date)
	}
	data.append("agency_name", rfpData.agency_name)
	data.append("scrape_source", "")
	data.append("due_date", rfpData.due_date)
	data.append("captured_date", rfpData.captured_date)
	data.append("source_path", rfpData.source_path)
	data.append("title", rfpData.title)
	data.append("state", rfpData.state)
	data.append("description", rfpData.description)
	data.append("naics_code", rfpData.naics_code)
	data.append("opportunity_type", rfpData.opportunity_type)

	if (files && files.length > 0) {
		files.forEach((file) => {
			data.append("files", file, file.name)
		})
	} else {
		console.warn("No files provided for RFP upload.")
	}

	const response = await api.post(`/sourcing/new_upload/`, data, {
		headers: headers,
	})

	return response.data
}

export const fetchUniqueOpportunity = async (): Promise<FilterResponse> => {
	const response = await api.get<FilterResponse>(`/sourcing/filter/type`)

	return response.data
}

// New function to fetch unique agency names
export const fetchUniqueAgencies = async (): Promise<FilterResponse> => {
	const response = await api.get<FilterResponse>(`/sourcing/filter/agency`)

	return response.data
}

// New function to fetch unique states
export const fetchUniqueStates = async (): Promise<FilterResponse> => {
	const response = await api.get<FilterResponse>(`/sourcing/filter/state`)

	return response.data
}

//Fetch unique Sources
export const fetchUniqueSources = async (): Promise<FilterResponse> => {
	const response = await api.get<FilterResponse>(`/sourcing/filter/source`)

	return response.data
}

export const useSourcingItemById = (source_id: number | undefined) => {
	return useQuery({
		queryKey: ["sourcingItem", source_id],
		queryFn: () => {
			if (!source_id) throw new Error("Source ID is required")
			return fetchSourcingItemById(source_id)
		},
		enabled: !!source_id,
		staleTime: 5 * 60 * 1000,
	})
}

export const manualUploadById = async (rfp_id: string, file: File): Promise<{ message: string }> => {
	const headers = {
		"Content-Type": "multipart/form-data",
	}

	const formData = new FormData()
	formData.append("rfp_id", rfp_id)
	formData.append("file", file)

	const response = await api.post<{ message: string }>(`/manual_upload/`, formData, {
		headers,
	})

	return response.data
}

export const manualFileDeleteById = async (rfp_id: string, file_name: string): Promise<{ message: string }> => {
	const headers = {
		"Content-Type": "multipart/form-data",
	}

	const formData = new FormData()
	formData.append("rfp_id", rfp_id)
	formData.append("file_name", file_name)

	const response = await api.post<{ message: string }>(`/manual_delete/`, formData, {
		headers,
	})

	return response.data
}

// React Query hooks for filter options
export const useOpportunityTypes = () => {
	return useQuery({
		queryKey: ["opportunityTypes"],
		queryFn: () => fetchUniqueOpportunity(),
		staleTime: Number.POSITIVE_INFINITY,
	})
}

export const useAgencies = () => {
	return useQuery({
		queryKey: ["agencies"],
		queryFn: () => fetchUniqueAgencies(),
		staleTime: Number.POSITIVE_INFINITY,
	})
}

export const useStates = () => {
	return useQuery({
		queryKey: ["states"],
		queryFn: () => fetchUniqueStates(),
		staleTime: Number.POSITIVE_INFINITY,
	})
}

export const useSourcingItems = (filters: SourcingFilters, scrapingSource = "HigherGov") => {
	return useQuery({
		queryKey: ["sourcingItems", scrapingSource, filters],
		queryFn: () => fetchSourcingItems(filters, scrapingSource),
		placeholderData: (previousData) => previousData,
		refetchInterval: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	})
}

export const useScrapeSources = () => {
	return useQuery({
		queryKey: ["sources"],
		queryFn: () => fetchUniqueSources(),
		staleTime: Number.POSITIVE_INFINITY,
	})
}
