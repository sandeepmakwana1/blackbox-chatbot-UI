import { Navigate, Route, Routes } from "react-router-dom"
import PlaygroundStandaloneLayout from "~/components/layouts/PlaygroundStandaloneLayout"
import ConfigPage from "~/pages/playground/config"
import StandalonePlaygroundPage from "~/pages/playground"

const AppRouter = () => {
	return (
		<Routes>
			<Route path="/" element={<PlaygroundStandaloneLayout />}>
				<Route index element={<Navigate to="/playground/config" replace />} />
				<Route path="playground">
					<Route index element={<Navigate to="/playground/config" replace />} />
					<Route path="config" element={<ConfigPage />} />
					<Route path=":source_id" element={<StandalonePlaygroundPage />} />
				</Route>
				<Route path="*" element={<Navigate to="/playground/config" replace />} />
			</Route>
		</Routes>
	)
}

export default AppRouter
