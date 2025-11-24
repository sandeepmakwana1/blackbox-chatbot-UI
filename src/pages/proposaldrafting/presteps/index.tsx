import ProposalDrafting from "../ProposalDrafting"

const PrestepsView = () => {
	return (
		<div className="h-screen overflow-hidden flex flex-col items-center">
			<div className="h-full overflow-y-auto py-2 pb-15 w-full flex justify-center">
				<ProposalDrafting />
			</div>
		</div>
	)
}

export default PrestepsView
