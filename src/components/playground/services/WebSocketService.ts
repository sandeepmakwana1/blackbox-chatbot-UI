import type { WebSocketMessageRequest, WebSocketMessageResponse } from "~/components/playground/types/playground"

export interface WebSocketConfig {
	url: string
	userId: string
	threadId?: string
	onMessage: (response: WebSocketMessageResponse) => void
	onError?: (error: Error) => void
	onConnect?: () => void
	onDisconnect?: () => void
}

export class WebSocketService {
	private ws: WebSocket | null = null
	private config: WebSocketConfig
	private reconnectAttempts = 0
	private maxReconnectAttempts = 5
	private reconnectDelay = 1000
	private isIntentionallyClosed = false
	private messageQueue: WebSocketMessageRequest[] = []
	private currentMessage = ""

	constructor(config: WebSocketConfig) {
		this.config = config
	}

	connect(): void {
		try {
			this.isIntentionallyClosed = false

			// Ensure proper URL format
			let baseUrl = this.config.url
			// Remove trailing slash if present
			if (baseUrl.endsWith("/")) {
				baseUrl = baseUrl.slice(0, -1)
			}

			// Encode user ID and thread ID properly
			const encodedUserId = encodeURIComponent(this.config.userId)
			let wsUrl = `${baseUrl}/${encodedUserId}`

			// Add thread ID to URL if provided
			if (this.config.threadId) {
				const encodedThreadId = encodeURIComponent(this.config.threadId)
				wsUrl = `${wsUrl}/${encodedThreadId}`
			}

			this.ws = new WebSocket(wsUrl)

			this.ws.onopen = this.handleOpen.bind(this)
			this.ws.onmessage = this.handleMessage.bind(this)
			this.ws.onerror = this.handleError.bind(this)
			this.ws.onclose = this.handleClose.bind(this)
		} catch (error) {
			console.error("[WebSocket] Failed to create connection:", error)
			this.config.onError?.(error as Error)
		}
	}

	private handleOpen(): void {
		this.reconnectAttempts = 0
		this.config.onConnect?.()

		// Process any queued messages
		while (this.messageQueue.length > 0) {
			const message = this.messageQueue.shift()
			if (message) {
				this.sendMessage(message)
			}
		}
	}

	private handleMessage(event: MessageEvent): void {
		try {
			const response: WebSocketMessageResponse = JSON.parse(event.data)

			// Handle streaming messages based on type
			if (response.type === "start") {
				// Reset current message for new stream
				this.currentMessage = ""
				this.config.onMessage(response)
			} else if (response.type === "chunk") {
				// Accumulate chunks
				this.currentMessage += response.content || ""
				// Send the accumulated message as a chunk
				this.config.onMessage({
					...response,
					type: "chunk",
					content: this.currentMessage,
				})
			} else if (response.type === "interrupted") {
				// Handle interrupted state - preserve accumulated content and pass it along
				// The interrupted content should be appended to what we already have
				const interruptedContent = response.content || "Waiting for your response to continue..."

				// Send the interrupted message with both accumulated and interrupted content
				this.config.onMessage({
					...response,
					type: "interrupted",
					content: interruptedContent,
					accumulatedContent: this.currentMessage, // Pass the accumulated content separately
				})

				// Don't reset currentMessage here, keep it for when conversation resumes
			} else if (response.type === "complete") {
				// Final message with complete content
				this.currentMessage = ""
				this.config.onMessage(response)
			} else {
				// Handle any other message types or direct messages
				this.config.onMessage(response)
			}
		} catch (error) {
			this.config.onError?.(new Error("Failed to parse message"))
		}
	}

	private handleError(event: Event): void {
		console.error("[WebSocket] Error occurred:", event)
		// Try to get more details about the error
		if (this.ws) {
			console.error("[WebSocket] Ready state:", this.ws.readyState)
			console.error("[WebSocket] URL:", this.ws.url)
		}
		this.config.onError?.(new Error("WebSocket connection error"))
	}

	private handleClose(event: CloseEvent): void {
		this.config.onDisconnect?.()

		// Code 1006 means abnormal closure
		if (event.code === 1006) {
			console.error("[WebSocket] Abnormal closure detected. This might be due to:")
		}

		if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnect()
		}
	}

	private reconnect(): void {
		this.reconnectAttempts++
		const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

		setTimeout(() => {
			this.connect()
		}, delay)
	}

	sendMessage(message: WebSocketMessageRequest): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			try {
				this.ws.send(JSON.stringify(message))
			} catch (error) {
				this.config.onError?.(error as Error)
			}
		} else {
			this.messageQueue.push(message)

			// Try to reconnect if not connected
			if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
				this.connect()
			}
		}
	}

	disconnect(): void {
		this.isIntentionallyClosed = true

		// Clear message queue and current message
		this.messageQueue = []
		this.currentMessage = ""

		// Remove event listeners before closing
		if (this.ws) {
			// Remove all event listeners to prevent memory leaks
			this.ws.onopen = null
			this.ws.onmessage = null
			this.ws.onerror = null
			this.ws.onclose = null

			// Only close if connection is open (not if it's still connecting)
			// This prevents the "WebSocket is closed before the connection is established" error
			if (this.ws.readyState === WebSocket.OPEN) {
				this.ws.close(1000, "User initiated disconnect")
			} else if (this.ws.readyState === WebSocket.CONNECTING) {
				// If still connecting, wait for connection then close
				const wsToClose = this.ws
				wsToClose.addEventListener("open", () => {
					wsToClose.close(1000, "User initiated disconnect")
				})
			}

			this.ws = null
		}

		// Reset reconnect attempts
		this.reconnectAttempts = 0
	}

	isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN
	}

	resetReconnectAttempts(): void {
		this.reconnectAttempts = 0
	}

	updateConfig(config: Partial<WebSocketConfig>): void {
		this.config = { ...this.config, ...config }
	}

	// Cancel the ongoing request/stream and intentionally close the socket
	cancelOngoingRequest(): void {
		// Clear any queued messages and buffered chunks
		this.messageQueue = []
		this.currentMessage = ""

		// Best-effort signal to the server that the client is cancelling
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			try {
				this.ws.send(JSON.stringify({ type: "cancel" }))
			} catch (error) {
				console.error("[WebSocket] Failed to send cancel message:", error)
			}
		}

		// Fully disconnect to stop receiving further chunks
		this.disconnect()
	}
}
