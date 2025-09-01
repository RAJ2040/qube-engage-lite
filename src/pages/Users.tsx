import { useMemo, useState } from "react"
import { AppUser, UserRole, UserStatus } from "@/types/models"
import { mockUsers } from "@/lib/mockData"
import { UserTable } from "@/components/Users/UserTable"
import { UserFilters, UserFilterState } from "@/components/Users/UserFilters"
import { EditUserModal } from "@/components/Users/EditUserModal"
import { UserAccessPanel } from "@/components/Users/UserAccessPanel"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

const PAGE_SIZE = 10

function withinLastActive(ts: number, range: UserFilterState["lastActive"], customRange?: { from?: Date; to?: Date }) {
	const now = Date.now()
	const day = 24 * 60 * 60 * 1000
	if (range === "any") return true
	if (range === "custom" && customRange?.from && customRange?.to) {
		return ts >= customRange.from.getTime() && ts <= customRange.to.getTime()
	}
	if (range === "today") return now - ts <= day
	if (range === "last-7-days") return now - ts <= 7 * day
	if (range === "last-30-days") return now - ts <= 30 * day
	if (range === "last-90-days") return now - ts <= 90 * day
	return true
}

export default function Users() {
	const [filters, setFilters] = useState<UserFilterState>({ query: "", role: "all", status: "all", lastActive: "any" })
	const [page, setPage] = useState(1)
	const [editUser, setEditUser] = useState<AppUser | null>(null)
	const [accessUser, setAccessUser] = useState<AppUser | null>(null)

	const filtered = useMemo(() => {
		return mockUsers.filter((u) => {
			const matchesQuery = filters.query
				? u.name.toLowerCase().includes(filters.query.toLowerCase()) || u.email.toLowerCase().includes(filters.query.toLowerCase())
				: true
			const matchesRole = filters.role === "all" ? true : u.role === filters.role
			const matchesStatus = filters.status === "all" ? true : u.status === filters.status
			const matchesLast = withinLastActive(u.lastActive, filters.lastActive, filters.lastActiveRange)
			return matchesQuery && matchesRole && matchesStatus && matchesLast
		})
	}, [filters])

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
	const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	const handleToggleStatus = (u: AppUser) => {
		const next: UserStatus = u.status === "active" ? "inactive" : "active"
		// mutate mockUsers for demo only
		const idx = mockUsers.findIndex((x) => x.userId === u.userId)
		if (idx >= 0) mockUsers[idx].status = next
		setFilters({ ...filters })
	}

	const handleSaveUser = (userId: string, updates: Partial<Pick<AppUser, "name" | "email" | "status">>) => {
		const idx = mockUsers.findIndex((x) => x.userId === userId)
		if (idx >= 0) mockUsers[idx] = { ...mockUsers[idx], ...updates }
		setEditUser(null)
		setFilters({ ...filters })
	}

	const handleSaveAccess = (userId: string, updates: { role?: UserRole }) => {
		const idx = mockUsers.findIndex((x) => x.userId === userId)
		if (idx >= 0 && updates.role) mockUsers[idx].role = updates.role
		setAccessUser(null)
		setFilters({ ...filters })
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">User Access Management</h1>
			</div>
			<UserFilters value={filters} onChange={(v) => { setPage(1); setFilters(v) }} onReset={() => setFilters({ query: "", role: "all", status: "all", lastActive: "any" })} />
			<UserTable
				data={pageItems}
				OnViewProfile={(u) => setAccessUser(u)}
				onEdit={(u) => setEditUser(u)}
				onToggleStatus={handleToggleStatus}
			/>
			<Pagination className="pt-2">
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }} />
					</PaginationItem>
					<PaginationItem>
						<div className="px-3 py-2 text-sm text-muted-foreground">Page {page} of {totalPages}</div>
					</PaginationItem>
					<PaginationItem>
						<PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)) }} />
					</PaginationItem>
				</PaginationContent>
			</Pagination>

			<EditUserModal open={!!editUser} user={editUser} onOpenChange={(o) => !o && setEditUser(null)} onSave={handleSaveUser} />
			<UserAccessPanel open={!!accessUser} user={accessUser} onOpenChange={(o) => !o && setAccessUser(null)} onSave={handleSaveAccess} />
		</div>
	)
}


