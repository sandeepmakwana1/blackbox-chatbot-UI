import React from "react"

import { Check, ChevronLeft, ChevronRight, Loader2, ArrowRight, ArrowLeft } from "lucide-react"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"

interface StepProps {
	title: string
	description?: string
	isCompleted?: boolean
	isActive?: boolean
	stepNumber: number
}

const Step = ({ title, description, isCompleted, isActive, stepNumber }: StepProps) => {
	return (
		<div className="flex gap-1.5 items-center text-center">
			<div className="relative flex items-center justify-center">
				<div
					className={cn(
						"w-5 h-5 rounded-[6px] flex items-center justify-center text-xs font-normal",
						isCompleted
							? "bg-neutral-900 text-white"
							: isActive
							? "bg-primary-300 text-white"
							: "bg-neutral-100 border border-neutral-400 text-neutral-600"
					)}
				>
					{isCompleted ? <Check size={12} strokeWidth={1.5} /> : stepNumber}
				</div>
			</div>
			<div>
				<p
					className={cn(
						"text-sm font-normal",
						isCompleted ? "text-neutral-900" : isActive ? "text-primary" : "text-neutral-600"
					)}
				>
					{title}
				</p>
				{description && <p className="text-xs text-muted-foreground">{description}</p>}
			</div>
		</div>
	)
}

interface StepperProps {
	steps: Array<{ title: string; description?: string }>
	currentStep: number
	onStepChange: (step: number) => void
	isLoading?: boolean
	isDisabled?: boolean
	loadingText?: string
	nextStepText?: string
}

export function Stepper({
	steps,
	currentStep,
	onStepChange,
	isLoading = false,
	isDisabled = false,
	loadingText = "Loading...",
	nextStepText = "Next",
}: StepperProps) {
	return (
		<div className="w-full mx-auto">
			<div className="flex items-center justify-between">
				<div className="flex items-center">
					{steps.map((step, index) => (
						<React.Fragment key={step.title}>
							<Step
								title={step.title}
								description={step.description}
								isCompleted={index < currentStep}
								isActive={index === currentStep}
								stepNumber={index + 1}
							/>
							{index < steps.length - 1 && (
								<div className="flex justify-center mx-2">
									<div className={cn("w-4 h-px bg-neutral-400", isDisabled && "opacity-50")}></div>
								</div>
							)}
						</React.Fragment>
					))}
				</div>
				<div className="flex gap-1">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onStepChange(currentStep - 1)}
						disabled={currentStep === 0 || isLoading || isDisabled}
						className="bg-white border-neutral-400 text-neutral-700  hover:text-neutral-900 disabled:opacity-50"
					>
						<ArrowLeft size={16} />
						Previous
					</Button>
					<Button
						onClick={() => onStepChange(currentStep + 1)}
						disabled={isLoading || isDisabled}
						size="sm"
						className="bg-neutral-900 text-white  hover:bg-neutral-800 disabled:opacity-50"
					>
						{isLoading ? (
							<>
								<Loader2 size={16} className="animate-spin text-white" />
								{loadingText}
							</>
						) : (
							<>
								{nextStepText}
								<ArrowRight size={16} className="text-white" />
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	)
}
