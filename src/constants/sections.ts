export interface Section {
	id: string
	title: string
	content: string
}

export const defaultSections: Section[] = [
	{
		id: "summary",
		title: "Summary",
		content: "A brief summary of the RFP document to guide proposal drafting.",
	},
	{
		id: "topic-selection",
		title: "Topic Selection",
		content:
			"Select topics for deep research to enrich your proposal. You can skip deep research if you're short on time.",
	},
	{
		id: "table-of-content",
		title: "Table of Content",
		content: "Refine or regenerate the proposal structure to tailor and strengthen your proposal content.",
	},
	{
		id: "agency-references",
		title: "Agency references",
		content: "Select relevant agencies to include as references in your proposal.",
	},
	{
		id: "preferences",
		title: "Preferences",
		content: "Customize your preferences and research topics to make your proposal more relevant and aligned.",
	},
]
