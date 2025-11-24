import { getValidationList } from "~/handlers/validationHandler"
import { useValidationStore } from "~/store/validationStore"
import { columns, DataTable } from "./ValidateTableContent"
import PaginationComponent from "~/components/common/PaginationComponent"

type ValidateTableProps = {
	activeTabId: string
}

const ValidateTable = ({ activeTabId }: ValidateTableProps) => {
	const { filters, setFilter } = useValidationStore()
	const { data: validationList, isLoading, isFetching, isError, error } = getValidationList(filters, activeTabId)

	const items = validationList?.data || []
	const total = validationList?.total || 0
	const page = validationList?.page || filters.page
	const totalPages = validationList?.total_pages || 0

	const setPage = (newPage: number) => {
		setFilter("page", newPage)
	}

	return (
		<div className="flex-1 flex flex-col h-full custom-scrollbar">
			<div className="px-4 pb-4 items-center justify-between">
				<DataTable columns={columns} data={items} isLoading={isLoading} isFetching={isFetching} />
			</div>
			<PaginationComponent page={page} pageSize={filters.page_size} total={total} onPageChange={setPage} />
		</div>
	)
}

export default ValidateTable
