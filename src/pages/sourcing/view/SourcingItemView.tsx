import { format, parseISO } from "date-fns"
import { useParams } from "react-router-dom"
import { Folder, Trash, Calendar2, Link2, TableDocument, DocumentText1 } from "iconsax-reactjs"
import TeamAssignees from "~/components/common/TeamAssignees"
import { useSourcingItemById, manualFileDeleteById, manualUploadById } from "~/handlers/sourcingHandler"
import { useState, useRef } from "react"
import { truncateFilename, truncateText } from "~/lib/utils"
import { ArrowUpRight, Download, Plus, Loader2 } from "lucide-react"
import { Button } from "~/components/ui/button"
import { SourcingItemViewSkeleton } from "~/pages/sourcing/view/SourcingItemViewSkeleton"
import { toast } from "sonner"

const MAX_FILE_SIZE_MB = 15
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_FILE_EXTENSIONS = [
	".pdf",
	".doc",
	".docx",
	".xlsx",
	".xls",
	".csv",
	".zip",
	".zipx",
	".tgz",
	".gz",
	".tar",
]
const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-excel",
	"text/csv",
]
const UPLOAD_ERRORS = {
	FILE_TOO_LARGE: `Upload failed. File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.`,
	INVALID_FILE_TYPE: "Invalid file type. Only PDF, DOC, or DOCX are allowed.",
	UPLOAD_FAILED: "An error occurred during upload. Please try again.",
}

interface SourcingItemViewProps {
	hideValidateButton?: boolean
}

