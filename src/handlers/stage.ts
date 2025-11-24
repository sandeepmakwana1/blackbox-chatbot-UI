import { api } from "~/handlers/axios"
import type { StageResponse } from "~/types/stage"

export const getStageStatus = async (source_id: number, run_migration: boolean = false): Promise<StageResponse> => {
	const params = {
		source_id: source_id,
		run_migration: run_migration,
	}
	const response = await api.get<StageResponse>(`/rfp/stage`, { params })

	return response.data
}

export const updateStageStatus = async (source_id: number, stage_name: string): Promise<StageResponse> => {
	const params = {
		source_id: source_id,
	}

	const payload = {
		stage_name: stage_name,
	}
	const response = await api.put<StageResponse>(`/rfp/stage`, payload, { params })

	return response.data
}
