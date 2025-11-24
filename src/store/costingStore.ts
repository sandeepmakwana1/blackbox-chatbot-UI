import { create } from "zustand"
import { costImageFormatting, regenerateCost } from "~/handlers/contentGenerationHandlers"
import type { CostResponse, HourlyJobTitleWage, License, InfrastructureItem } from "~/types/costing"
import { toast } from "sonner"

export interface TableData {
	columns: Array<{ key: string; label: string; editable?: boolean }>
	rows: Array<Record<string, any>>
}

interface CostingState {
	costData: CostResponse | null
	smartCostMarkdown: string | null
	isUploading: boolean
	isRegenerating: boolean
	error: string | null
	setCostData: (data: CostResponse) => void // Add this function
	uploadCostImages: (sourceId: number, files: File[]) => Promise<void>
	getTableData: (tabId: "human-resources" | "licenses" | "infrastructure") => TableData
	resetSmartCostSheet: () => void
	updateRowData: (tabId: string, rowIndex: number, updatedValues: Record<string, any>) => void
	deleteRow: (tabId: string, rowIndex: number) => void
	regenerateCostData: (
		sourceId: string,
		sectionName: "human-resources" | "licenses" | "infrastructure",
		userFeedback: string
	) => Promise<void>
	getCostingData: () => CostResponse | null
}

