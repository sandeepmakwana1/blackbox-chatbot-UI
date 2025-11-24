import { create } from "zustand"

interface TabState {
	validationTabInfo: Record<string, "legal" | "technical" | "checklist">
	costingTabInfo: Record<string, "human-resources" | "licenses" | "infrastructure" | "smart-cost-sheet">
	contentTabInfo: Record<string, "summary" | "contentgeneration" | "costing">
	summaryTabInfo: Record<string, "summary" | "user-preferences" | "deep-research">

	onTabChange?: (sourceId: string, tabType: "validation" | "costing" | "content", newTab: string) => void

	setOnTabChangeCallback: (
		callback: (sourceId: string, tabType: "validation" | "costing" | "content", newTab: string) => void
	) => void

	setCostingTabInfo: (
		sourceId: string,
		tab: "human-resources" | "licenses" | "infrastructure" | "smart-cost-sheet"
	) => void
	setValidationTabInfo: (sourceId: string, tab: "legal" | "technical" | "checklist") => void
	setContentTabInfo: (sourceId: string, tab: "summary" | "contentgeneration" | "costing") => void
	setSummaryTabInfo: (sourceId: string, tab: "summary" | "user-preferences" | "deep-research") => void
	getValidationTabInfo: (sourceId: string) => "legal" | "technical" | "checklist"
	getCostingTabInfo: (sourceId: string) => "human-resources" | "licenses" | "infrastructure" | "smart-cost-sheet"
	getContentTabInfo: (sourceId: string) => "summary" | "contentgeneration" | "costing"
	getSummaryTabInfo: (sourceId: string) => "summary" | "user-preferences" | "deep-research"
}

export const useTabInfoStore = create<TabState>((set, get) => ({
	validationTabInfo: {},
	costingTabInfo: {},
	contentTabInfo: {},
	summaryTabInfo: {},
	onTabChange: undefined,

	setOnTabChangeCallback: (callback) => set({ onTabChange: callback }),

	setValidationTabInfo: (sourceId: string, tab: "legal" | "technical" | "checklist") => {
		set((state) => ({
			validationTabInfo: {
				...state.validationTabInfo,
				[sourceId]: tab,
			},
		}))
		// Trigger callback after state update
		const { onTabChange } = get()
		if (onTabChange) {
			onTabChange(sourceId, "validation", tab)
		}
	},

	setCostingTabInfo: (
		sourceId: string,
		tab: "human-resources" | "licenses" | "infrastructure" | "smart-cost-sheet"
	) => {
		set((state) => ({
			costingTabInfo: {
				...state.costingTabInfo,
				[sourceId]: tab,
			},
		}))
		const { onTabChange } = get()
		if (onTabChange) {
			onTabChange(sourceId, "costing", tab)
		}
	},

	setContentTabInfo: (sourceId: string, tab: "summary" | "contentgeneration" | "costing") => {
		set((state) => ({
			contentTabInfo: {
				...state.contentTabInfo,
				[sourceId]: tab,
			},
		}))
		const { onTabChange } = get()
		if (onTabChange) {
			onTabChange(sourceId, "content", tab)
		}
	},
	setSummaryTabInfo: (sourceId: string, tab: "summary" | "user-preferences" | "deep-research") => {
		set((state) => ({
			summaryTabInfo: {
				...state.summaryTabInfo,
				[sourceId]: tab,
			},
		}))
		const { onTabChange } = get()
		if (onTabChange) {
			onTabChange(sourceId, "content", tab)
		}
	},

	getValidationTabInfo: (sourceId: string) => get().validationTabInfo[sourceId] || "legal",
	getCostingTabInfo: (sourceId: string) => get().costingTabInfo[sourceId] || "human-resources",
	getContentTabInfo: (sourceId: string) => get().contentTabInfo[sourceId] || "contentgeneration",
	getSummaryTabInfo: (sourceId: string) => get().summaryTabInfo[sourceId] || "summary",
}))
