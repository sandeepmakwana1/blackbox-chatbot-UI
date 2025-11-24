export type ContentGenerationResponse = {
	content: Section | Section[]
}

export type costMergeResponse = {
	sections: Section | Section[]
}

export type Section = {
	sectionNumber?: string
	sectionName?: string
	content?: string
	subsections?: SubSection[]
}

export type SubSection = {
	subSectionNumber?: string
	subsectionName: string
	content?: string
}

export type EditingState = {
	sectionNumber?: string
	subSectionNumber?: string
	isEditing: boolean
}

export type UnsavedChanges = {
	[key: string]: {
		originalContent: string
		editedContent: string
		isSection: boolean
		sectionNumber: string
		subSectionNumber?: string
	}
}
