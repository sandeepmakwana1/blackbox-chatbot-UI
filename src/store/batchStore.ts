// src/store/batchStore.ts

import { create } from "zustand"
import type { BatchFilter } from "~/types/batch"

type Step = "validation" | "agency" | "processing"

interface BatchState {
	filters: BatchFilter
	step: Step
	validationIds: number[]
	maxSelection: number
	setFilter: (key: keyof BatchFilter, value: string) => void
	resetFilters: () => void
	setBatchSearch: (value: string) => void
	goToStep: (step: Step) => void
	startValidation: (ids: number[], max: number) => void
	addValidationItems: (ids: number[]) => void
	removeValidationItem: (id: number) => void
	startProcessing: () => void
	clearStore: () => void
}

const initialState = {
	filters: {
		batchSearch: "",
	},
	step: "validation" as Step,
	validationIds: [],
	maxSelection: 0,
}

export const useBatchStore = create<BatchState>((set, get) => ({
	...initialState,

	// Actions
	setFilter: (key, value) => {
		const newFilters = { ...get().filters, [key]: value }
		set({ filters: newFilters })
	},

	resetFilters: () => set({ filters: { batchSearch: "" } }),

	setBatchSearch: (value: string) => get().setFilter("batchSearch", value),

	goToStep: (step: Step) => set({ step }),

	startValidation: (ids: number[], max: number) => {
		set({
			validationIds: ids,
			maxSelection: max,
			step: "validation",
		})
	},

	addValidationItems: (ids: number[]) => {
		set((state) => ({
			validationIds: Array.from(new Set([...state.validationIds, ...ids])),
		}))
	},

	removeValidationItem: (id: number) => {
		set((state) => ({
			validationIds: state.validationIds.filter((currentId) => Number(currentId) !== id),
		}))
	},

	startProcessing: () => {
		set({ step: "processing" })
	},

	clearStore: () => {
		set(initialState)
	},
}))
