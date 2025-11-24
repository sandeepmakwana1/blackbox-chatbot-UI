import type { Team, TeamMember, AssignedMember, UserMember } from "~/types/teams"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "~/handlers/axios"
import { queryClient } from "~/root"

export const fetchTeams = async (): Promise<Team[]> => {
	const response = await api.get<Team[]>(`/teams/`)

	return response.data
}

export const fetchTeamMembersById = async (id: number): Promise<TeamMember[]> => {
	const response = await api.get<TeamMember[]>(`/users/team/${id}`)

	return response.data
}

export const fetchAssignedMembersBySourceID = async (source_id: number): Promise<AssignedMember[]> => {
	const response = await api.get<AssignedMember[]>(`/rfp/${source_id}/assignees`)

	return response.data
}

export const postAssignRfpToUser = async (source_id: number, team_id: number, user_id: number, rfp_id: string) => {
	const payload = {
		source_id: source_id,
		user_id: user_id,
		team_id: team_id,
		rfp_id: rfp_id,
	}

	const response = await api.post(`/assignee/`, payload)

	return response.status
}

export const deleteAssignRfpFromUser = async (source_id: number, user_id: number) => {
	const response = await api.delete(`/assignee/${source_id}/${user_id}`)

	return response.status
}

export const fetchUsersSourcing = async (): Promise<UserMember[]> => {
	const response = await api.get<UserMember[]>(`/assignees/users`)

	return response.data
}

export const postAssignRfpToUserSourcing = async (rfp_id: string, user_id: number, source_id: number) => {
	const payload = {
		rfp_id: rfp_id,
		user_id: user_id,
		source_id: source_id,
	}

	const response = await api.post(`/assignees/assign-by-user`, payload)
	return response.status
}

export const deleteAssignRfpFromUserSourcing = async (source_id: number, user_id: number) => {
	const response = await api.delete(`/assignees/unassign/${source_id}/${user_id}`)

	return response.status
}

// React Query hook for fetching teams
export const useTeams = () => {
	return useQuery({
		queryKey: ["teams"],
		queryFn: fetchTeams,
		staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
	})
}

// React Query hook for fetching team members by team ID
export const useTeamMembers = (teamId: number | undefined) => {
	return useQuery({
		queryKey: ["teamMembers", teamId],
		queryFn: () => {
			if (!teamId) throw new Error("Team ID is required")
			return fetchTeamMembersById(teamId)
		},
		enabled: !!teamId,
		staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
	})
}

// React Query hook for fetching assigned members by source ID
export const useAssignedMembers = (source_id: number | undefined) => {
	return useQuery({
		queryKey: ["assignedMembers", source_id],
		queryFn: () => {
			if (!source_id) throw new Error("Source ID is required")
			return fetchAssignedMembersBySourceID(source_id)
		},
		enabled: !!source_id,
		staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
	})
}

// React Query mutation hook for assigning RFP to user
export const useAssignRfpToUser = () => {
	return useMutation({
		mutationFn: ({
			source_id,
			team_id,
			user_id,
			rfp_id,
		}: {
			source_id: number
			team_id: number
			user_id: number
			rfp_id: string
		}) => postAssignRfpToUser(source_id, team_id, user_id, rfp_id),
		onSuccess: (_, variables) => {
			// Invalidate relevant queries to refetch data
			queryClient.invalidateQueries({ queryKey: ["assignedMembers", variables.source_id] })
		},
	})
}

// React Query mutation hook for unassigning RFP from user
export const useUnassignRfpFromUser = () => {
	return useMutation({
		mutationFn: ({ source_id, user_id }: { source_id: number; user_id: number }) =>
			deleteAssignRfpFromUser(source_id, user_id),
		onSuccess: (_, variables) => {
			// Invalidate relevant queries to refetch data
			queryClient.invalidateQueries({ queryKey: ["assignedMembers", variables.source_id] })
		},
	})
}

export const useUsersSourcing = () => {
	return useQuery({
		queryKey: ["usersSourcing"],
		queryFn: fetchUsersSourcing,
		staleTime: Number.POSITIVE_INFINITY,
	})
}

export const useAssignRfpToUserSourcingMutation = () => {
	return useMutation({
		mutationFn: ({ rfp_id, user_id, source_id }: { rfp_id: string; user_id: number; source_id: number }) =>
			postAssignRfpToUserSourcing(rfp_id, user_id, source_id),
	})
}

export const useUnassignRfpFromUserSourcingMutation = () => {
	return useMutation({
		mutationFn: ({ source_id, user_id }: { source_id: number; user_id: number }) =>
			deleteAssignRfpFromUserSourcing(source_id, user_id),
	})
}
