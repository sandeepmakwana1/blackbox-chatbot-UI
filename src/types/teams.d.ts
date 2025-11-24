export type Team = {
	name: string
	id: number
	created_at: string
	updated_at: string
}

export type TeamRole = {
	id: number
	name: string
	description: string
	created_at: string
	updated_at: string
}

export type TeamMember = {
	id: number
	email: string
	first_name: string
	last_name: string
	team_id: number
	created_at: string
	updated_at: string
	role_id: number
	role: TeamRole
}

export type UserMember = {
	id: number
	email: string
	name: string
}

export type AssignedMember = {
	id: number
	RFP_id: string
	team_id: number
	user_id: number
	team_name: string
	email: string
	name: string
}
