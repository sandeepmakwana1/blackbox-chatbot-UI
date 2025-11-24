import {
	Pagination,
	PaginationContent,
	PaginationInfo,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "~/components/ui/pagination"

type PaginationComponentProps = {
	page: number
	pageSize: number
	total: number
	onPageChange: (page: number) => void
}

const PaginationComponent = ({ page, pageSize, total, onPageChange }: PaginationComponentProps) => {
	const totalPages = Math.ceil(total / pageSize)

	const setPage = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			onPageChange(newPage)
		}
	}

	const generatePaginationItems = () => {
		const paginationItems = []
		const maxVisiblePages = 5

		if (totalPages <= 1) return []

		// Always show first page
		paginationItems.push(
			<PaginationItem key="page-1">
				<PaginationLink isActive={page === 1} onClick={() => setPage(1)}>
					1
				</PaginationLink>
			</PaginationItem>
		)

		let startPage = Math.max(2, page - 2)
		let endPage = Math.min(totalPages - 1, page + 2)

		if (page <= 3) {
			startPage = 2
			endPage = Math.min(totalPages - 1, maxVisiblePages - 1)
		} else if (page >= totalPages - 2) {
			startPage = Math.max(2, totalPages - maxVisiblePages + 2)
			endPage = totalPages - 1
		}

		// Add ellipsis before middle pages if needed
		if (startPage > 2) {
			paginationItems.push(
				<PaginationItem key="ellipsis-back">
					<PaginationLink onClick={() => setPage(Math.max(1, page - 5))}>&hellip;</PaginationLink>
				</PaginationItem>
			)
		}

		// Add middle pages
		for (let i = startPage; i <= endPage; i++) {
			if (i > 0 && i < totalPages) {
				paginationItems.push(
					<PaginationItem key={`page-${i}`}>
						<PaginationLink isActive={page === i} onClick={() => setPage(i)}>
							{i}
						</PaginationLink>
					</PaginationItem>
				)
			}
		}

		// Add ellipsis after middle pages if needed
		if (endPage < totalPages - 1) {
			paginationItems.push(
				<PaginationItem key="ellipsis-forward">
					<PaginationLink onClick={() => setPage(Math.min(totalPages, page + 5))}>&hellip;</PaginationLink>
				</PaginationItem>
			)
		}

		// Always show last page if there's more than one page
		if (totalPages > 1) {
			paginationItems.push(
				<PaginationItem key={`page-${totalPages}`}>
					<PaginationLink isActive={page === totalPages} onClick={() => setPage(totalPages)}>
						{totalPages}
					</PaginationLink>
				</PaginationItem>
			)
		}

		return paginationItems
	}

	return (
		<div className="border-t border-[#e2e8f0] py-[10px] px-6 bg-[#f8fafc] mt-auto">
			<div className="flex justify-between items-center text-sm text-[#64748b]">
				<div className="whitespace-nowrap">
					<PaginationInfo page={page} pageSize={pageSize} total={total} />
				</div>
				<Pagination>
					<PaginationContent className="gap-2">
						{page > 1 && (
							<PaginationItem>
								<PaginationPrevious onClick={() => setPage(page - 1)} />
							</PaginationItem>
						)}
						{generatePaginationItems()}
						{page < totalPages && (
							<PaginationItem>
								<PaginationNext onClick={() => setPage(page + 1)} />
							</PaginationItem>
						)}
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	)
}

export default PaginationComponent
