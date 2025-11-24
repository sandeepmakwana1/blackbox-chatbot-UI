import { Skeleton } from "~/components/ui/skeleton"
import { Loader } from "~/components/ui/loader"

export const CostingDataSkeleton = () => {
	return (
		<div className="relative flex w-full gap-4">
			{/* Loading overlay */}
			<div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
				<div className="flex flex-col items-center gap-3">
					<Loader size="lg" variant="primary" />
					<span className="text-sm text-neutral-600">Loading costing data. This may take a moment...</span>
				</div>
			</div>

			{/* Main table skeleton */}
			<div className="flex-1 flex flex-col gap-3">
				{/* Summary bar skeleton */}
				<div className="flex w-full items-center justify-between px-3.5 py-2.5 bg-success-200 rounded-lg">
					<div className="flex items-center gap-4">
						<Skeleton className="w-6 h-6 rounded-md bg-success-300" />
						<Skeleton className="h-4 w-48 bg-success-300" />
					</div>
					<Skeleton className="h-6 w-32 bg-success-300" />
				</div>

				{/* Table skeleton */}
				<div className="rounded-lg border border-solid border-neutral-400 bg-white">
					{/* Table header skeleton */}
					<div className="bg-gray-50 border-b border-neutral-400">
						<div className="flex">
							{Array.from({ length: 6 }).map((_, i) => (
								<div key={i} className="px-4 py-3 border-r border-neutral-400 last:border-r-0 flex-1">
									<Skeleton className="h-4 w-full" />
								</div>
							))}
						</div>
					</div>

					{/* Table rows skeleton */}
					<div className="divide-y divide-neutral-400">
						{Array.from({ length: 5 }).map((_, rowIndex) => (
							<div key={rowIndex} className="flex hover:bg-gray-50">
								{Array.from({ length: 6 }).map((_, colIndex) => (
									<div
										key={colIndex}
										className="px-4 py-3 border-r border-neutral-400 last:border-r-0 flex-1"
									>
										{colIndex === 0 ? (
											<Skeleton className="h-4 w-8" />
										) : colIndex === 1 ? (
											<Skeleton className="h-4 w-24" />
										) : colIndex === 2 ? (
											<Skeleton className="h-4 w-20" />
										) : colIndex === 3 ? (
											<Skeleton className="h-4 w-16" />
										) : colIndex === 4 ? (
											<Skeleton className="h-4 w-14" />
										) : (
											<div className="flex items-center justify-between">
												<Skeleton className="h-4 w-20" />
												<Skeleton className="w-4 h-4" />
											</div>
										)}
									</div>
								))}
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Details panel skeleton */}
			<div className="w-[35%] min-h-[20rem] rounded-lg border border-solid border-neutral-400 bg-white">
				<div className="flex flex-col gap-4 px-4 py-3">
					{/* Header */}
					<div className="flex items-center gap-2">
						<Skeleton className="w-6 h-6 rounded-md" />
						<Skeleton className="h-4 w-16" />
					</div>

					{/* Badges */}
					<div className="flex items-center gap-1">
						<Skeleton className="h-6 w-20 rounded-full" />
						<Skeleton className="h-6 w-16 rounded-full" />
					</div>

					{/* Stats grid */}
					<div className="grid grid-cols-3 rounded-[8px] border border-neutral-400">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className={`flex flex-col gap-1 px-3 py-2 bg-white ${
									i === 1 ? "border-x border-neutral-200" : ""
								}`}
							>
								<Skeleton className="h-3 w-16" />
								<Skeleton className="h-4 w-12" />
							</div>
						))}
					</div>

					{/* Rate suggestions */}
					<div className="flex flex-col gap-1">
						<Skeleton className="h-4 w-32" />
						<div className="grid grid-cols-3 rounded-[8px] border border-neutral-400 overflow-hidden">
							{Array.from({ length: 3 }).map((_, i) => (
								<div
									key={i}
									className={`flex flex-col gap-6 px-3 py-2 bg-white ${
										i === 1 ? "border-x border-neutral-400" : ""
									}`}
								>
									<div className="flex items-center gap-1">
										<Skeleton className="w-2 h-2 rounded-sm" />
										<Skeleton className="h-3 w-12" />
									</div>
									<div className="flex flex-col">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-3 w-10" />
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Description */}
					<div className="flex flex-col gap-2">
						<Skeleton className="h-4 w-20" />
						<div className="space-y-1">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-4/5" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
