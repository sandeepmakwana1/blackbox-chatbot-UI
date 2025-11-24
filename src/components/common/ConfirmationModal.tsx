import React from "react"
import { Button } from "../ui/button"

interface ConfirmationModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: (inputValue?: string) => void
	title: string
	icon?: React.ElementType
	text?: string
	inputPlaceholder?: string
	confirmLabel: string
	cancelLabel: string
	inputValue?: string
	onInputChange?: (value: string) => void
}

export const ConfirmationModal = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	icon: IconComponent,
	text,
	inputPlaceholder,
	confirmLabel,
	cancelLabel,
	inputValue = "",
	onInputChange,
}: ConfirmationModalProps) => {
	if (!isOpen) return null

	return (
		<>
			<div
				className="fixed inset-0 z-40"
				style={{
					backgroundColor: "rgba(0, 0, 0, 0.6)",
					pointerEvents: "auto",
				}}
				onClick={onClose}
			/>

			<div className="fixed inset-0 z-50 flex items-center justify-center">
				<div className="w-[473px] bg-white rounded-lg border border-gray-300 p-6">
					{IconComponent && (
						<div className="mb-4">
							<div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-[#FFEBE9] text-[#CD2F34] transition-all duration-200">
								<IconComponent size={20} />
							</div>
						</div>
					)}

					<h2 className="text-l font-semibold text-gray-900 mb-4">{title}</h2>

					{text && <p className="text-base text-neutral-700 mb-4">{text}</p>}

					{inputPlaceholder && (
						<div className="mb-8">
							<label htmlFor="input-field" className="block text-sm font-medium text-gray-800 mb-2">
								{inputPlaceholder}
							</label>
							<textarea
								id="input-field"
								value={inputValue}
								onChange={(e) => onInputChange?.(e.target.value)}
								placeholder="Type here..."
								rows={4}
								className="w-full px-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none placeholder:text-left placeholder:text-gray-500 resize-none"
							/>
						</div>
					)}

					<div className="flex justify-between gap-2 mt-4">
						<Button
							variant="secondary"
							size="sm"
							onClick={onClose}
							className="w-[50%] bg-gray-200 text-black hover:bg-gray-300 transition-colors duration-200 px-3 py-2 rounded-md"
						>
							{cancelLabel}
						</Button>

						<Button
							variant="primary"
							size="sm"
							onClick={() => onConfirm(inputValue || undefined)}
							className="w-[50%] bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 px-3 py-2 rounded-md"
							disabled={!!inputPlaceholder && !inputValue.trim()}
						>
							{confirmLabel}
						</Button>
					</div>
				</div>
			</div>
		</>
	)
}
