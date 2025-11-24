import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

const PlaygroundLanding = () => {
	const navigate = useNavigate()

	useEffect(() => {
		navigate("/playground/config", { replace: true })
	}, [navigate])

	return null
}

export default PlaygroundLanding
