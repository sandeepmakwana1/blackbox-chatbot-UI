import { AnimatePresence, motion } from "framer-motion"
import { useBatchStore } from "~/store/batchStore"
import { ValidationBatch } from "~/pages/batch/view/step2/ValidationBatch"
import { BatchProcessing } from "~/pages/batch/view/step4/BatchProcessing"
import { AgencyReferenceBatch } from "~/pages/batch/view/step3/AgencyReferenceBatch"

const BatchView = () => {
	const step = useBatchStore((state) => state.step)

	const variants = {
		enter: { opacity: 0, y: 20 },
		center: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -20 },
	}

	return (
		<div className="flex flex-col h-full overflow-hidden my-6">
			<AnimatePresence mode="wait">
				<motion.div
					// key={step}
					variants={variants}
					initial="enter"
					animate="center"
					exit="exit"
					transition={{ duration: 0.3, ease: "easeInOut" }}
					className="h-full"
				>
					{step === "validation" && <ValidationBatch />}
					{step === "agency" && <AgencyReferenceBatch />}
					{step === "processing" && <BatchProcessing />}
				</motion.div>
			</AnimatePresence>
		</div>
	)
}

export default BatchView
