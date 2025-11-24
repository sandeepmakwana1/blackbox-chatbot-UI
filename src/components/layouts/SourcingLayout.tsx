import SidebarNav from "~/components/layouts/SidebarNav"
import SourcingHeader from "~/pages/sourcing/list/SourcingHeader"
import { Outlet } from "react-router-dom"
import { Toaster } from "sonner"
export default function SourcingLayout() {
	return (
		<div className="flex h-screen bg-[#f8fafc] overflow-hidden">
			<SidebarNav />

			<div className="flex-1 flex flex-col overflow-hidden">
				<SourcingHeader />

				<div className="flex-1 overflow-hidden">
					<Outlet />
				</div>
			</div>

			<Toaster position="top-right" richColors closeButton />
		</div>
	)
}
