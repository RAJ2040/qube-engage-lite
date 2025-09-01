import { ConsumerEvent } from "@/types/models"

interface EventHistoryProps {
	events: ConsumerEvent[]
}

export function EventHistory({ events }: EventHistoryProps) {
	return (
		<div className="rounded-lg border p-4 bg-card">
			<div className="text-lg font-semibold mb-2">Event History</div>
			<div className="space-y-3 max-h-80 overflow-auto pr-2">
				{events.map((e) => (
					<div key={e.id} className="flex items-start justify-between gap-4 text-sm">
						<div>
							<div className="font-medium">{e.type}</div>
							{e.metadata && (
								<pre className="text-xs text-muted-foreground bg-muted rounded p-2 mt-1 max-w-xl overflow-auto">{JSON.stringify(e.metadata, null, 2)}</pre>
							)}
						</div>
						<div className="text-muted-foreground whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</div>
					</div>
				))}
				{events.length === 0 && (
					<div className="text-sm text-muted-foreground">No events found.</div>
				)}
			</div>
		</div>
	)
}


