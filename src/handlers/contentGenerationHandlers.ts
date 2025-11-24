import { useQuery } from "@tanstack/react-query"
import type { ContentGenerationResponse, costMergeResponse, Section } from "~/types/contentGeneration"
import type { CostResponse, ExcelLinkResponse, ExcelSheetResponse, SelectedFile } from "~/types/costing"
import { api } from "~/handlers/axios"
import { handleSseStream, type SseCallbacks } from "./sseHandler"

const API_URL = import.meta.env.VITE_API_URL || "https://blackboxai-dev.log1.com"

const getToken = () => {
	const token = localStorage.getItem("token")
	if (!token) {
		throw new Error("Authentication token not found")
	}
	return token
}

interface StreamResponse {
	status: "processing" | "completed" | "error"
	message?: string
	data?: ContentGenerationResponse
}

interface RegenerateAllCallbacks {
	onProcessing?: (message: string) => void
	onSectionCompleted?: (section: Section, completedCount: number, totalCount: number) => void
	onAllCompleted?: (sections: Section[]) => void
	onError?: (error: string) => void
}

export const getContentForSection = async (source_id: number, section_number: number, callbacks?: SseCallbacks) => {
	const payload = {
		source_id: source_id.toString(),
		section_number: section_number,
	}

	return handleSseStream("/rfp-content-generation-section/", payload, callbacks)
}

export const contentRegenerate = async (
	source_id: number,
	section_number: number,
	user_feedback: string,
	callbacks?: SseCallbacks
) => {
	const payload = {
		source_id: source_id.toString(),
		section_id: section_number,
		user_feedbacks: user_feedback,
	}

	return handleSseStream("/rfp-content-regeneration/", payload, callbacks)
}

export const contentRegenerateAll = async (
	source_id: number,
	user_feedback: string,
	totalSections: number,
	callbacks?: RegenerateAllCallbacks
) => {
	try {
		const token = getToken()

		const headers = {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		}

		const payload = {
			source_id: source_id.toString(),
			section_id: -1,
			user_feedbacks: user_feedback,
		}

		const response = await fetch(`${API_URL}/rfp-content-regeneration/`, {
			method: "POST",
			headers,
			body: JSON.stringify(payload),
		})

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const reader = response.body?.getReader()
		const decoder = new TextDecoder()
		let buffer = ""
		let completedSections: Section[] = []
		let completedCount = 0

		if (reader) {
			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				const chunk = decoder.decode(value, { stream: true })
				buffer += chunk

				const lines = buffer.split("\n")
				buffer = lines.pop() || ""

				for (const line of lines) {
					try {
						if (!line.trim()) continue
						const parsed: StreamResponse = JSON.parse(line)

						if (parsed.status === "processing" && parsed.message) {
							callbacks?.onProcessing?.(parsed.message)
						} else if (parsed.status === "completed" && parsed.data?.content) {
							const section = Array.isArray(parsed.data.content)
								? parsed.data.content[0]
								: parsed.data.content

							completedSections.push(section)
							completedCount++

							callbacks?.onSectionCompleted?.(section, completedCount, totalSections)

							if (completedCount >= totalSections) {
								callbacks?.onAllCompleted?.(completedSections)
								return completedSections
							}
						}
					} catch (err) {
						console.warn("Failed to parse:", line)
					}
				}
			}
		}

		if (completedSections.length > 0) {
			callbacks?.onAllCompleted?.(completedSections)
			return completedSections
		}

		throw new Error("Stream ended without completion")
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error"
		callbacks?.onError?.(message)
		throw error
	}
}

export const generateCost = async (source_id: string, regenerate: boolean): Promise<CostResponse> => {
	const params = {
		source_id: source_id,
		content_modified: regenerate,
	}
	const response = await api.get<CostResponse>(`/cost-generator/`, { params })
	return response.data
}

export const mergeCost = async (source_id: string, costData: CostResponse): Promise<costMergeResponse> => {
	const params = {
		source_id: source_id,
	}

	const payload = {
		hourly_wages: costData.hourly_wages,
		rfp_license: costData.rfp_license,
		rfp_infrastructure: costData.rfp_infrastructure,
		cost_field_name: costData.cost_field_name,
	}

	const response = await api.post<costMergeResponse>(`/cost-formating/`, payload, { params })
	return response.data
}

export const confirmCostMerge = async (sourceId: string, sections: Section[]): Promise<void> => {
	try {
		await api.post(`/cost-merge/`, { sections: sections }, { params: { source_id: sourceId } })
	} catch (error) {
		console.error("Error confirming cost merge:", error)
		throw error
	}
}

export const regenerateCost = async (
	source_id: string,
	section_name: string,
	section_content: any,
	user_feedback: string
) => {
	const params = {
		source_id: source_id,
	}
	const payload = {
		section_name: section_name,
		section_content: section_content,
		user_feedback: user_feedback,
	}
	const response = await api.post(`/cost-regenerator/`, payload, { params })
	return response.data
}

export const updateContent = async (source_id: string, section_id: number, content: Section): Promise<void> => {
	const payload = {
		source_id: source_id,
		section_id: section_id,
		updated_content: content,
	}
	try {
		const response = await api.put(`/rfp-content-update/`, payload)
		return response.data
	} catch (error) {
		console.error("Error updating content:", error)
		throw error
	}
}

export const useGenerateCost = (source_id: number) => {
	return useQuery({
		queryKey: ["cost", source_id],
		queryFn: ({ queryKey }) => {
			const [, sourceId, regenerate] = queryKey
			return generateCost(sourceId.toString(), Boolean(regenerate))
		},
		placeholderData: (previousData) => previousData,
		gcTime: 10 * 60 * 1000,
	})
}

export const costImageFormatting = async (source_id: number, files: File[]): Promise<{ table_result: string }> => {
	const headers = {
		"Content-Type": "multipart/form-data",
	}

	const params = {
		source_id: source_id.toString(),
	}

	const data = new FormData()

	if (files && files.length > 0) {
		files.forEach((file) => {
			data.append("images", file, file.name)
		})
	} else {
		console.warn("No files provided for RFP upload.")
	}

	const response = await api.post<{ table_result: string }>(`/cost-image-formatting/`, data, {
		headers: headers,
		params: params,
	})

	return response.data
}

export const getCostingExcelSheets = async (source_id: string): Promise<ExcelSheetResponse> => {
	const params = {
		source_id: source_id,
	}
	const response = await api.get<ExcelSheetResponse>(`/excel-files/sheets/`, { params })
	return response.data
}

export const useGetCostingExcelSheets = (source_id: string, shouldRefetch: boolean) => {
	return useQuery({
		queryKey: ["costingExcelSheets", source_id],
		queryFn: () => getCostingExcelSheets(source_id),
		placeholderData: (previousData) => previousData,
		retry: false,
		refetchOnMount: shouldRefetch ? "always" : true,
	})
}

export const postCostingExcelSheets = async (source_id: string, sheets: SelectedFile): Promise<ExcelLinkResponse> => {
	const payload = {
		source_id: source_id,
		files: [sheets],
	}
	const response = await api.post<ExcelLinkResponse>(`/process-sheets-to-google-sheet/`, payload)
	return response.data
}
