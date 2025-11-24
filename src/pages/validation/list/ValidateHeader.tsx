import { useParams, useLocation } from "react-router"
import { useSourcingItemById } from "~/handlers/sourcingHandler"
import { SharedHeader } from "~/shared/SharedHeader"

export default function ValidateHeader() {
	const { source_id } = useParams<{ source_id?: string }>()
	const location = useLocation()
	const numericSourceId = source_id ? Number(source_id) : undefined
	const { data: validationItem } = useSourcingItemById(numericSourceId)

	const canValidate =
		validationItem && (validationItem.URLupload?.length > 0 || validationItem.Manualupload?.length > 0)
	const isDetailPage = location.pathname.startsWith("/validate/") && !!source_id

	return (
		<SharedHeader
			isSourcingPage={false}
			isSourcingListPage={false}
			isDetailPage={isDetailPage}
			canValidate={!!canValidate}
			source_id={source_id}
			showValidateButton={false}
		/>
	)
}
