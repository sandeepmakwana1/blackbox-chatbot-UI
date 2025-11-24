import { Plus } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useBatchStore } from "~/store/batchStore"
import { useValidationItems } from "~/handlers/batchHandler"
import { Loader } from "~/components/ui/loader"
import { Badge } from "~/components/ui/badge"
import { Calendar, Verify } from "iconsax-reactjs"
import { Button } from "~/components/ui/button"
import type { ValidationItem } from "~/types/batch"
import IconWrapper from "~/components/ui/iconWrapper"

const ProcessingCard = ({
	index,
	isSpread,
	totalCards,
	item,
}: {
	index: number
	isSpread: boolean
	totalCards: number
	item: ValidationItem
}) => {
	// Calculate spread positions
	const getSpreadTransform = () => {
		if (!isSpread) {
			return {
				x: 0,
				rotate: index * 2 - 2,
				y: index * 12,
			}
		}

		const cardsPerRow = 5
		const row = Math.floor(index / cardsPerRow)
		const col = index % cardsPerRow
		const spacing = 228 // Card width (212px) + gap (16px)
		const rowSpacing = 240 // Card height (224px) + gap (16px)

		const totalCols = Math.min(totalCards, cardsPerRow)
		const offsetX = ((totalCols - 1) * spacing) / 2
		const offsetY = (Math.ceil(totalCards / cardsPerRow - 1) * rowSpacing) / 2

		return {
			x: col * spacing - offsetX,
			y: row * rowSpacing - offsetY,
			rotate: 0,
		}
	}

	const transform = getSpreadTransform()

	return (
		<motion.div
			layoutId={`batch-card-${item.source_id}`}
			className="absolute bg-white rounded-2xl pt-3 pr-3 pb-4 pl-4 w-53 h-56 border border-neutral-300 shadow-lg flex flex-col justify-between gap-8"
			animate={{
				x: transform.x,
				y: transform.y,
				rotate: transform.rotate,
				scale: isSpread ? 1 : 1,
			}}
			transition={{
				duration: 0.5,
				ease: [0.32, 0.72, 0, 1],
			}}
			style={{
				zIndex: 3 - index,
				transformOrigin: "bottom center",
			}}
		>
			<div className="flex justify-between items-center ">
				<p className="text-xs text-neutral-700 truncate font-semibold">ID:: {item.rfp_id}</p>
				<Loader size="sm" variant="yellow" className="shrink-0" />
			</div>
			<div className="flex flex-col gap-3">
				<div className="flex gap-1 items-start">
					<Badge variant="brown">{item.opportunity_type}</Badge>
					<Badge variant="dangerTransparent">
						<IconWrapper size={12} strokeWidth={2}>
							<Calendar />
						</IconWrapper>
						{item.due_date}
					</Badge>
				</div>
				<div className="flex flex-col items-start">
					<p className="text-neutral-800 text-xs font-semibold line-clamp-3 text-left">{item.title}</p>
					<p className="text-neutral-600 text-xxs text-left">{item.agency_name}</p>
				</div>
				{item.validation_score && (
					<Badge variant="success">
						<Verify variant="Bold" />
						{item.validation_score}% Relevant
					</Badge>
				)}
			</div>
		</motion.div>
	)
}

export const BatchProcessing = () => {
	const { validationIds, goToStep } = useBatchStore()
	const { data: validationItems, isLoading } = useValidationItems(validationIds)
	const [isSpread, setIsSpread] = useState(false)

	const itemsToShow = validationItems?.rfps || []

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsSpread(true)
		}, 3000)
		return () => clearTimeout(timer)
	}, [])

	return (
		<div className="flex-1 flex flex-col h-full custom-scrollbar pb-12 gap-6 items-center justify-center text-center">
			{/* Header */}
			<div className="w-full max-w-4xl px-4 absolute top-10">{/* ... Header content ... */}</div>

			{/* Main Content */}
			{isLoading ? (
				<Loader size="sm" />
			) : (
				<div className="flex flex-col items-center gap-8">
					<div className="relative w-[500px] h-64 flex items-center justify-center">
						{itemsToShow.map((item, index) => (
							<ProcessingCard
								key={item.source_id}
								index={index}
								isSpread={isSpread}
								totalCards={itemsToShow.length}
								item={item}
							/>
						))}
					</div>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5, duration: 0.5 }}
						className="flex flex-col"
					>
						<h1 className="text-md font-semibold text-neutral-900">Batch processing in progress</h1>
						<p className="text-neutral-600 text-sm max-w-md">
							Content generation for the proposals in this batch has been started. You will be able to see
							the results soon.
						</p>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7, duration: 0.5 }}
					>
						<Button
							size="large"
							onClick={() => {
								goToStep("validation")
							}}
						>
							<Plus /> Add more opportunities
						</Button>
					</motion.div>
				</div>
			)}
		</div>
	)
}
