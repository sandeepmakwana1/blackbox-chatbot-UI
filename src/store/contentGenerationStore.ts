import { create } from "zustand"
import type { Section, UnsavedChanges } from "~/types/contentGeneration"

export interface ContentGenerationState {
	successfulSections: Record<string, Record<string, boolean>>
	failedSections: Record<string, Record<string, boolean>>
	expandedSections: Record<string, Record<string, boolean>>
	content: Record<string, Section[]>
	generatingSections: Record<string, Record<string, boolean>>
	processingMessages: Record<string, Record<string, string>>
	isRegeneratingAll: boolean
	regenerateAllMessage: string
	scrollToSection: Record<string, string | null>
	activeSubSection: Record<string, string | null>
	isRegenPanelOpen: Record<string, boolean>

	markdownResponse: Record<string, string>
	getMarkdownResponse: (sourceId: string) => string
	setMarkdownResponse: (sourceId: string, response: string) => void

	isMarkdownLoading: Record<string, boolean>
	isMarkdownFetched: Record<string, boolean>
	isMarkdownLoadingSelector: (sourceId: string) => boolean
	isMarkdownFetchedSelector: (sourceId: string) => boolean
	setIsMarkdownLoading: (sourceId: string, loading: boolean) => void
	setIsMarkdownFetched: (sourceId: string, fetched: boolean) => void

	// Editing state
	isEditing: Record<string, Record<string, boolean>> // sourceId -> identifier -> isEditing
	unsavedChanges: Record<string, UnsavedChanges> // sourceId -> map of id-> change data
	editedSubsections: Record<string, Record<string, boolean>> // sourceId -> subSectionNumber -> edited

	setSuccessfulSection: (sourceId: string, sectionNumber: string, isSuccessful: boolean) => void
	setFailedSection: (sourceId: string, sectionNumber: string, hasFailed: boolean) => void
	setExpandedSection: (sourceId: string, sectionNumber: string, isExpanded: boolean) => void

	setContent: (sourceId: string, content: Section[]) => void
	mergeSections: (sourceId: string, newSections: Section[]) => void
	updateContent: (sourceId: string, updater: (prevContent: Section[]) => Section[]) => void
	addSectionContent: (sourceId: string, sectionData: Section | Section[]) => void
	updateSectionContent: (sourceId: string, sectionIndex: number, sectionData: Section) => void

	setGeneratingSection: (sourceId: string, sectionNumber: string, isGenerating: boolean) => void
	setProcessingMessage: (sourceId: string, sectionNumber: string, message: string) => void
	setIsRegeneratingAll: (isLoading: boolean) => void
	setRegenerateAllMessage: (message: string) => void
	setScrollToSection: (sourceId: string, sectionNumber: string | null) => void
	setActiveSubSection: (sourceId: string, subSectionNumber: string | null) => void
	setIsRegenPanelOpen: (sourceId: string, isOpen: boolean) => void

	// Editing actions
	startEditing: (
		sourceId: string,
		identifier: string,
		originalContent: string,
		isSection: boolean,
		sectionNumber: string,
		subSectionNumber?: string
	) => void
	updateDraft: (sourceId: string, identifier: string, newContent: string) => void
	saveEdit: (
		sourceId: string,
		identifier: string
	) => { contentToSave: string; isSection: boolean; sectionNumber: string; subSectionNumber?: string } | null
	discardEdit: (sourceId: string, identifier: string) => void
	stopEditing: (sourceId: string, identifier: string) => void

	resetSourceState: (sourceId: string) => void

	getSuccessfulSections: (sourceId: string) => Record<string, boolean>
	getFailedSections: (sourceId: string) => Record<string, boolean>
	getExpandedSections: (sourceId: string) => Record<string, boolean>
	getContent: (sourceId: string) => Section[]
	getGeneratingSections: (sourceId: string) => Record<string, boolean>
	getProcessingMessages: (sourceId: string) => Record<string, string>
	getScrollToSection: (sourceId: string) => string | null
	getActiveSubSection: (sourceId: string) => string | null
	getIsEditing: (sourceId: string, identifier: string) => boolean
	getUnsavedChanges: (sourceId: string) => UnsavedChanges
	getEditedSubsections: (sourceId: string) => Record<string, boolean>
	getIsRegenPanelOpen: (sourceId: string) => boolean
}

