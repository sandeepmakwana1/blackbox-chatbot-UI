import { useState, useRef } from "react"
import { Button } from "~/components/ui/button"
import { DocumentUpload, DocumentText, CloseSquare, Magicpen, Grid6 } from "iconsax-reactjs"
import { truncateFilename } from "~/lib/utils"
import { toast } from "sonner"
import { useCostingStore } from "~/store/costingStore" // Import our store
import { Upload } from "lucide-react"

interface CostImageUploadProps {
	source_id: number
}

const CostImageUpload: React.FC<CostImageUploadProps> = ({ source_id }) => {
	const [files, setFiles] = useState<File[]>([])
	const [isDragOver, setIsDragOver] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Get the loading state and upload action from the store
	const { isUploading, uploadCostImages } = useCostingStore()

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files)
			addFiles(newFiles)
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = ""
		}
	}

	const addFiles = (newFiles: File[]) => {
		const imageFiles = newFiles.filter(
			(file) => file.type.startsWith("image/") && ["image/jpeg", "image/png", "image/gif"].includes(file.type)
		)

		if (imageFiles.length !== newFiles.length) {
			toast.error("Only JPG, PNG, and GIF files are supported")
		}

		setFiles((prevFiles) => {
			const existingFileNames = new Set(prevFiles.map((f) => f.name))
			const uniqueNewFiles = imageFiles.filter((file) => !existingFileNames.has(file.name))
			return [...prevFiles, ...uniqueNewFiles]
		})
	}

	const removeFile = (fileName: string) => {
		setFiles((prevFiles) => prevFiles.filter((f) => f.name !== fileName))
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(true)
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)
		const droppedFiles = Array.from(e.dataTransfer.files)
		addFiles(droppedFiles)
	}

	const handleUpload = async () => {
		if (files.length === 0) {
			toast.error("Please select at least one image file")
			return
		}

		await uploadCostImages(source_id, files)
		setFiles([])
	}

	const handleBrowseClick = () => {
		fileInputRef.current?.click()
	}

	return (
		<div className="flex flex-col bg-white py-3 px-46 gap-4 rounded-[8px] h-[calc(100vh-200px)]">
			{/* Header */}
			<div className="flex items-center justify-between self-stretch ">
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-[7px] bg-neutral-900 p-1.5">
						<Grid6 size={14} color="#ffffff" />
					</div>

					<span className="text-neutral-900 text-sm font-medium">Smart cost sheet analysis</span>
				</div>

				{files.length > 0 && (
					<div className="flex justify-center">
						<Button
							size="sm"
							className="bg-gradient-to-r from-[#5151D0] to-[#D4358F] text-white hover:opacity-90 "
							onClick={handleUpload}
							disabled={isUploading}
						>
							{isUploading ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
									Processing...
								</>
							) : (
								<>
									<Magicpen size={16} />
									Generate cost sheet
								</>
							)}
						</Button>
					</div>
				)}
			</div>

			{/* Upload Area */}
			<div
				className={`flex flex-col self-stretch p-2 gap-6 rounded-[10px] border border-dashed border-neutral-500 transition-colors ${
					isDragOver ? "bg-blue-50 border-[#5151D0] border-2" : "bg-gray-50 border-[#C5D0DC]"
				}`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				<div className="flex flex-col items-center self-stretch gap-3 pt-8">
					<Grid6 size={24} color="#92A0B5" />
					<div className="flex flex-col self-stretch gap-1">
						<span className="text-neutral-900 text-sm font-medium text-center">
							Drag & drop images here or click to browse
						</span>
						<span className="text-neutral-700 text-sm text-center">
							Upload a clear image of your cost table to generate a complete, <br /> AI-powered cost sheet
							for your proposal.
						</span>
					</div>
				</div>

				<div className="flex flex-col items-center self-stretch pb-8 gap-1.5">
					<input
						type="file"
						ref={fileInputRef}
						multiple
						onChange={handleFileChange}
						className="hidden"
						accept="image/jpeg,image/png,image/gif,.jpg,.png,.gif"
					/>
					<Button variant="primary" onClick={handleBrowseClick} disabled={isUploading}>
						<Upload />
						Upload images
					</Button>
					<span className="text-[#76859B] text-xs text-center">Supported formats: JPG, PNG, GIF</span>
				</div>
			</div>

			{/* Uploaded Files */}
			{files.length > 0 && (
				<div className="flex flex-col items-start self-stretch gap-1">
					<span className="text-neutral-900 text-sm font-medium">Uploaded images ({files.length})</span>
					<div className="flex flex-col self-stretch">
						{files.map((file, index) => (
							<div
								key={`${file.name}-${index}`}
								className="flex items-center justify-between self-stretch bg-white text-left pl-2 py-1.5 pr-4 gap-3 rounded-[8px] hover:bg-neutral-100 transition-colors"
							>
								<div className="flex items-center gap-2">
									<div className="p-1.5 bg-neutral-300 rounded-[8px] hover:bg-neutral-400 ">
										<DocumentText size={16} color="#76869C" />
									</div>
									<span className="text-neutral-900 text-sm font-medium truncate" title={file.name}>
										{truncateFilename(file.name, 40)}
									</span>
								</div>

								<button
									type="button"
									onClick={() => removeFile(file.name)}
									className="text-danger-300 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={isUploading}
								>
									<CloseSquare size={16} />
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default CostImageUpload
