import { AppUser } from "@/types/models"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface UserTableProps {
	data: AppUser[]
	OnViewProfile: (user: AppUser) => void
	onEdit: (user: AppUser) => void
	onToggleStatus: (user: AppUser) => void
}

export function UserTable({ data, OnViewProfile, onEdit, onToggleStatus }: UserTableProps) {
	return (
		<div className="rounded-lg border bg-card">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>User ID</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Last Active</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((user) => (
						<TableRow key={user.userId}>
							<TableCell>{user.userId}</TableCell>
							<TableCell>{user.name}</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell className="capitalize">{user.role}</TableCell>
							<TableCell className="capitalize">{user.status}</TableCell>
							<TableCell>{new Date(user.lastActive).toLocaleDateString()}</TableCell>
							<TableCell className="text-right space-x-2">
								<Button size="sm" variant="secondary" onClick={() => OnViewProfile(user)}>View</Button>
								<Button size="sm" onClick={() => onEdit(user)}>Edit</Button>
								<Button size="sm" variant="outline" onClick={() => onToggleStatus(user)}>
									{user.status === "active" ? "Deactivate" : "Activate"}
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}


