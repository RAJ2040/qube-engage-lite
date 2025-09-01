import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { UserRole, UserStatus } from "@/types/models"

export interface UserFilterState {
	query: string
	role: UserRole | "all"
	status: UserStatus | "all"
	lastActive: "any" | "today" | "last-7-days" | "last-30-days" | "last-90-days" | "custom"
	lastActiveRange?: { from?: Date; to?: Date }
}

interface UserFiltersProps {
	value: UserFilterState
	onChange: (next: UserFilterState) => void
	onReset?: () => void
}

export function UserFilters({ value, onChange, onReset }: UserFiltersProps) {
	const [showCustomLastActiveDates, setShowCustomLastActiveDates] = useState(false)

	const handleLastActiveChange = (newValue: string) => {
		const isCustom = newValue === "custom"
		setShowCustomLastActiveDates(isCustom)
		onChange({ 
			...value, 
			lastActive: newValue as UserFilterState["lastActive"],
			lastActiveRange: isCustom ? value.lastActiveRange : undefined
		})
	}

	const handleCustomLastActiveApply = () => {
		if (value.lastActiveRange?.from && value.lastActiveRange?.to) {
			onChange({ ...value })
		}
	}

	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<div className="flex flex-1 items-center gap-2">
				<Input
					placeholder="Search by name or email"
					value={value.query}
					onChange={(e) => onChange({ ...value, query: e.target.value })}
				/>
				<Select value={value.role} onValueChange={(v) => onChange({ ...value, role: v as UserFilterState["role"] })}>
					<SelectTrigger className="w-40"><SelectValue placeholder="Role" /></SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All roles</SelectItem>
						<SelectItem value="admin">Admin</SelectItem>
						<SelectItem value="manager">Manager</SelectItem>
						<SelectItem value="editor">Editor</SelectItem>
						<SelectItem value="viewer">Viewer</SelectItem>
					</SelectContent>
				</Select>
				<Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v as UserFilterState["status"] })}>
					<SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All status</SelectItem>
						<SelectItem value="active">Active</SelectItem>
						<SelectItem value="inactive">Inactive</SelectItem>
						<SelectItem value="invited">Invited</SelectItem>
						<SelectItem value="suspended">Suspended</SelectItem>
					</SelectContent>
				</Select>
				<Select value={value.lastActive} onValueChange={handleLastActiveChange}>
					<SelectTrigger className="w-44"><SelectValue placeholder="Last Active" /></SelectTrigger>
					<SelectContent>
						<SelectItem value="any">Any time</SelectItem>
						<SelectItem value="today">Today</SelectItem>
						<SelectItem value="last-7-days">Last 7 days</SelectItem>
						<SelectItem value="last-30-days">Last 30 days</SelectItem>
						<SelectItem value="last-90-days">Last 90 days</SelectItem>
						<SelectItem value="custom">Custom Range</SelectItem>
					</SelectContent>
				</Select>

				{showCustomLastActiveDates && (
					<div className="flex items-center gap-2">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										"w-32 justify-start text-left font-normal",
										!value.lastActiveRange?.from && "text-muted-foreground"
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{value.lastActiveRange?.from ? format(value.lastActiveRange.from, "MMM dd") : "From"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={value.lastActiveRange?.from}
									onSelect={(date) => onChange({
										...value,
										lastActiveRange: { ...value.lastActiveRange, from: date }
									})}
									initialFocus
								/>
							</PopoverContent>
						</Popover>

						<span className="text-muted-foreground">to</span>

						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										"w-32 justify-start text-left font-normal",
										!value.lastActiveRange?.to && "text-muted-foreground"
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{value.lastActiveRange?.to ? format(value.lastActiveRange.to, "MMM dd") : "To"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={value.lastActiveRange?.to}
									onSelect={(date) => onChange({
										...value,
										lastActiveRange: { ...value.lastActiveRange, to: date }
									})}
									initialFocus
								/>
							</PopoverContent>
						</Popover>

						<Button 
							onClick={handleCustomLastActiveApply}
							disabled={!value.lastActiveRange?.from || !value.lastActiveRange?.to}
							size="sm"
						>
							Apply
						</Button>
					</div>
				)}
			</div>
			<div className="flex items-center gap-2">
				{onReset && (
					<Button variant="outline" onClick={onReset}>Reset</Button>
				)}
			</div>
		</div>
	)
}


