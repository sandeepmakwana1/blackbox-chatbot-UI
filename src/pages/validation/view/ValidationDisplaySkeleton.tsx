import { Skeleton } from "~/components/ui/skeleton"
import { Loader } from "~/components/ui/loader"

export const ValidationSkeleton = () => {
	return (
		<div className="relative flex flex-col gap-1.5 p-3 bg-neutral-50">
			{/* Loading overlay */}
			<div className="absolute inset-0 bg-white/0 backdrop-blur-[2px] z-10 flex items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<Loader size="lg" variant="primary" />
					<span className="text-sm text-neutral-600">
						Running validation checks. This may take a moment...
					</span>
				</div>
			</div>

			{/* Header skeleton */}
			<div className="flex justify-between items-center">
				<div className="flex items-center bg-white p-1 rounded-lg border border-neutral-200">
					<Skeleton className="h-7 w-16 rounded-sm" />
					<Skeleton className="h-7 w-20 rounded-sm ml-1" />
				</div>
				<Skeleton className="h-6 w-24 rounded-md" />
			</div>

			{/* Main Content skeleton */}
			<div className="flex gap-3">
				{/* Summary skeleton */}
				<div className="flex flex-col gap-4 px-3 pt-3 pb-4 bg-white rounded-lg border border-neutral-200 w-[450px]">
					<div className="flex items-center gap-2">
						<Skeleton className="w-6 h-6 rounded-md" />
						<Skeleton className="h-4 w-48" />
					</div>

					<div className="flex flex-col gap-4">
						{/* Recommendation skeleton */}
						<div className="flex flex-col gap-1">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-6 w-32 rounded-md" />
						</div>

						{/* Summary skeleton */}
						<div className="flex flex-col gap-1">
							<Skeleton className="h-4 w-16" />
							<div className="space-y-1">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-4 w-5/6" />
							</div>
						</div>

						{/* Details skeletons */}
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="flex flex-col gap-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-4 w-40" />
							</div>
						))}

						{/* Next steps skeleton */}
						<div className="flex flex-col gap-2">
							<Skeleton className="h-4 w-20" />
							<div className="flex flex-col gap-4">
								{Array.from({ length: 3 }).map((_, i) => (
									<div key={i} className="flex items-start gap-3">
										<Skeleton className="h-5 w-5 rounded-md mt-1" />
										<div className="flex-1">
											<Skeleton className="h-4 w-full mb-1" />
											<Skeleton className="h-4 w-2/3" />
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Checkpoints skeleton */}
				<div className="flex bg-white rounded-lg border border-neutral-200 flex-1 overflow-hidden">
					{/* Checkpoints list skeleton */}
					<div className="flex flex-col gap-4 p-3 w-[400px] border-r border-neutral-200">
						<div className="flex items-center gap-2">
							<Skeleton className="w-6 h-6 rounded-md" />
							<Skeleton className="h-4 w-24" />
						</div>

						<div className="flex flex-col gap-4">
							{/* Checkpoint groups skeleton */}
							{Array.from({ length: 3 }).map((_, groupIndex) => (
								<div key={groupIndex} className="flex flex-col gap-2">
									<Skeleton className="h-6 w-16 rounded-md" />
									<div className="flex flex-col bg-white rounded-lg border border-neutral-200">
										{Array.from({ length: 2 + groupIndex }).map((_, itemIndex) => (
											<div
												key={itemIndex}
												className={`flex items-center w-full p-3 ${
													itemIndex === 0 ? "rounded-t-lg" : ""
												} ${
													itemIndex === 2 + groupIndex - 1
														? "rounded-b-lg"
														: "border-b border-neutral-200"
												}`}
											>
												<Skeleton className="w-1.5 h-1.5 rounded-full mr-2" />
												<Skeleton className="h-4 flex-1 mr-2" />
												<Skeleton className="w-4 h-4" />
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Details skeleton */}
					<div className="flex flex-col gap-4 p-5 flex-1">
						<div className="flex items-center gap-2">
							<Skeleton className="h-6 w-20 rounded-md" />
							<Skeleton className="h-4 w-32" />
						</div>

						<div className="flex flex-col gap-6">
							{/* Sections skeleton */}
							{Array.from({ length: 4 }).map((_, sectionIndex) => (
								<div key={sectionIndex} className="flex flex-col gap-2">
									<Skeleton className="h-6 w-16 rounded-md" />
									<div className="flex flex-col gap-1.5">
										{Array.from({ length: 2 + (sectionIndex % 2) }).map((_, itemIndex) => (
											<div key={itemIndex} className="flex items-start gap-2">
												<Skeleton className="w-1 h-1 rounded-full mt-2 shrink-0" />
												<div className="flex-1">
													<Skeleton className="h-4 w-full mb-1" />
													{itemIndex % 2 === 0 && <Skeleton className="h-4 w-3/4" />}
												</div>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
