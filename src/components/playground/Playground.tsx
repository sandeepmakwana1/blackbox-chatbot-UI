import { useState, useRef, useEffect, useCallback } from "react"
import {
	X,
	ArrowUp,
	Atom,
	Globe,
	Check,
	Paperclip,
	Telescope,
	MessageSquarePlus,
	RefreshCw,
	AlertCircle,
	History,
	ArrowUpRight,
	Maximize2,
	Minimize2,
	Sparkles,
	SparklesIcon,
	CircleStop,
} from "lucide-react"
import { usePlaygroundStore } from "~/store/playgroundStore"
import { Button } from "~/components/ui/button"
import { Loader } from "~/components/ui/loader"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { cn } from "~/lib/utils"
import { useParams, useLocation } from "react-router-dom"
import { playgroundIntegration } from "./PlaygroundIntegration"
import { Box, Copy, MessageText, SearchStatus } from "iconsax-reactjs"
import AssetsManager from "~/lib/AssetsManager"
import type { WebSocketMessageResponse, Chat, ContextType } from "~/components/playground/types/playground"
import { StyledMarkdown } from "~/components/playground/MarkdownComponentPlayground"
import TypingDots from "~/components/playground/TypingDots"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { optimizePrompt } from "~/components/playground/handlers/playgroundHandlers"
import { toast } from "sonner"
import IconWrapper from "../ui/iconWrapper"
import ContextSourcesDropdown from "./ContextSourcesDropdown"
import { GradientIcon } from "../ui/gradientIcon"
import { resolvePlaygroundUserEmail } from "~/store/playgroundConfigStore"

interface PlaygroundProps {
	className?: string
	onZindex?: boolean
	context?: "content-generation" | "presteps" | "validation" | "bulk"
}

interface AttachedFile {
	id: string
	name: string
	type: "pdf" | "txt" | "doc" | "docx"
	file: File
}

// Define the dropdown options
const dropdownOptions = [
	{ id: "web-search", label: "Web search", icon: Globe },
	{ id: "deep-research", label: "Deep research", icon: Telescope },
]

// File type display mapping
const fileTypeDisplay: Record<AttachedFile["type"], string> = {
	pdf: "PDF",
	txt: "TXT",
	doc: "DOC",
	docx: "DOCX",
}

