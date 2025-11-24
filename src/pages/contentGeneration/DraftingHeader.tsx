import { useParams } from "react-router-dom"
import { Button } from "~/components/ui/button"
import { useContentGenerationStore } from "~/store/contentGenerationStore"
import { exportAsDocx } from "~/lib/Export-docs"
import { ChevronDown } from "lucide-react"
import { useSourcingItemById } from "~/handlers/sourcingHandler"
import { useBreadcrumbs } from "~/hooks/useBreadcrumbs"
import { Breadcrumb } from "~/components/common/BreadCrumbComponent"
import { truncateText } from "~/lib/utils"

export default function DraftingHeader() {
	const { source_id } = useParams<{ source_id: string }>()
	const { getContent } = useContentGenerationStore()
	const handleExport = async () => {
		if (!source_id) {
			console.error("No source ID available for export")
			return
		}

		try {
			const content = getContent(source_id)

			if (!content || content.length === 0) {
				console.warn("No content available to export")
				return
			}

			// Transform the content to match the expected Section[] format for export
			const exportContent = content.map((section) => ({
				sectionName: section.sectionName || "Untitled Section",
				content: section.content || "",
				subsections: section.subsections || [],
			}))

			// Generate a meaningful filename
			const timestamp = new Date().toISOString().split("T")[0]
			const filename = `Content-${source_id}-${timestamp}`

			await exportAsDocx(exportContent, filename)

			console.log("Export completed successfully")
		} catch (error) {
			console.error("Failed to export content:", error)
			// You might want to show a toast notification here
		}
	}

	const { data: sourcingItem } = useSourcingItemById(parseInt(source_id))

	const breadcrumbData = {
		...(source_id && sourcingItem && { source_id: truncateText(sourcingItem.title, 42) }),
	}
	const breadcrumbs = useBreadcrumbs(breadcrumbData)

	return (
		<header className="flex items-center justify-between px-4 py-2 border-b border-[#e2e8f0] bg-white">
			<div className="flex items-center gap-2">
				<Breadcrumb items={breadcrumbs} />
			</div>

			<div className="flex items-center gap-2">
				<Button size="sm" variant="tertiary" onClick={handleExport}>
					Export
					<ChevronDown />
				</Button>
			</div>
		</header>
	)
}
