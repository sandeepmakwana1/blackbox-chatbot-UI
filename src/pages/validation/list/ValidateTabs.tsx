import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { useValidationStore } from "~/store/validationStore"
import { useEffect, useState } from "react"
import { Sort, SearchNormal1, Layer } from "iconsax-reactjs"
import type { ValidationTabsProps } from "~/types/validation"

export default function ValidateTabs({ activeTabId, setActiveTabId }: ValidationTabsProps) {
	const { setFilter, filters, setValidateSearch } = useValidationStore()
	const [searchValue, setSearchValue] = useState(filters.validateSearch || "")

	useEffect(() => {
		if (filters.validateSearch !== searchValue) {
			setSearchValue(filters.validateSearch || "")
		}
	}, [filters.validateSearch])

	// Handle search input with debounce
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchValue !== filters.validateSearch) {
				setValidateSearch(searchValue)
			}
		}, 500)

		return () => clearTimeout(timer)
	}, [searchValue, setValidateSearch, filters.validateSearch])

	const handleTabChange = (tabId: string) => {
		setActiveTabId(tabId)
		setFilter("page", 1)
	}

	return (
		<div className="px-4 pb-4 mt-2 flex items-center justify-between">
			<Tabs defaultValue="all" className="w-auto" value={activeTabId} onValueChange={handleTabChange}>
				<TabsList>
					<TabsTrigger value="all">
						<Layer size={16} variant="Linear" className="mr-1" />
						<span>All</span>
					</TabsTrigger>
					<TabsTrigger value="Validated">
						<span>Validated</span>
					</TabsTrigger>
					<TabsTrigger value="Draft">
						<span>Draft</span>
					</TabsTrigger>
					{/* <TabsTrigger value="Archived">
						<span>Archived</span>
					</TabsTrigger> */}
				</TabsList>
			</Tabs>

			<div className="flex items-center gap-2">
				<div className="flex items-center bg-[#FFFFFF] p-2 gap-1.5 mr-[6px] rounded-[6px] border border-solid border-[#DFE5EB]">
					<SearchNormal1 size={16} color="#92A0B5" />
					<Input
						type="search"
						placeholder="Search by Title / Description"
						value={searchValue}
						onChange={(e) => setSearchValue(e.target.value)}
						className="text-[#91A0B4] bg-transparent text-[12px] w-[300px] border-hidden"
					/>
				</div>

				<Button
					variant="outline"
					className="border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] gap-2"
					onClick={() => {
						useValidationStore.getState().toggleFiltersVisible()
					}}
				>
					<Sort size={16} variant="Linear" />
					Filters
				</Button>
			</div>
		</div>
	)
}
