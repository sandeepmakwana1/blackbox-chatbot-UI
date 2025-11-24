import { useEffect } from "react"
import { useNavigate, Outlet } from "react-router-dom"
import { useLocalStore } from "~/store/data"

export default function ProtectedRoute() {
	const isAuthenticated = useLocalStore((state) => state.isAuthenticated)
	const navigate = useNavigate()

	useEffect(() => {
		if (!isAuthenticated) {
			navigate("/login", { replace: true })
		}
	}, [isAuthenticated, navigate])

	return <Outlet />
}
