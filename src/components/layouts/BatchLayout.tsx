import SidebarNav from "~/components/layouts/SidebarNav"
import { Outlet } from "react-router-dom"
import { Toaster } from "sonner"
import { Playground } from "~/components/playground/Playground"
import { PlaygroundTile } from "../common/PlaygroundTile"
import BatchHeader from "~/pages/batch/BatchHeader"
export default function BulkLayout() {
	return (
		<div className="flex h-screen bg-neutral-200 overflow-hidden">
			<SidebarNav />

			<div className="flex flex-1 overflow-hidden">
				<div className="flex-1 flex flex-col overflow-hidden">
					<BatchHeader />
					<div className="flex-1 overflow-hidden dotted-background">
						<Outlet />
					</div>
				</div>
				<Playground context="bulk" onZindex />
			</div>

			<PlaygroundTile />

			<Toaster position="top-right" richColors closeButton />
		</div>
	)
}
