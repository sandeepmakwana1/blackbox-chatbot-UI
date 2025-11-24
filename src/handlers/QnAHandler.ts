import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "~/handlers/axios"

export type QuestionRegenerateStatus = "processing" | "complete" | "error"

export interface QuestionRegenerateResponse<TData = unknown> {
	status: QuestionRegenerateStatus
	message?: string
	data?: TData
}

export type QuestionsApiResponse = {
	status: string
	message: string
	data: {
		questions: string[]
	}
}

export async function addQuestionAPI(source_id: string, question: string) {
	const response = await api.post(`/questions/${source_id}`, { question })
	return response.data
}

export async function editQuestionAPI(source_id: string, index: string, new_question: string) {
	const response = await api.put(`/questions/${source_id}`, { index, new_question })
	return response.data
}

export async function deleteQuestionAPI(source_id: string, index: string) {
	const response = await api.post(`/questions/delete/${source_id}`, { index })
	return response.data
}

export async function getQuestionsAPI(source_id: string): Promise<QuestionsApiResponse> {
	const response = await api.get<QuestionsApiResponse>(`/questions/${source_id}`)
	return response.data
}

export const regenerateQuestion = async <TData = unknown>(
	source_id: number | string,
	index: number | string,
	user_feedback: string
): Promise<QuestionRegenerateResponse<TData>> => {
	const payload = {
		index: String(index),
		user_feedback: user_feedback,
	}

	const response = await api.post<QuestionRegenerateResponse<TData>>(
		`/questions/regenerate/${String(source_id)}`,
		payload
	)

	return response.data
}

export const useGetQuestions = (source_id: number | string | undefined) => {
	return useQuery({
		queryKey: ["questions", source_id],
		queryFn: () => {
			if (!source_id) throw new Error("Source ID is required")
			return getQuestionsAPI(String(source_id))
		},
		enabled: !!source_id,
		placeholderData: (previousData) => previousData,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		retry: false,
	})
}

// Mutation Hooks
export const useAddQuestion = (source_id: string | number) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (question: string) => addQuestionAPI(String(source_id), question),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["questions", source_id] })
		},
	})
}

export const useEditQuestion = (source_id: string | number) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ index, new_question }: { index: string; new_question: string }) =>
			editQuestionAPI(String(source_id), index, new_question),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["questions", source_id] })
		},
	})
}

export const useDeleteQuestion = (source_id: string | number) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (index: string) => deleteQuestionAPI(String(source_id), index),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["questions", source_id] })
		},
	})
}

export const useRegenerateQuestion = (source_id: string | number) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ index, user_feedback }: { index: string; user_feedback: string }) =>
			regenerateQuestion(String(source_id), index, user_feedback),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["questions", source_id] })
		},
	})
}
