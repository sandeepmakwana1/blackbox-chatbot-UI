import { ArrowRight } from "iconsax-reactjs"
import { Check, X } from "lucide-react"
import React, { useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "~/components/ui/dialog"
import { useGetCostingExcelSheets, postCostingExcelSheets } from "~/handlers/contentGenerationHandlers"
import type { ExcelLinkResponse } from "~/types/costing"
import AssetsManager from "~/lib/AssetsManager"
import type { SelectedFile } from "~/types/costing"
import SuccessDialog from "./SuccessDialog"
import { Loader } from "~/components/ui/loader"

interface FileExportDialogProps {
	isOpen: boolean
	onClose: () => void
	sourceId: string
}

const doesFileHaveSheets = (file: { file_name: string; sheets: string[] }): boolean => {
	const extension = file.file_name.split(".").pop()?.toLowerCase()
	if (extension === "xlsx" || extension === "xls") {
		if (file.sheets.length > 0 && !file.sheets[0].startsWith("Error")) {
			return true
		}
		return false
	}
	return false
}

const FileExportDialog: React.FC<FileExportDialogProps> = ({ isOpen, onClose, sourceId }) => {
	const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
	const [step, setStep] = useState<"select-file" | "select-sheets">("select-file")
	const [isApiWaiting, setIsApiWaiting] = useState(false)

	const [showSuccessDialog, setShowSuccessDialog] = useState(false)
	const [successData, setSuccessData] = useState<ExcelLinkResponse | null>(null)

	const { data: excelSheets, error, isLoading } = useGetCostingExcelSheets(sourceId, true)

	const handleFileSelect = (fileName: string) => {
		if (!excelSheets?.files) return

		const file = excelSheets.files.find((f) => f.file_name === fileName)
		if (!file) return

		if (doesFileHaveSheets(file)) {
			setSelectedFile({
				file_name: fileName,
				sheet_names: [],
			})
			setStep("select-sheets")
		} else {
			setSelectedFile({
				file_name: fileName,
				sheet_names: [],
			})
			setStep("select-file")
		}
	}

	const handleSheetToggle = (sheetName: string) => {
		if (!selectedFile) return

		setSelectedFile((prev) => {
			if (!prev) return null
			const isSelected = prev.sheet_names.includes(sheetName)
			return {
				...prev,
				sheet_names: isSelected
					? prev.sheet_names.filter((s) => s !== sheetName)
					: [...prev.sheet_names, sheetName],
			}
		})
	}

	const handleGenerate = async () => {
		try {
			setIsApiWaiting(true)
			const res = await postCostingExcelSheets(sourceId, selectedFile!)
			setIsApiWaiting(false)
			setSuccessData(res)
			setShowSuccessDialog(true)
		} catch (error) {
			setIsApiWaiting(false)
			console.error("Error generating cost sheet:", error)
		}
	}

	const handleClose = () => {
		setSelectedFile(null)
		setStep("select-file")
		setShowSuccessDialog(false)
		setSuccessData(null)
		onClose()
	}

	const handleSuccessDialogClose = () => {
		setShowSuccessDialog(false)
		setSuccessData(null)
		handleClose()
	}

	const getSelectedFileObject = () => {
		if (!selectedFile || !excelSheets?.files) return null
		return excelSheets.files.find((f) => f.file_name === selectedFile.file_name)
	}

	const getDialogContent = () => {
		if (isLoading) {
			return (
				<>
					<DialogHeader className="gap-0">
						<h3 className="text-md font-semibold text-neutral-900">Export proposal costing</h3>
						<p className="text-sm text-neutral-700">Loading excel documents...</p>
					</DialogHeader>
					<div className="flex justify-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					</div>
				</>
			)
		}

		if (error) {
			return (
				<>
					<DialogHeader className="gap-0">
						<h3 className="text-md font-semibold text-neutral-900">Export proposal costing</h3>
						<p className="text-sm text-red-600">Error loading excel documents. Please try again.</p>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={handleClose} variant="outline">
							Close
						</Button>
					</DialogFooter>
				</>
			)
		}

		// Empty state
		if (!excelSheets?.files || excelSheets.files.length === 0) {
			return (
				<>
					<DialogHeader className="gap-0">
						<h3 className="text-md font-semibold text-neutral-900">Export proposal costing</h3>
						<p className="text-sm text-neutral-700">No excel documents found for this source.</p>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={handleClose} variant="outline">
							Close
						</Button>
					</DialogFooter>
				</>
			)
		}

		// Main content state
		return (
			<>
				<DialogHeader className="gap-0">
					<h3 className="text-md font-semibold text-neutral-900">Export proposal costing</h3>
					<p className="text-sm text-neutral-700">
						Choose an excel document and spreadsheets to generate cost sheet.
					</p>
				</DialogHeader>

				<div className="flex flex-col gap-1.5 h-96 overflow-y-auto custom-scrollbar">
					{excelSheets.files.map((file, index) => {
						const isSelected = selectedFile?.file_name === file.file_name
						const showSheets = step === "select-sheets" && isSelected

						return (
							<div key={file.file_name} className="w-full">
								<div
									className={`
										w-full px-4 py-3 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col gap-2
										${showSheets ? "border-primary" : "border-neutral-300 hover:border-neutral-500"}
									`}
									onClick={() => handleFileSelect(file.file_name)}
									style={isSelected ? { boxShadow: "1px 2px 3px 0 #E3E8F3" } : {}}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<img
												src={AssetsManager.COSTING_EXPORT_EXCEL_ICON}
												alt="Excel Icon"
												className="w-5 h-5 flex-shrink-0"
											/>
											<span className="text-sm font-medium text-neutral-800 truncate">
												{file.file_name}
											</span>
										</div>

										<div
											className={`
											w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
											${isSelected ? "border-primary border-6" : "border-neutral-500"}
										`}
										></div>
									</div>

									{showSheets && doesFileHaveSheets(file) && (
										<div className=" pl-8 flex flex-wrap gap-2">
											{file.sheets.map((sheet, sheetIndex) => {
												const isSheetSelected = selectedFile?.sheet_names.includes(sheet)
												return (
													<div
														key={sheetIndex}
														className={`
																rounded-full text-xs px-3 py-1 h-auto flex gap-1 items-center cursor-pointer border transition-all duration-200
																${
																	isSheetSelected
																		? "bg-primary-100 border-primary-200 text-primary"
																		: "border-neutral-400 text-neutral-700 hover:border-neutral-500"
																}
															`}
														onClick={(e) => {
															e.stopPropagation()
															handleSheetToggle(sheet)
														}}
													>
														<Check
															size={12}
															strokeWidth={2}
															className={isSheetSelected ? "opacity-100" : "opacity-60"}
														/>
														{sheet}
													</div>
												)
											})}
										</div>
									)}
								</div>
							</div>
						)
					})}
				</div>

				<DialogFooter>
					<Button
						onClick={handleGenerate}
						disabled={
							isApiWaiting ||
							!selectedFile ||
							!excelSheets?.files ||
							(() => {
								const selectedFileObj = getSelectedFileObject()
								return (
									selectedFileObj &&
									doesFileHaveSheets(selectedFileObj) &&
									selectedFile.sheet_names.length === 0
								)
							})()
						}
					>
						{isApiWaiting ? (
							<>
								<Loader size="sm" variant="neutral" />
								Generating...
							</>
						) : (
							<>
								Generate cost sheet
								<ArrowRight />
							</>
						)}
					</Button>
				</DialogFooter>
			</>
		)
	}

	return (
		<>
			{/* Main File Export Dialog */}
			<Dialog open={isOpen && !showSuccessDialog} onOpenChange={handleClose}>
				<DialogContent
					className="max-w-2xl w-full"
					showCloseButton={!isApiWaiting}
					onInteractOutside={(e) => {
						if (isApiWaiting) {
							e.preventDefault()
						}
					}}
					onEscapeKeyDown={(e) => {
						if (isApiWaiting) {
							e.preventDefault()
						}
					}}
				>
					{getDialogContent()}
				</DialogContent>
			</Dialog>

			{/* Success Dialog */}
			<SuccessDialog isOpen={showSuccessDialog} onClose={handleSuccessDialogClose} data={successData} />
		</>
	)
}

export default FileExportDialog
