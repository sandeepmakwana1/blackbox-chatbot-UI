import { format, parseISO } from "date-fns"
import { Folder, Calendar2, Link2, TableDocument, DocumentText1 } from "iconsax-reactjs"
import { useSourcingItemById } from "~/handlers/sourcingHandler"
import { truncateFilename } from "~/lib/utils"
import { ArrowUpRight, Download } from "lucide-react"
import { SourcingItemViewSkeleton } from "~/pages/sourcing/view/SourcingItemViewSkeleton"

interface SourcingItemReadOnlyViewProps {
	source_id: number
}

export default function SourcingItemReadOnlyView({ source_id }: SourcingItemReadOnlyViewProps) {
	const { data: currentItem, isLoading, isError, error } = useSourcingItemById(source_id)

	if (isLoading) {
		return <SourcingItemViewSkeleton />
	}

	if (isError) {
		return (
			<div className="flex-1 p-6">
				<div className="bg-red-100 border border-red-400 text-red-700 rounded-md p-6 text-center">
					Error fetching item details: {error instanceof Error ? error.message : "Unknown error"}
				</div>
			</div>
		)
	}

	if (!currentItem) {
		return (
			<div className="flex-1 p-6">
				<div className="bg-white border border-[#e2e8f0] rounded-md p-6 text-center text-[#64748b]">
					No item found for the provided ID.
				</div>
			</div>
		)
	}

	const formatDate = (dateString: string) => {
		try {
			const date = parseISO(dateString)
			return format(date, "MMMM dd, yyyy")
		} catch (e) {
			console.warn("Invalid date string for SourcingItemReadOnlyView:", dateString)
			return "Invalid Date"
		}
	}

	const handleDownload = (url: string) => {
		window.open(url, "_blank")
	}

	return (
		<main className="flex gap-3 p-3 h-full overflow-hidden bg-[#F9FAFB] w-full">
			{/* Left Column - 70% width */}
			<div className="flex flex-col gap-3 w-[70%] overflow-hidden">
				{/* RFP Details Card - FIXED HEIGHT */}
				<div
					className="bg-[#FFFFFF] p-4 rounded-[12px] border border-solid border-[#EDF2F7] flex-shrink-0"
					style={{ boxShadow: "2px 2px 6px #D0DEEB5C" }}
				>
					<div className="flex flex-col items-start gap-1.5">
						{/* Date and Link Info */}
						<div className="flex items-start">
							<div className="flex shrink-0 items-center mr-4 w-50">
								<Calendar2 size="16" color="#92A0B5" variant="Linear" className="mr-2" />
								<span className="text-[#6D7C91] text-[14px] font-medium">Posted</span>
							</div>
							<span className="text-[#121822] text-[14px] font-medium">
								{formatDate(currentItem.posted_date)}
							</span>
						</div>

						<div className="flex items-start">
							<div className="flex shrink-0 items-center mr-4 w-50">
								<Calendar2 size="16" color="#92A0B5" variant="Linear" className="mr-2" />
								<span className="text-[#6D7C91] text-[14px] font-medium">Due</span>
							</div>
							<span className="text-[#121822] text-[14px] font-medium">
								{formatDate(currentItem.due_date)}
							</span>
						</div>

						<div className="flex items-start">
							<div className="flex shrink-0 items-center mr-4 w-50">
								<Calendar2 size="16" color="#92A0B5" variant="Linear" className="mr-2" />
								<span className="text-[#6D7C91] text-[14px] font-medium">Last updated</span>
							</div>
							<span className="text-[#121822] text-[14px] font-medium">
								{formatDate(currentItem.posted_date)}
							</span>
						</div>

						{currentItem.pre_proposal_meeting_date && (
							<div className="flex items-start">
								<div className="flex shrink-0 items-center mr-4 w-50">
									<Calendar2 size="16" color="#92A0B5" variant="Linear" className="mr-2" />
									<span className="text-[#6D7C91] text-[14px] font-medium">Pre-proposal meeting</span>
								</div>
								<span className="text-[#121822] text-[14px] font-medium">
									{formatDate(currentItem.pre_proposal_meeting_date)}
								</span>
							</div>
						)}

						{currentItem.question_submission_date && (
							<div className="flex items-start">
								<div className="flex shrink-0 items-center mr-4 w-50">
									<Calendar2 size="16" color="#92A0B5" variant="Linear" className="mr-2" />
									<span className="text-[#6D7C91] text-[14px] font-medium">Question submission</span>
								</div>
								<span className="text-[#121822] text-[14px] font-medium">
									{formatDate(currentItem.question_submission_date)}
								</span>
							</div>
						)}

						<div className="flex items-start">
							<div className="flex shrink-0 items-center mr-4 w-50">
								<Link2 size="16" color="#92A0B5" variant="Linear" className="mr-2" />
								<span className="text-[#6D7C91] text-[14px] font-medium">Procured from</span>
							</div>
							<div className="flex shrink-0 items-center">
								<span className="text-[14px] font-medium">{currentItem.scrape_source}</span>
							</div>
						</div>

						<div className="flex items-start">
							<div className="flex shrink-0 items-center mr-4 w-50">
								<Link2 size="16" color="#92A0B5" variant="Linear" className="mr-2" />
								<span className="text-[#6D7C91] text-[14px] font-medium">Original source</span>
							</div>
							<div className="flex shrink-0 items-center">
								<a href={currentItem.source_path} target="_blank" rel="noopener noreferrer">
									<span className="text-[#2867EF] text-[14px] font-medium mr-2 hover:underline">
										{currentItem.agency_name}
									</span>
								</a>
								<ArrowUpRight size={16} color="#2867EF" />
							</div>
						</div>
					</div>
				</div>

				{/* Description Card - FLEXIBLE HEIGHT, Scrollable */}
				<div className="flex-1 overflow-hidden min-h-0">
					<div className="flex flex-col bg-[#FFFFFF] p-4 rounded-[12px] border border-solid border-[#EDF2F7] h-full">
						<div className="flex items-center mb-4 flex-shrink-0">
							<div className="p-1.5 bg-[#121822] rounded-[7px] mr-2">
								<TableDocument size={14} color="#ffffff" />
							</div>
							<span className="text-[#121822] text-[14px] font-medium">Description</span>
						</div>
						<div className="text-[#6D7C91] text-[14px] whitespace-pre-wrap break-words flex-1 overflow-y-auto custom-scrollbar">
							{currentItem.description}
						</div>
					</div>
				</div>
			</div>

			{/* Right Column - Documents Sidebar - 30% width */}
			<div className="flex flex-col bg-[#FFFFFF] py-2.5 gap-4 rounded-[12px] border border-solid border-[#EDF2F7] w-[30%] min-w-0 overflow-hidden h-full">
				{/* Project Documents - FIXED HEIGHT SECTION */}
				<div className="flex flex-col gap-3 flex-shrink-0">
					<div className="flex items-center justify-between px-2.5">
						<div className="flex shrink-0 items-center">
							<div className="p-1.5 bg-[#121822] rounded-[7px] mr-2">
								<Folder size={14} color="#ffffff" />
							</div>
							<span className="text-[#121822] text-[14px] font-medium">Solicitation documents</span>
						</div>
					</div>

					{/* Fixed max height for solicitation docs, or make it flexible */}
					<div className="flex flex-col max-h-[200px] overflow-y-auto custom-scrollbar">
						{currentItem.URLupload?.length === 0 ? (
							<div className="text-[#6D7C91] text-[12px] px-2.5">
								No documents available from the sourced platform.
							</div>
						) : (
							currentItem.URLupload.map((doc, index) => (
								<div
									key={index}
									className="flex items-center w-full bg-[#FFFFFF] hover:bg-neutral-200 p-2 mb-1 rounded flex-shrink-0"
								>
									<div className="p-2 bg-[#EDF2F7] rounded-[8px] mr-2">
										<DocumentText1 size={14} color="#121822" />
									</div>
									<div className="flex flex-col flex-1 min-w-0">
										<span
											className="text-neutral-800 text-xs font-medium truncate"
											title={doc.file_name}
										>
											{truncateFilename(doc.file_name, 25)}
										</span>
									</div>
									<Download
										size={16}
										color="#6E7C91"
										className="cursor-pointer flex-shrink-0"
										onClick={() => handleDownload(doc.s3_url)}
									/>
								</div>
							))
						)}
					</div>
				</div>

				{/* Manually Added Documents - FLEXIBLE HEIGHT */}
				<div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
					<div className="flex items-center justify-between flex-shrink-0 px-2.5">
						<div className="flex shrink-0 items-center">
							<div className="p-1.5 bg-[#121822] rounded-[7px] mr-2">
								<Folder size={14} color="#ffffff" />
							</div>
							<span className="text-[#121822] text-[14px] font-medium">Manually added</span>
						</div>
					</div>

					<div className="flex flex-col overflow-y-auto custom-scrollbar flex-1 min-h-0">
						{currentItem.Manualupload?.length === 0 ? (
							<div className="flex flex-col items-center justify-center space-y-3 px-4 py-6">
								<div className="bg-[#EDF2F7] p-2 rounded-[8px] inline-flex">
									<DocumentText1 size="16" color="#76869C" variant="Linear" />
								</div>
								<div className="text-center">
									<h3 className="text-[12px] font-semibold text-black">No documents available</h3>
									<p className="text-[#6E7C91] text-[10px] px-2">
										No documents have been uploaded manually.
									</p>
								</div>
							</div>
						) : (
							currentItem.Manualupload.map((doc, index) => (
								<div
									key={index}
									className="flex items-center w-full bg-[#FFFFFF] hover:bg-[#F5F7FA] p-2 mb-1 rounded flex-shrink-0"
								>
									<div className="p-2 bg-[#EDF2F7] rounded-[8px] mr-2">
										<DocumentText1 size={14} color="#121822" />
									</div>
									<div className="flex flex-col flex-1 min-w-0">
										<span
											className="text-neutral-800 text-[12px] font-medium truncate"
											title={doc.file_name}
										>
											{truncateFilename(doc.file_name, 25)}
										</span>
									</div>
									<Download
										size={16}
										color="#6E7C91"
										className="cursor-pointer flex-shrink-0"
										onClick={() => handleDownload(doc.s3_url)}
									/>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</main>
	)
}
