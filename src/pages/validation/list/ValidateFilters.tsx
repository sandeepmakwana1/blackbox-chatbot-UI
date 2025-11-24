import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Button } from "~/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command"
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons"
import { useValidationStore } from "~/store/validationStore"
import { useOpportunityTypes, useAgencies, useStates } from "~/handlers/sourcingHandler"
import { useLocation } from "react-router"
import { Sort } from "iconsax-reactjs"
import { useState } from "react"
import { cn } from "~/lib/utils"

export default function ValidateFilters() {
	const { filters, setOpportunityType, setDateFilter, setAgencyName, setState, resetFilters } = useValidationStore()
	const location = useLocation()

	const [openOpportunityType, setOpenOpportunityType] = useState(false)
	const [openAgency, setOpenAgency] = useState(false)

	const {
		data: opportunityTypesData,
		isLoading: isLoadingOpportunityTypes,
		isError: isErrorOpportunityTypes,
	} = useOpportunityTypes()
	const { data: agenciesData, isLoading: isLoadingAgencies, isError: isErrorAgencies } = useAgencies()
	const { data: statesData, isLoading: isLoadingStates, isError: isErrorStates } = useStates()

	const opportunityTypes = opportunityTypesData?.data || []
	const agencies = agenciesData?.data || []
	const states = statesData?.data || []

	return (
		<div className="w-80 border-l border-neutral-300 bg-white overflow-y-auto custom-scrollbar rounded-[12px]">
			<div className="flex items-center justify-between px-4 py-3 border-b border-neutral-300">
				<div className="flex items-center gap-x-2">
					<Sort size={16} color="#6E7C91" />
					<span className="text-sm font-medium text-neutral-700">Filter by</span>
				</div>
				<div className="flex items-center gap-2">
					<div
						className="text-neutral-700 text-xs h-auto hover:text-primary hover:cursor-pointer"
						onClick={resetFilters}
					>
						Reset
					</div>
				</div>
			</div>

			{/* Opportunity Type */}
			<div className="px-3 py-2.5 relative">
				<h3 className="text-xs font-semibold text-[#64748b] uppercase mb-2">Opportunity Type</h3>
				<Popover open={openOpportunityType} onOpenChange={setOpenOpportunityType}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={openOpportunityType}
							className={cn(
								"w-full justify-between border-[#e2e8f0]",
								filters.opportunity_type ? "text-neutral-900" : "text-neutral-600"
							)}
							disabled={isLoadingOpportunityTypes || isErrorOpportunityTypes}
						>
							<span className="truncate">{filters.opportunity_type || "Select opportunity type"}</span>
							<ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-white" align="start">
						<Command>
							<CommandInput placeholder="Search opportunity type..." className="h-9" />
							<CommandList>
								<CommandEmpty>No opportunity type found.</CommandEmpty>
								<CommandGroup>
									<CommandItem
										value="all"
										onSelect={() => {
											setOpportunityType("")
											setOpenOpportunityType(false)
										}}
									>
										All Types
										<CheckIcon
											className={cn(
												"ml-auto h-4 w-4",
												!filters.opportunity_type ? "opacity-100" : "opacity-0"
											)}
										/>
									</CommandItem>
									{opportunityTypes.map((type: string) => (
										<CommandItem
											key={type}
											value={type}
											onSelect={() => {
												setOpportunityType(type)
												setOpenOpportunityType(false)
											}}
										>
											{type}
											<CheckIcon
												className={cn(
													"ml-auto h-4 w-4",
													filters.opportunity_type === type ? "opacity-100" : "opacity-0"
												)}
											/>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				{isErrorOpportunityTypes && <p className="text-xs text-red-500 mt-1">Could not load types.</p>}
			</div>

			{/* Date Filter */}
			<div className="px-3 py-2.5">
				<h3 className="text-xs font-semibold text-[#64748b] uppercase mb-3">Date</h3>
				<RadioGroup value={filters.date_filter || ""} onValueChange={setDateFilter}>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="" id="all-dates" />
						<label htmlFor="all-dates" className="text-sm text-[#64748b]">
							All dates
						</label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="yesterday" id="yesterday" />
						<label htmlFor="yesterday" className="text-sm text-[#64748b]">
							Released yesterday
						</label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="week" id="week" />
						<label htmlFor="week" className="text-sm text-[#64748b]">
							Released in past 7 days
						</label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="month" id="month" />
						<label htmlFor="month" className="text-sm text-[#64748b]">
							Released in past 30 days
						</label>
					</div>
				</RadioGroup>
			</div>

			{/* Agency Name */}
			<div className="px-3 py-2.5 relative">
				<h3 className="text-xs font-semibold text-[#64748b] uppercase mb-1">Agency</h3>
				<Popover open={openAgency} onOpenChange={setOpenAgency}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={openAgency}
							className={cn(
								"w-full justify-between border-[#e2e8f0]",
								filters.agency_name ? "text-neutral-900" : "text-neutral-600"
							)}
							disabled={isLoadingAgencies || isErrorAgencies}
						>
							<span className="truncate">{filters.agency_name || "Select agency"}</span>
							<ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-74 p-0 z-50 bg-white custom-scrollbar" align="start">
						<Command>
							<CommandInput placeholder="Search agency..." className="h-9" />
							<CommandList>
								<CommandEmpty>No agency found.</CommandEmpty>
								<CommandGroup>
									<CommandItem
										value="all"
										onSelect={() => {
											setAgencyName("")
											setOpenAgency(false)
										}}
									>
										All Agencies
										<CheckIcon
											className={cn(
												"ml-auto h-4 w-4",
												!filters.agency_name ? "opacity-100" : "opacity-0"
											)}
										/>
									</CommandItem>
									{agencies.map((agency: string) => (
										<CommandItem
											key={agency}
											value={agency}
											onSelect={() => {
												setAgencyName(agency)
												setOpenAgency(false)
											}}
											className="hover:bg-neutral-200 text-clip cursor-pointer"
										>
											{agency}
											<CheckIcon
												className={cn(
													"ml-auto h-4 w-4",
													filters.agency_name === agency ? "opacity-100" : "opacity-0"
												)}
											/>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				{isErrorAgencies && <p className="text-xs text-red-500 mt-1">Could not load agencies.</p>}
			</div>
		</div>
	)
}
