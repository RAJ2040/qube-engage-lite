import { useMemo, useState } from "react"
import { Consumer, ConsumerEvent } from "@/types/models"
import { mockConsumerEvents, mockConsumers } from "@/lib/mockData"
import { ConsumerFilters, ConsumerFilterState } from "@/components/Consumers/ConsumerFilters"
import { ConsumerTable } from "@/components/Consumers/ConsumerTable"
import { ConsumerProfile } from "@/components/Consumers/ConsumerProfile"
import { EventHistory } from "@/components/Consumers/EventHistory"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

const PAGE_SIZE = 10

function withinDays(ts: number, maxDays: number) {
	const now = Date.now()
	const day = 24 * 60 * 60 * 1000
	return now - ts <= maxDays * day
}

export default function Consumers() {
	const [filters, setFilters] = useState<ConsumerFilterState>({ query: "", signupDate: "any", activity: "any", events: "any" })
	const [page, setPage] = useState(1)
	const [selected, setSelected] = useState<Consumer | null>(null)

	const filtered = useMemo(() => {
		return mockConsumers.filter((c) => {
			const matchesQuery = filters.query
				? c.name.toLowerCase().includes(filters.query.toLowerCase()) || c.contact.toLowerCase().includes(filters.query.toLowerCase())
				: true
			const matchesSignup =
				filters.signupDate === "any"
					? true
					: filters.signupDate === "custom" && filters.signupDateRange?.from && filters.signupDateRange?.to
						? c.signupDate >= filters.signupDateRange.from.getTime() && c.signupDate <= filters.signupDateRange.to.getTime()
						: filters.signupDate === "last-30-days"
							? withinDays(c.signupDate, 30)
							: filters.signupDate === "last-90-days"
								? withinDays(c.signupDate, 90)
								: withinDays(c.signupDate, 365)
			const matchesActivity =
				filters.activity === "any"
					? true
					: filters.activity === "active"
						? withinDays(c.lastActive, 30)
						: !withinDays(c.lastActive, 30)
			const matchesEvents =
				filters.events === "any"
					? true
					: filters.events === "gt-0"
						? c.eventsCount > 0
						: filters.events === "gt-100"
							? c.eventsCount > 100
							: c.eventsCount > 500
			return matchesQuery && matchesSignup && matchesActivity && matchesEvents
		})
	}, [filters])

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
	const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	const eventsForSelected: ConsumerEvent[] = useMemo(() => {
		if (!selected) return []
		return mockConsumerEvents
			.filter((e) => e.consumerId === selected.consumerId)
			.sort((a, b) => b.timestamp - a.timestamp)
	}, [selected])

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Consumers</h1>
			</div>
			<ConsumerFilters value={filters} onChange={(v) => { setPage(1); setSelected(null); setFilters(v) }} />
			<ConsumerTable data={pageItems} onRowClick={(c) => setSelected(c)} />
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

			{selected && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<div className="lg:col-span-1">
						<ConsumerProfile consumer={selected} />
					</div>
					<div className="lg:col-span-2">
						<EventHistory events={eventsForSelected} />
						<div className="rounded-lg border p-4 bg-card mt-4">
							<div className="text-lg font-semibold mb-2">Campaign Interactions</div>
							<div className="text-sm text-muted-foreground">Placeholder for future campaign interactions.</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}


