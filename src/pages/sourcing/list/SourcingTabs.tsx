import { useSourcingStore } from "~/store/sourcingStore"
import { useEffect, useState } from "react"
import { SearchStatus, Sort, SearchNormal1, DocumentUpload } from "iconsax-reactjs"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"
import type { SourcingTabsProps } from "~/types/sourcing"

const SOURCING_TABS_DATA = [
	{ id: "sourced", label: "Sourced", IconComponent: SearchStatus },
	{ id: "validated", label: "Manually Added", IconComponent: DocumentUpload },
]

export default function SourcingTabs({ activeTabId, setActiveTabId }: SourcingTabsProps) {
	const { filters, setScrapeSources, setSourcingSearch, toggleFiltersVisible } = useSourcingStore()
	const [searchValue, setSearchValue] = useState(filters.sourcingSearch || "")

	useEffect(() => {
		if (filters.sourcingSearch !== searchValue) {
			setSearchValue(filters.sourcingSearch || "")
		}
	}, [filters.sourcingSearch])

	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchValue !== filters.sourcingSearch) {
				setSourcingSearch(searchValue)
			}
		}, 500)
		return () => clearTimeout(timer)
	}, [searchValue, setSourcingSearch, filters.sourcingSearch])

	const handleTabChange = (tabId: string) => {
		setActiveTabId(tabId)
		setScrapeSources(null)
		useSourcingStore.getState().setFilter("page", 1)
	}

	return (
		<div className="py-2 px-3 flex items-center justify-between bg-white">
			<Tabs value={activeTabId} onValueChange={handleTabChange} className="w-auto">
				<TabsList className="h-auto bg-transparent p-0">
					{SOURCING_TABS_DATA.map((tab) => {
						const isActive = activeTabId === tab.id
						const iconColor = isActive ? "#174cbe" : "#92A0B5"

						return (
							<TabsTrigger key={tab.id} value={tab.id}>
								<tab.IconComponent size={16} variant="Linear" color={iconColor} className="mr-[4px]" />
								<span>{tab.label}</span>
							</TabsTrigger>
						)
					})}
				</TabsList>
			</Tabs>

			<div className="flex items-center gap-2">
				<div className="flex items-center bg-[#FFFFFF] p-2 gap-1.5 mr-[6px] rounded-[6px] border border-solid border-[#DFE5EB] ">
					<SearchNormal1 size={16} color="#92A0B5" />
					<Input
						type="search"
						placeholder="Search opportunities"
						value={searchValue}
						onChange={(e) => setSearchValue(e.target.value)}
						className="text-[#91A0B4] bg-transparent text-[12px] w-[300px] border-hidden focus-visible:ring-0 focus-visible:ring-offset-0 "
					/>
				</div>
				<Button variant="tertiary" size="sm" onClick={toggleFiltersVisible}>
					<Sort size={16} variant="Linear" />
					Filters
				</Button>
			</div>
		</div>
	)
}
