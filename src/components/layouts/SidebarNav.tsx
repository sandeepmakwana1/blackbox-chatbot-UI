import { Link, useLocation } from "react-router-dom"
import { LogOut } from "lucide-react"
import { useLocalStore } from "~/store/data"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { cn } from "~/lib/utils"
import { useState } from "react"

import { ColorSwatch, GlobalSearch, Layer } from "iconsax-reactjs"
import { GradientIcon } from "../ui/gradientIcon"
import IconWrapper from "../ui/iconWrapper"

export default function SidebarNav() {
	const location = useLocation()
	const navigate = useNavigate()
	const logout = useLocalStore((state) => state.logout)
	const [isExpanded, setIsExpanded] = useState(false)

	const handleLogout = () => {
		logout()
		toast.success("Successfully logged out")
		navigate("/login")
	}

	const navItems = [
		{
			icon: <GlobalSearch size="18" color="#121822" />,
			label: "Sourced proposals",
			href: "/sourcing",
			isNew: false,
		},
		{
			icon: <Layer size="18" color="#121822" />,
			label: "Proposal tracking",
			href: "/validate",
			isNew: false,
		},
		{
			icon: (
				<GradientIcon
					Icon={ColorSwatch}
					angle={90}
					stops={[
						{ offset: "0%", color: "#5151D0" },
						{ offset: "100%", color: "#D4358F" },
					]}
					size={18}
					mode="stroke"
					strokeWidth={1.5}
				/>
			),
			label: "Batch processing",
			href: "/batch",
			isNew: true,
		},
	]

	return (
		<div
			className="relative w-16"
			onMouseEnter={() => setIsExpanded(true)}
			onMouseLeave={() => setIsExpanded(false)}
		>
			<div
				className={cn(
					"h-screen border-r border-[#e2e8f0] bg-white flex flex-col transition-all duration-300 ease-in-out absolute z-50",
					isExpanded ? "w-64" : "w-16"
				)}
			>
				<div className="px-3 py-2 border-b border-[#e2e8f0]">
					<Link to="/sourcing" className="flex items-center gap-2">
						<img src="/consultadd-logo.png" alt="ConsultAdd Logo" className="h-[31px] w-[31px]" />
					</Link>
				</div>

				<nav className="flex-1 p-2">
					<ul className="space-y-1">
						{navItems.map((item) => {
							const isActive = `/${location.pathname.split("/")[1]}` === item.href

							return (
								<li key={item.href} className="relative">
									<Link
										to={item.href}
										className={cn(
											"flex flex-col items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-all",
											isActive
												? "bg-[#C5CEFF] text-[#174cbe]"
												: "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]",
											isExpanded && "flex-row gap-3",
											item.isNew && isActive && "gradient-rotate-continuous",
											item.isNew && !isActive && "hover:gradient-rotate-hover"
										)}
										title={!isExpanded ? item.label : undefined}
									>
										{item.icon}
										{isExpanded && (
											<span className="whitespace-nowrap overflow-hidden transition-opacity duration-300">
												{item.label}
											</span>
										)}
									</Link>
									{item.isNew && (
										<div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 z-10">
											<div className="p-[1px] bg-gradient-to-r from-[#5151D0] to-[#D4358F] rounded-[38px]">
												<div className="px-1.5 py-0.5 bg-gradient-to-r from-[#FADBF2] to-[#D8E0F9] rounded-[38px] flex items-center">
													<span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5151D0] to-[#D4358F] font-medium text-xxxs">
														NEW
													</span>
												</div>
											</div>
										</div>
									)}
								</li>
							)
						})}
					</ul>
				</nav>

				<div className="p-2 border-t border-[#e2e8f0] mt-auto">
					<button
						onClick={handleLogout}
						className={cn(
							"flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
						)}
						title={!isExpanded ? "Sign Out" : undefined}
					>
						<LogOut className="h-5 w-5" />
						{isExpanded && (
							<span className="whitespace-nowrap overflow-hidden transition-opacity duration-300">
								Sign Out
							</span>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}
