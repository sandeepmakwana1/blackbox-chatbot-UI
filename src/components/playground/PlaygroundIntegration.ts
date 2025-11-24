import { WebSocketService } from "~/components/playground/services/WebSocketService"
import type {
	ContextType,
	WebSocketMessageRequest,
	WebSocketMessageResponse,
} from "~/components/playground/types/playground"
import { getUserChats, getConversation, createChat } from "~/components/playground/handlers/playgroundHandlers"
import { getWebSocketUrl } from "~/components/playground/handlers/axios"

export class PlaygroundIntegrationService {
	private static instance: PlaygroundIntegrationService
	private wsService: WebSocketService | null = null
	private WS_URL: string

	constructor() {
		// Use the properly configured WebSocket URL from axios config
		this.WS_URL = getWebSocketUrl()
	}

	static getInstance(): PlaygroundIntegrationService {
		if (!PlaygroundIntegrationService.instance) {
			PlaygroundIntegrationService.instance = new PlaygroundIntegrationService()
		}
		return PlaygroundIntegrationService.instance
	}

	// Initialize WebSocket connection
	initializeWebSocket(
		userId: string,
		threadId: string | null | undefined,
		onMessage: (response: WebSocketMessageResponse) => void,
		onConnect?: () => void,
		onDisconnect?: () => void,
		onError?: (error: Error) => void
	): void {
		// Keep WS URL fresh in case the user updated config
		this.WS_URL = getWebSocketUrl()

		// Always disconnect existing connection first
		if (this.wsService) {
			this.wsService.disconnect()
			this.wsService = null
		}

		this.wsService = new WebSocketService({
			url: this.WS_URL,
			userId,
			threadId: threadId || undefined,
			onMessage,
			onConnect,
			onDisconnect,
			onError,
		})

		this.wsService.connect()
	}

	// Send message through WebSocket
	sendMessage(
		threadId: string,
		message: string,
		type: "chat" | "deep-research" = "chat",
		tool?: "web",
		contexts?: ContextType[]
	): void {
		if (!this.wsService) {
			throw new Error("WebSocket not initialized")
		}

		const wsMessage: WebSocketMessageRequest = {
			thread_id: threadId,
			type,
			message,
			...(tool && { tool }),
			...(contexts && contexts.length > 0 && { contexts }),
		}

		this.wsService.sendMessage(wsMessage)
	}

	// Disconnect WebSocket
	disconnect(): void {
		if (this.wsService) {
			this.wsService.disconnect()
			this.wsService = null
		}
	}

	// Cancel the in-flight request/stream and close the socket
	cancelOngoingRequest(): void {
		if (this.wsService) {
			this.wsService.cancelOngoingRequest()
			this.wsService = null
		}
	}

	// Check if WebSocket is connected
	isConnected(): boolean {
		return this.wsService?.isConnected() || false
	}

	// Retry WebSocket connection
	retryConnection(): void {
		if (this.wsService) {
			this.WS_URL = getWebSocketUrl()
			this.wsService.updateConfig({ url: this.WS_URL })
			this.wsService.resetReconnectAttempts()
			this.wsService.connect()
		}
	}

	// Reconnect WebSocket with same configuration (useful for chat switching)
	reconnectWebSocket(threadId?: string | null): void {
		if (this.wsService) {
			this.WS_URL = getWebSocketUrl()
			this.wsService.updateConfig({ url: this.WS_URL })
			// Update thread ID if provided
			if (threadId !== undefined) {
				this.wsService.updateConfig({ threadId: threadId || undefined })
			}
			this.wsService.disconnect()
			setTimeout(() => {
				if (this.wsService) {
					this.wsService.connect()
				}
			}, 100) // Small delay to ensure clean disconnection
		}
	}

	// API methods
	async fetchUserChats(source_id: string) {
		try {
			const response = await getUserChats(source_id)
			if (response.status === "success" && response.chats) {
				// Ensure chats is always an array
				const chats = Array.isArray(response.chats) ? response.chats : [response.chats]
				return chats
			}
			return []
		} catch (error) {
			console.error("Failed to fetch user chats:", error)
			throw error
		}
	}

	async fetchConversation(threadId: string, source_id: string) {
		try {
			const response = await getConversation(threadId, source_id)
			return response.messages || []
		} catch (error) {
			console.error("Failed to fetch conversation:", error)
			throw error
		}
	}

	async createNewChat(source_id: string) {
		try {
			const response = await createChat(source_id)

			// Handle different response formats
			if (response) {
				// If response has chats field
				if (response.chats) {
					const chat = Array.isArray(response.chats) ? response.chats[0] : response.chats
					if (chat && chat.thread_id) {
						return chat
					}
				}

				// If response itself is the chat object
				if (response.thread_id) {
					return response as any
				}

				// If response has a chat field (singular)
				if ((response as any).chat && (response as any).chat.thread_id) {
					return (response as any).chat
				}
			}

			throw new Error("Invalid response format from create chat API")
		} catch (error) {
			console.error("Failed to create new chat:", error)
			console.error("Error details:", error)
			throw error
		}
	}
}

// Export singleton instance
export const playgroundIntegration = PlaygroundIntegrationService.getInstance()
