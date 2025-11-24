import * as React from "react"
import * as Popover from "@radix-ui/react-popover"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "~/lib/utils"

function MultiSelect({ open, onOpenChange, children, ...props }: React.ComponentProps<typeof Popover.Root>) {
	return (
		<Popover.Root open={open} onOpenChange={onOpenChange} {...props}>
			{children}
		</Popover.Root>
	)
}

function MultiSelectTrigger({
	className,
	placeholder,
	selectedValues = [],
	size = "default",
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
	placeholder?: string
	selectedValues?: string[]
	size?: "sm" | "default"
}) {
	return (
		<Popover.Trigger asChild data-slot="multi-select-trigger" data-size={size} {...props}>
			<button
				type="button"
				className={cn(
					"flex w-fit justify-between rounded-md border px-3 py-2 text-sm",
					"hover:bg-neutral-100",
					className
				)}
			>
				<span
					className="truncate data-placeholder:text-neutral-600"
					data-placeholder={selectedValues.length === 0 ? true : undefined}
				>
					{selectedValues.length > 0 ? selectedValues.join(", ") : placeholder || "Select..."}
				</span>
				<span>
					<ChevronDownIcon className="size-4 opacity-50 text-neutral-600" />
				</span>
			</button>
		</Popover.Trigger>
	)
}

function MultiSelectContent({
	className,
	children,
	align = "start",
	...props
}: React.ComponentProps<typeof Popover.Content>) {
	return (
		<Popover.Portal>
			<Popover.Content
				data-slot="multi-select-content"
				align={align}
				className={cn("z-50 rounded-md border shadow-md p-1", className)}
				{...props}
			>
				<div className="max-h-60 overflow-y-auto">{children}</div>
			</Popover.Content>
		</Popover.Portal>
	)
}

function MultiSelectItem({
	className,
	children,
	value,
	selectedValues = [],
	onChange,
	...props
}: React.HTMLAttributes<HTMLDivElement> & {
	value: string
	selectedValues?: string[]
	onChange?: (value: string) => void
}) {
	const isSelected = selectedValues.includes(value)

	return (
		<div
			data-slot="multi-select-item"
			className={cn(
				"flex rounded-sm py-1.5 pl-2 pr-22 text-sm cursor-default",
				!isSelected && "hover:text-primary-300",
				isSelected && "bg-primary-100 text-primary-300",
				className
			)}
			onClick={() => onChange?.(value)}
			{...props}
		>
			{children}
		</div>
	)
}

export { MultiSelect, MultiSelectTrigger, MultiSelectContent, MultiSelectItem }
