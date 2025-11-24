import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Warning2 } from "iconsax-reactjs"

interface TopicSelectionConfirmDialogProps {
	open: boolean
	onClose: () => void
	onConfirm: () => void
	deepResearchEnabled: boolean
	isLoading?: boolean
}

const TopicSelectionConfirmDialog: React.FC<TopicSelectionConfirmDialogProps> = ({
	open,
	onClose,
	onConfirm,
	deepResearchEnabled,
	isLoading = false,
}) => {
	const getDialogContent = () => {
		if (deepResearchEnabled) {
			return {
				icon: <Warning2 size={24} className="text-warning-400" />,
				iconBg: "bg-warning-100",
				title: "Proceed to next step?",
				description:
					"Once you proceed, Deep Research will start based on your current selections. You can still view them later, but no further edits will be allowed.",
				continueButtonText: "Yes, proceed",
				continueButtonColor: "",
				hoverEffect: "",
			}
		} else {
			return {
				icon: <Warning2 size={24} className="text-danger-300" />,
				iconBg: "bg-danger-100",
				title: "Skip deep research?",
				description:
					"Deep Research generates detailed and tailored proposals based on your selected topics. Skipping it will lead to a more general proposal without topic-specific insights.",
				continueButtonText: "Yes, proceed",
				continueButtonColor: "bg-danger-300",
				hoverEffect: "bg-danger-200",
			}
		}
	}

	const { icon, iconBg, title, description, continueButtonText, continueButtonColor, hoverEffect } =
		getDialogContent()

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent showCloseButton={false} className="w-93 max-w-md">
				<DialogHeader>
					<div className="flex flex-col items-left gap-y-4">
						<div className={`p-2.5 ${iconBg} h-full w-fit rounded-[10px]`}>{icon}</div>

						<DialogTitle className="text-md font-medium text-gray-900">{title}</DialogTitle>
					</div>
					<DialogDescription className="text-sm text-neutral-700 text-left">{description}</DialogDescription>
				</DialogHeader>

				<div className="flex gap-2 justify-between">
					<Button variant="secondary" onClick={onClose} className="w-[49%]">
						Cancel
					</Button>
					<Button
						variant="primary"
						onClick={onConfirm}
						className={`${continueButtonColor} hover:${hoverEffect} w-[49%]`}
						disabled={isLoading}
					>
						{isLoading ? "Processing..." : continueButtonText}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default TopicSelectionConfirmDialog
