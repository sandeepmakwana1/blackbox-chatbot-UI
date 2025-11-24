import { Skeleton } from "~/components/ui/skeleton"

export const TableOfContentSkeleton = () => (
	<div className="pt-3 pb-4 px-3 bg-white h-full">
		<Skeleton className="h-5 w-32 mb-4" />
		<div className="space-y-3">
			{Array.from({ length: 15 }).map((_, index) => (
				<div key={index} className="space-y-2">
					<div className="flex items-center space-x-3">
						<Skeleton className="h-4 w-4 rounded-full" />
						<Skeleton className="h-4 flex-1" />
					</div>
					{index % 2 === 0 && (
						<div className="pl-7 space-y-1">
							<Skeleton className="h-3 w-3/4" />
							<Skeleton className="h-3 w-2/3" />
							{index % 4 === 0 && <Skeleton className="h-3 w-1/2" />}
						</div>
					)}
				</div>
			))}
		</div>
	</div>
)

export const ContentDisplaySkeleton = () => (
	<div className="space-y-6 w-full max-w-[740px]">
		{Array.from({ length: 4 }).map((_, index) => (
			<div key={index} className="border border-neutral-300 rounded-lg bg-white p-4">
				<div className="flex items-center justify-between mb-4">
					<Skeleton className="h-6 w-64" />
					<Skeleton className="h-8 w-32" />
				</div>
				<div className="space-y-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-5/6" />
					<Skeleton className="h-4 w-4/5" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</div>
				{index % 2 === 0 && (
					<div className="mt-6 space-y-4">
						<div>
							<Skeleton className="h-5 w-48 mb-2" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-4/5" />
								<Skeleton className="h-4 w-5/6" />
							</div>
						</div>
						<div>
							<Skeleton className="h-5 w-52 mb-2" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						</div>
					</div>
				)}
			</div>
		))}
	</div>
)

export const SummarySkeleton = () => (
	<div className="space-y-4">
		<Skeleton className="h-6 w-3/4" />
		<div className="space-y-3">
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-5/6" />
			<Skeleton className="h-4 w-4/5" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-3/4" />
		</div>
		<Skeleton className="h-6 w-2/3" />
		<div className="space-y-3">
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-4/5" />
			<Skeleton className="h-4 w-5/6" />
		</div>
		<Skeleton className="h-6 w-1/2" />
		<div className="space-y-3">
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-4 w-5/6" />
			<Skeleton className="h-4 w-2/3" />
		</div>
	</div>
)
