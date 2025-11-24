import { useEffect } from "react"
import type { RefObject } from "react"

type Options = {
	extraRefs?: Array<RefObject<HTMLElement>>
	ignoreSelectors?: string[]
	ignorePredicate?: (event: MouseEvent | TouchEvent) => boolean
}

const DEFAULT_IGNORES: string[] = [
	".mdxeditor",
	".mdxeditor-toolbar",
	'[role="toolbar"]',
	"[data-radix-select-trigger]",
	"[data-radix-select-content]",
	"[data-radix-select-viewport]",
	"[data-radix-select-item]",
	"[data-radix-select-portal]",
	"[data-radix-dropdown-menu-trigger]",
	"[data-radix-dropdown-menu-content]",
	"[data-radix-popper-content]",
	"[data-radix-portal]",
	'[role="menu"]',
	'[role="menuitem"]',
	'[role="listbox"]',
	'[role="option"]',
	'[role="combobox"]',
	'[aria-haspopup="listbox"]',
	'[aria-expanded="true"]',
	".ProseMirror",
	".cm-editor",
	".cm-content",
	"button",
]

export function useClickOutside(ref: RefObject<HTMLElement>, handler: () => void, options: Options = {}) {
	const { extraRefs = [], ignoreSelectors, ignorePredicate } = options

	useEffect(() => {
		const listener = (event: MouseEvent | TouchEvent) => {
			const target = event.target as Element | null
			if (!target) return

			if (ref.current && ref.current.contains(target)) return

			for (const r of extraRefs) {
				if (r?.current && r.current.contains(target)) return
			}

			const mergedIgnores = Array.from(new Set([...(ignoreSelectors ?? []), ...DEFAULT_IGNORES]))

			for (const sel of mergedIgnores) {
				if (target.closest(sel)) return
			}

			if (ignorePredicate && ignorePredicate(event)) return

			handler()
		}

		document.addEventListener("mousedown", listener, true)
		document.addEventListener("touchstart", listener, true)

		return () => {
			document.removeEventListener("mousedown", listener, true)
			document.removeEventListener("touchstart", listener, true)
		}
	}, [ref, handler, extraRefs, ignoreSelectors, ignorePredicate])
}
