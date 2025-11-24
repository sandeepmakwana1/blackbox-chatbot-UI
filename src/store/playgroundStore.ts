import { create } from "zustand"
import type { Chat, Message as ApiMessage } from "~/components/playground/types/playground"

interface Message {
	id: string
	role: "user" | "assistant"
	content: string
	timestamp: Date
	isStreaming?: boolean
	isTypingIndicator?: boolean // Special flag for typing indicator messages
	metadata?: {
		action?: string
		sectionNumber?: string
		sectionName?: string
	}
}

interface PlaygroundState {
	isOpen: boolean
	messages: Message[]
	isTyping: boolean
	currentThreadId: string | null
	pastChats: Chat[]
	isConnected: boolean
	isLoadingChats: boolean
	isLoadingConversation: boolean
	connectionError: string | null
	chatType: "chat" | "web" | "deep-research" | "file"
	streamingMessageId: string | null

	// Actions
	togglePlayground: () => void
	openPlayground: () => void
	closePlayground: () => void
	addMessage: (message: Omit<Message, "id" | "timestamp">) => void
	updateMessage: (messageId: string, content: string) => void
	clearMessages: () => void
	setIsTyping: (isTyping: boolean) => void
	removeMessage: (messageId: string) => void
	setCurrentThreadId: (threadId: string | null) => void
	setPastChats: (chats: Chat[]) => void
	setIsConnected: (isConnected: boolean) => void
	setConnectionError: (error: string | null) => void
	setChatType: (type: "chat" | "web" | "deep-research" | "file") => void
	setIsLoadingChats: (isLoading: boolean) => void
	setIsLoadingConversation: (isLoading: boolean) => void
	setStreamingMessageId: (messageId: string | null) => void
	loadConversation: (messages: ApiMessage[]) => void
	resetChat: () => void
	removeTypingIndicator: () => void
}

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
	isOpen: false,
	messages: [],
	isTyping: false,
	currentThreadId: null,
	pastChats: [],
	isConnected: false,
	isLoadingChats: false,
	isLoadingConversation: false,
	connectionError: null,
	chatType: "chat",
	streamingMessageId: null,

	togglePlayground: () => set((state) => ({ isOpen: !state.isOpen })),

	openPlayground: () => set({ isOpen: true }),

	closePlayground: () =>
		set((state) => ({
			isOpen: false,
			// Preserve thread ID and messages when closing
			// This allows us to reconnect to the same conversation when reopening
		})),

	addMessage: (message) =>
		set((state) => ({
			messages: [
				...state.messages,
				{
					...message,
					id: `msg-${Date.now()}-${Math.random()}`,
					timestamp: new Date(),
				},
			],
		})),

	updateMessage: (messageId, content) =>
		set((state) => ({
			messages: state.messages.map((msg) => (msg.id === messageId ? { ...msg, content } : msg)),
		})),

	clearMessages: () => set({ messages: [] }),

	setIsTyping: (isTyping) => set({ isTyping }),

	removeMessage: (messageId) =>
		set((state) => ({
			messages: state.messages.filter((msg) => msg.id !== messageId),
		})),

	setCurrentThreadId: (threadId) => set({ currentThreadId: threadId }),

	setPastChats: (chats) => set({ pastChats: chats }),

	setIsConnected: (isConnected) => set({ isConnected, connectionError: isConnected ? null : "Connection lost" }),

	setConnectionError: (error) => set({ connectionError: error }),

	setChatType: (type) => set({ chatType: type }),

	setIsLoadingChats: (isLoading) => set({ isLoadingChats: isLoading }),

	setIsLoadingConversation: (isLoading) => set({ isLoadingConversation: isLoading }),

	setStreamingMessageId: (messageId) => set({ streamingMessageId: messageId }),

	loadConversation: (messages) => {
		const convertedMessages: Message[] = messages.map((msg) => ({
			id: `msg-${Date.now()}-${Math.random()}`,
			role: msg.role === "human" ? "user" : "assistant",
			content: msg.content,
			timestamp: new Date(),
		}))
		set({ messages: convertedMessages })
	},

	resetChat: () =>
		set({
			messages: [],
			currentThreadId: null,
			streamingMessageId: null,
			isTyping: false,
		}),

	removeTypingIndicator: () =>
		set((state) => ({
			// Remove both typing indicators and empty streaming messages
			messages: state.messages.filter((msg) => !msg.isTypingIndicator && !(msg.isStreaming && !msg.content)),
		})),
}))
