import { useEffect, useRef } from "react"
import type { BatchValidationSocketResponse } from "~/types/batch"

interface UseBatchValidationSocketProps {
	batchId: string | null
	onMessage: (data: BatchValidationSocketResponse) => void
	onError?: (error: Error) => void
	onConnect?: () => void
	onDisconnect?: () => void
}

export const useBatchValidationSocket = ({
	batchId,
	onMessage,
	onError,
	onConnect,
	onDisconnect,
}: UseBatchValidationSocketProps) => {
	const webSocketRef = useRef<WebSocket | null>(null)
	// Use refs to store the latest callbacks without causing re-connections
	const onMessageRef = useRef(onMessage)
	const onErrorRef = useRef(onError)
	const onConnectRef = useRef(onConnect)
	const onDisconnectRef = useRef(onDisconnect)

	// Update refs when callbacks change
	useEffect(() => {
		onMessageRef.current = onMessage
		onErrorRef.current = onError
		onConnectRef.current = onConnect
		onDisconnectRef.current = onDisconnect
	}, [onMessage, onError, onConnect, onDisconnect])

	useEffect(() => {
		// Only establish a connection if a valid batchId is provided.
		if (!batchId) {
			return
		}

		const url = `${import.meta.env.VITE_BATCH_WS_URL}?batch_id=${batchId}`
		const ws = new WebSocket(url)
		webSocketRef.current = ws

		ws.onopen = () => {
			console.log("[WebSocket] Connection established for batch:", batchId)
			onConnectRef.current?.()
		}

		ws.onmessage = (event: MessageEvent) => {
			try {
				const response: BatchValidationSocketResponse = JSON.parse(event.data)
				console.log("[WebSocket] Message received:", response)
				onMessageRef.current(response)
			} catch (error) {
				console.error("[WebSocket] Failed to parse message:", error, event.data)
				onErrorRef.current?.(new Error("Failed to parse message"))
			}
		}

		ws.onerror = (event: Event) => {
			console.error("[WebSocket] Error occurred:", event)
			onErrorRef.current?.(new Error("WebSocket connection error"))
		}

		ws.onclose = (event: CloseEvent) => {
			console.log("[WebSocket] Connection closed. Code:", event.code, "Reason:", event.reason)
			onDisconnectRef.current?.()
		}

		// Cleanup function to close the connection when the component unmounts or batchId changes.
		return () => {
			console.log("[WebSocket] Cleaning up connection for batch:", batchId)
			if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
				ws.close(1000, "Component unmounted or batchId changed")
			}
			webSocketRef.current = null
		}
	}, [batchId]) // Only depend on batchId

	return webSocketRef
}
