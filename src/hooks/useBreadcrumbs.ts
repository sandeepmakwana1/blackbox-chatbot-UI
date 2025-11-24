import { useLocation, useParams } from "react-router-dom"
import { useMemo } from "react"
// Make sure this import path is correct for your project structure
import { RouteMappings } from "~/routes"

type BreadcrumbItem = {
	href: string
	label: any
	isCurrent?: boolean
}

function findRouteMatch(path: string) {
	if (RouteMappings[path]) {
		return RouteMappings[path]
	}

	const dynamicMatchKey = Object.keys(RouteMappings).find((key) => {
		const keyParts = key.split("/").filter(Boolean)
		const pathParts = path.split("/").filter(Boolean)

		if (keyParts.length !== pathParts.length) return false

		return keyParts.every((part, index) => {
			return part.startsWith(":") || part === pathParts[index]
		})
	})

	return dynamicMatchKey ? RouteMappings[dynamicMatchKey] : null
}

export function useBreadcrumbs(breadcrumbData: Record<string, any> = {}) {
	const location = useLocation()
	const params = useParams<{ [key: string]: string }>()

	const breadcrumbs = useMemo(() => {
		const items: BreadcrumbItem[] = []
		const initialMatch = findRouteMatch(location.pathname)

		if (initialMatch?.parent) {
			let currentPathForLookup: string | undefined = location.pathname
			let isFirstIteration = true

			while (currentPathForLookup) {
				const match = findRouteMatch(currentPathForLookup)
				if (match) {
					const href = Object.entries(params).reduce(
						(path, [key, value]) => path.replace(`:${key}`, value!),
						match.path
					)

					let label = match.label
					if (match.dynamicKey && !isFirstIteration) {
						if (breadcrumbData[match.dynamicKey]) {
							label = breadcrumbData[match.dynamicKey]
						} else if (params[match.dynamicKey]) {
							label = `...`
						}
					}

					items.unshift({ href, label })

					isFirstIteration = false
					currentPathForLookup = match.parent
						? Object.entries(params).reduce(
								(path, [key, value]) => path.replace(`:${key}`, value!),
								match.parent
						  )
						: undefined
				} else {
					currentPathForLookup = undefined
				}
			}
		} else {
			const pathSegments = location.pathname.split("/").filter(Boolean)
			let currentPath = ""

			for (const segment of pathSegments) {
				currentPath += `/${segment}`
				const match = findRouteMatch(currentPath)

				if (match) {
					let label = match.label
					if (match.dynamicKey && breadcrumbData[match.dynamicKey]) {
						label = breadcrumbData[match.dynamicKey]
					} else if (match.dynamicKey && params[match.dynamicKey]) {
						label = `...`
					}
					items.push({ href: currentPath, label })
				} else {
					items.push({
						href: currentPath,
						label: segment.charAt(0).toUpperCase() + segment.slice(1),
					})
				}
			}
		}

		if (items.length > 0) {
			items[items.length - 1].isCurrent = true
		}

		return items
	}, [location.pathname, params, breadcrumbData])

	return breadcrumbs
}
