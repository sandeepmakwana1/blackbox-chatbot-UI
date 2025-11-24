import React from "react"
import { Download } from "lucide-react"
import { Verify } from "iconsax-reactjs"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader } from "~/components/ui/dialog"
import type { ExcelLinkResponse } from "~/types/costing"
import AssetsManager from "~/lib/AssetsManager"

interface SuccessDialogProps {
	isOpen: boolean
	onClose: () => void
	data: ExcelLinkResponse | null
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({ isOpen, onClose, data }) => {
	const handleOpenInExcel = () => {
		if (data?.google_sheet_url) {
			window.open(data.google_sheet_url, "_blank")
		}
	}

	const handleDownload = () => {
		if (data?.download_url) {
			const link = document.createElement("a")
			link.href = data.download_url
			link.download = ""
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-93 px-5 py-6">
				<DialogHeader className="flex gap-4">
					<div className="bg-success-200 rounded-lg p-2.5 w-fit">
						<Verify className="text-success-700" variant="Bold" />
					</div>
					<div>
						<h3 className="text-md font-semibold text-neutral-900">Cost sheet generated successfully!</h3>
						<p className="text-sm text-neutral-700">
							You can now download the Cost sheet or open it in Microsoft Excel.
						</p>
					</div>
				</DialogHeader>

				<div>
					<div className="flex flex-col gap-3">
						<Button
							onClick={handleOpenInExcel}
							variant="outline"
							className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-neutral-700"
							disabled={!data?.google_sheet_url}
						>
							<img
								src={AssetsManager.COSTING_EXPORT_EXCEL_ICON}
								alt="Playground Header Icon"
								className="w-5 h-5"
							/>
							Open in Google Sheets
						</Button>

						<Button
							onClick={handleDownload}
							className="flex items-center justify-center gap-2 w-full px-3 py-2.5"
							disabled={!data?.download_url}
						>
							<Download size={16} />
							Download
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default SuccessDialog
