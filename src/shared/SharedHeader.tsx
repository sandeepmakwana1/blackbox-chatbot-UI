import { useSourcingItemById } from "~/handlers/sourcingHandler"
import { Breadcrumb } from "../components/common/BreadCrumbComponent"
import { useBreadcrumbs } from "../hooks/useBreadcrumbs"
import { HeaderButtons } from "./HeaderButtons"

//Common header for Validation and Sourcing
export const SharedHeader = ({
	isSourcingPage = false,
	isSourcingListPage,
	isDetailPage,
	canValidate,
	source_id,
	handleOpenModal,
	showValidateButton = true,
}: {
	isSourcingPage: boolean
	isSourcingListPage: boolean
	isDetailPage: boolean
	canValidate: boolean
	source_id?: string
	handleOpenModal?: () => void
	showValidateButton?: boolean
}) => {
	const numericSourceId = source_id ? Number(source_id) : undefined
	const { data: sourcingItem } = useSourcingItemById(numericSourceId)

	const breadcrumbData = {
		...(source_id && sourcingItem && { source_id: sourcingItem.title }),
	}
	const breadcrumbs = useBreadcrumbs(breadcrumbData)

	return (
		<header className="flex items-center justify-between min-h-12 max-h-12 px-4 py-2 border-b border-[#e2e8f0] bg-white">
			<div className="flex items-center gap-2">
				<Breadcrumb items={breadcrumbs} />
			</div>

			<div className="flex items-center gap-2">
				<HeaderButtons
					isSourcingPage={isSourcingPage}
					isSourcingListPage={isSourcingListPage}
					isDetailPage={isDetailPage}
					canValidate={canValidate}
					source_id={source_id}
					handleOpenModal={handleOpenModal}
					showValidateButton={showValidateButton}
				/>
			</div>
		</header>
	)
}
