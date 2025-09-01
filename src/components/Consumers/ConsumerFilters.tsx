import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

export interface ConsumerFilterState {
	query: string
	signupDate: "any" | "last-30-days" | "last-90-days" | "last-365-days" | "custom"
	signupDateRange?: { from?: Date; to?: Date }
	activity: "any" | "active" | "inactive"
	events: "any" | "gt-0" | "gt-100" | "gt-500"
}

interface ConsumerFiltersProps {
	value: ConsumerFilterState
	onChange: (next: ConsumerFilterState) => void
}

export function ConsumerFilters({ value, onChange }: ConsumerFiltersProps) {
	const [showCustomSignupDates, setShowCustomSignupDates] = useState(false)

	const handleSignupDateChange = (newValue: string) => {
		const isCustom = newValue === "custom"
		setShowCustomSignupDates(isCustom)
		onChange({ 
			...value, 
			signupDate: newValue as ConsumerFilterState["signupDate"],
			signupDateRange: isCustom ? value.signupDateRange : undefined
		})
	}

	const handleCustomSignupDateApply = () => {
		if (value.signupDateRange?.from && value.signupDateRange?.to) {
			onChange({ ...value })
		}
	}

	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<div className="flex flex-1 items-center gap-2">
				<Input
					placeholder="Search by name, email or phone"
					value={value.query}
					onChange={(e) => onChange({ ...value, query: e.target.value })}
				/>
				<Select value={value.signupDate} onValueChange={handleSignupDateChange}>
					<SelectTrigger className="w-44"><SelectValue placeholder="Signup date" /></SelectTrigger>
					<SelectContent>
						<SelectItem value="any">Any time</SelectItem>
						<SelectItem value="last-30-days">Last 30 days</SelectItem>
						<SelectItem value="last-90-days">Last 90 days</SelectItem>
						<SelectItem value="last-365-days">Last 365 days</SelectItem>
						<SelectItem value="custom">Custom Range</SelectItem>
					</SelectContent>
				</Select>
				
				{showCustomSignupDates && (
					<div className="flex items-center gap-2">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										"w-32 justify-start text-left font-normal",
										!value.signupDateRange?.from && "text-muted-foreground"
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{value.signupDateRange?.from ? format(value.signupDateRange.from, "MMM dd") : "From"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={value.signupDateRange?.from}
									onSelect={(date) => onChange({
										...value,
										signupDateRange: { ...value.signupDateRange, from: date }
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
										!value.signupDateRange?.to && "text-muted-foreground"
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{value.signupDateRange?.to ? format(value.signupDateRange.to, "MMM dd") : "To"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={value.signupDateRange?.to}
									onSelect={(date) => onChange({
										...value,
										signupDateRange: { ...value.signupDateRange, to: date }
									})}
									initialFocus
								/>
							</PopoverContent>
						</Popover>

						<Button 
							onClick={handleCustomSignupDateApply}
							disabled={!value.signupDateRange?.from || !value.signupDateRange?.to}
							size="sm"
						>
							Apply
						</Button>
					</div>
				)}
				<Select value={value.activity} onValueChange={(v) => onChange({ ...value, activity: v as ConsumerFilterState["activity"] })}>
					<SelectTrigger className="w-40"><SelectValue placeholder="Activity" /></SelectTrigger>
					<SelectContent>
						<SelectItem value="any">Any</SelectItem>
						<SelectItem value="active">Active recently</SelectItem>
						<SelectItem value="inactive">Inactive</SelectItem>
					</SelectContent>
				</Select>
				<Select value={value.events} onValueChange={(v) => onChange({ ...value, events: v as ConsumerFilterState["events"] })}>
					<SelectTrigger className="w-40"><SelectValue placeholder="Events" /></SelectTrigger>
					<SelectContent>
						<SelectItem value="any">Any</SelectItem>
						<SelectItem value="gt-0">&gt; 0</SelectItem>
						<SelectItem value="gt-100">&gt; 100</SelectItem>
						<SelectItem value="gt-500">&gt; 500</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}


