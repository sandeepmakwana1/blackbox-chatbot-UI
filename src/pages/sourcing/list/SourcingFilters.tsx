import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { MultiSelect, MultiSelectTrigger, MultiSelectContent, MultiSelectItem } from "~/components/ui/multiSelect"
import { Calendar } from "~/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Button } from "~/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command"
import { CalendarIcon, CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"
import { useSourcingStore } from "~/store/sourcingStore"
import { useUsersSourcing } from "~/handlers/teamsHandler"
import { useOpportunityTypes, useAgencies, useStates, useScrapeSources } from "~/handlers/sourcingHandler"
import { Sort, User } from "iconsax-reactjs"
import { useState } from "react"
import { cn } from "~/lib/utils"

export default function SourcingFilters() {
	const {
		activeTabId,
		filters,
		setOpportunityType,
		setDateFilter,
		setAgencyName,
		setState,
		resetFilters,
		setScrapeSources,
		setAssigneeIds,
		setReleasedAfterDate,
		setValidationStatus,
	} = useSourcingStore()

	const [openOpportunityType, setOpenOpportunityType] = useState(false)
	const [openAgency, setOpenAgency] = useState(false)
	const [openState, setOpenState] = useState(false)
	const [openValidation, setOpenValidation] = useState(false)

	const {
		data: opportunityTypesData,
		isLoading: isLoadingOpportunityTypes,
		isError: isErrorOpportunityTypes,
	} = useOpportunityTypes()
	const {
		data: scrapeSourceData,
		isLoading: isLoadingScrapeSources,
		isError: isErrorScrapeSources,
	} = useScrapeSources()
	const { data: agenciesData, isLoading: isLoadingAgencies, isError: isErrorAgencies } = useAgencies()
	const { data: statesData, isLoading: isLoadingStates, isError: isErrorStates } = useStates()
	const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers } = useUsersSourcing()

	const opportunityTypes = opportunityTypesData?.data || []
	const agencies = agenciesData?.data || []
	const states = statesData?.data || []
	const sources = scrapeSourceData?.data || []

	const selectedUserIds = (filters?.assignee_ids ?? []).map(String)
	const selectedSourceIds = filters.scrape_sources || []

	const handleAssigneeIdsChange = (selected: string[]) => {
		const numericIds = selected.map((id) => Number(id))
		setAssigneeIds(numericIds.length > 0 ? numericIds : null)
	}

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
				<h3 className="text-xs font-semibold text-[#64748b] uppercase mb-3">DATE</h3>
				<RadioGroup
					value={filters.date_filter || ""}
					onValueChange={(value) => {
						setDateFilter(value)
						if (value !== "released_after") {
							setReleasedAfterDate(null)
						}
					}}
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="" id="all-dates" />
						<label htmlFor="all-dates" className="text-sm text-[#64748b]">
							All dates
						</label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="yesterday" id="yesterday" />
						<label htmlFor="yesterday" className="text-sm text-[#64748b]">
							Released Yesterday
						</label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="week" id="week" />
						<label htmlFor="week" className="text-sm text-[#64748b]">
							Released in past 7 days
						</label>
					</div>
					<div className="flex flex-col space-y-2">
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="released_after" id="released_after" />
							<label htmlFor="released_after" className="text-sm text-[#64748b]">
								Released after
							</label>
						</div>
						{filters.date_filter === "released_after" && (
							<div className="ml-6">
								<Popover>
									<PopoverTrigger asChild className="w-full border-[#e2e8f0]">
										<Button variant="secondary" className="flex justify-between">
											<span className="text-xs font-semibold text-neutral-600">
												{filters.released_after_date
													? format(new Date(filters.released_after_date), "PPP")
													: "Select date"}
											</span>
											<CalendarIcon className="mr-2 h-4 w-4" />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										side="bottom"
										align="start"
										sideOffset={6}
										className="w-auto z-50 bg-white border border-primary-200 rounded-md"
									>
										<Calendar
											showOutsideDays={false}
											mode="single"
											selected={
												filters.released_after_date
													? new Date(filters.released_after_date)
													: undefined
											}
											onSelect={(date) =>
												setReleasedAfterDate(date ? format(date, "yyyy-MM-dd") : null)
											}
											disabled={{ after: new Date() }}
											className="rounded-md"
										/>
									</PopoverContent>
								</Popover>
							</div>
						)}
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

			{/* Assignees */}
			<div className="px-3 py-2.5 relative">
				<h3 className="text-xs font-semibold text-[#64748b] uppercase mb-1">Assignees</h3>
				<MultiSelect>
					<MultiSelectTrigger
						selectedValues={selectedUserIds.map(
							(id) => usersData.find((u) => u.id === Number(id))?.name || id
						)}
						placeholder={
							isLoadingUsers ? "Loading..." : isErrorUsers ? "Error loading" : "Select assignees"
						}
						className="w-full border-[#e2e8f0] px-4 text-xs"
					/>
					<MultiSelectContent className="z-50 bg-white max-h-48 overflow-y-auto custom-scrollbar">
						<MultiSelectItem
							value="all"
							selectedValues={selectedUserIds}
							onChange={() => handleAssigneeIdsChange([])}
						>
							All Assignees
						</MultiSelectItem>
						{!isLoadingUsers &&
							!isErrorUsers &&
							usersData.map((user) => (
								<MultiSelectItem
									key={user.id.toString()}
									value={user.id.toString()}
									selectedValues={selectedUserIds}
									onChange={(val) => {
										if (val === "all") {
											handleAssigneeIdsChange([])
										} else {
											const next = selectedUserIds.includes(val)
												? selectedUserIds.filter((v) => v !== val)
												: [...selectedUserIds, val]
											handleAssigneeIdsChange(next)
										}
									}}
								>
									<User size="16" className="mr-2 text-gray-500" />
									{user.name}
								</MultiSelectItem>
							))}
					</MultiSelectContent>
				</MultiSelect>
				{isErrorUsers && <p className="text-xs text-red-500 mt-1">Could not load assignees.</p>}
			</div>

			{/* Scrape sources */}
			{activeTabId === "sourced" && (
				<div className="px-3 py-2.5 relative">
					<h3 className="text-xs font-semibold text-[#64748b] uppercase mb-1">Sources</h3>
					<MultiSelect>
						<MultiSelectTrigger
							selectedValues={selectedSourceIds.map((id) => sources.find((u) => u === id) || id)}
							placeholder={
								isLoadingScrapeSources
									? "Loading..."
									: isErrorScrapeSources
									? "Error loading"
									: "Select sources"
							}
							className="w-full border-[#e2e8f0]  px-4 text-xs"
						/>
						<MultiSelectContent className="z-50 bg-white max-h-48 overflow-y-auto custom-scrollbar">
							<MultiSelectItem
								value="all"
								selectedValues={selectedSourceIds}
								onChange={() => setScrapeSources(null)}
							>
								All Sources
							</MultiSelectItem>
							{!isLoadingScrapeSources &&
								!isErrorScrapeSources &&
								sources.map((source) => (
									<MultiSelectItem
										key={source}
										value={source}
										selectedValues={selectedSourceIds}
										onChange={(val) => {
											if (val === "all") {
												setScrapeSources(null)
											} else {
												const next = selectedSourceIds.includes(val)
													? selectedSourceIds.filter((v) => v !== val)
													: [...selectedSourceIds, val]
												setScrapeSources(next.length > 0 ? next : null)
											}
										}}
									>
										{source}
									</MultiSelectItem>
								))}
						</MultiSelectContent>
					</MultiSelect>
					{isErrorScrapeSources && <p className="text-xs text-red-500 mt-1">Could not load Sources.</p>}
				</div>
			)}

			{/* State */}
			<div className="px-3 py-2.5 relative">
				<h3 className="text-xs font-semibold text-[#64748b] uppercase mb-1">State</h3>
				<Popover open={openState} onOpenChange={setOpenState}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={openState}
							className={cn(
								"w-full justify-between border-[#e2e8f0]",
								filters.state ? "text-neutral-900" : "text-neutral-600"
							)}
							disabled={isLoadingStates || isErrorStates}
						>
							<span className="truncate">{filters.state || "Select state"}</span>
							<ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-white" align="start">
						<Command>
							<CommandInput placeholder="Search state..." className="h-9" />
							<CommandList>
								<CommandEmpty>No state found.</CommandEmpty>
								<CommandGroup>
									<CommandItem
										value="all"
										onSelect={() => {
											setState("")
											setOpenState(false)
										}}
									>
										All States
										<CheckIcon
											className={cn(
												"ml-auto h-4 w-4",
												!filters.state ? "opacity-100" : "opacity-0"
											)}
										/>
									</CommandItem>
									{states.map((state: string) => (
										<CommandItem
											key={state}
											value={state}
											onSelect={() => {
												setState(state)
												setOpenState(false)
											}}
										>
											{state}
											<CheckIcon
												className={cn(
													"ml-auto h-4 w-4",
													filters.state === state ? "opacity-100" : "opacity-0"
												)}
											/>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				{isErrorStates && <p className="text-xs text-red-500 mt-1">Could not load states.</p>}
			</div>

			{/* Validation status */}
			<div className="px-3 py-2.5 relative">
				<h3 className="text-xs font-semibold text-[#64748b] uppercase mb-1">Validation Status</h3>
				<Popover open={openValidation} onOpenChange={setOpenValidation}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={openValidation}
							className={cn(
								"w-full justify-between border-[#e2e8f0]",
								filters.validation_status && filters.validation_status !== "all"
									? "text-neutral-900"
									: "text-neutral-600"
							)}
						>
							<span className="truncate">
								{filters.validation_status === "validated"
									? "Validated"
									: filters.validation_status === "non-validated"
									? "Non-validated"
									: filters.validation_status === "all"
									? "All"
									: "Select Validation Status"}
							</span>
							<ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-white" align="start">
						<Command>
							<CommandInput placeholder="Search status..." className="h-9" />
							<CommandList>
								<CommandEmpty>No status found.</CommandEmpty>
								<CommandGroup>
									<CommandItem
										value="all"
										onSelect={() => {
											setValidationStatus("all")
											setOpenValidation(false)
										}}
									>
										All
										<CheckIcon
											className={cn(
												"ml-auto h-4 w-4",
												filters.validation_status === "all" ? "opacity-100" : "opacity-0"
											)}
										/>
									</CommandItem>
									<CommandItem
										value="validated"
										onSelect={() => {
											setValidationStatus("validated")
											setOpenValidation(false)
										}}
									>
										Validated
										<CheckIcon
											className={cn(
												"ml-auto h-4 w-4",
												filters.validation_status === "validated" ? "opacity-100" : "opacity-0"
											)}
										/>
									</CommandItem>
									<CommandItem
										value="non-validated"
										onSelect={() => {
											setValidationStatus("non-validated")
											setOpenValidation(false)
										}}
									>
										Non-validated
										<CheckIcon
											className={cn(
												"ml-auto h-4 w-4",
												filters.validation_status === "non-validated"
													? "opacity-100"
													: "opacity-0"
											)}
										/>
									</CommandItem>
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	)
}
