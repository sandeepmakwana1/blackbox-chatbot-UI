import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap text-xs hover:cursor-pointer font-medium transition-all disabled:pointer-events-none disabled:bg-neutral-100 disabled:text-neutral-500 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive disabled:[&_svg]:text-neutral-400",
	{
		variants: {
			variant: {
				primary: "bg-primary text-white [&_svg]:text-white hover:bg-primary-500",
				secondary:
					"bg-white border-[1px] border-neutral-400 text-neutral-700 [&_svg]:text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 hover:[&_svg]:text-neutral-900",
				tertiary: "bg-white border-[1px] border-primary text-primary [&_svg]:text-primary hover:bg-primary-100",
				outline:
					"border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
				ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 [&_svg]:text-neutral-700 hover:[&_svg]:text-neutral-900 hover:bg-neutral-200",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "px-4 py-2 gap-x-1 rounded-[8px] [&_svg:not([class*='size-'])]:size-5",
				large: "px-5 py-2.5 gap-x-1 rounded-[12px] text-sm [&_svg:not([class*='size-'])]:size-5",
				sm: "px-3 py-1.5 gap-x-1 rounded-[6px] [&_svg:not([class*='size-'])]:size-4",
				icon: "px-2 py-2 rounded-[8px] [&_svg:not([class*='size-'])]:size-5",
				"icon-sm": "px-2 py-2 rounded-[6px] [&_svg:not([class*='size-'])]:size-4",
				"icon-batch": "px-1.5 py-1.5 rounded-[6px] [&_svg:not([class*='size-'])]:size-4",
				"icon-pg":
					"h-[26px] w-[26px] flex items-center justify-center rounded-[6px] [&_svg:not([class*='size-'])]:size-3.5 leading-none",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "default",
		},
	}
)

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean
	}) {
	const Comp = asChild ? Slot : "button"

	return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
