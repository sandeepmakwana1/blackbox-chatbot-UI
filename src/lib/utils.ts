import { clsx, type ClassValue } from "clsx"
import { toast } from "sonner"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const localStorageConfig = {
	getItem: (name: string) => {
		const item = localStorage.getItem(name)
		return item ? JSON.parse(item) : null
	},
	setItem: (name: string, value: any) => {
		localStorage.setItem(name, JSON.stringify(value))
	},
	removeItem: (name: string) => {
		localStorage.removeItem(name)
	},
}

export const sessionStorageConfig = {
	getItem: (name: string) => {
		const item = sessionStorage.getItem(name)
		return item ? JSON.parse(item) : null
	},
	setItem: (name: string, value: any) => {
		sessionStorage.setItem(name, JSON.stringify(value))
	},
	removeItem: (name: string) => {
		sessionStorage.removeItem(name)
	},
}
export function truncateText(text: string | null | undefined, maxLength: number, ellipsis = "..."): string {
	if (!text) return ""

	if (text.length <= maxLength) {
		return text
	}

	// Calculate where to cut the string to accommodate the ellipsis
	// const truncateAt = maxLength - ellipsis.length
	return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

export function truncateFilename(filename: string | null | undefined, maxLength: number, ellipsis = "..."): string {
	if (!filename) return ""

	if (filename.length <= maxLength) {
		return filename
	}

	// Split the filename to preserve extension
	const lastDotIndex = filename.lastIndexOf(".")

	// If no extension or the extension is the filename (e.g., ".gitignore")
	if (lastDotIndex <= 0) {
		return truncateText(filename, maxLength, ellipsis)
	}

	const name = filename.substring(0, lastDotIndex)
	const extension = filename.substring(lastDotIndex)

	// Make sure we have enough room for the extension and ellipsis
	const maxNameLength = maxLength - extension.length - ellipsis.length

	if (maxNameLength <= 0) {
		// If extension is too long, truncate the whole thing
		return truncateText(filename, maxLength, ellipsis)
	}

	return name.slice(0, maxNameLength) + ellipsis + extension
}

export const handleAxiosError = (error: any) => {
	const message =
		error.response?.data?.detail ||
		error.response?.data?.error ||
		error.response?.data?.message ||
		error.message ||
		error.details ||
		"Bad Request"

	toast.error(message)

	console.error("API Error:", message)
}

export const getCurrentPrestepStage = () => {
	const savedData = localStorage.getItem("currentDraftProposal")
	if (savedData) {
		const { savedSourceId, step } = JSON.parse(savedData)

		return {
			title: step,
			source_id: savedSourceId,
		}
	} else {
		return {
			title: "Summary",
			source_id: null,
		}
	}
}

export const getRelevantBadgeVariant = (score: number) => {
	if (score > 90) return "success"
	if (score > 50) return "warning"
	return "danger"
}
