import { api } from "./axios"
import type { UserChats, Conversation, OptimisePromptResponse } from "~/components/playground/types/playground"
import { resolvePlaygroundUserEmail, usePlaygroundConfigStore } from "~/store/playgroundConfigStore"

const getUserId = () => {
	const configuredUser = resolvePlaygroundUserEmail()
	if (configuredUser) {
		return configuredUser
	}

	try {
		const localStore = localStorage.getItem("local-store")
		if (localStore) {
			const parsed = JSON.parse(localStore)
			return parsed.state?.user?.email || "random_user"
		}
	} catch (error) {
		console.error("Error getting user ID:", error)
	}
	return "random_user"
}

const getSourceId = () => {
	const configuredSourceId = (usePlaygroundConfigStore.getState().defaultSourceId || "").trim()
	if (configuredSourceId) {
		return configuredSourceId
	}

	try {
		// Get source_id from the URL path
		const pathParts = window.location.pathname.split("/")
		const playgroundIndex = pathParts.indexOf("content-generation")
		if (playgroundIndex !== -1 && pathParts[playgroundIndex + 1]) {
			return pathParts[playgroundIndex + 1]
		}
	} catch (error) {
		console.error("Error getting source ID:", error)
	}
	return null
}

const getEncodedUserId = (source_id: string) => {
	const userId = getUserId()

	// Combine email and source_id with a separator
	const combinedId = source_id ? `${userId}_${source_id}` : userId
	return encodeURIComponent(combinedId)
}

export const getUserChats = async (source_id: string): Promise<UserChats> => {
	const encodedUserId = getEncodedUserId(source_id)
	const response = await api.get<UserChats>(`/api/chats/${encodedUserId}`)

	return response.data
}

export const getConversation = async (thread_id: string, source_id: string): Promise<Conversation> => {
	const encodedUserId = getEncodedUserId(source_id)
	const response = await api.get<Conversation>(`/conversation/${encodedUserId}/${thread_id}`)

	return response.data
}

export const createChat = async (source_id: string): Promise<any> => {
	const payload = {
		title: "New Chat",
		conversation_type: "chat",
		first_message: "",
	}

	const encodedUserId = getEncodedUserId(source_id)
	const response = await api.post<any>(`/api/chats/${encodedUserId}`, payload)

	return response.data
}

export const deleteChat = async (thread_id: string, source_id: string) => {
	const encodedUserId = getEncodedUserId(source_id)
	const response = await api.delete(`/api/chats/${encodedUserId}/${thread_id}`)

	return response.status
}

export const renameChat = async (thread_id: string, new_name: string, source_id: string): Promise<UserChats> => {
	const encodedUserId = getEncodedUserId(source_id)
	const payload = { title: new_name }
	const response = await api.put<UserChats>(`/api/chats/${encodedUserId}/${thread_id}`, payload)

	return response.data
}

export const optimizePrompt = async (prompt: string): Promise<OptimisePromptResponse> => {
	const payload = { user_prompt: prompt }
	const response = await api.post<OptimisePromptResponse>(`/api/prompt/optimize`, payload)
	return response.data
}
