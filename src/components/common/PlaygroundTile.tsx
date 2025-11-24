import AssetsManager from "~/lib/AssetsManager"
import { useParams } from "react-router-dom"
import { usePlaygroundStore } from "~/store/playgroundStore"
import { useContentGenerationStore } from "~/store/contentGenerationStore"

interface PlaygroundTileProps {
	isContentPage?: boolean
}

export const PlaygroundTile = ({ isContentPage = false }: PlaygroundTileProps) => {
	const { source_id } = useParams<{ source_id: string }>()
	const { openPlayground, isOpen } = usePlaygroundStore()
	const { getIsRegenPanelOpen, setIsRegenPanelOpen } = useContentGenerationStore()

	const handleOpenPlayground = () => {
		if (getIsRegenPanelOpen(source_id!)) {
			setIsRegenPanelOpen(source_id!, false)
		}
		setTimeout(() => {
			openPlayground()
		}, 200)
	}

	if (!source_id) {
		return null
	}

	if (isOpen) {
		return null
	}

	return (
		<div className="fixed bottom-12 right-0 z-50" onClick={isContentPage ? handleOpenPlayground : openPlayground}>
			<div className="border-l-4 border-t-4 border-b-4 hover:border-l-6 hover:border-t-6 hover:border-b-6 border-[#C5CEFF80]/50 hover:border-[#C5CEFF80] rounded-l-4xl transition-all hover:shadow-[-2px_0_14px_0_#C5D6F8]">
				<div className="flex gap-1.5 text-xs text-white bg-gradient-to-r from-[#5151D0] to-[#D4358F] py-2 pl-3.5 pr-1.5 rounded-l-4xl items-center cursor-pointer hover:pr-4 transition-all">
					<img src={AssetsManager.STAR_PLAYGROUND} alt="Star" className="w-3.5 h-3.5" />
					Playground
				</div>
			</div>
		</div>
	)
}
