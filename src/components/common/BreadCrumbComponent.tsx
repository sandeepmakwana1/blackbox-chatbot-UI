import {
	Breadcrumb as ShadcnBreadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbSeparator,
	BreadcrumbPage,
	RouterBreadcrumbLink,
} from "~/components/ui/breadcrumb"

type BreadcrumbItem = {
	href: string
	label: string
	isCurrent?: boolean
}

type BreadcrumbProps = {
	items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
	return (
		<ShadcnBreadcrumb>
			<BreadcrumbList className="flex items-center">
				{items.map((item, index) => (
					<div key={index} className="flex items-center gap-[2px]">
						<BreadcrumbItem>
							{item.isCurrent ? (
								<BreadcrumbPage className="text-sm font-medium text-foreground truncate block max-w-[300px]">
									{item.label}
								</BreadcrumbPage>
							) : (
								<RouterBreadcrumbLink
									className="text-[#6E7C91] hover:bg-[#EDF2F7] py-[3px] px-[6px] rounded-[5px]"
									to={item.href}
								>
									{item.label}
								</RouterBreadcrumbLink>
							)}
						</BreadcrumbItem>
						{!item.isCurrent && index < items.length - 1 && (
							<BreadcrumbSeparator className="[&>svg]:size-4 text-muted-foreground">
								/
							</BreadcrumbSeparator>
						)}
					</div>
				))}
			</BreadcrumbList>
		</ShadcnBreadcrumb>
	)
}
