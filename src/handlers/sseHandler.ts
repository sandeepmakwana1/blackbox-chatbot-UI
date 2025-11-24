import { toast } from "sonner"
import { handleTokenRefresh } from "~/handlers/axios"

interface SseMessage {
	status: "processing" | "completed" | "error"
	message?: string
	data?: any
}

export interface SseCallbacks {
	onProcessing?: (message: string) => void
	onCompleted?: (data: any) => void
	onError?: (error: string) => void
	onChunk?: (rawChunk: string) => void
}

const getToken = (): string | null => {
	return localStorage.getItem("token")
}

const API_URL = import.meta.env.VITE_API_URL || "https://blackboxai-dev.log1.com"

export const handleSseStream = async (
	endpoint: string,
	payload: Record<string, any>,
	callbacks: SseCallbacks,
	method: "POST" | "GET" = "POST",
	isRetry: boolean = false
): Promise<any> => {
	let token = getToken()

	try {
		if (!token && !isRetry) {
			try {
				token = await handleTokenRefresh()
			} catch (error) {
				const message = "Session expired. Please log in."
				callbacks.onError?.(message)
				throw new Error(message)
			}
		}

		const response = await fetch(`${API_URL}${endpoint}`, {
			method: method,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: method !== "GET" ? JSON.stringify(payload) : undefined,
		})

		if (response.status === 403 && !isRetry) {
			try {
				await handleTokenRefresh()
				return handleSseStream(endpoint, payload, callbacks, method, true)
			} catch (error) {
				const message = "Failed to refresh session."
				callbacks.onError?.(message)
				throw new Error(message)
			}
		}

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
		}

		const reader = response.body?.getReader()
		if (!reader) {
			throw new Error("Failed to get stream reader from the response.")
		}

		const decoder = new TextDecoder()
		let buffer = ""
		let finalData: any = null

		while (true) {
			const { done, value } = await reader.read()

			if (done) {
				if (finalData) {
					return finalData
				}
				throw new Error("Stream ended without a completion message.")
			}

			const chunk = decoder.decode(value, { stream: true })
			callbacks.onChunk?.(chunk)
			buffer += chunk

			const lines = buffer.split("\n")
			buffer = lines.pop() || ""

			for (const line of lines) {
				if (!line.trim()) continue

				try {
					const parsed: SseMessage = JSON.parse(line)

					if (parsed.status === "processing" && parsed.message) {
						callbacks.onProcessing?.(parsed.message)
					} else if (parsed.status === "completed" && parsed.data !== undefined) {
						finalData = parsed.data
						callbacks.onCompleted?.(finalData)
					} else if (parsed.status === "error" && parsed.message) {
						callbacks.onError?.(parsed.message)
						throw new Error(parsed.message)
					}
				} catch (err) {
					console.warn("Failed to parse an SSE line:", line, err)
				}
			}
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : "An unknown streaming error occurred"
		toast.error(message)
		callbacks.onError?.(message)
		throw error
	}
}
