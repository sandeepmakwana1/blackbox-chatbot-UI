export type UserChats = {
	status: "success" | "failed"
	thread_id?: string
	chats?: Chat[] | Chat
}

export type Chat = {
	thread_id: string
	title: string
	created_at: string
	updated_at: string
	message_count: number
	last_message_preview: string
	conversation_type: "chat" | "web" | "deep-research" | "file" | "context-web" | "context-chat"
	user_id: string
}

export type Conversation = {
	conversation_type: "chat" | "web" | "deep-research" | "file" | "context-web" | "context-chat"
	messages?: Message[]
}

export type Message = {
	role: "human" | "assistant"
	content: string
}

export type ContextType =
	| "rfp_context"
	| "validation_legal"
	| "validation_technical"
	| "table_of_content"
	| "deep_research"
	| "user_preference"
	| "rfp_infrastructure"
	| "rfp_license"
	| "hourly_wages"
	| "content"

export type WebSocketMessageRequest = {
	thread_id: string
	type: "chat" | "deep-research"
	contexts?: ContextType[]
	tool?: "web"
	message: string
}

export type WebSocketMessageResponse = {
	done?: boolean
	thread_id?: string
	type: "complete" | "chunk" | "start" | "interrupted" | "research_initiated" | "webhook_result"
	content: string
	accumulatedContent?: string // Added for interrupted messages to preserve chunks
	token_tracking?: TokenTracking
}

export type TokenTracking = {
	total_tokens: number
	last_request_tokens: number
	current_tokens: number
	model: string
	breakdown: {
		main_response_tokens: number
		summarization_tokens: number
		main_model: string
		summary_model: string
	}
}

export type OptimisePromptResponse = {
	status: "success" | "failed"
	result: string
}
