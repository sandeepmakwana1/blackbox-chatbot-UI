import { Outlet } from "react-router-dom"

const PlaygroundStandaloneLayout = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-[#F4F7FB] via-white to-[#EEF2FF] text-neutral-900">
			<Outlet />
		</div>
	)
}

export default PlaygroundStandaloneLayout
