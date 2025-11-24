import { useState, useEffect, useRef } from "react"
import {
	useTeams,
	useTeamMembers,
	useAssignedMembers,
	useAssignRfpToUser,
	useUnassignRfpFromUser,
} from "~/handlers/teamsHandler"
import type { Team, TeamMember } from "~/types/teams"
import { UserSquare } from "iconsax-reactjs"
import { Plus, X } from "lucide-react"

interface RfpAssigneesProps {
	source_id: number
	rfp_id: string
}

const getTeamDotColor = (teamName?: string): string => {
	if (teamName?.toLowerCase().includes("management")) return "#FF3366"
	if (teamName?.toLowerCase().includes("legal")) return "#1472FF"
	let hash = 0
	for (let i = 0; i < (teamName?.length || 0); i++) {
		hash = teamName!.charCodeAt(i) + ((hash << 5) - hash)
		hash = hash & hash
	}
	const color = (hash & 0x00ffffff).toString(16).toUpperCase()
	return "#" + "000000".substring(0, 6 - color.length) + color
}

export const RfpAssigneesComponent: React.FC<RfpAssigneesProps> = ({ source_id, rfp_id }) => {
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
	const [showTeamsDropdown, setShowTeamsDropdown] = useState(false)
	const [showMembersDropdown, setShowMembersDropdown] = useState(false)

	const teamsDropdownRef = useRef<HTMLDivElement | null>(null)
	const membersDropdownRef = useRef<HTMLDivElement | null>(null)

	const {
		data: assignedMembers = [],
		isLoading: isLoadingAssignedMembers,
		error: errorAssignedMembers,
	} = useAssignedMembers(source_id)

	const { data: availableTeams = [], isLoading: isLoadingTeams } = useTeams()

	const { data: teamMembers = [], isLoading: isLoadingTeamMembers } = useTeamMembers(selectedTeam?.id)

	const assignMutation = useAssignRfpToUser()
	const unassignMutation = useUnassignRfpFromUser()

	const assignedMember = assignedMembers[0]

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node
			if (teamsDropdownRef.current && !teamsDropdownRef.current.contains(target)) {
				setShowTeamsDropdown(false)
			}
			if (membersDropdownRef.current && !membersDropdownRef.current.contains(target)) {
				setShowMembersDropdown(false)
			}
		}
		document.addEventListener("mousedown", handleClickOutside)
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [])

	const handleSelectTeam = (team: Team) => {
		setSelectedTeam(team)
		setShowTeamsDropdown(false)
		setShowMembersDropdown(true)
	}

	const handleAddMember = async (member: TeamMember) => {
		if (!selectedTeam) return

		assignMutation.mutate(
			{ source_id, team_id: selectedTeam.id, user_id: member.id, rfp_id },
			{
				onSuccess: () => {
					setShowMembersDropdown(false)
					setSelectedTeam(null)
				},
				onError: (error) => {
					console.error("Failed to assign member:", error)
				},
			}
		)
	}

	const handleDeleteMember = async () => {
		if (!assignedMember) return

		unassignMutation.mutate(
			{ source_id, user_id: assignedMember.user_id },
			{
				onError: (error) => {
					console.error("Failed to unassign member:", error)
				},
			}
		)
	}

	if (isLoadingAssignedMembers) {
		return (
			<div className="flex flex-col items-start">
				<span className="text-[#121822] text-[14px] font-medium mb-1">Assignees</span>
				<div className="flex items-center space-x-2 text-gray-500">
					<div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
					<span>Loading assignees...</span>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col items-start">
			<span className="text-[#121822] text-[14px] font-medium mb-[8px]">Assignees</span>

			{errorAssignedMembers && (
				<div className="text-sm text-red-600 my-2">
					Error: {errorAssignedMembers instanceof Error ? errorAssignedMembers.message : "An error occurred."}
				</div>
			)}
			{assignMutation.error && (
				<div className="text-sm text-red-600 my-2">
					Failed to assign:{" "}
					{assignMutation.error instanceof Error ? assignMutation.error.message : "Please try again."}
				</div>
			)}
			{unassignMutation.error && (
				<div className="text-sm text-red-600 my-2">
					Failed to unassign:{" "}
					{unassignMutation.error instanceof Error ? unassignMutation.error.message : "Please try again."}
				</div>
			)}

			<div className="flex items-center flex-wrap gap-2 self-stretch">
				{assignedMember ? (
					<>
						<div
							className="flex shrink-0 items-center bg-[#FFFFFF] pt-[6px] pb-[6px] pl-[8px] pr-[10px] rounded-[6px] border border-solid border-[#CBD5E1]"
							style={{ boxShadow: "1px 1px 1px #F6F6F6" }}
						>
							<span
								className="w-[8px] h-[8px] rounded-full mr-[6px]"
								style={{ backgroundColor: getTeamDotColor(assignedMember.team_name) }}
							></span>
							<span className="text-[#121822] text-[14px] font-medium">{assignedMember.team_name}</span>
						</div>
						<div
							className="relative group flex shrink-0 items-center bg-[#FFFFFF] pt-[6px] pb-[6px] pl-[8px] pr-[24px] rounded-[6px] border border-solid border-[#CBD5E1]"
							style={{ boxShadow: "1px 1px 1px #F6F6F6" }}
						>
							<UserSquare size="16" className="mr-2 text-gray-500" />
							<span className="text-[#6D7C91] text-[14px] font-medium">
								{assignedMember.name || assignedMember.email}
							</span>
							<button
								onClick={handleDeleteMember}
								disabled={unassignMutation.isPending}
								className="absolute right-[4px] top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
								aria-label={`Remove ${assignedMember.name || assignedMember.email}`}
							>
								<X size="16" color="#6D7C91" className="hover:text-red-500" />
							</button>
						</div>
					</>
				) : (
					<>
						<div className="relative">
							{selectedTeam ? (
								<div
									className="flex shrink-0 items-center bg-[#FFFFFF] pt-[4px] pb-[4px] pl-[8px] pr-[10px] rounded-[6px] border border-solid border-[#CBD5E1]"
									style={{ boxShadow: "1px 1px 1px #F6F6F6" }}
								>
									<span
										className="w-[8px] h-[8px] rounded-full mr-[6px]"
										style={{ backgroundColor: getTeamDotColor(selectedTeam.name) }}
									></span>
									<span className="text-[#121822] text-[14px] font-bold">{selectedTeam.name}</span>
									<button
										onClick={() => {
											setSelectedTeam(null)
											setShowMembersDropdown(false)
										}}
										className="ml-2"
										aria-label="Clear selected team"
									>
										<X size="14" color="#6D7C91" className="hover:text-red-500" />
									</button>
								</div>
							) : (
								<button
									onClick={() => setShowTeamsDropdown((prev) => !prev)}
									disabled={isLoadingTeams}
									className="flex shrink-0 items-center bg-[#FFFFFF] pt-[4px] pb-[4px] pl-[8px] pr-[10px] rounded-[6px] border border-dashed border-[#C5D0DC] hover:border-solid hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
									style={{ boxShadow: "1px 1px 1px #F6F6F6" }}
								>
									{isLoadingTeams ? (
										<div className="animate-spin h-3 w-3 border-2 border-neutral-500 rounded-full mr-[4px]"></div>
									) : (
										<Plus size={16} color="#6E7C91" className="mr-[4px]" />
									)}
									<span className="text-[#6D7C91] text-[14px] font-medium">Add team</span>
								</button>
							)}
							{showTeamsDropdown && (
								<div
									className="absolute mt-1 w-full md:w-auto min-w-[200px] bg-white border border-gray-300 rounded-md shadow-lg z-10"
									ref={teamsDropdownRef}
								>
									{isLoadingTeams ? (
										<div className="p-2 text-gray-500 flex items-center space-x-2">
											<div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
											<span>Loading teams...</span>
										</div>
									) : availableTeams.length > 0 ? (
										availableTeams.map((team) => (
											<div
												key={team.id}
												className="p-2 hover:bg-gray-100 cursor-pointer"
												onClick={() => handleSelectTeam(team)}
											>
												{team.name}
											</div>
										))
									) : (
										<div className="p-2 text-gray-500">No teams available</div>
									)}
								</div>
							)}
						</div>

						<div className="relative">
							<button
								onClick={() => setShowMembersDropdown((prev) => !prev)}
								disabled={!selectedTeam || assignMutation.isPending || isLoadingTeamMembers}
								className={`flex shrink-0 items-center text-left pt-[4px] pb-[4px] pl-[8px] pr-[8px] rounded-[6px] border border-dashed 
									${
										!selectedTeam
											? "border-[#E2E8F0] bg-gray-50 text-gray-400 cursor-not-allowed"
											: "border-[#91A0B4] bg-[#FFFFFF] hover:border-gray-400"
									} disabled:opacity-50`}
							>
								{assignMutation.isPending || (isLoadingTeamMembers && showMembersDropdown) ? (
									<div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full mr-[4px]"></div>
								) : (
									<Plus
										size={16}
										className="mr-[4px]"
										color={!selectedTeam ? "#9CA3AF" : "#6E7C91"}
									/>
								)}
								<span
									className={`text-[14px] font-bold ${
										!selectedTeam ? "text-gray-400" : "text-[#6D7C91]"
									}`}
								>
									Add Assignee
								</span>
							</button>
							{showMembersDropdown && selectedTeam && (
								<div
									className="absolute mt-1 w-full md:w-auto min-w-[250px] bg-white border border-gray-300 rounded-md shadow-lg z-10"
									ref={membersDropdownRef}
								>
									{isLoadingTeamMembers ? (
										<div className="p-2 text-gray-500 flex items-center space-x-2">
											<div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
											<span>Loading members...</span>
										</div>
									) : teamMembers.length > 0 ? (
										teamMembers.map((member) => (
											<div
												key={member.email}
												className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
												onClick={() => handleAddMember(member)}
											>
												<UserSquare size="16" className="mr-2 text-gray-500" />
												<span className="text-sm text-gray-700">
													{member.first_name} {member.last_name} ({member.email})
												</span>
											</div>
										))
									) : (
										<div className="p-2 text-sm text-gray-500">No available members</div>
									)}
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	)
}

export default RfpAssigneesComponent
