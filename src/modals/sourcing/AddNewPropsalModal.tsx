import { useState, useRef } from "react"
import type { ChangeEvent, FormEvent } from "react"
import {
	CloseSquare,
	Hashtag,
	Category2,
	CalendarEdit,
	CalendarTick,
	Link21,
	DocumentUpload,
	ArrowRight,
	DocumentText,
	Refresh,
} from "iconsax-reactjs"
import { Button } from "~/components/ui/button"
import { DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import type { RfpData } from "~/types/sourcing"
import { toast } from "sonner"
import { truncateFilename } from "~/lib/utils"

interface AddNewProposalModalProps {
	onSave: (rfpData: RfpData, files: File[]) => Promise<any>
}

interface ValidationErrors {
	[key: string]: string
}

const ERROR_MESSAGES = {
	required: "This field is required",
	invalidUrl: "Please enter a valid URL (e.g., https://example.com)",
	invalidNaics: "NAICS Code must be 2-6 digits",
	dateOrder: {
		postedAfterDue: "Posted date cannot be after due date",
		dueBeforePosted: "Due date cannot be before posted date",
	},
	noFiles: "At least one file is required",
}

// Updated REQUIRED_FIELDS - removed rfp_id, rfp_id_version, and posted_date
const REQUIRED_FIELDS = [
	"title",
	"description",
	"opportunity_type",
	"due_date",
	"agency_name",
	"source_path",
	"state",
	"naics_code",
]

const INITIAL_RFP_DATA: RfpData = {
	rfp_id: "",
	rfp_id_version: "1",
	agency_name: "",
	posted_date: "",
	due_date: "",
	captured_date: new Date().toISOString().split("T")[0],
	source_path: "",
	title: "",
	state: "",
	description: "",
	naics_code: "",
	opportunity_type: "",
}

const URL_REGEX =
	/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
const NAICS_REGEX = /^[0-9]{2,6}$/

const AddNewProposalModal: React.FC<AddNewProposalModalProps> = ({ onSave }) => {
	const [rfpData, setRfpData] = useState<RfpData>(INITIAL_RFP_DATA)
	const [files, setFiles] = useState<File[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [errors, setErrors] = useState<ValidationErrors>({})
	const fileInputRef = useRef<HTMLInputElement>(null)

	const validateField = (name: string, value: string): string => {
		// Only validate required fields for emptiness
		if (REQUIRED_FIELDS.includes(name) && !value?.trim()) {
			return ERROR_MESSAGES.required
		}

		// Validate format only if value is provided
		if (value?.trim()) {
			if (name === "source_path" && !URL_REGEX.test(value)) {
				return ERROR_MESSAGES.invalidUrl
			}
			if (name === "naics_code" && !NAICS_REGEX.test(value)) {
				return ERROR_MESSAGES.invalidNaics
			}
		}

		return ""
	}

	const validateDateLogic = (postedDate: string, dueDate: string): { posted_date?: string; due_date?: string } => {
		const dateErrors: { posted_date?: string; due_date?: string } = {}

		// Only validate date logic if both dates are provided
		if (postedDate && dueDate) {
			const posted = new Date(postedDate)
			const due = new Date(dueDate)

			if (posted > due) {
				dateErrors.posted_date = ERROR_MESSAGES.dateOrder.postedAfterDue
				dateErrors.due_date = ERROR_MESSAGES.dateOrder.dueBeforePosted
			}
		}

		return dateErrors
	}

	const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target
		const newRfpData = { ...rfpData, [name]: value }
		setRfpData(newRfpData)

		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }))
		}

		if (["source_path", "naics_code"].includes(name)) {
			const error = validateField(name, value)
			if (error) {
				setErrors((prev) => ({ ...prev, [name]: error }))
			}
		}

		if (name === "posted_date" || name === "due_date") {
			const dateErrors = validateDateLogic(
				name === "posted_date" ? value : rfpData.posted_date,
				name === "due_date" ? value : rfpData.due_date
			)

			// Clear any existing date errors first
			setErrors((prev) => {
				const newErrors = { ...prev }
				if (dateErrors.posted_date) {
					newErrors.posted_date = dateErrors.posted_date
				} else {
					delete newErrors.posted_date
				}
				if (dateErrors.due_date) {
					newErrors.due_date = dateErrors.due_date
				} else {
					delete newErrors.due_date
				}
				return newErrors
			})
		}
	}

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files)
			setFiles((prevFiles) => {
				const existingFileNames = new Set(prevFiles.map((f) => f.name))
				const uniqueNewFiles = newFiles.filter((file) => !existingFileNames.has(file.name))
				return [...prevFiles, ...uniqueNewFiles]
			})
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = ""
		}
	}

	const validateForm = (): boolean => {
		const newErrors: ValidationErrors = {}

		REQUIRED_FIELDS.forEach((field) => {
			const error = validateField(field, rfpData[field as keyof RfpData] as string)
			if (error) newErrors[field] = error
		})

		// Validate optional fields for format if they have values
		if (rfpData.source_path) {
			const sourceError = validateField("source_path", rfpData.source_path)
			if (sourceError) newErrors.source_path = sourceError
		}

		if (rfpData.naics_code) {
			const naicsError = validateField("naics_code", rfpData.naics_code)
			if (naicsError) newErrors.naics_code = naicsError
		}

		const dateErrors = validateDateLogic(rfpData.posted_date, rfpData.due_date)
		Object.assign(newErrors, dateErrors)

		if (files.length === 0) {
			newErrors.files = ERROR_MESSAGES.noFiles
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validateForm()) return

		setIsLoading(true)
		try {
			rfpData.captured_date = new Date().toISOString().split("T")[0]
			// Only set rfp_id_version if rfp_id is provided
			if (rfpData.rfp_id?.trim()) {
				rfpData.rfp_id_version = rfpData.rfp_id + "-0"
			}
			await onSave(rfpData, files)
			toast.success("Proposal added successfully!")
		} finally {
			setIsLoading(false)
		}
	}

	const handleClear = () => {
		setRfpData({
			...INITIAL_RFP_DATA,
			captured_date: new Date().toISOString().split("T")[0],
		})
		setFiles([])
		setErrors({})
		if (fileInputRef.current) {
			fileInputRef.current.value = ""
		}
	}

	const removeFile = (fileName: string) => {
		setFiles(files.filter((f) => f.name !== fileName))
		if (files.length > 1 && errors.files) {
			setErrors((prev) => ({ ...prev, files: "" }))
		}
	}

	return (
		<DialogContent className="max-w-5xl min-w-[858px] h-[95vh] flex flex-col p-0 gap-0">
			<DialogHeader className="flex items-center pt-4 pb-2 px-4 border-b-0">
				<div className="flex items-center w-full">
					<DocumentUpload size="20" className="text-[#121821] mr-2" />
					<DialogTitle className="text-[#121821] text-sm font-bold">Add new opportunity</DialogTitle>
				</div>
			</DialogHeader>

			<div className="grow overflow-hidden px-4 py-4">
				<form onSubmit={handleSubmit} className="h-full flex flex-col space-y-4">
					{/* Title */}
					<div className="flex flex-col items-start self-stretch">
						<input
							name="title"
							type="text"
							value={rfpData.title}
							onChange={handleChange}
							placeholder="Add title"
							className={`w-full p-2.5 focus:border-[#5151D0] text-[#121822] text-lg font-bold focus:outline-none focus:ring-0 transition-colors placeholder:text-slate-400 placeholder:font-normal placeholder:text-base ${
								errors.title ? "border-b-2 border-red-500" : "border-b border-slate-300"
							}`}
							required
						/>
						{errors.title && <span className="text-red-500 text-xs mt-1">{errors.title}</span>}
					</div>

					{/* Description */}
					<div className="flex flex-col items-start self-stretch">
						<textarea
							name="description"
							value={rfpData.description}
							onChange={handleChange}
							placeholder="Add description..."
							className={`w-full p-2.5 focus:border-[#5151D0] text-[#121822] text-sm focus:outline-none focus:ring-0 h-28 resize-none overflow-y-auto transition-colors placeholder:text-slate-400 ${
								errors.description ? "border-2 border-red-500" : ""
							} rounded-md`}
							rows={4}
							required
						/>
						{errors.description && <span className="text-red-500 text-xs mt-1">{errors.description}</span>}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
						{/* ID - Now Optional */}
						<div className="flex flex-col">
							<div
								className={`flex items-center bg-white rounded-md border border-solid ${
									errors.rfp_id ? "border-red-500" : "border-[#C5D0DC]"
								}`}
								style={{ boxShadow: "1px 1px 1px #F6F6F6" }}
							>
								<div className="flex shrink-0 items-center bg-gray-50 py-1.5 pl-2 pr-2 gap-1 rounded-l-md border-r border-[#C5D0DC]">
									<Hashtag size="16" className="text-[#6D7C91]" />
									<span className="text-[#6D7C91] text-xs font-medium">ID</span>
								</div>
								<input
									type="text"
									name="rfp_id"
									value={rfpData.rfp_id}
									onChange={handleChange}
									placeholder="e.g., AD123-24 (optional)"
									className="grow p-[7px] text-xs text-[#2D3748] rounded-r-md focus:outline-none placeholder:text-slate-400"
								/>
							</div>
							{errors.rfp_id && <span className="text-red-500 text-xs mt-1">{errors.rfp_id}</span>}
						</div>

						{/* Type */}
						<div className="flex flex-col">
							<div
								className={`flex items-center bg-white rounded-md border border-solid ${
									errors.opportunity_type ? "border-red-500" : "border-[#C5D0DC]"
								}`}
								style={{ boxShadow: "1px 1px 1px #F6F6F6" }}
							>
								<div className="flex shrink-0 items-center bg-gray-50 py-1.5 pl-2 pr-2 gap-1 rounded-l-md border-r border-[#C5D0DC]">
									<Category2 size="16" className="text-[#6D7C91]" />
									<span className="text-[#6D7C91] text-xs font-medium">
										Type <span className="text-red-500">*</span>
									</span>
								</div>
								<select
									name="opportunity_type"
									value={rfpData.opportunity_type}
									onChange={handleChange}
									className="grow p-[7px] text-xs text-[#2D3748] rounded-r-md focus:outline-none bg-white appearance-none"
									required
								>
									<option value="" disabled>
										Select type
									</option>
									<option value="RFP">RFP</option>
									<option value="RFQ">RFQ</option>
									<option value="RFI">RFI</option>
									<option value="Sources Sought">Sources Sought</option>
									<option value="Grant">Grant</option>
									<option value="Other">Other</option>
								</select>
							</div>
							{errors.opportunity_type && (
								<span className="text-red-500 text-xs mt-1">{errors.opportunity_type}</span>
							)}
						</div>

						{/* Posted Date - Now Optional */}
						<div className="flex flex-col">
							<div
								className={`flex items-center bg-white rounded-md border border-solid ${
									errors.posted_date ? "border-red-500" : "border-[#C5D0DC]"
								}`}
								style={{ boxShadow: "1px 1px 1px #F6F6F6" }}
							>
								<div className="flex shrink-0 items-center bg-gray-50 py-1.5 pl-2 pr-2 gap-1 rounded-l-md border-r border-[#C5D0DC]">
									<CalendarEdit size="16" className="text-[#6D7C91]" />
									<span className="text-[#6D7C91] text-xs font-medium">Posted</span>
								</div>
								<input
									type="date"
									name="posted_date"
									value={rfpData.posted_date}
									onChange={handleChange}
									max={rfpData.due_date || undefined}
									className="grow p-[7px] text-xs text-[#2D3748] rounded-r-md focus:outline-none placeholder:text-slate-400 scheme-light dark:scheme-dark"
								/>
							</div>
							{errors.posted_date && (
								<span className="text-red-500 text-xs mt-1">{errors.posted_date}</span>
							)}
						</div>

						{/* Due Date */}
						<div className="flex flex-col">
							<div
								className={`flex items-center bg-white rounded-md border border-solid ${
									errors.due_date ? "border-red-500" : "border-[#C5D0DC]"
								}`}
								style={{ boxShadow: "1px 1px 1px #F6F6F6" }}
							>
								<div className="flex shrink-0 items-center bg-gray-50 py-1.5 pl-2 pr-2 gap-1 rounded-l-md border-r border-[#C5D0DC]">
									<CalendarTick size="16" className="text-[#6D7C91]" />
									<span className="text-[#6D7C91] text-xs font-medium">
										Due <span className="text-red-500">*</span>
									</span>
								</div>
								<input
									type="date"
									name="due_date"
									value={rfpData.due_date}
									onChange={handleChange}
									min={rfpData.posted_date || undefined}
									className="grow p-[7px] text-xs text-[#2D3748] rounded-r-md focus:outline-none placeholder:text-slate-400 scheme-light dark:scheme-dark"
									required
								/>
							</div>
							{errors.due_date && <span className="text-red-500 text-xs mt-1">{errors.due_date}</span>}
						</div>

						{/* Source URL */}
						<div className="flex flex-col sm:col-span-2">
							<div
								className={`flex items-center bg-white rounded-md border border-solid ${
									errors.source_path ? "border-red-500" : "border-[#C5D0DC]"
								}`}
								style={{ boxShadow: "1px 1px 1px #F6F6F6" }}
							>
								<div className="flex shrink-0 items-center bg-gray-50 py-1.5 pl-2 pr-2 gap-1 rounded-l-md border-r border-[#C5D0DC]">
									<Link21 size="16" className="text-[#6D7C91]" />
									<span className="text-[#6D7C91] text-xs font-medium">
										Original Source <span className="text-red-500">*</span>
									</span>
								</div>
								<input
									type="url"
									name="source_path"
									value={rfpData.source_path}
									onChange={handleChange}
									placeholder="https://example.com/rfp"
									className="grow p-[7px] text-xs text-[#2D3748] rounded-r-md focus:outline-none placeholder:text-slate-400"
									required
								/>
							</div>
							{errors.source_path && (
								<span className="text-red-500 text-xs mt-1">{errors.source_path}</span>
							)}
						</div>
					</div>

					{/* Additional fields */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 mt-3">
						<div>
							<label className="text-[#4A5568] text-xs font-medium mb-0.5 block">
								Agency Name <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="agency_name"
								value={rfpData.agency_name}
								onChange={handleChange}
								placeholder="e.g., Dept. of Technology"
								className={`w-full p-2 text-xs border rounded-md focus:ring-1 focus:ring-[#5151D0] focus:border-[#5151D0] transition-shadow ${
									errors.agency_name ? "border-red-500" : "border-slate-300"
								}`}
								required
							/>
							{errors.agency_name && (
								<span className="text-red-500 text-xs mt-1">{errors.agency_name}</span>
							)}
						</div>
						<div>
							<label className="text-[#4A5568] text-xs font-medium mb-0.5 block">
								State / Territory <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="state"
								value={rfpData.state}
								onChange={handleChange}
								placeholder="e.g., CA, Texas"
								className={`w-full p-2 text-xs border rounded-md focus:ring-1 focus:ring-[#5151D0] focus:border-[#5151D0] transition-shadow ${
									errors.state ? "border-red-500" : "border-slate-300"
								}`}
								required
							/>
							{errors.state && <span className="text-red-500 text-xs mt-1">{errors.state}</span>}
						</div>
						<div>
							<label className="text-[#4A5568] text-xs font-medium mb-0.5 block">
								NAICS Code <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="naics_code"
								value={rfpData.naics_code}
								onChange={handleChange}
								placeholder="e.g., 541511"
								className={`w-full p-2 text-xs border rounded-md focus:ring-1 focus:ring-[#5151D0] focus:border-[#5151D0] transition-shadow ${
									errors.naics_code ? "border-red-500" : "border-slate-300"
								}`}
								required
							/>
							{errors.naics_code && (
								<span className="text-red-500 text-xs mt-1">{errors.naics_code}</span>
							)}
						</div>
					</div>

					{/* File Upload */}
					<div className="flex flex-col items-start self-stretch gap-2 grow min-h-0">
						<h3 className="text-[#121822] text-sm font-bold">Add solicitation files</h3>
						<input
							type="file"
							ref={fileInputRef}
							multiple
							onChange={handleFileChange}
							className="hidden"
							accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.zip,.zipx,.tgz,.gz,.tar"
						/>
						{errors.files && <span className="text-red-500 text-xs">{errors.files}</span>}
						{files.length > 0 && (
							<div className="grow w-full space-y-1.5 self-stretch min-h-0 overflow-y-auto rounded-md">
								{files.map((file, index) => (
									<div
										key={`${file.name}-${index}`}
										className="flex items-center self-stretch bg-white py-1.5 px-2 gap-3 rounded-lg border border-slate-200 hover:shadow-sm transition-shadow"
									>
										<div className="p-[8px] bg-[#EDF2F7] rounded-md">
											<DocumentText size="16" className="text-slate-500" />
										</div>
										<div className="flex flex-1 flex-col items-start">
											<span
												className="text-black text-sm font-semibold truncate text-ellipsis"
												title={file.name}
											>
												{truncateFilename(file.name, 30)}
											</span>
											<span className="text-[#6D7C91] text-xs">
												{(file.size / 1024).toFixed(1)} KB
											</span>
										</div>
										<button
											type="button"
											onClick={() => removeFile(file.name)}
											className="text-red-500 hover:text-red-700"
										>
											<CloseSquare size={20} />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</form>
			</div>

			{/* Footer */}
			<div className="flex flex-col sm:flex-row justify-between items-center gap-2 p-3.5 border-t border-slate-200 bg-white rounded-b-lg">
				<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
					<Button
						type="button"
						variant="outline"
						className="flex items-center gap-1 text-[#5151D0] border-[#5151D0] hover:bg-[#5151D0]/10 py-[7px] px-3 text-xs font-bold rounded-md transition-colors w-full sm:w-auto"
						onClick={() => fileInputRef.current?.click()}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
							<g clipPath="url(#clip0_140_13658)">
								<path
									d="M10.6666 10.6667L7.99997 8.00007M7.99997 8.00007L5.33331 10.6667M7.99997 8.00007V14.0001M13.5933 12.2601C14.2435 11.9056 14.7572 11.3447 15.0532 10.6658C15.3493 9.98698 15.4108 9.22889 15.2281 8.5112C15.0454 7.7935 14.629 7.15708 14.0444 6.70237C13.4599 6.24766 12.7406 6.00056 12 6.00007H11.16C10.9582 5.21956 10.5821 4.49496 10.0599 3.88073C9.5378 3.2665 8.8832 2.77864 8.14537 2.45381C7.40754 2.12898 6.60567 1.97564 5.80005 2.00533C4.99443 2.03501 4.20602 2.24694 3.49409 2.62518C2.78216 3.00342 2.16525 3.53814 1.68972 4.18913C1.2142 4.84011 0.892434 5.59043 0.748627 6.38367C0.60482 7.17691 0.64271 7.99242 0.859449 8.76891C1.07619 9.5454 1.46613 10.2626 1.99997 10.8667"
									stroke="#5151D0"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</g>
							<defs>
								<clipPath id="clip0_140_13658">
									<rect width="16" height="16" fill="white" />
								</clipPath>
							</defs>
						</svg>
						Upload file{files.length > 0 ? "s" : ""}
					</Button>
					<Button
						type="button"
						variant="outline"
						className="flex items-center gap-1 text-slate-600 border-slate-300 hover:bg-slate-50 py-[7px] px-3 text-xs font-bold rounded-md transition-colors w-full sm:w-auto"
						onClick={handleClear}
						disabled={isLoading}
					>
						<Refresh size="16" />
						Clear
					</Button>
				</div>
				<Button
					type="submit"
					className="grow sm:grow-0 justify-center bg-[#5151D0] hover:bg-[#5151D0]/90 text-white flex items-center gap-1.5 py-[7px] px-3 text-xs rounded-md transition-transform hover:scale-[1.02] focus:ring-2 focus:ring-offset-1 focus:ring-[#5151D0]"
					onClick={handleSubmit}
					disabled={isLoading}
				>
					{isLoading ? (
						<>
							<svg
								className="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Saving...
						</>
					) : (
						<>
							Save & start drafting
							<ArrowRight variant="Linear" size="16" />
						</>
					)}
				</Button>
			</div>
		</DialogContent>
	)
}

export default AddNewProposalModal
