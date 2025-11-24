import SidebarNav from "~/components/layouts/SidebarNav"
import { Outlet } from "react-router-dom"
import { Toaster } from "sonner"
import DraftingHeader from "~/pages/contentGeneration/DraftingHeader"
import { Playground } from "~/components/playground/Playground"
import { PlaygroundTile } from "../common/PlaygroundTile"

export default function ContentGenerationLayout() {
	return (
		<div className="flex h-screen bg-[#f8fafc] overflow-hidden">
			<SidebarNav />

			<div className="flex flex-1 overflow-hidden">
				<div className="flex-1 flex flex-col overflow-hidden">
					<DraftingHeader />
					<div className="flex-1 overflow-hidden">
						<Outlet />
					</div>
				</div>
				<Playground context="content-generation" />
			</div>

			<PlaygroundTile isContentPage />

			<Toaster position="top-right" richColors closeButton />
		</div>
	)
}
