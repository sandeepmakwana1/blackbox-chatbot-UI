import { format, parseISO } from "date-fns"
import { motion } from "framer-motion"
import { Calendar2, Eye, Trash, Verify } from "iconsax-reactjs"
import { AlertTriangle, ArrowUpRight, Check, LoaderIcon } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import IconWrapper from "~/components/ui/iconWrapper"
import { Loader } from "~/components/ui/loader"
import { getRelevantBadgeVariant } from "~/lib/utils"
import { ValidationItemDialog } from "~/pages/batch/view/step2/ViewDialog"
import type { ValidationItem } from "~/types/batch"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { cn } from "~/lib/utils"

interface InnerBatchItemProps {
	item: ValidationItem
	onDelete?: () => void
	isLoading?: boolean
	isValidating?: boolean
	isFailed?: boolean
	isDrafting?: boolean
	draftingStatus?: "processing" | "success" | "failed"
	isReadOnly?: boolean
	className?: string
	variant?: "primary" | "secondary"
}

export function InnerBatchItem({
	item,
	onDelete,
	isLoading = false,
	isValidating = false,
	isFailed = false,
	isDrafting = false,
	draftingStatus,
	isReadOnly = false,
	className = "",
	variant = "primary",
}: InnerBatchItemProps) {
	const formatDate = (dateString: string) => {
		try {
			return format(parseISO(dateString), "MMM dd, yyyy")
		} catch {
			return "Invalid Date"
		}
	}

	const statusInfo = {
		processing: {
			bgClass: "batch-in-progress",
			textClass: "text-warning-500",
			Icon: LoaderIcon,
			text: "CONTENT GENERATION IN PROGRESS",
		},
		success: {
			bgClass: "batch-completed-step-2",
			textClass: "text-success-500",
			Icon: Check,
			text: "CONTENT GENERATION COMPLETED",
		},
		failed: {
			bgClass: "batch-failed",
			textClass: "text-danger-400",
			Icon: AlertTriangle,
			text: "CONTENT GENERATION FAILED",
		},
	}

	// Extracted card content to avoid duplication
	const cardContent = (
		<>
			<div className="flex justify-between items-center">
				<div className="font-semibold text-xs text-neutral-700 truncate">ID:: {item.rfp_id}</div>
				<div className="flex items-center">
					{isLoading || isValidating ? (
						<div className="px-1.5 py-0.5">
							<Loader size="sm" variant="yellow" />
						</div>
					) : isDrafting ? (
						<Button
							size="icon-batch"
							variant="ghost"
							onClick={(e) => {
								e.stopPropagation()
								window.open(`/content-generation/${item.source_id}`, "_blank")
							}}
						>
							<ArrowUpRight />
						</Button>
					) : (
						<>
							{!isReadOnly && onDelete && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="icon-batch"
											variant="ghost"
											className="[&_svg]:text-danger-300 hover:[&_svg]:text-danger-400 hover:bg-danger-100"
											onClick={(e) => {
												e.stopPropagation()
												onDelete()
											}}
										>
											<Trash />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Remove item</TooltipContent>
								</Tooltip>
							)}

							{item.validation_score != null && (
								<Tooltip>
									<TooltipTrigger asChild>
										<ValidationItemDialog source_id={item.source_id} item={item}>
											<Button
												size="icon-batch"
												variant="ghost"
												onClick={(e) => e.stopPropagation()}
											>
												<Eye />
											</Button>
										</ValidationItemDialog>
									</TooltipTrigger>
									<TooltipContent>View details</TooltipContent>
								</Tooltip>
							)}
						</>
					)}
				</div>
			</div>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-1">
						<Badge variant="brown">{item.opportunity_type}</Badge>
						<Badge variant="dangerTransparent">
							<IconWrapper strokeWidth={1.5} size={12}>
								<Calendar2 />
							</IconWrapper>
							{formatDate(item.due_date)}
						</Badge>
					</div>
					<div className="flex flex-col min-h-14">
						{item.validation_score != null ? (
							<ValidationItemDialog source_id={item.source_id} item={item}>
								<div
									className={`text-neutral-900  line-clamp-2 cursor-pointer hover:underline ${
										variant === "primary" ? "text-sm" : "text-xs"
									}`}
									onClick={(e) => e.stopPropagation()}
								>
									{item.title}
								</div>
							</ValidationItemDialog>
						) : (
							<div
								className={`text-neutral-900 line-clamp-2 ${
									variant === "primary" ? "text-sm" : "text-xs"
								}`}
							>
								{item.title}
							</div>
						)}
						<div
							className={`text-xs text-neutral-600 line-clamp-1 ${
								variant === "primary" ? "text-sm" : "text-xs"
							}`}
						>
							{item.agency_name}
						</div>
					</div>
				</div>
				<div className="flex items-center justify-between">
					{isValidating ? (
						<Badge variant="warningTransparent" className="[&_svg]:size-3.5 bg-white p-0">
							<LoaderIcon strokeWidth={2} className="text-warning-400 animate-spin" />
							<p>Validation in progress</p>
						</Badge>
					) : item.validation_score != null ? (
						<Badge variant={getRelevantBadgeVariant(item.validation_score)}>
							<Verify variant="Bold" size={12} />
							<p>{item.validation_score}% Relevant</p>
						</Badge>
					) : (
						<Badge variant="neutralTransparent" dot className="bg-transparent px-0 py-0.5">
							Not validated
						</Badge>
					)}

					{isFailed ? (
						<div className="flex gap-1 items-center text-danger-300 text-xs font-medium">
							<AlertTriangle size={12} />
							Failed
						</div>
					) : null}
				</div>
			</div>
		</>
	)

	// Render new layout when draftingStatus is provided
	if (draftingStatus) {
		const { bgClass, textClass, Icon, text } = statusInfo[draftingStatus]
		return (
			<motion.div
				layoutId={`batch-card-${item.source_id}`}
				className={`rounded-2xl w-79 flex flex-col gap-2.5 p-1 pb-2.5 transition-colors duration-200 ${bgClass}`}
				style={{ boxShadow: "2px 2px 6px #D0DEEB5C" }}
			>
				<div
					className={`p-3 flex flex-col gap-6 cursor-pointer rounded-xl ${
						isFailed ? "bg-[#FFFAFA]" : "bg-white"
					}`}
				>
					{cardContent}
				</div>

				<div className={`flex items-center justify-center gap-2 font-semibold text-xs ${textClass}`}>
					<Icon size={16} />
					<span>{text}</span>
				</div>
			</motion.div>
		)
	}

	// Render original layout when draftingStatus is not provided
	return (
		<motion.div
			layoutId={`batch-card-${item.source_id}`}
			className={cn(
				"pt-3 pb-4 pl-4 pr-3 rounded-2xl border border-solid cursor-pointer  flex flex-col transition-colors duration-200",
				isFailed ? "bg-[#FFFAFA] border-[#FBE2E2]" : "bg-white border-neutral-300 hover:border-neutral-500",
				variant === "primary" ? "w-79 h-53.5 gap-8 " : "w-67.75 h-47 gap-4",
				className
			)}
			style={{ boxShadow: "2px 2px 6px #D0DEEB5C" }}
		>
			{cardContent}
		</motion.div>
	)
}
