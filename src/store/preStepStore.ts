import { create } from "zustand"
import type { UserPreference, OutlineSection, TopicSelection } from "~/types/preSteps"
import type { AgencyReference } from "~/types/agencyReference"

interface PreStepState {
	table_of_contet: OutlineSection[]
	userPreferences: UserPreference[]
	topicSelectedQuestions: TopicSelection
	selectedAgencyReferences: AgencyReference[]
	deepResearchEnabled?: boolean
	deepResearchStatus?: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" | "FAILED"
	isDeepResearchPolling: boolean
	tocVersion: number

	setOutline: (outline: OutlineSection[]) => void
	setUserPreferences: (preferences: UserPreference[]) => void
	setTopicSelectedQuestions: (selection: TopicSelection) => void
	setSelectedAgencyReferences: (refs: AgencyReference[]) => void
	setDeepResearchEnabled?: (enabled: boolean) => void
	setDeepResearchStatus?: (status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" | "FAILED") => void
	setDeepResearchPolling: (isPolling: boolean) => void
	setTocVersion: (version: number) => void
}

export const usePreStepStore = create<PreStepState>((set) => ({
	table_of_contet: [],
	userPreferences: [],
	topicSelectedQuestions: { research_categories: {} },
	selectedAgencyReferences: [],
	deepResearchEnabled: false,
	isDeepResearchPolling: false,
	deepResearchStatus: "NOT_STARTED",
	tocVersion: 1,

	setOutline: (outline) => {
		set({ table_of_contet: outline })
	},

	setUserPreferences: (preferences) => {
		set({ userPreferences: preferences })
	},

	setTopicSelectedQuestions: (selection) => {
		set({ topicSelectedQuestions: selection })
	},

	setSelectedAgencyReferences: (refs) => {
		set({ selectedAgencyReferences: refs })
	},

	setDeepResearchEnabled: (enabled) => set({ deepResearchEnabled: enabled }),

	setDeepResearchPolling: (isPolling) => set({ isDeepResearchPolling: isPolling }),

	setDeepResearchStatus: (status) => set({ deepResearchStatus: status }),
	setTocVersion: (version) => set({ tocVersion: version }),
}))
