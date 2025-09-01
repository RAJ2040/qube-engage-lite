import { Consumer } from "@/types/models"

interface ConsumerProfileProps {
	consumer: Consumer
}

export function ConsumerProfile({ consumer }: ConsumerProfileProps) {
	return (
		<div className="rounded-lg border p-4 bg-card">
			<div className="text-lg font-semibold mb-2">Profile</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
				<div>
					<div className="text-muted-foreground">Consumer ID</div>
					<div className="font-medium">{consumer.consumerId}</div>
				</div>
				<div>
					<div className="text-muted-foreground">Name</div>
					<div className="font-medium">{consumer.name}</div>
				</div>
				<div>
					<div className="text-muted-foreground">Contact</div>
					<div className="font-medium break-all">{consumer.contact}</div>
				</div>
				<div>
					<div className="text-muted-foreground">Signup Date</div>
					<div className="font-medium">{new Date(consumer.signupDate).toLocaleString()}</div>
				</div>
				<div>
					<div className="text-muted-foreground">Last Active</div>
					<div className="font-medium">{new Date(consumer.lastActive).toLocaleString()}</div>
				</div>
				<div>
					<div className="text-muted-foreground">Events Count</div>
					<div className="font-medium">{consumer.eventsCount}</div>
				</div>
			</div>
			{consumer.attributes && (
				<div className="mt-4">
					<div className="text-muted-foreground text-sm mb-1">Attributes</div>
					<pre className="text-xs bg-muted rounded p-3 overflow-auto">
						{JSON.stringify(consumer.attributes, null, 2)}
					</pre>
				</div>
			)}
		</div>
	)
}


