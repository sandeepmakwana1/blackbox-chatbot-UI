import ValidateTabs from "./ValidateTabs"
import ValidateFilters from "./ValidateFilters"
import ValidateTable from "./ValidateTable"
import { useValidationStore } from "~/store/validationStore"

const ValidationList = () => {
	const { filtersVisible, activeValidateTabId, setActiveValidateTabId } = useValidationStore()
	return (
		<div className="flex flex-col h-full">
			<ValidateTabs activeTabId={activeValidateTabId} setActiveTabId={setActiveValidateTabId} />

			<div className="flex-1 flex overflow-hidden">
				<ValidateTable activeTabId={activeValidateTabId} />
				{filtersVisible && <ValidateFilters />}
			</div>
		</div>
	)
}

export default ValidationList
