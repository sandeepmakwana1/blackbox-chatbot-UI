import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import PreferencesHeader from "./PreferenceHeader"
import UserPreferences from "./UserPreferences"
import DeepResearch from "./DeepResearch"
import { useUserPreferences, useGetDeepResearch } from "~/handlers/preStepsHandlers"
import { Loader } from "~/components/ui/loader"
import { usePreStepStore } from "~/store/preStepStore"

const Preference: React.FC = () => {
	const [selectedButton, setSelectedButton] = useState<"user-preferences" | "deep-research" | string>("deep-research")
	const { source_id } = useParams<{ source_id: string }>()
	const { setUserPreferences } = usePreStepStore()

	// Fetch User Preferences data
	const {
		data: userPreferenceResponse,
		isLoading: isUserPreferencesLoading,
		isFetching: isUserPreferencesFetching,
		isError: isUserPreferencesError,
		error: userPreferencesError,
	} = useUserPreferences(parseInt(source_id), true)

	// Fetch Deep Research data
	const {
		data: deepResearchResponse,
		isLoading: isDeepResearchLoading,
		isFetching: isDeepResearchFetching,
		isError: isDeepResearchError,
		error: deepResearchError,
	} = useGetDeepResearch(parseInt(source_id), true)

	// Individual loading states
	const isUserPreferencesLoadingState = isUserPreferencesLoading || isUserPreferencesFetching
	const isDeepResearchLoadingState = isDeepResearchLoading || isDeepResearchFetching
	useEffect(() => {
		if (userPreferenceResponse?.data?.user_preferences) {
			const originalPreferences = userPreferenceResponse.data.user_preferences || []
			const specialInstructionTemplate = {
				question: "special instruction",
				suggested_answer: "",
			}

			const existingSpecialIndex = originalPreferences.findIndex(
				(pref) => pref.question === "special instruction"
			)

			let displayPreferences
			if (existingSpecialIndex !== -1) {
				const existingItem = originalPreferences[existingSpecialIndex]
				const otherItems = originalPreferences.filter((_, index) => index !== existingSpecialIndex)
				displayPreferences = [existingItem, ...otherItems]
			} else {
				displayPreferences = [specialInstructionTemplate, ...originalPreferences]
			}

			setUserPreferences(displayPreferences)
		}
	}, [userPreferenceResponse, setUserPreferences])

	return (
		<div className="p-2 bg-white rounded-lg h-full relative">
			<PreferencesHeader
				selectedButton={selectedButton}
				onButtonClick={setSelectedButton}
				isUserPreferencesLoading={isUserPreferencesLoadingState}
			/>

			{/* Show loading only for Deep Research when it's selected and loading */}
			{selectedButton === "deep-research" && isDeepResearchLoadingState && (
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<Loader size="xl" variant="primary" />
						<p className="mt-4 text-[#64748b]">Loading Deep Research...</p>
					</div>
				</div>
			)}

			{/* Show loading only for User Preferences when it's selected and loading */}
			{selectedButton === "user-preferences" && isUserPreferencesLoadingState && (
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<Loader size="xl" variant="primary" />
						<p className="mt-4 text-[#64748b]">Loading User Preferences...</p>
					</div>
				</div>
			)}

			{/* Show error for the selected tab */}
			{selectedButton === "deep-research" && isDeepResearchError && (
				<div className="flex-1 p-6">
					<div className="bg-red-100 border border-red-400 text-red-700 rounded-md p-6 text-center">
						Error fetching Deep Research data: {deepResearchError?.message}
					</div>
				</div>
			)}

			{selectedButton === "user-preferences" && isUserPreferencesError && (
				<div className="flex-1 p-6">
					<div className="bg-red-100 border border-red-400 text-red-700 rounded-md p-6 text-center">
						Error fetching User Preferences data: {userPreferencesError?.message}
					</div>
				</div>
			)}

			{/* Show content when data is available and not loading */}
			{selectedButton === "user-preferences" && !isUserPreferencesLoadingState && !isUserPreferencesError && (
				<UserPreferences userPreferenceResponse={userPreferenceResponse?.data} />
			)}

			{selectedButton === "deep-research" && !isDeepResearchLoadingState && !isDeepResearchError && (
				<DeepResearch deepResearchResponse={deepResearchResponse?.data} />
			)}
		</div>
	)
}

export default Preference