export const Playground: React.FC<PlaygroundProps> = ({ className, onZindex = false, context = "" }) => {
	const {
		isOpen,
		messages,
		isTyping,
		currentThreadId,
		pastChats,
		isConnected,
		isLoadingChats,
		isLoadingConversation,
		connectionError,
		chatType,
		streamingMessageId,
		togglePlayground,
		closePlayground,
		addMessage,
		updateMessage,
		clearMessages,
		setIsTyping,
		setCurrentThreadId,
		setPastChats,
		setIsConnected,
		setConnectionError,
		setChatType,
		setIsLoadingChats,
		setIsLoadingConversation,
		setStreamingMessageId,
		loadConversation,
		resetChat,
		removeMessage,
	} = usePlaygroundStore()

	const { source_id } = useParams<{ source_id: string }>()
	const location = useLocation()
	const [input, setInput] = useState("")
	const [selectedOption, setSelectedOption] = useState<string | null>(null)
	const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
	const [showChatHistory, setShowChatHistory] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLTextAreaElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const streamingMessageIdRef = useRef<string | null>(null)
	const [isExpanded, setIsExpanded] = useState(false)
	const [isCopied, setIsCopied] = useState(false)
	const [isOptimizing, setIsOptimizing] = useState(false)
	const [isCancelling, setIsCancelling] = useState(false)
	const [documentContext, setDocumentContext] = useState<ContextType[]>([])
	const [proposalDocsEnabled, setProposalDocsEnabled] = useState(false)
	const [currentPageEnabled, setCurrentPageEnabled] = useState(false)

	// Get user ID from localStorage
	const getUserId = useCallback(() => {
		const configuredUser = resolvePlaygroundUserEmail()
		if (configuredUser) {
			return source_id ? `${configuredUser}_${source_id}` : configuredUser
		}

		try {
			const localStore = JSON.parse(localStorage.getItem("local-store") || "{}")
			const userId = localStore.state?.user?.email || "random_user"
			// Combine with source_id if available
			return source_id ? `${userId}_${source_id}` : userId
		} catch {
			return "random_user"
		}
	}, [source_id])

	// Load past chats when playground opens
	useEffect(() => {
		if (!source_id) {
			closePlayground()
		} else {
			if (isOpen) {
				resetChat()
				loadPastChats()
			}
		}
	}, [isOpen, source_id])

	// Handle WebSocket connection separately to avoid dependency issues
	useEffect(() => {
		// Only manage WebSocket if playground is open and we have a thread with messages
		if (!isOpen || !currentThreadId || messages.length === 0) {
			return
		}

		// Check if already connected
		if (playgroundIntegration.isConnected()) {
			return
		}

		// Connect WebSocket for existing conversation
		const userId = getUserId()
		playgroundIntegration.initializeWebSocket(
			userId,
			currentThreadId,
			handleWebSocketMessage,
			() => {
				setIsConnected(true)
				setConnectionError(null)
			},
			() => {
				setIsConnected(false)
				setConnectionError("Connection lost. Please retry.")
			},
			(error) => {
				console.error("[Playground] WebSocket error:", error)
				setIsConnected(false)
				setConnectionError(error.message)
			}
		)

		// No cleanup here - we handle disconnection when playground closes
	}, [isOpen, currentThreadId, messages.length])

	// Clean up WebSocket when playground closes
	useEffect(() => {
		if (!isOpen) {
			playgroundIntegration.disconnect()
			setIsConnected(false)
		}
	}, [isOpen])

	// Clean up WebSocket on route change
	useEffect(() => {
		return () => {
			// Disconnect WebSocket when navigating away from the page
			if (playgroundIntegration.isConnected()) {
				playgroundIntegration.disconnect()
				setIsConnected(false)
			}
		}
	}, [location.pathname])

	// Handle WebSocket messages
	const handleWebSocketMessage = useCallback(
		(response: WebSocketMessageResponse) => {
			if (response.type === "start") {
				// Add message and get the last message ID from the store
				addMessage({
					role: "assistant",
					content: "",
					isStreaming: true,
				})

				// Get the ID of the message we just added (last message in the array)
				setTimeout(() => {
					const { messages } = usePlaygroundStore.getState()
					if (messages.length > 0) {
						const lastMessage = messages[messages.length - 1]
						streamingMessageIdRef.current = lastMessage.id
						setStreamingMessageId(lastMessage.id)
					}
				}, 0)

				setIsTyping(true)
			} else if (response.type === "chunk") {
				// Update the streaming message with chunks
				if (streamingMessageIdRef.current) {
					updateMessage(streamingMessageIdRef.current, response.content || "")
				} else {
					// If no streaming message exists, create one
					addMessage({
						role: "assistant",
						content: response.content || "",
						isStreaming: true,
					})

					// Get the ID of the message we just added
					setTimeout(() => {
						const { messages } = usePlaygroundStore.getState()
						if (messages.length > 0) {
							const lastMessage = messages[messages.length - 1]
							streamingMessageIdRef.current = lastMessage.id
							setStreamingMessageId(lastMessage.id)
						}
					}, 0)

					setIsTyping(true)
				}
			} else if (response.type === "interrupted") {
				// Handle interrupted state - preserve accumulated chunks and show interrupted message
				if (streamingMessageIdRef.current) {
					// If we have accumulated content from chunks, show it first
					if (response.accumulatedContent) {
						// Update the existing streaming message with the accumulated content
						updateMessage(streamingMessageIdRef.current, response.accumulatedContent)
					}

					// Add the interrupted message as a new message
					if (response.content) {
						addMessage({
							role: "assistant",
							content: response.content,
							isStreaming: false,
						})
					}
				} else {
					// If no streaming message exists but we have accumulated content, show it
					if (response.accumulatedContent) {
						addMessage({
							role: "assistant",
							content: response.accumulatedContent,
							isStreaming: false,
						})
					}

					// Add the interrupted message
					if (response.content) {
						addMessage({
							role: "assistant",
							content: response.content,
							isStreaming: false,
						})
					}
				}

				// Stop typing animation as we're waiting for user response
				setIsTyping(false)
				setStreamingMessageId(null)
				streamingMessageIdRef.current = null
			} else if (response.type === "research_initiated") {
				// Clean up any empty streaming messages from 'start' event
				const { removeTypingIndicator } = usePlaygroundStore.getState()
				removeTypingIndicator()

				// Clear streaming state
				setStreamingMessageId(null)
				streamingMessageIdRef.current = null

				// Show research initiated message
				if (response.content) {
					addMessage({
						role: "assistant",
						content: response.content,
						isStreaming: false,
					})
				}
				// Add a typing indicator message to show research is in progress
				addMessage({
					role: "assistant",
					content: "",
					isStreaming: true,
					isTypingIndicator: true, // Special flag for typing indicator
				})
				setIsTyping(false) // Don't use global typing state
			} else if (response.type === "webhook_result") {
				// Remove typing indicator message first
				const { messages: currentMessages, removeTypingIndicator } = usePlaygroundStore.getState()
				removeTypingIndicator()

				// Final research result
				if (response.content) {
					addMessage({
						role: "assistant",
						content: response.content,
						isStreaming: false,
					})
				}

				// Stop typing animation as research is complete
				setIsTyping(false)
				setStreamingMessageId(null)
				streamingMessageIdRef.current = null

				// Refresh past chats
				if (response.thread_id) {
					loadPastChats()
				}
			} else if (response.type === "complete") {
				// Finalize the message
				if (streamingMessageIdRef.current) {
					updateMessage(streamingMessageIdRef.current, response.content || "")
				} else {
					// If no streaming message exists, add the complete message
					addMessage({
						role: "assistant",
						content: response.content || "",
						isStreaming: false,
					})
				}

				// Update thread ID if provided
				if (response.thread_id && response.thread_id !== currentThreadId) {
					setCurrentThreadId(response.thread_id)
				}

				setIsTyping(false)
				setStreamingMessageId(null)
				streamingMessageIdRef.current = null

				// Refresh past chats after completing a message
				if (response.thread_id) {
					loadPastChats()
				}
			}
		},
		[addMessage, updateMessage, setStreamingMessageId, setIsTyping, currentThreadId, setCurrentThreadId]
	)

	// Load past chats
	const loadPastChats = async () => {
		try {
			setIsLoadingChats(true)
			const chats = await playgroundIntegration.fetchUserChats(source_id)
			setPastChats(chats)
		} catch (error) {
			console.error("Failed to load past chats:", error)
		} finally {
			setIsLoadingChats(false)
		}
	}

	// Load conversation for a specific thread
	const loadConversationForThread = async (threadId: string) => {
		try {
			setIsLoadingConversation(true)

			setStreamingMessageId(null)
			streamingMessageIdRef.current = null
			setIsTyping(false)

			// Set thread ID first
			setCurrentThreadId(threadId)

			// Reconnect WebSocket with new thread ID
			const userId = getUserId()
			if (playgroundIntegration.isConnected()) {
				playgroundIntegration.reconnectWebSocket(threadId)
			} else {
				// If not connected, initialize with thread ID
				playgroundIntegration.initializeWebSocket(
					userId,
					threadId,
					handleWebSocketMessage,
					() => {
						setIsConnected(true)
						setConnectionError(null)
					},
					() => {
						setIsConnected(false)
						setConnectionError("Connection lost. Please retry.")
					},
					(error) => {
						console.error("[Playground] WebSocket error:", error)
						setIsConnected(false)
						setConnectionError(error.message)
					}
				)
			}

			const messages = await playgroundIntegration.fetchConversation(threadId, source_id)

			// Only load conversation if there are messages
			if (messages && messages.length > 0) {
				loadConversation(messages)
				setShowChatHistory(false)
			} else {
				// If no messages, just clear any existing messages
				resetChat() // Clear any existing messages
				setShowChatHistory(false)
			}
		} catch (error) {
			console.error("Failed to load conversation:", error)
			// If failed to load, reset chat
			resetChat()
		} finally {
			setIsLoadingConversation(false)
		}
	}

	// Auto-scroll to bottom when new messages arrive (but don't fight user scroll on streaming updates)
	useEffect(() => {
		const messagesContainer = messagesEndRef.current?.parentElement
		if (messagesContainer && isOpen) {
			messagesContainer.scrollTop = 0
		}
	}, [messages.length, isOpen])

	const handleSendMessage = async () => {
		if (!input.trim()) return

		const userMessage = input.trim()
		setInput("")

		// Check if WebSocket is connected, reconnect if needed for existing chats
		if (currentThreadId && !playgroundIntegration.isConnected()) {
			const userId = getUserId()
			try {
				// Reconnect WebSocket with existing thread ID
				await new Promise<void>((resolve, reject) => {
					const timeout = setTimeout(() => {
						reject(new Error("WebSocket reconnection timeout"))
					}, 5000)

					playgroundIntegration.initializeWebSocket(
						userId,
						currentThreadId,
						handleWebSocketMessage,
						() => {
							clearTimeout(timeout)
							setIsConnected(true)
							setConnectionError(null)
							resolve()
						},
						() => {
							setIsConnected(false)
							setConnectionError("Connection lost. Please retry.")
						},
						(error) => {
							clearTimeout(timeout)
							console.error("[Playground] WebSocket reconnection error:", error)
							setIsConnected(false)
							setConnectionError(error.message)
							reject(error)
						}
					)
				})
			} catch (error) {
				console.error("Failed to reconnect WebSocket:", error)
				addMessage({
					role: "assistant",
					content: "Failed to reconnect. Please try again.",
				})
				return
			}
		}

		// Create new chat if no thread ID exists
		let threadId = currentThreadId
		if (!threadId) {
			try {
				const newChat = await playgroundIntegration.createNewChat(source_id)
				threadId = newChat.thread_id
				setCurrentThreadId(threadId)

				// Connect WebSocket with the new thread ID and wait for connection
				const userId = getUserId()

				// Create a promise to wait for connection
				await new Promise<void>((resolve, reject) => {
					const timeout = setTimeout(() => {
						reject(new Error("WebSocket connection timeout"))
					}, 5000) // 5 second timeout

					playgroundIntegration.initializeWebSocket(
						userId,
						threadId,
						handleWebSocketMessage,
						() => {
							clearTimeout(timeout)
							setIsConnected(true)
							setConnectionError(null)
							resolve()
						},
						() => {
							setIsConnected(false)
							setConnectionError("Connection lost. Please retry.")
						},
						(error) => {
							clearTimeout(timeout)
							console.error("[Playground] WebSocket error:", error)
							setIsConnected(false)
							setConnectionError(error.message)
							reject(error)
						}
					)
				})
			} catch (error) {
				console.error("Failed to create new chat or connect:", error)
				addMessage({
					role: "assistant",
					content: "Failed to create a new chat. Please try again.",
				})
				return
			}
		}

		// Add user message
		addMessage({
			role: "user",
			content: userMessage,
		})

		// Send message through WebSocket
		setIsTyping(true)

		try {
			if (selectedOption === "deep-research") {
				// Deep research - no tool, contexts from ContextSourcesDropdown
				playgroundIntegration.sendMessage(
					threadId,
					userMessage,
					"deep-research",
					undefined,
					documentContext.length > 0 ? documentContext : undefined
				)
			} else if (selectedOption === "web-search") {
				// Web search - type is chat with web tool
				playgroundIntegration.sendMessage(
					threadId,
					userMessage,
					"chat",
					"web",
					documentContext.length > 0 ? documentContext : undefined
				)
			} else {
				// Default chat - no tool, contexts from ContextSourcesDropdown
				playgroundIntegration.sendMessage(
					threadId,
					userMessage,
					"chat",
					undefined,
					documentContext.length > 0 ? documentContext : undefined
				)
			}
		} catch (error) {
			console.error("Error sending message:", error)
			setIsTyping(false)
			addMessage({
				role: "assistant",
				content: "Failed to send message. Please check your connection and try again.",
			})
		}
	}

	const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleSendMessage()
		}
	}

	const handleOptionSelect = (optionId: string) => {
		setSelectedOption(selectedOption === optionId ? null : optionId)
	}

	const handleFileAttachment = () => {
		fileInputRef.current?.click()
	}

	const handleNewChat = async () => {
		// Clear any streaming state
		setStreamingMessageId(null)
		streamingMessageIdRef.current = null
		setIsTyping(false)

		// Reset to empty state
		resetChat()
		setCurrentThreadId(null)
		setSelectedOption(null)
		setAttachedFiles([])
		setShowChatHistory(false)
		setDocumentContext([])
		setProposalDocsEnabled(false)
		setCurrentPageEnabled(false)

		// Disconnect WebSocket since we don't have a thread ID yet
		if (playgroundIntegration.isConnected()) {
			playgroundIntegration.disconnect()
			setIsConnected(false)
		}

		// Note: We don't create a new chat immediately
		// It will be created when the user sends the first message
		// This avoids the error and creates a cleaner flow
	}

	const handleCancelRequest = useCallback(() => {
		if (isCancelling || (!isTyping && !streamingMessageIdRef.current)) return

		setIsCancelling(true)

		try {
			playgroundIntegration.cancelOngoingRequest()
		} catch (error) {
			console.error("Failed to cancel playground request:", error)
		}

		const { removeTypingIndicator, messages: currentMessages } = usePlaygroundStore.getState()
		removeTypingIndicator()

		// If we were streaming, either annotate or remove the partial message
		if (streamingMessageIdRef.current) {
			const streamingId = streamingMessageIdRef.current
			const streamingMessage = currentMessages.find((msg) => msg.id === streamingId)

			if (streamingMessage) {
				if (streamingMessage.content) {
					updateMessage(streamingId, `${streamingMessage.content}\n\n_Request cancelled by user._`)
				} else {
					removeMessage(streamingId)
				}
			}
		}

		// Reset streaming/typing state
		streamingMessageIdRef.current = null
		setStreamingMessageId(null)
		setIsTyping(false)
		setConnectionError(null)
		setIsConnected(false)

		// Ensure any delayed disconnect callbacks don't leave an error banner behind
		setTimeout(() => setConnectionError(null), 300)

		setTimeout(() => setIsCancelling(false), 250)
	}, [isCancelling, isTyping, removeMessage, setConnectionError, setIsConnected, setIsTyping, setStreamingMessageId, updateMessage])

	const handleRetryConnection = () => {
		playgroundIntegration.retryConnection()
	}

	const handleHistory = () => {
		// Toggle chat history dropdown
		setShowChatHistory(!showChatHistory)
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])

		files.forEach((file) => {
			// Get file extension
			const extension = file.name.split(".").pop()?.toLowerCase()

			// Check if file type is allowed
			if (!extension || !["pdf", "txt", "doc", "docx"].includes(extension)) {
				console.warn(`File type ${extension} is not supported`)
				return
			}

			const fileType = extension === "docx" ? "docx" : (extension as AttachedFile["type"])

			const attachedFile: AttachedFile = {
				id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				name: file.name,
				type: fileType,
				file,
			}

			setAttachedFiles((prev) => [...prev, attachedFile])
		})

		// Reset file input
		if (fileInputRef.current) {
			fileInputRef.current.value = ""
		}
	}

	const removeFile = (fileId: string) => {
		setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId))
	}

	const userPicture = JSON.parse(localStorage.getItem("user") || "{}").picture || null

	// Get the selected option details
	const selectedOptionDetails = dropdownOptions.find((option) => option.id === selectedOption)

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.style.height = "auto"
			inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
		}
	}, [input])

	const handleOptimizePrompt = async () => {
		if (!input.trim() || isOptimizing) return

		setIsOptimizing(true)
		try {
			const response = await optimizePrompt(input.trim())
			if (response.status === "success") {
				setInput(response.result)
			}
		} catch (error) {
			toast.error("Failed to optimize prompt. Please try again.")
		} finally {
			setIsOptimizing(false)
		}
	}

	const InputContainer = useCallback(
		() => (
			<div className="px-2.5 py-2">
				<div
					className={cn(
						"flex flex-col px-2.5 py-2 rounded-[10px] border-[1px] border-neutral-400 magical-container",
						isOptimizing && "optimizing"
					)}
					style={{ boxShadow: "0 2px 6px 0 #F0F3F8" }}
				>
					{/* Attached Files Display */}
					{/* {attachedFiles.length > 0 && (
						<div className="flex gap-1 rounded-md mb-3 overflow-x-auto custom-scrollbar">
							{attachedFiles.map((file) => (
								<div
									key={file.id}
									className="group relative flex-shrink-0 rounded-[4px] transition-colors"
								>
									<div className="flex gap-1 items-center bg-[rgba(246,247,249,1)] p-1 rounded-[4px]">
										<div className="text-xxs uppercase p-2 bg-neutral-400 text-neutral-700 rounded-[4px]">
											{fileTypeDisplay[file.type]}
										</div>
										<div className="text-neutral-800 text-xxs leading-tight">
											{truncateText(file.name, 18)}
										</div>
									</div>
									<button
										onClick={() => removeFile(file.id)}
										className="absolute -top-0 -right-1 w-4 h-4 bg-neutral-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<X size={8} />
									</button>
								</div>
							))}
						</div>
					)} */}

					<textarea
						ref={inputRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder="Ask me anything..."
						className="placeholder-text-neutral-600 text-xs font-normal text-neutral-900 pb-3 w-full resize-none outline-none border-none bg-transparent overflow-y-auto custom-scrollbar"
						style={{
							minHeight: "32px",
							maxHeight: "234px",
						}}
						rows={2}
						disabled={isOptimizing}
					/>

					<div className="flex justify-between">
						<div className="flex gap-1 items-center">
							{/* Hidden file input */}
							{/* <input
								ref={fileInputRef}
								type="file"
								multiple
								accept=".pdf,.txt,.doc,.docx"
								onChange={handleFileChange}
								className="hidden"
							/> */}

							{/* Attachment button */}
							{/* <Button
								onClick={handleFileAttachment}
								size="icon-pg"
								variant="ghost"
								className="text-neutral-600 border border-neutral-300 hover:text-neutral-800 hover:bg-neutral-100 hover:border-neutral-500"
							>
								<Paperclip size={14} />
							</Button> */}

							{/* More button with dropdown */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										size="sm"
										variant="ghost"
										className={`p-1.75 ${
											selectedOptionDetails
												? "text-primary bg-primary-100 hover:bg-[#DBDFFC]"
												: "text-neutral-600 hover:text-neutral-800 hover:bg-neutral-200"
										}`}
									>
										{selectedOptionDetails ? (
											<selectedOptionDetails.icon size={16} className="text-primary" />
										) : (
											<IconWrapper strokeWidth={2} size={16}>
												<SearchStatus />
											</IconWrapper>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="start"
									className="w-48 bg-white border border-neutral-200 shadow-lg rounded-md"
								>
									{dropdownOptions.map((option) => {
										const IconComponent = option.icon
										const isSelected = selectedOption === option.id

										return (
											<DropdownMenuItem
												key={option.id}
												onClick={() => handleOptionSelect(option.id)}
												className={cn(
													"relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none transition-colors",
													// Default state (not selected, not hovered)
													"bg-white text-neutral-700",
													// Hover states
													"hover:bg-neutral-200 hover:text-neutral-800",
													// Selected states
													isSelected && [
														"bg-white text-primary",
														"hover:bg-primary-100 hover:text-primary",
													]
												)}
											>
												<IconComponent size={14} />
												{option.label}
												{isSelected && <Check size={14} className="ml-auto text-primary" />}
											</DropdownMenuItem>
										)
									})}
					</DropdownMenuContent>
				</DropdownMenu>

					<ContextSourcesDropdown
						setDocumentContext={setDocumentContext}
						proposalDocsEnabled={proposalDocsEnabled}
						setProposalDocsEnabled={setProposalDocsEnabled}
						currentPageEnabled={currentPageEnabled}
						setCurrentPageEnabled={setCurrentPageEnabled}
					/>
				</div>

				<div className="flex gap-1">
					<Button
						onClick={handleOptimizePrompt}
						disabled={!input.trim() || isTyping || isOptimizing}
								size="icon-pg"
								variant="secondary"
								className="border-0 disabled:opacity-10 gradient-rotate-hover transition-all duration-300"
							>
								{isOptimizing ? (
									<Loader size="sm" variant="neutral" />
								) : (
									<GradientIcon
										mode="stroke"
										stops={[
											{ offset: "0%", color: "#F588DB" },
											{ offset: "100%", color: "#6061E2" },
										]}
										Icon={Sparkles}
										size={14}
									/>
								)}
							</Button>
							{isTyping || streamingMessageId ? (
								<Button
									onClick={handleCancelRequest}
									disabled={isCancelling}
									size="icon-pg"
									className="text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
									title="Cancel response"
								>
									{isCancelling ? <Loader size="sm" variant="neutral" /> : <CircleStop size={14} />}
								</Button>
							) : (
								<Button
									onClick={handleSendMessage}
									disabled={!input.trim()}
									size="icon-pg"
									className="text-white bg-neutral-900 disabled:bg-neutral-300 disabled:text-neutral-500"
								>
									<ArrowUp size={14} />
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		),
		[
			input,
			attachedFiles,
			selectedOption,
			selectedOptionDetails,
			handleSendMessage,
			handleKeyPress,
			handleFileAttachment,
			handleOptionSelect,
			removeFile,
			handleFileChange,
			handleOptimizePrompt,
			isOptimizing,
			isTyping,
			isCancelling,
			streamingMessageId,
			handleCancelRequest,
			documentContext,
		]
	)

	return (
		<div
			className={cn(
				"h-full flex flex-col bg-white border-l border-gray-200 transition-all duration-300 overflow-hidden",
				onZindex ? (isOpen ? "fixed right-0 top-0 w-90 z-40" : "hidden") : isOpen ? "w-90" : "w-0",
				isExpanded &&
					"fixed right-0 w-full h-full z-50 bg-black/50 flex items-baseline-last justify-center pr-2",
				className
			)}
		>
			{isOpen && (
				<div
					className={cn(
						"h-full flex flex-col bg-white transition-all duration-300",
						isExpanded && "rounded-xl max-w-3xl w-full max-h-[98vh] overflow-hidden"
					)}
					// style={isExpanded ? { boxShadow: "-2px 0 6px 0 #BCCCDB" } : {}}
				>
					{/* Header */}
					<div className="flex items-center justify-between px-2 py-1.5">
						<div className="flex items-center gap-1">
							<img
								src={AssetsManager.PLAYGROUND_HEADER_ICON}
								alt="Playground Header Icon"
								className="w-5 h-5"
							/>
							<div className="flex flex-col">
								<span className="text-neutral-900 text-xs font-medium">BlackBox AI Playground</span>
							</div>
						</div>

						<div className="flex items-center">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={handleNewChat}
										className=" text-neutral-600 hover:text-neutral-700 hover:bg-neutral-200"
									>
										<MessageSquarePlus size={14} />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>New Conversation</p>
								</TooltipContent>
							</Tooltip>

							{/* History Dropdown */}
							<DropdownMenu open={showChatHistory} onOpenChange={setShowChatHistory}>
								<Tooltip>
									<TooltipTrigger asChild>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												className=" text-neutral-600 hover:text-neutral-700 hover:bg-neutral-200"
											>
												<History size={14} />
											</Button>
										</DropdownMenuTrigger>
									</TooltipTrigger>
									<TooltipContent>
										<p>Past conversations</p>
									</TooltipContent>
								</Tooltip>
								<DropdownMenuContent
									align="end"
									className="w-75 max-h-96 overflow-y-auto bg-white border border-neutral-300 shadow-lg rounded-md p-0 custom-scrollbar"
								>
									{isLoadingChats ? (
										<div className="flex items-center justify-center py-4">
											<Loader size="sm" variant="neutral" />
										</div>
									) : pastChats.length > 0 ? (
										<>
											<div className="px-2.5 py-1.5 text-xs font-semibold text-neutral-700 border-b border-neutral-300">
												Past conversations
											</div>
											<div className="p-1.5">
												{pastChats.map((chat) => (
													<DropdownMenuItem
														key={chat.thread_id}
														onClick={() => {
															loadConversationForThread(chat.thread_id)
															setShowChatHistory(false)
														}}
														disabled={isLoadingConversation}
														className="flex items-center justify-between p-1.5 hover:bg-neutral-200 cursor-pointer rounded group"
													>
														<div className="text-xs font-medium text-neutral-800 truncate">
															{chat.title || "Untitled Chat"}
														</div>
														<ArrowUpRight
															size={14}
															className="text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 "
														/>
													</DropdownMenuItem>
												))}
											</div>
										</>
									) : (
										<div className="px-2 py-4 text-xs text-gray-500 text-center">
											No chat history available
										</div>
									)}
								</DropdownMenuContent>
							</DropdownMenu>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => setIsExpanded(!isExpanded)}
										className=" text-neutral-600 hover:text-neutral-700 hover:bg-neutral-200"
									>
										{isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>{isExpanded ? "Minimize" : "Expand"}</p>
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => {
											setIsExpanded(false)
											closePlayground()
										}}
										className=" text-neutral-600 hover:text-neutral-700 hover:bg-neutral-200"
									>
										<X size={14} />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Close</p>
								</TooltipContent>
							</Tooltip>
						</div>
					</div>

					{/* Connection Status Banner - Only show when we have messages (active chat) */}
				{messages.length > 0 && !isConnected && connectionError && !isCancelling && (
						<div className="bg-red-50 border-b border-red-200 px-3 py-2">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<AlertCircle size={14} className="text-red-600" />
									<span className="text-xs text-red-700">{connectionError}</span>
								</div>
								<Button
									size="icon-sm"
									variant="ghost"
									onClick={handleRetryConnection}
									className="text-red-600 hover:text-red-700"
								>
									<RefreshCw size={12} />
								</Button>
							</div>
						</div>
					)}

					{/* Messages Container */}
					<div className="flex-1 flex flex-col-reverse overflow-y-auto custom-scrollbar ">
						{messages.length === 0 && (
							<div
								className="flex flex-col items-center justify-center h-full text-gray-500 bg-[linear-gradient(180deg,rgba(252,253,254,1)_0%,rgba(243,234,251,0.05)_50%,rgba(229,234,251,1)_100%)]
"
							>
								<div className="flex flex-col items-center gap-2">
									<img
										src={AssetsManager.PLAYGROUND_HEADER_ICON}
										alt="Playground Header Icon"
										className="w-9 h-9"
									/>
									<p className="text-center text-15 font-semibold bg-gradient-to-r from-[#5151D0] to-[#D4358F] bg-clip-text text-transparent">
										How can I help you today?
									</p>
								</div>

								{/* Input Container - Placed here when no messages */}
								<div className="w-full max-w-lg mt-6">{InputContainer()}</div>

								{/* Past Conversations Section - Show only first 4 */}
								{pastChats.length > 0 && (
									<div className="mt-6 w-full max-w-sm px-2">
										<p className="text-xxs text-neutral-700">Recent conversations</p>
										<div className="grid grid-cols-2 gap-1.5 mt-1">
											{pastChats.slice(0, 4).map((chat) => (
												<button
													key={chat.thread_id}
													onClick={() => loadConversationForThread(chat.thread_id)}
													disabled={isLoadingConversation}
													className="w-full text-left rounded-md bg-white border border-[#EFEEF7] transition-colors disabled:opacity-50 group"
												>
													<div className="flex flex-col gap-2.5 p-2.5 text-left hover:text-primary">
														<div className="flex items-center justify-between">
															<MessageText variant="Bold" size={16} />
															<ArrowUpRight
																size={14}
																strokeWidth={2}
																className="text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200"
															/>
														</div>

														<div className="text-xs text-neutral-800 truncate">
															{chat.title || "Untitled Chat"}
														</div>
													</div>
												</button>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						{messages
							.slice()
							.reverse()
							.map((message) => (
								<div key={message.id}>
									{message.role === "assistant" ? (
										<div className="flex flex-col gap-1 items-start pr-2 pl-3 py-3 w-full">
											<div className={cn("flex gap-2 w-full")}>
												<div className="flex-shrink-0 pt-0.5">
													<img
														src={AssetsManager.ASSISTANT_ICON}
														alt="Assistant Icon"
														className="w-3.5 h-3.5"
													/>
												</div>

												<div className="flex-1 w-[90%]">
													{/* Use StyledMarkdown for assistant messages */}
													{(message.isStreaming && !message.content) ||
													message.isTypingIndicator ? (
														// Show typing dots for streaming messages without content or typing indicators
														<div className="text-xs font-normal text-neutral-800">
															<TypingDots />
														</div>
													) : (
														<StyledMarkdown className="markdown-content overflow-x-hidden">
															{message.content || ""}
														</StyledMarkdown>
													)}
													{message.metadata && (
														<div className="mt-2 pt-2 border-t border-gray-200">
															<p className="text-xs text-gray-500">
																{message.metadata.action && (
																	<span>Action: {message.metadata.action}</span>
																)}
																{message.metadata.sectionNumber && (
																	<span className="ml-2">
																		Section: {message.metadata.sectionNumber}
																	</span>
																)}
															</p>
														</div>
													)}
												</div>
											</div>

											<Button
												variant="ghost"
												size="icon-pg"
												onClick={async () => {
													await navigator.clipboard.writeText(message.content)
													setIsCopied(true)
													setTimeout(() => setIsCopied(false), 1000)
												}}
												className="ml-4 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-400 shrink-0"
											>
												{isCopied ? <Check size={14} /> : <Copy size={14} />}
											</Button>
										</div>
									) : (
										<div className={cn("flex gap-2 pr-2 pl-3 py-3 w-full", "bg-[#F3F4FC]")}>
											<div className="w-5.5 h-5.5 shrink-0 rounded-full overflow-hidden">
												<img
													src={userPicture}
													alt="User"
													crossOrigin="anonymous"
													referrerPolicy="no-referrer"
													className="w-full h-full object-cover"
												/>
											</div>

											<div className="flex-1">
												<div className="text-xs font-medium whitespace-pre-wrap break-words text-neutral-900">
													{message.content}
												</div>
											</div>
										</div>
									)}
								</div>
							))}

						<div ref={messagesEndRef} />
					</div>

					{/* Input Container - Only show at bottom when there are messages */}
					{messages.length > 0 && InputContainer()}
				</div>
			)}
		</div>
	)
}
