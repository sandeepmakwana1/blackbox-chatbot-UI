import { forwardRef } from "react"

import { cn } from "~/lib/utils"

const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
	({ className, children, ...props }, ref) => {
		return (
			<label
				ref={ref}
				data-slot="label"
				className={cn(
					"flex items-center gap-2 text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
					className
				)}
				{...props}
			>
				{children}
			</label>
		)
	}
)

Label.displayName = "Label"

export { Label }
