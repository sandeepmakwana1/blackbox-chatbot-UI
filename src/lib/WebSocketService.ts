export interface WebSocketConfig<T> {
	url: string
	userId: string
	threadId?: string
	onMessage: (response: T) => void
	onError?: (error: Error) => void
	onConnect?: () => void
	onDisconnect?: () => void
}

export class WebSocketService<T> {
	private ws: WebSocket | null = null
	private config: WebSocketConfig<T>
	private reconnectAttempts = 0
	private maxReconnectAttempts = 5
	private reconnectDelay = 1000
	private isIntentionallyClosed = false

	constructor(config: WebSocketConfig<T>) {
		this.config = config
	}

	connect(): void {
		try {
			this.isIntentionallyClosed = false

			let baseUrl = this.config.url
			if (baseUrl.endsWith("/")) {
				baseUrl = baseUrl.slice(0, -1)
			}

			const encodedUserId = encodeURIComponent(this.config.userId)
			let wsUrl = `${baseUrl}/${encodedUserId}`

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
	}

	private handleMessage(event: MessageEvent): void {
		try {
			const response: T = JSON.parse(event.data)
			this.config.onMessage(response)
		} catch (error) {
			console.error("[WebSocket] Failed to parse message:", error, event.data)
			this.config.onError?.(new Error("Failed to parse message"))
		}
	}

	private handleError(event: Event): void {
		console.error("[WebSocket] Error occurred:", event)
		if (this.ws) {
			console.error("[WebSocket] Ready state:", this.ws.readyState)
			console.error("[WebSocket] URL:", this.ws.url)
		}
		this.config.onError?.(new Error("WebSocket connection error"))
	}

	private handleClose(event: CloseEvent): void {
		this.config.onDisconnect?.()

		if (event.code === 1006) {
			console.error("[WebSocket] Abnormal closure detected.")
		}

		if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnect()
		}
	}

	private reconnect(): void {
		this.reconnectAttempts++
		const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
		setTimeout(() => this.connect(), delay)
	}

	disconnect(): void {
		this.isIntentionallyClosed = true

		if (this.ws) {
			this.ws.onopen = null
			this.ws.onmessage = null
			this.ws.onerror = null
			this.ws.onclose = null

			if (this.ws.readyState === WebSocket.OPEN) {
				this.ws.close(1000, "User initiated disconnect")
			} else if (this.ws.readyState === WebSocket.CONNECTING) {
				const wsToClose = this.ws
				wsToClose.addEventListener("open", () => {
					wsToClose.close(1000, "User initiated disconnect")
				})
			}
			this.ws = null
		}
		this.reconnectAttempts = 0
	}

	isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN
	}

	resetReconnectAttempts(): void {
		this.reconnectAttempts = 0
	}

	updateConfig(config: Partial<WebSocketConfig<T>>): void {
		this.config = { ...this.config, ...config }
	}
}
