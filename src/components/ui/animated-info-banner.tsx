import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SquareDashedMousePointer } from "lucide-react"

interface AnimatedInfoBannerProps {
	delay?: number
	className?: string
}

export default function AnimatedInfoBanner({ delay = 0, className = "" }: AnimatedInfoBannerProps) {
	const [isExpanded, setIsExpanded] = useState(false)
	const textRef = useRef<HTMLSpanElement>(null)
	const [textWidth, setTextWidth] = useState(0)

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsExpanded(true)
		}, delay)

		return () => clearTimeout(timer)
	}, [delay])

	useEffect(() => {
		if (textRef.current) {
			setTextWidth(textRef.current.scrollWidth)
		}
	}, [])

	const text = "Hover on desired section to Mark it as 'Executive Summary' to proceed."

	return (
		<motion.div
			initial={{ scale: 0.8, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{
				type: "spring",
				stiffness: 400,
				damping: 25,
				delay: delay / 1000,
			}}
			className={`inline-flex bg-warning-100 border-warning-200 border items-center gap-1.5 px-2.5 py-[7px] text-xs rounded-md text-warning-400 ${className}`}
		>
			<motion.div
				initial={{ rotate: -10 }}
				animate={{ rotate: 0 }}
				transition={{
					type: "spring",
					stiffness: 300,
					damping: 20,
					delay: (delay + 200) / 1000,
				}}
			>
				<SquareDashedMousePointer size={16} className="text-warning-400 flex-shrink-0" strokeWidth={2} />
			</motion.div>

			<div className="relative">
				{/* Hidden text to measure width */}
				<span ref={textRef} className="absolute invisible whitespace-nowrap text-xs" aria-hidden="true">
					{text}
				</span>

				<AnimatePresence>
					{isExpanded && (
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: textWidth }}
							transition={{
								type: "spring",
								stiffness: 300,
								damping: 25,
								delay: (delay + 300) / 1000,
							}}
							className="overflow-hidden"
						>
							<motion.span
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{
									duration: 0.3,
									delay: (delay + 500) / 1000,
								}}
								className="whitespace-nowrap block"
							>
								{text}
							</motion.span>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</motion.div>
	)
}
