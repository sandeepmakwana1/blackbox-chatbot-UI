import { useBreadcrumbs } from "~/hooks/useBreadcrumbs"
import { Breadcrumb } from "~/components/common/BreadCrumbComponent"

export default function BatchHeader() {
	const breadcrumbData = {
		...{ source_id: "view" },
	}
	const breadcrumbs = useBreadcrumbs(breadcrumbData)

	return (
		<header className="flex items-center justify-between h-12 px-4 py-2 border-b border-[#e2e8f0] bg-white">
			<div className="flex items-center gap-2">
				<Breadcrumb items={breadcrumbs} />
			</div>
		</header>
	)
}
