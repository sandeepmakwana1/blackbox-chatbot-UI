import SidebarNav from "~/components/layouts/SidebarNav"
import { Outlet } from "react-router-dom"
import { Toaster } from "sonner"
import PreStepsHeader from "~/pages/proposaldrafting/PreStepsHeader"
import { Playground } from "~/components/playground/Playground"
import { PlaygroundTile } from "../common/PlaygroundTile"
export default function PreStepsLayoutLayout() {
	return (
		<div className="flex h-screen bg-neutral-200 overflow-hidden">
			<SidebarNav />

			<div className="flex flex-1 overflow-hidden">
				<div className="flex-1 flex flex-col overflow-hidden">
					<PreStepsHeader />
					<div className="flex-1 overflow-hidden">
						<Outlet />
					</div>
				</div>
				<Playground context="presteps" />
			</div>

			<PlaygroundTile />

			<Toaster position="top-right" richColors closeButton />
		</div>
	)
}
