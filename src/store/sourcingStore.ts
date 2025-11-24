import { create } from "zustand"
import type { SourcingFilters } from "~/types/sourcing"

// Simplified store interface focusing on UI state
interface SourcingState {
	// Core UI state
	filtersVisible: boolean
	filters: SourcingFilters

	// Actions
	toggleFiltersVisible: () => void
	setFilter: (key: keyof SourcingFilters, value: number[] | string[] | string | null | number) => void
	resetFilters: () => void

	// Individual filter setters for convenience
	setOpportunityType: (value: string | null) => void
	setDateFilter: (value: string | null) => void
	setAgencyName: (value: string | null) => void
	setState: (value: string | null) => void
	// setNaicsCode: (value: string | null) => void
	setSourcingSearch: (value: string) => void
	setValidateSearch: (value: string) => void
	setScrapeSources: (value: string[] | null) => void
	setAssigneeIds: (value: number[] | null) => void
	setReleasedAfterDate: (value: string | null) => void
	setValidationStatus: (value: string | null) => void

	activeTabId: string
	activeValidateTabId: string
	setActiveTabId: (tabId: string) => void
	setActiveValidateTabId: (tabId: string) => void
}

export const useSourcingStore = create<SourcingState>((set, get) => ({
	// Core UI state
	filtersVisible: true,
	filters: {
		opportunity_type: null,
		date_filter: null,
		agency_name: null,
		state: null,
		// naics_code: null,
		sourcingSearch: "",
		validateSearch: "",
		page: 1,
		page_size: 15,
		scrape_sources: null,
		assignee_ids: null,
		released_after_date: null,
		validation_status: null,
	},

	// UI actions
	toggleFiltersVisible: () => set((state) => ({ filtersVisible: !state.filtersVisible })),

	setFilter: (key, value) => {
		// Reset to page 1 when changing filters
		const newFilters = {
			...get().filters,
			[key]: value,
			page: key === "page" ? (typeof value === "number" ? value : 1) : 1, // Ensure page is always a number
		}

		set({ filters: newFilters })
	},

	resetFilters: () =>
		set({
			filters: {
				opportunity_type: null,
				date_filter: null,
				agency_name: null,
				state: null,
				sourcingSearch: "",
				validateSearch: "",
				page: 1,
				page_size: 15,
				validation_status: null,
				scrape_sources: null,
				assignee_ids: null,
				released_after_date: null,
			},
		}),

	// Individual filter setters
	setOpportunityType: (value) => get().setFilter("opportunity_type", value),
	setDateFilter: (value) => get().setFilter("date_filter", value),
	setAgencyName: (value) => get().setFilter("agency_name", value),
	setState: (value) => get().setFilter("state", value),
	// setNaicsCode: (value) => get().setFilter("naics_code", value),
	setSourcingSearch: (value) => get().setFilter("sourcingSearch", value),
	setValidateSearch: (value) => get().setFilter("validateSearch", value),

	activeTabId: "sourced",
	activeValidateTabId: "all",
	setActiveTabId: (tabId) => set(() => ({ activeTabId: tabId })),
	setActiveValidateTabId: (tabId) => set(() => ({ activeValidateTabId: tabId })),
	setScrapeSources: (value) => get().setFilter("scrape_sources", value),
	setAssigneeIds: (value) => get().setFilter("assignee_ids", value),
	setReleasedAfterDate: (value) => get().setFilter("released_after_date", value),
	setValidationStatus: (value) => get().setFilter("validation_status", value),
}))
