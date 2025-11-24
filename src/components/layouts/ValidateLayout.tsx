import SidebarNav from "~/components/layouts/SidebarNav"
import { Outlet } from "react-router-dom"
import { Toaster } from "sonner"
import ValidateHeader from "~/pages/validation/list/ValidateHeader"
import { Playground } from "~/components/playground/Playground"
import { PlaygroundTile } from "~/components/common/PlaygroundTile"
export default function ValidateLayout() {
	return (
		<div className="flex h-screen bg-[#f8fafc] overflow-hidden">
			<SidebarNav />

			<div className="flex flex-1 overflow-hidden">
				<div className="flex-1 flex flex-col overflow-hidden">
					<ValidateHeader />
					<div className="flex-1 overflow-hidden">
						<Outlet />
					</div>
				</div>
				<Playground onZindex={true} context="validation" />
			</div>

			<PlaygroundTile />

			<Toaster position="top-right" richColors closeButton />
		</div>
	)
}
