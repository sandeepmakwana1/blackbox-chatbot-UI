import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "~/lib/utils"
import { Button } from "./button"
import "react-day-picker/style.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
	const [month, setMonth] = React.useState<Date>(new Date())
	const today = new Date()
	return (
		<div className="flex flex-col gap-1">
			<DayPicker
				month={month}
				today={today}
				endMonth={today}
				onMonthChange={setMonth}
				captionLayout="dropdown"
				animate
				showOutsideDays={showOutsideDays}
				className={cn("p-1", className)}
				classNames={{
					button_next: "bg-neutral-400 mb-6 ml-3 hover:bg-neutral-200",
					button_previous: "bg-neutral-400 mb-6 mr-3 hover:bg-neutral-200",
					chevron: "size-4",
					month_caption: "flex text-sm",
					day: "rounded-md cursor-default hover:bg-neutral-200 text-sm",
					selected: "rounded-md bg-primary-200 hover:bg-primary-200",
					today: "font-semibold text-primary-300",
					...classNames,
				}}
				{...props}
			/>
			<Button variant="secondary" size="sm" onClick={() => setMonth(today)}>
				Current Month
			</Button>
		</div>
	)
}
