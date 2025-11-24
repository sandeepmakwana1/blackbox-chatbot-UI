import { useMutation, useQuery } from "@tanstack/react-query"
import axios from "axios"
import type {
	OutlineJson,
	OutlineSection,
	UserPreference,
	UserPreferencesResponse,
	TopicSelection,
	DeepResearchData,
	DeepResearchApiResponse,
	DeepResearchStatusResponse,
	OutlineJsonUpdateStatus,
} from "~/types/preSteps"
import { queryClient } from "~/root"
import { api } from "~/handlers/axios"
import type { AgencyReference, AgencyReferenceResponse } from "~/types/agencyReference"
import { handleSseStream, type SseCallbacks } from "./sseHandler"

const API_URL = import.meta.env.VITE_API_URL || "https://blackboxai-dev.log1.com"

const getToken = () => {
	const token = localStorage.getItem("token")
	if (!token) {
		throw new Error("Authentication token not found")
	}
	return token
}
interface UserPreferencesResponseWithStatus {
	status: "processing" | "completed"
	data?: UserPreferencesResponse
}

interface OutlineJsonWithStatus {
	status: "processing" | "completed"
	data?: OutlineJson
}

interface TopicSelectionWithStatus {
	status: "processing" | "completed"
	data?: TopicSelection
}

interface DeepResearchDataWithStatus {
	status: "processing" | "completed"
	data?: DeepResearchData
}

export const getUserSummary = async (source_id: number, callbacks: SseCallbacks = {}) => {
	const endpoint = `/rfp-user-summary/?source_id=${source_id}`

	const payload = {}

	return handleSseStream(endpoint, payload, callbacks, "GET")
}

export const getUserPreferences = async (source_id: number): Promise<UserPreferencesResponseWithStatus> => {
	const params: Record<string, string | number> = {
		source_id: source_id,
	}

	const response = await api.get(`/rfp-user-preference`, {
		params,
	})

	// Handle 202 status - request is still processing
	if (response.status === 202) {
		return {
			status: "processing",
			data: undefined,
		}
	}

	// Handle 200 status - data is ready
	if (response.status === 200) {
		return {
			status: "completed",
			data: {
				...response.data["detail"],
			},
		}
	}

	throw new Error(`Unexpected status code: ${response.status}`)
}

export const getOutlineJson = async (source_id: number): Promise<OutlineJsonWithStatus> => {
	try {
		const params: Record<string, string | number> = {
			source_id: source_id,
		}
		const response = await api.get(`/rfp-table-of-content/`, {
			params,
		})
		if (response.status === 202) {
			return {
				status: "processing",
				data: undefined,
			}
		}

		// Handle 200 status - data is ready
		if (response.status === 200) {
			return {
				status: "completed",
				data: {
					...response.data["detail"],
					exec_summary_section_number: response.data["detail"].exec_summary_section_number,
					toc_version: response.data["detail"].toc_version,
					generated_sections: response.data["detail"].generated_sections || [],
				},
			}
		}
		throw new Error(`Unexpected status code: ${response.status}`)
	} catch (error) {
		console.error("Error fetching outline JSON:", error)
		throw error
	}
}

export const putUserPreferences = async (source_id: number, preferences: UserPreference[]) => {
	const payload = {
		source_id: source_id.toString(),
		user_preference: preferences,
	}
	const response = await api.put(`/rfp-user-preference`, payload)
	return response.data["detail"]
}

export const postOutlineJson = async (
	source_id: number,
	outline_json: OutlineSection[],
	toc_version: number,
	executive_summary_section_number: number
) => {
	try {
		console.log("Posting outline JSON:", { source_id, outline_json, toc_version, executive_summary_section_number })
		const headers = {
			"Content-Type": "multipart/form-data",
		}

		const form = new FormData()
		form.append("source_id", source_id.toString())
		form.append("table_of_content", JSON.stringify(outline_json))
		form.append("toc_version", toc_version.toString())
		form.append("exec_summary_section_number", executive_summary_section_number.toString())
		const response = await api.put(`/rfp-toc-update`, form, {
			headers,
		})
		return response.data["detail"]
	} catch (error) {
		console.error("Error Updating the Table of content :", error)
		throw error
	}
}

export const getOutlineJsonUpdateStatus = async (source_id: number): Promise<OutlineJsonUpdateStatus> => {
	const response = await api.get(`/rfp-toc-status/${source_id}`)
	return response.data
}

export const tocRegenerate = async (
	source_id: number,
	toc: OutlineSection[],
	userFeedback: string
): Promise<OutlineJsonWithStatus> => {
	const payload = {
		source_id: source_id.toString(),
		previous_outline: toc,
		user_feedback: userFeedback,
	}
	const response = await api.post(`/rfp-toc-regenerate`, payload)

	return response.data
}

export const getTopicSelection = async (source_id: number): Promise<TopicSelectionWithStatus> => {
	const params = {
		source_id: source_id.toString(),
	}
	const response = await api.get(`/deep-research/queries`, { params })
	if (response.status === 202) {
		return {
			status: "processing",
			data: undefined,
		}
	}
	if (response.status === 200) {
		return {
			status: "completed",
			data: {
				...response.data,
			},
		}
	}
}

export const putAgencyReferences = async (source_id: number, agencyReferences: AgencyReference[]) => {
	const response = await api.put(`/agency-references/`, {
		source_id: String(source_id),
		agency_references: agencyReferences,
	})
	return response.data
}

