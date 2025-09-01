import { AppUser, Consumer, ConsumerEvent, UserRole, UserStatus } from "@/types/models"

function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(days: number) {
	return Date.now() - days * 24 * 60 * 60 * 1000
}

const roles: UserRole[] = ["admin", "manager", "viewer", "editor"]
const statuses: UserStatus[] = ["active", "inactive", "invited", "suspended"]

export const mockUsers: AppUser[] = Array.from({ length: 42 }).map((_, i) => ({
	userId: `U-${1000 + i}`,
	name: `User ${i + 1}`,
	email: `user${i + 1}@example.com`,
	role: roles[i % roles.length],
	status: statuses[i % statuses.length],
	lastActive: daysAgo(randomInt(0, 90)),
}))

export const mockConsumers: Consumer[] = Array.from({ length: 137 }).map((_, i) => {
	const useEmail = i % 2 === 0
	return {
		consumerId: `C-${2000 + i}`,
		name: `Consumer ${i + 1}`,
		contact: useEmail ? `consumer${i + 1}@example.com` : `+1-555-01${(i % 100).toString().padStart(2, "0")}`,
		signupDate: daysAgo(randomInt(10, 400)),
		lastActive: daysAgo(randomInt(0, 120)),
		eventsCount: randomInt(0, 1200),
		attributes: {
			country: ["US", "IN", "DE", "BR", "GB"][i % 5],
			plan: ["free", "pro", "enterprise"][i % 3],
		},
	}
})

export const mockConsumerEvents: ConsumerEvent[] = mockConsumers.flatMap((c, idx) => {
	const count = randomInt(3, 20)
	return Array.from({ length: count }).map((_, j) => ({
		id: `${c.consumerId}-E-${j + 1}`,
		consumerId: c.consumerId,
		timestamp: daysAgo(randomInt(0, 180)),
		type: ["login", "purchase", "view", "signup", "click"][j % 5],
		metadata: {
			amount: j % 3 === 0 ? randomInt(5, 200) : undefined,
			page: ["/", "/pricing", "/product", "/checkout"][j % 4],
			campaignId: idx % 7 === 0 ? `CMP-${idx}` : undefined,
		},
	}))
})


