export type UserRole = "admin" | "manager" | "viewer" | "editor"

export type UserStatus = "active" | "inactive" | "invited" | "suspended"

export interface AppUser {
	userId: string
	name: string
	email: string
	role: UserRole
	status: UserStatus
	lastActive: number
}

export interface Consumer {
	consumerId: string
	name: string
	contact: string // email or phone
	signupDate: number
	lastActive: number
	eventsCount: number
	attributes?: Record<string, unknown>
}

export interface ConsumerEvent {
	id: string
	consumerId: string
	timestamp: number
	type: string
	metadata?: Record<string, unknown>
}


