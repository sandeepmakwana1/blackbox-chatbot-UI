// src/components/LogoutButton.tsx
// import React from 'react';
import { Button } from "~/components/ui/button"
import { LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useLocalStore } from "app/store/data"

const LogoutButton = () => {
	const logout = useLocalStore((state) => state.logout)
	const navigate = useNavigate()

	const handleLogout = () => {
		logout()
		toast.success("Successfully logged out")
		navigate("/login")
	}

	return (
		<Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
			<LogOut className="h-4 w-4" />
			<span>Logout</span>
		</Button>
	)
}

export default LogoutButton
