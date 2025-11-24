export default function TypingDots() {
	return (
		<div className="flex items-center space-x-1 p-2">
			<div className="flex space-x-1">
				<div
					className="w-1 h-1 bg-gradient-to-r from-[#5151D0] to-[#D4358F] rounded-full animate-bounce shadow-sm"
					style={{ animationDelay: "0ms" }}
				></div>
				<div
					className="w-1 h-1 bg-gradient-to-r from-[#5151D0] to-[#D4358F] rounded-full animate-bounce shadow-sm"
					style={{ animationDelay: "150ms" }}
				></div>
				<div
					className="w-1 h-1 bg-gradient-to-r from-[#5151D0] to-[#D4358F] rounded-full animate-bounce shadow-sm"
					style={{ animationDelay: "300ms" }}
				></div>
			</div>
		</div>
	)
}
