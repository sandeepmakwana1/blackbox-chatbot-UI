import { route, layout, index } from "@react-router/dev/routes"
import { ColorSwatch, GlobalSearch, Layer } from "iconsax-reactjs"
import IconWrapper from "./components/ui/iconWrapper"

type RouteMapping = {
	path: string
	label: string | React.ReactNode
	dynamicKey?: string
	parent?: string
}

const PLAYGROUND_ONLY = import.meta.env.VITE_PLAYGROUND_ONLY === "true"

const playgroundRoutes = [
	index("pages/playground/landing.tsx"),
	route("playground", "components/layouts/PlaygroundStandaloneLayout.tsx", [
		index("pages/playground/landing.tsx"),
		route("config", "pages/playground/config.tsx"),
		route(":source_id", "pages/playground/index.tsx"),
	]),
]

if (PLAYGROUND_ONLY) {
	export default playgroundRoutes
}

export default [
	index("pages/login/index.tsx"),
	route("login", "pages/login/Login.tsx"),
	route("playground", "components/layouts/PlaygroundStandaloneLayout.tsx", [
		index("pages/playground/landing.tsx"),
		route("config", "pages/playground/config.tsx"),
		route(":source_id", "pages/playground/index.tsx"),
	]),

	// Protected routes (require authentication)
	layout("lib/ProtectedRoute.tsx", [
		route("sourcing", "components/layouts/SourcingLayout.tsx", [
			index("pages/sourcing/list/index.tsx"), // Handles /sourcing list
			route(":source_id", "pages/sourcing/view/index.tsx"),
		]),
		route("validate", "components/layouts/ValidateLayout.tsx", [
			index("pages/validation/list/index.tsx"), // Handles /validation list
			route(":source_id", "pages/validation/view/index.tsx"),
		]),
		layout("lib/StageProtectedRoute.tsx", [
			route("presteps", "components/layouts/PreStepsLayout.tsx", [
				index("pages/proposaldrafting/index.tsx"),
				route(":source_id", "pages/proposaldrafting/presteps/index.tsx"),
			]),
			route("content-generation", "components/layouts/ContentGenerationLayout.tsx", [
				index("pages/contentGeneration/index.tsx"), // Handles /content-generation list
				route(":source_id", "pages/contentGeneration/view/index.tsx"),
			]),
		]),
		route("batch", "components/layouts/BatchLayout.tsx", [
			index("pages/batch/index.tsx"),
			route("new", "pages/batch/new/index.tsx"),
			route(":batch_id", "pages/batch/view/index.tsx"),
		]),
	]),
]

export const RouteMappings: Record<string, RouteMapping> = {
	"/sourcing": {
		path: "/sourcing",
		label: (
			<div className="flex items-center gap-1 ">
				<GlobalSearch size={18} />
				<h1 className="text-[14px]">Contract opportunities</h1>
			</div>
		),
	},
	"/sourcing/:source_id": {
		path: "/sourcing/:source_id",
		label: "Source details",
		dynamicKey: "source_id",
	},
	"/sourcing/:source_id/draft-proposal": {
		path: "/sourcing/:source_id/draft-proposal",
		label: "Draft Proposal",
		dynamicKey: "source_id",
	},
	"/validate": {
		path: "/validate",
		label: (
			<div className="flex items-center gap-1">
				<Layer size={18} />
				<h1 className="font-[14px] leading-[24px]">Proposal tracking</h1>
			</div>
		),
	},
	"/validate/:source_id": {
		path: "/validate/:source_id",
		label: "Validation details",
		dynamicKey: "source_id",
		parent: "/validate",
	},
	"/presteps/:source_id": {
		path: "/presteps/:source_id",
		label: "Pre-Steps",
		dynamicKey: "source_id",
	},
	"/content-generation": {
		path: "/content-generation",
		label: "Proposal Drafting",
		parent: "/validate",
	},
	"/content-generation/:source_id": {
		path: "/content-generation/:source_id",
		label: "Proposal drafting",
		dynamicKey: "source_id",
		parent: "/validate/:source_id",
	},
	"/batch": {
		path: "/batch",
		label: (
			<div className="flex items-center gap-1">
				<IconWrapper strokeWidth={1.5} size={18}>
					<ColorSwatch />
				</IconWrapper>
				<h1 className="font-[14px] leading-[24px]">Batch Processing</h1>
			</div>
		),
	},
}
