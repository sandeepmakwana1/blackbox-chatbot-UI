import { BookmarkIcon } from "lucide-react"
import React from "react"
import { Button } from "~/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog"

interface SaveChangesModalProps {
	isOpen: boolean
	onSave: () => void
	onCancel: () => void
	onClose: () => void
}

const SaveChangesModal: React.FC<SaveChangesModalProps> = ({ isOpen, onSave, onCancel, onClose }) => {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="w-93 max-w-md" showCloseButton={false}>
				<DialogHeader>
					<div className="flex flex-col items-left gap-y-4">
						<div className="p-2.5 bg-danger-100 h-full w-fit rounded-[10px]">
							<BookmarkIcon size={24} className="text-danger-300" />
						</div>
						<DialogTitle className="text-md font-medium text-gray-900">Proceed without saving?</DialogTitle>
					</div>
					<DialogDescription className="text-sm text-neutral-700 text-left">
						Changes made in this section haven't been saved.
						<br />
						Do you want to continue without saving?
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<div className="flex flex-col items-center w-full gap-2">
						<Button onClick={onSave} className="w-full">
							Save & proceed
						</Button>
						<Button
							onClick={onClose}
							className="bg-white border border-neutral-400 text-neutral-700 hover:bg-neutral-400 w-full"
						>
							Keep Editing
						</Button>
						<Button
							onClick={onCancel}
							className="bg-white border border-red-400 text-red-700 hover:bg-red-400 w-full"
						>
							Discard Changes
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default SaveChangesModal
