import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ProposalDraftingHeader from "./ProposalDraftingHeader"
import Summary from "./presteps/summary/Summary"
import TopicSelection from "./presteps/topicselection/TopicSelection"
import Preference from "./presteps/preference/Preference"
import { getUserSummary } from "~/handlers/preStepsHandlers"
import TableOfContentView from "./presteps/tableofcontent/TableOfContentView"
import { toast } from "sonner"
import AgencyReference from "./presteps/agencyreference/AgencyReference"
import { Loader } from "~/components/ui/loader"
import DeepResearchPill from "./presteps/DeepResearchPill" // Import the new component
import { usePlaygroundStore } from "~/store/playgroundStore"
import { defaultSections } from "~/constants/sections"

const ProposalDrafting: React.FC = () => {
	const { source_id } = useParams<{ source_id: string }>()
	const localStorageKey = "currentDraftProposal"
	const navigate = useNavigate()

	const [markdownResponse, setMarkdownResponse] = useState<string>("")
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [error, setError] = useState<string | null>(null)
	const [processingMessage, setProcessingMessage] = useState<string>("")
	const [isProcessing, setIsProcessing] = useState<boolean>(false)
	const [isChanged, setIsChanged] = useState<boolean>(false)
	const [executiveSummaryIndex, setExecutiveSummaryIndex] = useState<number | null>(null)
	const { isOpen } = usePlaygroundStore()

	const getInitialSection = () => {
		try {
			const savedData = localStorage.getItem(localStorageKey)
			if (savedData) {
				const { savedSourceId, step } = JSON.parse(savedData)
				if (savedSourceId === source_id) {
					const section = defaultSections.find((s) => s.id === step)
					if (section) {
						return section
					}
				}
			}
		} catch (e) {
			console.error("Error parsing saved draft data:", e)
		}
		return defaultSections[0]
	}

	const [currentSection, setCurrentSection] = useState<{
		id: string
		title: string
		content: string
	}>(getInitialSection)

	const handleNavigateToContentGeneration = () => {
		navigate(`/content-generation/${source_id}`)
	}

	// Update localStorage when section changes
	useEffect(() => {
		localStorage.setItem(
			localStorageKey,
			JSON.stringify({
				savedSourceId: source_id,
				step: currentSection.id,
			})
		)
	}, [currentSection, source_id])

	useEffect(() => {
		const fetchMarkdownData = async () => {
			if (!source_id) {
				setError("Source ID is required")
				setIsLoading(false)
				return
			}

			try {
				setIsLoading(true)
				setError(null)
				setMarkdownResponse("")
				setProcessingMessage("")
				setIsProcessing(false)

				const sourceIdNumber = parseInt(source_id, 10)
				if (isNaN(sourceIdNumber)) throw new Error("Invalid source ID")

				// Call getUserSummary with the corrected callbacks
				await getUserSummary(sourceIdNumber, {
					onProcessing: (msg) => {
						setIsProcessing(true)
						// This correctly handles the intermediate messages
						setProcessingMessage(msg)
						setIsLoading(false) // Show processing UI once the stream starts
					},
					onCompleted: (data) => {
						const parseStringData = (data: any): string => {
							if (typeof data === "string") {
								try {
									const parsed = JSON.parse(data)
									return typeof parsed === "string" ? parsed : data
								} catch {
									return data
								}
							}
							return data
						}

						setMarkdownResponse(parseStringData(data?.summary) || "")

						setIsProcessing(false)
						setProcessingMessage("")
					},
					onError: (msg) => {
						setError(msg)
						toast.error(`Error: ${msg}`)
						setIsProcessing(false)
						setProcessingMessage("")
					},
					// We remove onChunk as it's not needed and was causing issues.
					// onChunk: (chunk) => {
					//     setMarkdownResponse((prev) => prev + "\n" + chunk); // This was incorrect
					// },
				})
			} catch (err) {
				console.error("Error fetching markdown data:", err)
				const errorMessage = err instanceof Error ? err.message : "Failed to fetch data"
				setError(errorMessage)
				// Don't show a toast here if the stream's onError already did
				if (!error) {
					toast.error(errorMessage)
				}
				setIsProcessing(false)
			} finally {
				setIsLoading(false)
			}
		}

		fetchMarkdownData()
		// Adding 'error' to the dependency array to avoid re-triggering toasts on unrelated re-renders.
	}, [source_id])

	const handleSectionChange = (section: { id: string }) => {
		localStorage.setItem(localStorageKey, section.id)

		const newSectionData = defaultSections.find((s) => s.id === section.id)
		setCurrentSection({
			id: section.id,
			title: section.id.charAt(0).toUpperCase() + section.id.slice(1).replace(/-/g, " "),
			content: newSectionData.content,
		})
	}
	const initialSectionIndex = defaultSections.findIndex((step) => step.id === currentSection.id)

	return (
		<div className={`w-full flex flex-col gap-1.5 overflow-hidden ${isOpen ? "px-2" : "px-35"}`}>
			<div className="bg-white rounded-lg " style={{ boxShadow: "2px 2px 6px 0px rgba(234, 238, 245, 1)" }}>
				<ProposalDraftingHeader
					initialSectionIndex={initialSectionIndex}
					onSectionChange={(section) => handleSectionChange(section)}
					onNavigateToContentGeneration={handleNavigateToContentGeneration}
					sourceId={source_id}
					executiveSummaryIndex={executiveSummaryIndex}
					isChanged={isChanged}
				/>

				<div className="px-4 py-2.5">
					<h2 className="text-lg font-semibold text-neutral-900">{currentSection.title}</h2>
					<p className="text-xs text-neutral-700">{currentSection.content}</p>
				</div>
			</div>

			{isLoading && (
				<div className="flex justify-center items-center h-64">
					<div className="text-center">
						<Loader size="xl" variant="primary" />
						<p className="text-gray-500">Loading...</p>
					</div>
				</div>
			)}

			{isProcessing && (
				<div className="flex justify-center items-center h-64">
					<div className="text-center flex flex-col items-center">
						<div className="animate-pulse flex space-x-2 mb-4">
							<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
							<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
							<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
						</div>
						<p className="text-blue-600 font-medium">{processingMessage}</p>
						<p className="text-gray-500 text-sm mt-2">This may take a few moments...</p>
					</div>
				</div>
			)}

			{!isLoading && !isProcessing && currentSection?.id === "summary" && (
				<Summary markdownResponse={markdownResponse} />
			)}
			{/* {!isLoading && !isProcessing && currentSection?.id === "topic-selection" && <TopicSelection />} */}
			{!isLoading && !isProcessing && currentSection?.id === "preferences" && <Preference />}
			{!isLoading && !isProcessing && currentSection?.id === "table-of-content" && (
				<TableOfContentView
					setIsChanged={setIsChanged}
					executiveSummaryIndex={executiveSummaryIndex}
					setExecutiveSummaryIndex={setExecutiveSummaryIndex}
				/>
			)}
			{!isLoading && !isProcessing && currentSection?.id === "agency-references" && (
				<AgencyReference sourceId={source_id} />
			)}
			{!isLoading && !isProcessing && currentSection?.id === "topic-selection" && <TopicSelection />}

			{/* Render the pill component, it will manage its own visibility */}
			<DeepResearchPill sourceId={source_id} />
		</div>
	)
}

export default ProposalDrafting
