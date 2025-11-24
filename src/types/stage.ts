export type StageResponse = {
	id: number
	name: string
	description: string
}

export enum StageName {
	Validated = "Validated",
	Submitted = "Submitted",
	PreSteps = "Pre-Steps",
	Won = "Won",
	Draft = "Draft",
	OnHold = "On Hold",
	Cancelled = "Cancelled",
	Completed = "Completed",
	Rejected = "Rejected",
	Archived = "Archived",
}
