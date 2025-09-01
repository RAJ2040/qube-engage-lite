import { AppUser, UserRole } from "@/types/models"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

interface UserAccessPanelProps {
	open: boolean
	user?: AppUser | null
	onOpenChange: (open: boolean) => void
	onSave: (userId: string, updates: { role?: UserRole }) => void
}

export function UserAccessPanel({ open, user, onOpenChange, onSave }: UserAccessPanelProps) {
	const roles: UserRole[] = ["admin", "manager", "editor", "viewer"]
	const [role, setRole] = useState<UserRole>(user?.role ?? "viewer")

	useEffect(() => {
		setRole(user?.role ?? "viewer")
	}, [user])

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-md">
				<SheetHeader>
					<SheetTitle>Manage Access</SheetTitle>
					<SheetDescription>
						Assign role and control access permissions for this user.
					</SheetDescription>
				</SheetHeader>
				<div className="mt-4 space-y-4">
					<div>
						<div className="text-sm text-muted-foreground mb-1">User</div>
						<div className="font-medium">{user?.name} <span className="text-muted-foreground">({user?.email})</span></div>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Role</label>
						<Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{roles.map((r) => (
									<SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<SheetFooter className="mt-6">
					<Button onClick={() => user && onSave(user.userId, { role })}>Save</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}