export const useContentGenerationStore = create<ContentGenerationState>((set, get) => ({
	successfulSections: {},
	failedSections: {},
	expandedSections: {},
	content: {},
	generatingSections: {},
	processingMessages: {},
	isRegeneratingAll: false,
	regenerateAllMessage: "",
	scrollToSection: {},
	activeSubSection: {},
	isEditing: {},
	unsavedChanges: {},
	editedSubsections: {},
	isRegenPanelOpen: {},
	markdownResponse: {},
	isMarkdownLoading: {},
	isMarkdownFetched: {},

	setSuccessfulSection: (sourceId: string, sectionNumber: string, isSuccessful: boolean) =>
		set((state) => ({
			successfulSections: {
				...state.successfulSections,
				[sourceId]: {
					...state.successfulSections[sourceId],
					[sectionNumber]: isSuccessful,
				},
			},
		})),

	setFailedSection: (sourceId: string, sectionNumber: string, hasFailed: boolean) =>
		set((state) => ({
			failedSections: {
				...state.failedSections,
				[sourceId]: {
					...state.failedSections[sourceId],
					[sectionNumber]: hasFailed,
				},
			},
		})),

	setExpandedSection: (sourceId: string, sectionNumber: string, isExpanded: boolean) =>
		set((state) => {
			const newExpandedForSource: Record<string, boolean> = {}
			// If a section is being expanded, set it as the only expanded section.
			// If it's being collapsed, the new state will be empty.
			if (isExpanded) {
				newExpandedForSource[sectionNumber] = true
			}
			return {
				expandedSections: {
					...state.expandedSections,
					[sourceId]: newExpandedForSource,
				},
			}
		}),

	setContent: (sourceId: string, content: Section[]) =>
		set((state) => ({
			content: {
				...state.content,
				[sourceId]: content,
			},
		})),

	mergeSections: (sourceId: string, newSections: Section[]) =>
		set((state) => {
			const existingContent = state.content[sourceId] || []
			const newSectionsMap = new Map(newSections.map((s) => [s.sectionName, s]))

			const updatedContent = existingContent.map((existingSection) => {
				const newSection = newSectionsMap.get(existingSection.sectionName || "")
				if (newSection) {
					// Replace content and subsections, keep other properties like expanded state
					return {
						...existingSection,
						content: newSection.content,
						subsections: newSection.subsections,
					}
				}
				return existingSection
			})

			return {
				content: {
					...state.content,
					[sourceId]: updatedContent,
				},
			}
		}),

	updateContent: (sourceId: string, updater: (prevContent: Section[]) => Section[]) =>
		set((state) => ({
			content: {
				...state.content,
				[sourceId]: updater(state.content[sourceId] || []),
			},
		})),

	addSectionContent: (sourceId: string, sectionData: Section | Section[]) =>
		set((state) => {
			const currentContent = state.content[sourceId] || []
			const sectionsToAdd = Array.isArray(sectionData) ? sectionData : [sectionData]

			return {
				content: {
					...state.content,
					[sourceId]: [...currentContent, ...sectionsToAdd],
				},
			}
		}),

	updateSectionContent: (sourceId: string, sectionIndex: number, sectionData: Section) =>
		set((state) => {
			const currentContent = [...(state.content[sourceId] || [])]
			if (sectionIndex >= 0 && sectionIndex < currentContent.length) {
				currentContent[sectionIndex] = sectionData
			}

			return {
				content: {
					...state.content,
					[sourceId]: currentContent,
				},
			}
		}),

	setGeneratingSection: (sourceId: string, sectionNumber: string, isGenerating: boolean) =>
		set((state) => ({
			generatingSections: {
				...state.generatingSections,
				[sourceId]: {
					...state.generatingSections[sourceId],
					[sectionNumber]: isGenerating,
				},
			},
		})),

	setProcessingMessage: (sourceId: string, sectionNumber: string, message: string) =>
		set((state) => ({
			processingMessages: {
				...state.processingMessages,
				[sourceId]: {
					...state.processingMessages[sourceId],
					[sectionNumber]: message,
				},
			},
		})),

	setIsRegeneratingAll: (isLoading: boolean) => set({ isRegeneratingAll: isLoading }),
	setRegenerateAllMessage: (message: string) => set({ regenerateAllMessage: message }),
	setScrollToSection: (sourceId: string, sectionNumber: string | null) =>
		set((state) => ({
			scrollToSection: {
				...state.scrollToSection,
				[sourceId]: sectionNumber,
			},
		})),

	setActiveSubSection: (sourceId: string, subSectionNumber: string | null) =>
		set((state) => ({
			activeSubSection: {
				...state.activeSubSection,
				[sourceId]: subSectionNumber,
			},
		})),

	startEditing: (
		sourceId: string,
		identifier: string,
		originalContent: string,
		isSection: boolean,
		sectionNumber: string,
		subSectionNumber?: string
	) =>
		set((state) => {
			const existing = state.unsavedChanges[sourceId]?.[identifier]
			const nextIsEditing = {
				...state.isEditing,
				[sourceId]: { ...(state.isEditing[sourceId] || {}), [identifier]: true },
			}

			if (existing) {
				return {
					isEditing: nextIsEditing,
					unsavedChanges: state.unsavedChanges,
				}
			}

			return {
				isEditing: nextIsEditing,
				unsavedChanges: {
					...state.unsavedChanges,
					[sourceId]: {
						...(state.unsavedChanges[sourceId] || {}),
						[identifier]: {
							originalContent,
							editedContent: originalContent,
							isSection,
							sectionNumber,
							subSectionNumber,
						},
					},
				},
			}
		}),

	updateDraft: (sourceId: string, identifier: string, newContent: string) =>
		set((state) => {
			const sourceChanges = state.unsavedChanges[sourceId] || {}
			const existing = sourceChanges[identifier]
			if (!existing) return {}
			// normalize to avoid \r\n vs \n mismatches
			const normalize = (s: string) => s.replace(/\r\n/g, "\n")
			const normalized = normalize(newContent)

			const editedMapForSubs = existing.subSectionNumber
				? {
						...state.editedSubsections,
						[sourceId]: {
							...(state.editedSubsections[sourceId] || {}),
							[existing.subSectionNumber]: normalize(normalized) !== normalize(existing.originalContent),
						},
				  }
				: state.editedSubsections

			return {
				unsavedChanges: {
					...state.unsavedChanges,
					[sourceId]: {
						...sourceChanges,
						[identifier]: {
							...existing,
							editedContent: normalized,
						},
					},
				},
				editedSubsections: editedMapForSubs,
			}
		}),

	saveEdit: (sourceId: string, identifier: string) => {
		const changes = get().unsavedChanges[sourceId]?.[identifier]
		if (!changes) return null
		const normalize = (s: string) => s.replace(/\r\n/g, "\n")
		const changed = normalize(changes.editedContent) !== normalize(changes.originalContent)
		if (!changed) {
			// mark not editing, remove unsaved entry
			set((state) => {
				const { [identifier]: _, ...restChanges } = state.unsavedChanges[sourceId] || {}
				return {
					unsavedChanges: { ...state.unsavedChanges, [sourceId]: restChanges },
					isEditing: {
						...state.isEditing,
						[sourceId]: { ...(state.isEditing[sourceId] || {}), [identifier]: false },
					},
				}
			})
			return null
		}
		// After saving, clear unsaved entry and mark not editing
		set((state) => {
			const { [identifier]: _, ...restChanges } = state.unsavedChanges[sourceId] || {}
			return {
				unsavedChanges: { ...state.unsavedChanges, [sourceId]: restChanges },
				isEditing: {
					...state.isEditing,
					[sourceId]: { ...(state.isEditing[sourceId] || {}), [identifier]: false },
				},
			}
		})
		return {
			contentToSave: changes.editedContent, // keep exact content
			isSection: changes.isSection,
			sectionNumber: changes.sectionNumber,
			subSectionNumber: changes.subSectionNumber,
		}
	},

	discardEdit: (sourceId: string, identifier: string) =>
		set((state) => {
			const sourceChanges = state.unsavedChanges[sourceId] || {}
			const removed = sourceChanges[identifier]
			const { [identifier]: _, ...rest } = sourceChanges

			let editedSubsForSource = state.editedSubsections[sourceId] || {}
			if (removed?.subSectionNumber) {
				const { [removed.subSectionNumber]: __, ...restSubs } = editedSubsForSource
				editedSubsForSource = restSubs
			}

			return {
				unsavedChanges: { ...state.unsavedChanges, [sourceId]: rest },
				isEditing: {
					...state.isEditing,
					[sourceId]: { ...(state.isEditing[sourceId] || {}), [identifier]: false },
				},
				editedSubsections: {
					...state.editedSubsections,
					[sourceId]: editedSubsForSource,
				},
			}
		}),

	stopEditing: (sourceId: string, identifier: string) =>
		set((state) => ({
			isEditing: {
				...state.isEditing,
				[sourceId]: { ...(state.isEditing[sourceId] || {}), [identifier]: false },
			},
		})),

	resetSourceState: (sourceId: string) =>
		set((state) => ({
			successfulSections: {
				...state.successfulSections,
				[sourceId]: {},
			},
			failedSections: {
				...state.failedSections,
				[sourceId]: {},
			},
			expandedSections: {
				...state.expandedSections,
				[sourceId]: {},
			},
			content: {
				...state.content,
				[sourceId]: [],
			},
			generatingSections: {
				...state.generatingSections,
				[sourceId]: {},
			},
			processingMessages: {
				...state.processingMessages,
				[sourceId]: {},
			},
			scrollToSection: {
				...state.scrollToSection,
				[sourceId]: null,
			},
			activeSubSection: {
				...state.activeSubSection,
				[sourceId]: null,
			},
			isEditing: {
				...state.isEditing,
				[sourceId]: {},
			},
			unsavedChanges: {
				...state.unsavedChanges,
				[sourceId]: {},
			},
			editedSubsections: {
				...state.editedSubsections,
				[sourceId]: {},
			},
			isRegenPanelOpen: {
				...state.isRegenPanelOpen,
				[sourceId]: false,
			},
			// optional cleanup
			markdownResponse: {
				...state.markdownResponse,
				[sourceId]: "",
			},
			isMarkdownLoading: {
				...state.isMarkdownLoading,
				[sourceId]: false,
			},
			isMarkdownFetched: {
				...state.isMarkdownFetched,
				[sourceId]: false,
			},
		})),

	setIsRegenPanelOpen: (sourceId: string, isOpen: boolean) =>
		set((state) => ({
			isRegenPanelOpen: {
				...state.isRegenPanelOpen,
				[sourceId]: isOpen,
			},
		})),
	getMarkdownResponse: (sourceId) => get().markdownResponse[sourceId] || "",
	isMarkdownLoadingSelector: (sourceId) => !!get().isMarkdownLoading[sourceId],
	isMarkdownFetchedSelector: (sourceId) => !!get().isMarkdownFetched[sourceId],

	setMarkdownResponse: (sourceId, response) =>
		set((state) => ({
			markdownResponse: {
				...state.markdownResponse,
				[sourceId]: response,
			},
			isMarkdownLoading: {
				...state.isMarkdownLoading,
				[sourceId]: false,
			},
			isMarkdownFetched: {
				...state.isMarkdownFetched,
				[sourceId]: true,
			},
		})),

	setIsMarkdownLoading: (sourceId, loading) =>
		set((state) => ({
			isMarkdownLoading: {
				...state.isMarkdownLoading,
				[sourceId]: loading,
			},
		})),

	setIsMarkdownFetched: (sourceId, fetched) =>
		set((state) => ({
			isMarkdownFetched: {
				...state.isMarkdownFetched,
				[sourceId]: fetched,
			},
		})),

	getSuccessfulSections: (sourceId: string) => get().successfulSections[sourceId] || {},
	getFailedSections: (sourceId: string) => get().failedSections[sourceId] || {},
	getExpandedSections: (sourceId: string) => get().expandedSections[sourceId] || {},
	getContent: (sourceId: string) => get().content[sourceId] || [],
	getGeneratingSections: (sourceId: string) => get().generatingSections[sourceId] || {},
	getProcessingMessages: (sourceId: string) => get().processingMessages[sourceId] || {},
	getScrollToSection: (sourceId: string) => get().scrollToSection[sourceId] || null,
	getActiveSubSection: (sourceId: string) => get().activeSubSection[sourceId] || null,
	getIsEditing: (sourceId: string, identifier: string) => !!get().isEditing[sourceId]?.[identifier],
	getUnsavedChanges: (sourceId: string) => get().unsavedChanges[sourceId] || {},
	getEditedSubsections: (sourceId: string) => get().editedSubsections[sourceId] || {},
	getIsRegenPanelOpen: (sourceId: string) => get().isRegenPanelOpen[sourceId] || false,
}))
