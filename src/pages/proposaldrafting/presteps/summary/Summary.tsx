import React from "react"
import { StyledMarkdown } from "~/components/common/MarkdownComponent"

interface SummaryProps {
	markdownResponse: string
}

const Summary: React.FC<SummaryProps> = ({ markdownResponse }) => {
	return (
		<div className=" p-4 pr-70 bg-white rounded-lg max-h-screen overflow-y-auto custom-scrollbar">
			<StyledMarkdown>{markdownResponse}</StyledMarkdown>
		</div>
	)
}

export default Summary
