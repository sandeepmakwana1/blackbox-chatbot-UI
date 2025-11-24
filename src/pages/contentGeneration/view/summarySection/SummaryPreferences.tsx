import React, { useState } from "react"
import { useParams } from "react-router-dom"
import { StyledMarkdown } from "~/components/common/MarkdownComponent"
import { Loader } from "~/components/ui/loader"
import { useGetDeepResearch, useUserPreferences } from "~/handlers/preStepsHandlers"
import DeepResearch from "~/pages/proposaldrafting/presteps/preference/DeepResearch"
import SummaryPreferencesHeader from "./SummaryPreferenceHeader"
import SummaryUserPreferences from "./SummaryUserPreference"
import { useTabInfoStore } from "~/store/tabInfoStore"

type ButtonType = "summary" | "user-preferences" | "deep-research"

interface SummaryPreferenceProps {
	markdownResponse: string
}

const SummaryPreferences: React.FC<SummaryPreferenceProps> = ({ markdownResponse }) => {
	// const [selectedButton, setSelectedButton] = useState<ButtonType>("summary")
	const { getSummaryTabInfo, setSummaryTabInfo } = useTabInfoStore()
	const { source_id } = useParams<{ source_id: string }>()
	const selectedButton = getSummaryTabInfo(source_id || "")

	const {
		data: userPreferenceResponse,
		isLoading: isUserPreferencesLoading,
		isFetching: isUserPreferencesFetching,
		isError: isUserPreferencesError,
		error: userPreferencesError,
	} = useUserPreferences(parseInt(source_id), false)

	const {
		data: deepResearchResponse,
		isLoading: isDeepResearchLoading,
		isFetching: isDeepResearchFetching,
		isError: isDeepResearchError,
		error: deepResearchError,
	} = useGetDeepResearch(parseInt(source_id), false)

	const isLoading = isUserPreferencesLoading || isDeepResearchLoading
	const isFetching = isUserPreferencesFetching || isDeepResearchFetching
	const isError = isUserPreferencesError || isDeepResearchError
	const error = userPreferencesError || deepResearchError
	return (
		<div className="h-full overflow-y-auto py-2 w-full flex justify-center">
			{(isLoading || isFetching) && selectedButton !== "summary" && (
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<Loader size="xl" variant="primary" />
						<p className="mt-4 text-[#64748b]">Loading...</p>
					</div>
				</div>
			)}

			{isError && (
				<div className="flex-1 p-6">
					<div className="bg-red-100 border border-red-400 text-red-700 rounded-md p-6 text-center">
						Error fetching data: {error?.message}
					</div>
				</div>
			)}

			{selectedButton === "summary" && (
				<div className="w-[80%] flex flex-col gap-1.5 overflow-hidden">
					<div className="px-4 py-3 bg-white rounded-lg h-full relative custom-scrollbar overflow-y-auto">
						<SummaryPreferencesHeader
							source_id={source_id}
							selectedButton={selectedButton}
							onButtonClick={setSummaryTabInfo}
						/>
						<StyledMarkdown>{markdownResponse}</StyledMarkdown>
					</div>
				</div>
			)}

			{!isLoading && !isFetching && !isError && selectedButton === "user-preferences" && (
				<div className="w-[80%] flex flex-col gap-1.5 overflow-hidden">
					<div className="px-4 py-3 bg-white rounded-lg h-full relative custom-scrollbar overflow-y-auto">
						<SummaryPreferencesHeader
							source_id={source_id}
							selectedButton={selectedButton}
							onButtonClick={setSummaryTabInfo}
						/>
						<SummaryUserPreferences
							userPreferenceResponse={userPreferenceResponse?.data}
							isReadOnly={true}
						/>
					</div>
				</div>
			)}

			{!isError && !isLoading && !isFetching && selectedButton === "deep-research" && (
				<div className="w-[80%] flex flex-col gap-1.5 overflow-hidden">
					<div className="px-4 py-3 bg-white rounded-lg h-full relative custom-scrollbar overflow-y-auto">
						<SummaryPreferencesHeader
							source_id={source_id}
							selectedButton={selectedButton}
							onButtonClick={setSummaryTabInfo}
						/>
						<DeepResearch deepResearchResponse={deepResearchResponse?.data} />
					</div>
				</div>
			)}
		</div>
	)
}

export default SummaryPreferences
