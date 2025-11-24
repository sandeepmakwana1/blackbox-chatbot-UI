import { Skeleton } from "~/components/ui/skeleton"

export const BatchListSkeleton = ({ length = 9 }: { length?: number }) => {
	const numRows = Math.ceil(length / 3)

	return (
		<div className="flex justify-center overflow-y-auto custom-scrollbar">
			<div className="flex flex-col gap-3">
				{Array.from({ length: numRows }).map((_, rowIndex) => {
					const startIndex = rowIndex * 3
					const endIndex = Math.min(startIndex + 3, length)
					const itemsInRow = endIndex - startIndex

					return (
						<div
							key={`row-${rowIndex}`}
							className={`flex gap-3 ${itemsInRow < 3 ? "justify-center" : "justify-start"}`}
						>
							{Array.from({ length: itemsInRow }).map((_, itemIndex) => {
								const globalIndex = startIndex + itemIndex
								return <BatchItemSkeleton key={globalIndex} />
							})}
						</div>
					)
				})}
			</div>
		</div>
	)
}

function BatchItemSkeleton() {
	return (
		<div
			className="bg-white pt-3 pb-4 pl-4 pr-3 rounded-2xl border border-solid border-neutral-300 w-79 h-43.5 flex flex-col gap-6"
			style={{ boxShadow: "2px 2px 6px #D0DEEB5C" }}
		>
			{/* id div skeleton */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-4 w-16" />
				<div className="flex gap-1 items-center">
					<Skeleton className="h-8 w-8 rounded" />
					<Skeleton className="h-4 w-4 rounded" />
				</div>
			</div>

			{/* info div skeleton */}
			<div className="flex flex-col gap-2.5">
				<div className="flex items-center gap-1">
					<Skeleton className="h-6 w-20 rounded-full" />
					<Skeleton className="h-6 w-24 rounded-full" />
				</div>

				<div className="flex flex-col">
					<Skeleton className="h-4 w-full mb-1" />
					<Skeleton className="h-4 w-3/4 mb-2" />
					<Skeleton className="h-3 w-1/2" />
				</div>
			</div>
		</div>
	)
}
