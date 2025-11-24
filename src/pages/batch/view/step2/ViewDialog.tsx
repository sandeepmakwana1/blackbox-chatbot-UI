import { format, parseISO } from "date-fns"
import { Verify } from "iconsax-reactjs"
import type { ReactNode } from "react"
import { Badge } from "~/components/ui/badge"
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader, VisuallyHidden } from "~/components/ui/dialog"
import ValidateViewTabs from "~/pages/validation/view/ValidationViewTabs"
import type { ValidationItem } from "~/types/batch"

interface ValidationItemDialogProps {
	children: ReactNode
	source_id: number
	item: ValidationItem
}

export function ValidationItemDialog({ children, source_id, item }: ValidationItemDialogProps) {
	const formatDate = (dateString: string) => {
		try {
			const date = parseISO(dateString)
			return format(date, "MMM dd, yyyy")
		} catch {
			return "Invalid Date"
		}
	}
	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>

			<DialogContent
				className="max-w-[95vw] w-full h-[95vh] p-0 flex flex-col overflow-hidden"
				closeButtonClassName="top-7 right-7 z-10"
			>
				<DialogHeader className="pt-4 px-4">
					<div className="flex flex-col gap-1.5 pb-4 pl-4 pt-3 pr-3 border border-neutral-300 rounded-xl">
						<div className="flex gap-1 items-center">
							<Badge>ID:: {item.rfp_id}</Badge>
							<Badge variant="dangerTransparent" dot>
								{formatDate(item.due_date)}
							</Badge>
							<Badge variant="success">
								<Verify variant="Bold" size={12} />
								<p>{item.validation_score}% Relevant</p>
							</Badge>
						</div>
						<div className="flex flex-col truncate">
							<p className="text-sm font-semibold text-neutral-900">{item.title}</p>
							<p className="text-xs font-medium text-neutral-600">{item.agency_name}</p>
						</div>
					</div>
				</DialogHeader>
				<VisuallyHidden>
					<DialogTitle>Overview</DialogTitle>
				</VisuallyHidden>
				<ValidateViewTabs source_id={source_id} isBatch />
			</DialogContent>
		</Dialog>
	)
}