export default function SourcingItemView({ hideValidateButton = false }: SourcingItemViewProps) {
	const { source_id } = useParams<{ source_id: string }>()
	const numericSourceId = source_id ? Number(source_id) : undefined

	const { data: currentItem, isLoading, isError, error, refetch } = useSourcingItemById(numericSourceId)

	const [isUploading, setIsUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleDelete = async (file_name: string) => {
		if (!currentItem) return
		if (window.confirm("Are you sure you want to delete this file?")) {
			try {
				await manualFileDeleteById(currentItem.rfp_id, file_name)
				if (refetch) {
					refetch()
				}
			} catch (err) {
				console.error("Error deleting file:", err)
			}
		}
	}

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = event.target.files
		if (!selectedFiles || selectedFiles.length === 0 || !currentItem) {
			return
		}

		setIsUploading(true)

		const validFiles: File[] = []
		const errors: string[] = []

		Array.from(selectedFiles).forEach((file) => {
			const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
			if (!ALLOWED_MIME_TYPES.includes(file.type) && !ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
				errors.push(` ${UPLOAD_ERRORS.INVALID_FILE_TYPE}`)
			} else if (file.size > MAX_FILE_SIZE_BYTES) {
				errors.push(` ${UPLOAD_ERRORS.FILE_TOO_LARGE}`)
			} else {
				validFiles.push(file)
			}
		})

		if (errors.length > 0) {
			toast.error(errors.join("\n"))
		}

		if (validFiles.length > 0) {
			const uploadPromises = validFiles.map((file) => manualUploadById(currentItem.rfp_id, file))
			try {
				await Promise.all(uploadPromises)
			} catch (err) {
				console.error("Error uploading files:", err)
				toast.error(UPLOAD_ERRORS.UPLOAD_FAILED)
			}
		}

		if (refetch) {
			refetch()
		}

		setIsUploading(false)
		if (fileInputRef.current) {
			fileInputRef.current.value = ""
		}
	}

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
					No item selected or details found. Please select an item from the list.
				</div>
			</div>
		)
	}

	const formatDate = (dateString: string) => {
		try {
			const date = parseISO(dateString)
			return format(date, "MMMM dd, yyyy")
		} catch (e) {
			console.warn("Invalid date string for SourcingItemView:", dateString)
			return "Invalid Date"
		}
	}

	const handleDownload = (url: string) => {
		window.open(url, "_blank")
	}

	return (
		<>
			<main className="flex gap-3 p-3 overflow-hidden h-full bg-[#F9FAFB] w-full">
				{/* Left Column - 70% width */}
				<div className="flex flex-col gap-3 w-[70%] overflow-hidden">
					{/* RFP Details Card */}
					<div
						className="bg-[#FFFFFF] p-4 rounded-[12px] border border-solid border-[#EDF2F7] flex-shrink-0"
						style={{ boxShadow: "2px 2px 6px #D0DEEB5C" }}
					>
						<div className="mb-3">
							<div className="flex items-center mb-2">
								<div className="flex flex-1 items-start gap-2">
									<div className="flex flex-col shrink-0 items-start bg-[#EDF2F7] py-1 px-2 rounded-[5px]">
										<span
											className="text-[#6D7C91] text-[12px] font-semibold hover:text-[#2B6CB0] hover:underline transition-colors"
											title={`ID :: ${currentItem.rfp_id}`}
										>
											{`ID :: ${truncateText(currentItem.rfp_id, 15)}`}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#F0EBEA] py-1 px-2 rounded-[5px]">
										<span className="text-[#7F6B60] text-[12px] font-semibold">
											{currentItem.opportunity_type || "RFP"}
										</span>
									</div>
								</div>
							</div>
							<div className="flex flex-col items-start">
								<span className="text-[#121821] text-[14px] font-semibold">{currentItem.title}</span>
								<span className="text-[#91A0B4] text-[12px] font-medium">
									{currentItem.agency_name}
								</span>
							</div>
						</div>

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
										<span className="text-[#6D7C91] text-[14px] font-medium">
											Pre-proposal meeting
										</span>
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
										<span className="text-[#6D7C91] text-[14px] font-medium">
											Question submission
										</span>
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

							<TeamAssignees source_id={currentItem.source_id} rfp_id={currentItem.rfp_id} />
						</div>
					</div>

					{/* Description Card - Scrollable */}
					<div className="flex-1 overflow-hidden min-h-0">
						<div className="flex flex-col bg-[#FFFFFF] p-4 rounded-[12px] border border-solid border-[#EDF2F7] h-full">
							<div className="flex items-center mb-4 flex-shrink-0">
								<div className="p-1.5 bg-[#121822] rounded-[7px] mr-2">
									<TableDocument size={14} color="#ffffff" />
								</div>
								<span className="text-[#121822] text-[14px] font-medium">Description</span>
							</div>
							<div className="text-[#6D7C91] text-[14px] whitespace-pre-wrap break-words flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
								{currentItem.description}
							</div>
						</div>
					</div>
				</div>

				{/* Right Column - Documents Sidebar - 30% width */}
				<div className="flex flex-col bg-[#FFFFFF] py-2.5 gap-4 rounded-[12px] border border-solid border-[#EDF2F7] w-[30%] min-w-0 overflow-hidden h-full">
					{/* Project Documents */}
					<div className="flex flex-col gap-3  flex-shrink-0">
						<div className="flex items-center justify-between px-2.5">
							<div className="flex shrink-0 items-center">
								<div className="p-1.5 bg-[#121822] rounded-[7px] mr-2">
									<Folder size={14} color="#ffffff" />
								</div>
								<span className="text-[#121822] text-[14px] font-medium">Solicitation documents</span>
							</div>
						</div>

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

					{/* Manually Added Documents */}
					<div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
						<div className="flex items-center justify-between flex-shrink-0 px-2.5">
							<div className="flex shrink-0 items-center">
								<div className="p-1.5 bg-[#121822] rounded-[7px] mr-2">
									<Folder size={14} color="#ffffff" />
								</div>
								<span className="text-[#121822] text-[14px] font-medium">Manually added</span>
							</div>
							{currentItem.Manualupload?.length > 0 && (
								<Button
									variant="tertiary"
									size="sm"
									onClick={() => fileInputRef.current?.click()}
									disabled={isUploading}
								>
									{isUploading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Uploading...
										</>
									) : (
										<>
											<Plus size={14} />
											Add more
										</>
									)}
								</Button>
							)}
						</div>

						<div className="flex flex-col overflow-y-auto custom-scrollbar flex-1 min-h-0">
							{currentItem.Manualupload?.length === 0 ? (
								<div className="flex flex-col items-center justify-center space-y-3 px-4 py-6">
									<div className="bg-[#EDF2F7] p-2 rounded-[8px] inline-flex">
										<DocumentText1 size="16" color="#76869C" variant="Linear" />
									</div>
									<div className="text-center">
										<h3 className="text-[12px] font-semibold text-black ">
											No documents available
										</h3>
										<p className="text-[#6E7C91] text-[10px] px-2 mb-1">
											No documents have been uploaded manually.
										</p>
									</div>
									<Button
										variant="tertiary"
										size="sm"
										onClick={() => fileInputRef.current?.click()}
										disabled={isUploading}
									>
										{isUploading ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Uploading...
											</>
										) : (
											<>
												<Plus size={14} />
												Upload
											</>
										)}
									</Button>
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
										<div className="flex items-center gap-2 ml-2 flex-shrink-0">
											<Download
												size={16}
												color="#6E7C91"
												className="cursor-pointer"
												onClick={() => handleDownload(doc.s3_url)}
											/>
											<Trash
												size={16}
												color="#E54848"
												variant="Linear"
												className="cursor-pointer"
												onClick={() => handleDelete(doc.file_name)}
											/>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</main>

			{/* Hidden file input for direct uploads */}
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				multiple
				className="hidden"
				accept={ALLOWED_FILE_EXTENSIONS.join(",")}
				disabled={isUploading}
			/>
		</>
	)
}
