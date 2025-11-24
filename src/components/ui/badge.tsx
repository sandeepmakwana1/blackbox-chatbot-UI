import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

const badgeVariants = cva(
	"inline-flex items-center justify-center hover:cursor-default rounded-[5px] px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
	{
		variants: {
			variant: {
				neutral: " bg-neutral-400 text-neutral-800",
				neutralTransparent: " bg-neutral-300 text-neutral-700",
				primary: " bg-primary-200 text-primary-500 ",
				primaryTransparent: " bg-primary-100 text-primary ",
				success: " bg-success-200 text-success-500 ",
				successTransparent: " bg-success-100 text-success-400 ",
				warning: " bg-warning-200 text-warning-500 ",
				warningTransparent: " bg-warning-100 text-warning-400 ",
				danger: " bg-danger-200 text-danger-500 ",
				dangerTransparent: " bg-danger-100 text-danger-300 ",
				blue: "bg-[#BCD1FC] text-[#1845A7]",
				blueTransparent: "bg-[#E5EDFD] text-[#1C55D0]",
				pink: "bg-[#FCBCEF] text-[#B21B8F]",
				pinkTransparent: "bg-[#FDDCF6] text-[#E031B7]",
				orange: "bg-[#FCBC97] text-[#85370A]",
				orangeTransparent: "bg-[#FCD6C0] text-[#D64B19]",
				brown: "bg-[#F0EBEA] text-[#7F6B60]",

				destructive:
					"border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
				outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
			},
		},
		defaultVariants: {
			variant: "neutral",
		},
	}
)

function Badge({
	className,
	variant,
	asChild = false,
	dot = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & {
		asChild?: boolean
		dot?: boolean
	}) {
	const Comp = asChild ? Slot : "span"

	return (
		<Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
			{dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />}
			{props.children}
		</Comp>
	)
}

export { Badge, badgeVariants }
