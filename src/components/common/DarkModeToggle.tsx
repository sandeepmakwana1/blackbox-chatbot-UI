// src/components/DarkModeToggle.tsx
import { useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "~/components/ui/button"

import { useThemeStore } from "app/store/data"

const DarkModeToggle = () => {
	const darkMode = useThemeStore((state) => state.darkMode)
	const toggleTheme = useThemeStore((state) => state.toggleTheme)

	useEffect(() => {
		document.documentElement.classList.toggle("dark", darkMode)
	}, [darkMode])

	return (
		<Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
			{darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
		</Button>
	)
}

export default DarkModeToggle