export const startDeepResearch = async (
	source_id: number,
	topicSelection: TopicSelection,
	run_deep_research: boolean
) => {
	try {
		const token = getToken()

		const headers = {
			Authorization: `Bearer ${token}`,
		}

		const payload = {
			source_id: source_id.toString(),
			research_categories: topicSelection.research_categories,
			run_deep_research: run_deep_research,
		}
		const response = await axios.post(`${API_URL}/deep-research/execute`, payload, { headers })
		if (response.status === 202) {
			return { success: true, data: response.data }
		}
	} catch (error) {
		if (error.response?.status === 409) {
			return { success: false, alreadyInProgress: true }
		}
		throw error
	}
}

export const getDeepResearch = async (source_id: number): Promise<DeepResearchDataWithStatus> => {
	try {
		const token = getToken()

		const headers = {
			Authorization: `Bearer ${token}`,
		}

		const params = {
			source_id: source_id.toString(),
		}

		const response = await axios.get<DeepResearchApiResponse>(`${API_URL}/deep-research`, { params, headers })
		const apiData = response.data

		if (apiData.status === "in_progress" || !apiData.data) {
			return {
				status: "processing",
				data: undefined,
			}
		}

		const research_categories: DeepResearchData["research_categories"] = {}

		for (const item of Object.values(apiData.data)) {
			const categoryName = Object.keys(item.section)[0]

			if (categoryName) {
				research_categories[categoryName] = {
					answer: item.answer,
					subcategories: item.section[categoryName],
				}
			}
		}

		return {
			status: "completed",
			data: {
				research_categories,
			},
		}
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 404) {
			return {
				status: "completed",
				data: { research_categories: {} },
			}
		}
	}
}

export const getDeepResearchStatus = async (source_id: number): Promise<DeepResearchStatusResponse> => {
	const params = {
		source_id: source_id.toString(),
	}
	const response = await api.get(`/deep-research/status`, { params })
	return response.data
}

export const getAgencyReferences = async (source_id: number): Promise<AgencyReferenceResponse> => {
	const params = {
		source_id: source_id.toString(),
	}
	const response = await api.get(`/agency-references`, { params })
	if (response.status === 200) {
		return response.data["detail"]
	}
	return {
		agency_references_db: [],
		agency_references_redis: [],
	}
}

// React Query Hooks
export const useUserPreferences = (source_id: number, shouldRefetch?: boolean) => {
	return useQuery({
		queryKey: ["userPreferences", source_id],
		queryFn: () => getUserPreferences(source_id),
		placeholderData: (previousData) => previousData,
		retry: false,
		gcTime: 10 * 60 * 1000,
		refetchOnMount: shouldRefetch ? "always" : true,
		staleTime: shouldRefetch ? 0 : 5 * 60 * 1000,
	})
}

export const useOutlineJson = (source_id: number, shouldRefetch?: boolean) => {
	return useQuery({
		queryKey: ["outlineJson", source_id],
		queryFn: () => getOutlineJson(source_id),
		placeholderData: (previousData) => previousData,
		refetchOnMount: shouldRefetch ? "always" : true,
	})
}

export const useTocRegenerate = () => {
	return useMutation({
		mutationFn: ({
			source_id,
			toc,
			userFeedback,
		}: {
			source_id: number
			toc: OutlineSection[]
			userFeedback: string
		}) => tocRegenerate(source_id, toc, userFeedback),
		onSuccess: (data, variables) => {
			// Optionally invalidate and refetch the outline query
			queryClient.invalidateQueries({
				queryKey: ["outlineJson", variables.source_id],
			})
		},
		onError: (error) => {
			console.error("Mutation failed:", error)
		},
	})
}

export const useTopicSelection = (source_id: number, shouldRefetch?: boolean) => {
	return useQuery({
		queryKey: ["topicSelection", source_id],
		queryFn: () => getTopicSelection(source_id),
		placeholderData: (previousData) => previousData,
		refetchOnMount: shouldRefetch ? "always" : true,
	})
}

export const useGetDeepResearch = (source_id: number, shouldRefetch?: boolean) => {
	return useQuery({
		queryKey: ["deepResearch", source_id],
		queryFn: () => getDeepResearch(source_id),
		placeholderData: (previousData) => previousData,
		refetchOnMount: shouldRefetch ? "always" : true,
	})
}

export const useDeepResearchStatus = (source_id: number, shouldRefetch?: boolean, isPolling?: boolean) => {
	return useQuery({
		queryKey: ["deepResearchStatus", source_id],
		queryFn: () => getDeepResearchStatus(source_id),
		placeholderData: (previousData) => previousData,
		refetchOnMount: shouldRefetch ? "always" : true,
		refetchInterval: isPolling ? 5000 : false,
		refetchOnWindowFocus: false,
	})
}

export const preStepsCheck = async (source_id: number) => {
	try {
		const token = getToken()

		const headers = {
			Authorization: `Bearer ${token}`,
		}
		const response = await axios.get(`${API_URL}/rfp-presteps-check/?source_id=${source_id}`, { headers })
		return response
	} catch (error) {
		console.error("Error fetching pre steps check:", error)
		throw error
	}
}

export const useAgencyReferences = (source_id: number, shouldRefetch?: boolean) => {
	return useQuery({
		queryKey: ["agencyReferences", source_id],
		queryFn: () => getAgencyReferences(source_id),
		placeholderData: (previousData) => previousData,
		refetchOnMount: shouldRefetch ? "always" : true,
	})
}
