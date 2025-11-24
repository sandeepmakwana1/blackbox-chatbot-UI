import { Skeleton } from "~/components/ui/skeleton"

export function SourcingItemViewSkeleton() {
	return (
		<div className="bg-[#F9FAFB] flex-1 overflow-y-auto">
			<div className="flex items-start self-stretch mt-[12px] ml-[12px] mr-[12px]">
				<div className="flex-1 mr-[12px]">
					{/* RFP Details Card Skeleton */}
					<div
						className="self-stretch bg-[#FFFFFF] pt-[12px] pb-[12px] pl-[16px] pr-[16px] mb-[12px] rounded-[12px] border border-solid border-[#EDF2F7]"
						style={{ boxShadow: "2px 2px 6px #D0DEEB5C" }}
					>
						<div className="self-stretch mb-[12px]">
							<div className="flex items-center self-stretch mb-[6px]">
								<div className="flex flex-1 items-start mr-[12px]">
									<Skeleton className="h-[20px] w-[100px] mr-[6px] rounded-[5px]" />
									<Skeleton className="h-[20px] w-[60px] rounded-[5px]" />
								</div>
							</div>
							<div className="flex flex-col items-start self-stretch">
								<Skeleton className="h-[18px] w-[300px] mb-[4px]" />
								<Skeleton className="h-[16px] w-[200px]" />
							</div>
						</div>
						<div className="flex flex-col items-start self-stretch gap-y-3">
							{/* Date and Link Info Skeletons */}
							{Array.from({ length: 5 }).map((_, index) => (
								<div key={index} className="flex items-center w-full">
									<div className="flex shrink-0 items-center mr-[16px] w-38">
										<Skeleton className="h-[16px] w-[16px] mr-[8px] rounded-full" />
										<Skeleton className="h-[16px] w-[80px]" />
									</div>
									<Skeleton className="h-[16px] w-[150px]" />
								</div>
							))}
							{/* Team Assignees Skeleton */}
							<div className="flex items-center gap-x-2 mt-2">
								<Skeleton className="h-[16px] w-[16px] rounded-full" />
								<Skeleton className="h-[16px] w-[100px]" />
								<div className="flex gap-x-1">
									<Skeleton className="h-[24px] w-[24px] rounded-full" />
									<Skeleton className="h-[24px] w-[24px] rounded-full" />
									<Skeleton className="h-[24px] w-[24px] rounded-full" />
								</div>
							</div>
						</div>
					</div>

					{/* Description Card Skeleton */}
					<div className="flex flex-col self-stretch bg-[#FFFFFF] pt-[12px] rounded-[12px] border border-solid border-[#EDF2F7]">
						<div className="flex items-center self-stretch bg-[#FFFFFF] mb-[16px] ml-[16px] mr-[16px]">
							<Skeleton className="h-[26px] w-[26px] rounded-[7px] mr-[8px]" />
							<Skeleton className="h-[16px] w-[100px]" />
						</div>
						<div className="ml-[16px] mr-[16px] pb-[16px] space-y-2">
							<Skeleton className="h-[16px] w-full" />
							<Skeleton className="h-[16px] w-full" />
							<Skeleton className="h-[16px] w-[80%]" />
							<Skeleton className="h-[16px] w-[90%]" />
							<Skeleton className="h-[16px] w-[75%]" />
						</div>
					</div>
				</div>

				{/* Documents Sidebar Skeleton */}
				<div className="flex flex-col shrink-0 items-start bg-[#FFFFFF] pt-[10px] rounded-[12px] gap-y-4 border border-solid border-[#EDF2F7] w-[400px]">
					{/* Project Documents Skeleton */}
					<div className="flex flex-col w-full gap-y-3">
						<div className="flex items-center justify-between bg-[#FFFFFF] pl-[12px] pr-[12px] w-full">
							<div className="flex shrink-0 items-center mr-[8px]">
								<Skeleton className="h-[26px] w-[26px] rounded-[7px] mr-[8px]" />
								<Skeleton className="h-[16px] w-[140px]" />
							</div>
						</div>
						<div className="flex flex-col items-start w-full">
							{Array.from({ length: 3 }).map((_, index) => (
								<div
									key={index}
									className="flex items-center w-full bg-[#FFFFFF] pl-3 pr-4 py-1.5 mb-[4px]"
								>
									<Skeleton className="h-[30px] w-[30px] rounded-[8px] mr-[8px]" />
									<div className="flex flex-col shrink-0 items-start flex-1">
										<Skeleton className="h-[14px] w-[180px]" />
									</div>
									<Skeleton className="h-[16px] w-[16px]" />
								</div>
							))}
						</div>
					</div>

					{/* Manually Added Documents Skeleton */}
					<div className="flex flex-col w-full gap-y-3">
						<div className="flex items-center justify-between bg-[#FFFFFF] pl-[12px] pr-[12px] w-full">
							<div className="flex shrink-0 items-center mr-[8px]">
								<Skeleton className="h-[26px] w-[26px] rounded-[7px] mr-[8px]" />
								<Skeleton className="h-[16px] w-[100px]" />
							</div>
							<Skeleton className="h-[32px] w-[80px] rounded-md" />
						</div>
						<div className="flex flex-col items-start w-full mb-[12px]">
							{Array.from({ length: 2 }).map((_, index) => (
								<div
									key={index}
									className="flex items-center w-full bg-[#FFFFFF] pl-3 pr-4 py-1.5 mb-[4px]"
								>
									<Skeleton className="h-[30px] w-[30px] rounded-[8px] mr-[8px]" />
									<div className="flex flex-col shrink-0 items-start flex-1">
										<Skeleton className="h-[14px] w-[160px]" />
									</div>
									<div className="flex items-center gap-x-2">
										<Skeleton className="h-[16px] w-[16px]" />
										<Skeleton className="h-[16px] w-[16px]" />
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
