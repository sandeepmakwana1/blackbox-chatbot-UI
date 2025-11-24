import * as React from "react"

import { cn } from "~/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
	multiline?: boolean
	autoResize?: boolean
}

interface TextareaProps extends React.ComponentProps<"textarea"> {
	multiline: true
	autoResize?: boolean
}

function Input(props: InputProps | TextareaProps) {
	const { className, multiline = false, autoResize = false, ...restProps } = props
	const textareaRef = React.useRef<HTMLTextAreaElement>(null)

	// Auto-resize functionality for textarea
	React.useEffect(() => {
		if (multiline && autoResize && textareaRef.current) {
			const textarea = textareaRef.current
			const adjustHeight = () => {
				textarea.style.height = "auto"
				textarea.style.height = `${textarea.scrollHeight}px`
			}

			adjustHeight()
			textarea.setSelectionRange(textarea.value.length, textarea.value.length)
			textarea.addEventListener("input", adjustHeight)

			return () => textarea.removeEventListener("input", adjustHeight)
		}
	}, [multiline, autoResize, multiline && (restProps as TextareaProps).value])

	const baseClasses = cn(
		"w-full min-w-0 bg-transparent text-base md:text-sm",
		"placeholder:text-muted-foreground selection:bg-neutral-400 selection:text-primary-foreground",
		"transition-[color,box-shadow] outline-none resize-none",
		"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
		className
	)

	const editModeClasses = cn(
		baseClasses,
		"border-none shadow-none p-0 m-0",
		"focus:ring-0 focus:border-none focus:shadow-none",
		"rounded-none"
	)

	if (multiline) {
		const { multiline: _, autoResize: __, ...textareaProps } = restProps as TextareaProps
		return (
			<textarea ref={textareaRef} data-slot="textarea" className={editModeClasses} rows={1} {...textareaProps} />
		)
	}

	const { multiline: _, autoResize: __, type, ...inputProps } = restProps as InputProps
	return <input type={type} data-slot="input" className={editModeClasses} {...inputProps} />
}

export { Input }
