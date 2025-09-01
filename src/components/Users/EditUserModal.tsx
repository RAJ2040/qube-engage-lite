import { AppUser, UserStatus } from "@/types/models"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"

interface EditUserModalProps {
	open: boolean
	user?: AppUser | null
	onOpenChange: (open: boolean) => void
	onSave: (userId: string, updates: Partial<Pick<AppUser, "name" | "email" | "status">>) => void
}

export function EditUserModal({ open, user, onOpenChange, onSave }: EditUserModalProps) {
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [status, setStatus] = useState<UserStatus>("active")

	useEffect(() => {
		if (user) {
			setName(user.name)
			setEmail(user.email)
			setStatus(user.status)
		}
	}, [user])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit User</DialogTitle>
					<DialogDescription>Update user details and status.</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Name</label>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Email</label>
						<Input value={email} onChange={(e) => setEmail(e.target.value)} />
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Status</label>
						<Select value={status} onValueChange={(v) => setStatus(v as UserStatus)}>
							<SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="inactive">Inactive</SelectItem>
								<SelectItem value="invited">Invited</SelectItem>
								<SelectItem value="suspended">Suspended</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={() => user && onSave(user.userId, { name, email, status })}>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}


