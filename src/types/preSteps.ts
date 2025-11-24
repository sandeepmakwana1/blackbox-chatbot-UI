export type SubSection = {
	subSectionNumber: string
	subSectionTitle: string
}

export type OutlineSection = {
	sectionNumber: string
	sectionTitle: string
	subSections: SubSection[]
	agentSpecialisation: string
	specificInstruction: string
	relevant_sections: string[]
	prompt: string
}

export type OutlineJson = {
	outline_json: OutlineSection[]
	exec_summary_section_number?: number
	toc_version: number
	generated_sections?: string[]
}

export type UserPreference = {
	question: string
	suggested_answer: string
}

export type UserPreferencesResponse = {
	user_preferences: UserPreference[]
}

export type Question = {
	question: string
}

export type TopicSelection = {
	research_categories: {
		[categoryName: string]: {
			[subcategoryName: string]: Question[]
		}
	}
}

export type DeepResearchData = {
	research_categories: {
		[categoryName: string]: {
			answer: string
			subcategories: {
				[subcategoryName: string]: Question[]
			}
		}
	}
}

export type ResearchStatus = "in_progress" | "completed"

export type ResearchItem = {
	section: {
		[categoryName: string]: {
			[subcategoryName: string]: Question[]
		}
	}
	status: ResearchStatus
	asked_at: number
	answer: string
	completed_at: number
}

export type DeepResearchApiResponse = {
	total: number
	completed: number
	status: ResearchStatus
	data?: {
		[responseId: string]: ResearchItem
	}
}

export type DeepResearchStatusResponse = {
	status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" | "FAILED"
	message: string
	total_tasks?: number
	completed_tasks?: number
	started_at?: string | null // ISO 8601 datetime string
	updated_at?: string | null // ISO 8601 datetime string
	completed_at?: string | null
}

export type OutlineJsonUpdateStatus = {
	status: "UPDATING" | "READY"
}
