import type { SourcingFilters } from "~/types/sourcing"
import type { RFPResponse, ValidationResponse } from "~/types/validation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { api } from "~/handlers/axios"
import { queryClient } from "~/root"
import { toast } from "sonner"

export const validateRfp = async (source_id: number, revalidate: boolean): Promise<RFPResponse> => {
	const payload = {
		source_id: source_id,
		revalidate: revalidate,
	}

	const response = await api.post<RFPResponse>(`/validation/`, payload)

	return response.data
}

// React Query hook for cached validation data
export const useValidateRfp = (source_id: number | undefined, revalidate: boolean = false) => {
	return useQuery({
		queryKey: ["validation", source_id],
		queryFn: () => {
			if (!source_id) throw new Error("Source ID is required")
			return validateRfp(source_id, revalidate)
		},
		enabled: !!source_id,
		staleTime: 5 * 60 * 1000,
		retry: false,
	})
}

export const useRevalidateRfpMutation = () => {
	return useMutation({
		mutationKey: ["revalidateRfp"],
		mutationFn: (source_id: number) => validateRfp(source_id, true),
		onSuccess: (data, source_id) => {
			queryClient.setQueryData(["validation", source_id], data)
			toast.success("Revalidation successful!")
		},
	})
}

export const fetchValidationItems = async (filters: SourcingFilters, status: string): Promise<ValidationResponse> => {
	const params: Record<string, string | number> = {
		page: filters.page,
		page_size: filters.page_size,
	}

	if (filters.validateSearch) {
		const cleanedSearch = filters.validateSearch.trim()
		if (cleanedSearch) {
			params.search = cleanedSearch
		}
	}

	if (filters.opportunity_type) params.opportunity_type = filters.opportunity_type
	if (filters.date_filter) params.date_filter = filters.date_filter
	if (filters.agency_name) params.agency_name = filters.agency_name
	if (status !== "all") params.status = status

	const response = await api.get<ValidationResponse>(`/rfps/active/`, {
		params,
	})

	return response.data
}

export const getValidationList = (filters: SourcingFilters, status: string) => {
	return useQuery({
		queryKey: ["validationItems", filters, status],
		queryFn: () => fetchValidationItems(filters, status),
		placeholderData: (previousData) => previousData,
		refetchInterval: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	})
}
