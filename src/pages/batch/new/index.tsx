import { AnimatePresence, motion } from "framer-motion"
import BatchList from "~/pages/batch/new/step1/BatchList"

const BulkStart = () => {
	const variants = {
		enter: { opacity: 0, y: 20 },
		center: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -20 },
	}

	return (
		<div className="flex flex-col h-full overflow-hidden my-6">
			<AnimatePresence mode="wait">
				<motion.div
					variants={variants}
					initial="enter"
					animate="center"
					exit="exit"
					transition={{ duration: 0.3, ease: "easeInOut" }}
					className="h-full"
				>
					<BatchList />
				</motion.div>
			</AnimatePresence>
		</div>
	)
}

export default BulkStart
