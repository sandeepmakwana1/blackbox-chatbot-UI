import SourcingTabs from "~/pages/sourcing/list/SourcingTabs"
import SourcingFilters from "./SourcingFilters"
import SourcingList from "~/pages/sourcing/list/SourcingList"
import { useSourcingStore } from "~/store/sourcingStore"

const SourcingPage = () => {
	const { filtersVisible, activeTabId, setActiveTabId } = useSourcingStore()

	return (
		<div className="flex flex-col h-full">
			<SourcingTabs activeTabId={activeTabId} setActiveTabId={setActiveTabId} />
			<div className="flex-1 flex overflow-hidden pt-3 px-3 gap-x-3">
				<SourcingList activeTabId={activeTabId} />
				{filtersVisible && <SourcingFilters />}
			</div>
		</div>
	)
}

export default SourcingPage
