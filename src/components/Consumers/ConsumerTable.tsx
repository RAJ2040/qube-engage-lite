import { Consumer } from "@/types/models"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ConsumerTableProps {
	data: Consumer[]
	onRowClick: (consumer: Consumer) => void
}

export function ConsumerTable({ data, onRowClick }: ConsumerTableProps) {
	return (
		<div className="rounded-lg border bg-card">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Consumer ID</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Email/Phone</TableHead>
						<TableHead>Signup Date</TableHead>
						<TableHead>Last Active</TableHead>
						<TableHead>Events Count</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data.map((c) => (
						<TableRow key={c.consumerId} className="cursor-pointer" onClick={() => onRowClick(c)}>
							<TableCell>{c.consumerId}</TableCell>
							<TableCell>{c.name}</TableCell>
							<TableCell>{c.contact}</TableCell>
							<TableCell>{new Date(c.signupDate).toLocaleDateString()}</TableCell>
							<TableCell>{new Date(c.lastActive).toLocaleDateString()}</TableCell>
							<TableCell>{c.eventsCount}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}