export const useCostingStore = create<CostingState>((set, get) => ({
	costData: null,
	smartCostMarkdown: null,
	isUploading: false,
	isRegenerating: false,
	error: null,

	// Add setCostData function
	setCostData: (data: CostResponse) => {
		set({ costData: data })
	},

	uploadCostImages: async (sourceId: number, files: File[]) => {
		set({ isUploading: true, error: null })
		try {
			const result = await costImageFormatting(sourceId, files)
			if (result.table_result) {
				set({ smartCostMarkdown: result.table_result })
			}
		} catch (err: any) {
			console.error("Error processing cost images:", err)
			set({ error: err.message || "Failed to process images." })
		} finally {
			set({ isUploading: false })
		}
	},

	resetSmartCostSheet: () => {
		set({ smartCostMarkdown: null, error: null })
	},

	regenerateCostData: async (sourceId, sectionName, userFeedback) => {
		const currentCostData = get().getCostingData()
		if (!currentCostData) {
			toast.error("Original cost data not available to regenerate.")
			return
		}

		let sectionContent: any
		let sectionLabel = ""
		let sectionNameBackend = ""

		if (sectionName === "human-resources") {
			sectionContent = currentCostData.hourly_wages
			sectionLabel = "Human resources"
			sectionNameBackend = "hourly_wages"
		} else if (sectionName === "licenses") {
			sectionContent = currentCostData.rfp_license
			sectionLabel = "Licenses"
			sectionNameBackend = "rfp_license"
		} else if (sectionName === "infrastructure") {
			sectionContent = currentCostData.rfp_infrastructure
			sectionLabel = "Infrastructure"
			sectionNameBackend = "rfp_infrastructure"
		}

		if (!sectionContent) {
			toast.error(`No data found for section: ${sectionLabel}`)
			return
		}

		set({ isRegenerating: true, error: null })
		try {
			const regeneratedData = await regenerateCost(sourceId, sectionNameBackend, sectionContent, userFeedback)
			const newCostData = JSON.parse(JSON.stringify(currentCostData))

			if (sectionName === "human-resources") {
				newCostData.hourly_wages = regeneratedData.hourly_wages.hourly_job_title_wages
			} else if (sectionName === "licenses") {
				newCostData.rfp_license = regeneratedData.rfp_license
			} else if (sectionName === "infrastructure") {
				newCostData.rfp_infrastructure = regeneratedData.rfp_infrastructure
			}

			set({ costData: newCostData, isRegenerating: false })
			toast.success(`${sectionLabel} data regenerated successfully.`)
		} catch (err) {
			console.error(`Error regenerating ${sectionName} data:`, err)
			const message = err instanceof Error ? err.message : `Failed to regenerate ${sectionLabel} data.`
			set({ error: message, isRegenerating: false })
			toast.error(message)
		}
	},

	getTableData: (tabId) => {
		const costData = get().costData
		if (!costData) return { columns: [], rows: [] }

		if (tabId === "human-resources") {
			const columns = [
				{ key: "id", label: "Sr. No.", editable: false },
				{ key: "name", label: "Resource", editable: true },
				{ key: "level", label: "Experience level", editable: true },
				{ key: "hours", label: "Total hours", editable: true },
				{ key: "rate", label: "Hourly rate ($)", editable: true },
				{ key: "cost", label: "Total cost ($)", editable: false },
			]
			const rows = (costData.hourly_wages || []).map((item: HourlyJobTitleWage, idx: number) => ({
				id: idx + 1,
				name: item.old_job_title,
				level: item.Experience_level,
				hours: item.hours,
				rate: item.hourly_wage,
				cost: item.hours * item.hourly_wage,
				...item,
			}))
			return { columns, rows }
		}

		if (tabId === "licenses") {
			const columns = [
				{ key: "id", label: "Sr. No.", editable: false },
				{ key: "platform", label: "Platform/Service", editable: true },
				{ key: "duration", label: "Duration", editable: true },
				{ key: "quantity", label: "Quantity", editable: true },
				{ key: "per_unit_cost", label: "Per Unit Cost ($)", editable: true },
				{ key: "total_investment", label: "Total Investment ($)", editable: false },
			]
			const rows = (costData.rfp_license?.licenses || []).map((item: License, idx: number) => ({
				id: idx + 1,
				platform: item.license_name,
				duration: item.license_duration,
				quantity: item.license_quantity,
				per_unit_cost: item.license_per_unit_cost,
				total_investment: item.license_quantity * item.license_per_unit_cost,
				...item,
			}))
			return { columns, rows }
		}

		if (tabId === "infrastructure") {
			const columns = [
				{ key: "id", label: "Sr. No.", editable: false },
				{ key: "platform", label: "Platform/Service", editable: true },
				{ key: "monthly_cost", label: "Monthly cost ($)", editable: true },
				{ key: "annual_cost", label: "Annual cost ($)", editable: false },
			]
			const rows = (costData.rfp_infrastructure?.items || []).map((item: InfrastructureItem, idx: number) => ({
				id: idx + 1,
				platform: item.component,
				monthly_cost: item.estimated_monthly_cost,
				annual_cost: item.estimated_annual_cost,
				...item,
			}))
			return { columns, rows }
		}

		return { columns: [], rows: [] }
	},

	updateRowData: (tabId, rowIndex, updatedValues) => {
		const costData = get().costData
		if (!costData) return

		const newCostData = JSON.parse(JSON.stringify(costData))
		let updated = false

		if (tabId === "human-resources" && newCostData.hourly_wages?.[rowIndex]) {
			const rowToUpdate = newCostData.hourly_wages[rowIndex]
			const newHours = Number(updatedValues.hours) ?? rowToUpdate.hours
			const newRate = Number(updatedValues.rate) ?? rowToUpdate.hourly_wage

			rowToUpdate.old_job_title = updatedValues.name ?? rowToUpdate.old_job_title
			rowToUpdate.Experience_level = updatedValues.level ?? rowToUpdate.Experience_level
			rowToUpdate.hours = newHours
			rowToUpdate.hourly_wage = newRate
			rowToUpdate.cost = newHours * newRate
			updated = true
		} else if (tabId === "licenses" && newCostData.rfp_license?.licenses?.[rowIndex]) {
			const rowToUpdate = newCostData.rfp_license.licenses[rowIndex]
			rowToUpdate.license_name = updatedValues.platform ?? rowToUpdate.license_name
			rowToUpdate.license_duration = updatedValues.duration ?? rowToUpdate.license_duration
			rowToUpdate.license_quantity = updatedValues.quantity ?? rowToUpdate.license_quantity
			rowToUpdate.license_per_unit_cost = Number(updatedValues.per_unit_cost) ?? rowToUpdate.license_per_unit_cost
			rowToUpdate.license_total_cost = Number(updatedValues.total_investment) ?? rowToUpdate.license_total_cost
			updated = true
		} else if (tabId === "infrastructure" && newCostData.rfp_infrastructure?.items?.[rowIndex]) {
			const rowToUpdate = newCostData.rfp_infrastructure.items[rowIndex]
			const newMonthlyCost = Number(updatedValues.monthly_cost) ?? rowToUpdate.estimated_monthly_cost
			rowToUpdate.component = updatedValues.platform ?? rowToUpdate.component
			rowToUpdate.estimated_monthly_cost = newMonthlyCost
			rowToUpdate.estimated_annual_cost = newMonthlyCost * 12
			updated = true
		}

		if (updated) {
			set({ costData: newCostData })
		}
	},

	deleteRow: (tabId, rowIndex) => {
		const costData = get().costData
		if (!costData) return

		const newCostData = JSON.parse(JSON.stringify(costData))
		let deleted = false
		let sectionName = ""

		if (tabId === "human-resources" && newCostData.hourly_wages?.[rowIndex]) {
			newCostData.hourly_wages.splice(rowIndex, 1)
			deleted = true
			sectionName = "Human Resources"
		} else if (tabId === "licenses" && newCostData.rfp_license?.licenses?.[rowIndex]) {
			newCostData.rfp_license.licenses.splice(rowIndex, 1)
			deleted = true
			sectionName = "License"
		} else if (tabId === "infrastructure" && newCostData.rfp_infrastructure?.items?.[rowIndex]) {
			newCostData.rfp_infrastructure.items.splice(rowIndex, 1)
			deleted = true
			sectionName = "Infrastructure"
		}

		if (deleted) {
			set({ costData: newCostData })
			toast.success(`${sectionName} row deleted successfully.`)
		} else {
			toast.error("Failed to delete row. Row not found.")
		}
	},

	getCostingData: () => {
		const costData = get().costData
		if (!costData) return null
		return JSON.parse(JSON.stringify(costData)) as CostResponse
	},
}))
