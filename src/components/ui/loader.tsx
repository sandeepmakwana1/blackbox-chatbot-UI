import { cn } from "~/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const loaderVariants = cva("inline-block animate-spin rounded-full border-solid border-t-transparent", {
	variants: {
		size: {
			xs: "h-3 w-3 border border-t-transparent",
			sm: "h-4 w-4 border-2 border-t-transparent",
			md: "h-5 w-5 border-2 border-t-transparent",
			lg: "h-6 w-6 border-2 border-t-transparent",
			xl: "h-8 w-8 border-2 border-t-transparent",
		},
		variant: {
			primary: "border-primary-300 border-t-transparent",
			neutral: "border-neutral-400 border-t-transparent",
			white: "border-white border-t-transparent",
			subtle: "border-neutral-300 border-t-transparent",
			yellow: "border-warning-300 border-t-transparent",
		},
	},
	defaultVariants: {
		size: "md",
		variant: "primary",
	},
})

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof loaderVariants> {
	/**
	 * Whether to show the loader
	 */
	loading?: boolean
	/**
	 * Subtle variant for the loader
	 */
	subtle?: boolean
}

const Loader = ({ className, size, variant, loading = true, style, ...props }: LoaderProps) => {
	if (!loading) return null

	return (
		<div
			className={cn(loaderVariants({ size, variant }), className)}
			style={{
				animationDuration: "0.8s",
				animationTimingFunction: "linear",
				...style,
			}}
			role="status"
			aria-label="Loading"
			{...props}
		>
			<span className="sr-only">Loading...</span>
		</div>
	)
}

export { Loader, loaderVariants }
