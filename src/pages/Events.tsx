import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { CreateEventModal } from "@/components/Modals/CreateEventModal"
import { 
  Search, 
  Filter, 
  Zap, 
  Calendar,
  User,
  MousePointer,
  ShoppingCart,
  Eye
} from "lucide-react"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchEvents, type EventItem, type EventsPayload } from "@/lib/api"

const eventTypes = [
  { name: "Page View", icon: Eye, color: "blue" },
  { name: "Button Click", icon: MousePointer, color: "green" },
  { name: "Purchase", icon: ShoppingCart, color: "purple" },
  { name: "UserLogin", icon: User, color: "orange" },
]

// Icons map for dynamic rendering
const typeToIcon: Record<string, any> = {
  Purchase: ShoppingCart,
  "Page View": Eye,
  "Button Click": MousePointer,
  "User Signup": User,
  UserLogin: User,
}

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["events", { page, limit, sortBy: "event_time", sortDir: "desc" }],
    queryFn: () => fetchEvents({ page, limit, sortBy: "event_time", sortDir: "desc" }),
    staleTime: 30_000,
  })

  const items: EventItem[] = data?.data.items ?? []
  const total = data?.data.total ?? 0
  const totalPages = data?.data.totalPages ?? Math.max(1, Math.ceil(total / limit))

  const overviewCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Page View": 0,
      "Button Click": 0,
      Purchase: 0,
      UserLogin: 0,
    }
    for (const ev of items) {
      const typeName = ev.name
      if (counts[typeName] !== undefined) counts[typeName] += 1
    }
    return counts
  }, [items])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items
    return items.filter((ev) =>
      [ev.name, ev.description, ev.user_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    )
  }, [items, searchTerm])

  const canPrev = page > 1
  const canNext = page < totalPages

  function buildPageList(): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }
    pages.push(1)
    if (page > 3) pages.push("ellipsis")
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (page < totalPages - 2) pages.push("ellipsis")
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">
            Monitor real-time user activities and track important actions
          </p>
        </div>
        <Button 
          className="bg-gradient-primary hover:opacity-90 text-white shadow-glow"
          onClick={() => setShowCreateModal(true)}
        >
          <Zap className="w-4 h-4 mr-2" />
          Send Test Event
        </Button>
      </div>

      {/* Event Types Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {eventTypes.map((event) => (
          <Card key={event.name} className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${event.color}-100 dark:bg-${event.color}-900/20 flex items-center justify-center`}>
                  <event.icon className={`w-5 h-5 text-${event.color}-600 dark:text-${event.color}-400`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{event.name}</h3>
                  <p className="text-sm text-muted-foreground">{overviewCounts[event.name] ?? 0} events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Events Stream */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Event Stream</CardTitle>
              <CardDescription>
                Real-time view of user activities in your application
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading && (
              <div className="text-sm text-muted-foreground">Loading events...</div>
            )}
            {isError && (
              <div className="text-sm text-destructive">
                Failed to load events{error instanceof Error ? `: ${error.message}` : ""}
              </div>
            )}
            {!isLoading && !isError && filtered.map((ev) => {
              const Icon = typeToIcon[ev.name] ?? Zap
              const when = new Date(ev.event_time)
              return (
                <div key={`${ev.name}-${ev.event_time}-${ev.user_id}`} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{ev.name}</h4>
                      {ev.user_id && <Badge variant="outline">{ev.user_id}</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
                      {ev.description && (
                        <div><span className="font-medium">description:</span> {ev.description}</div>
                      )}
                      {ev.properties && Object.entries(ev.properties).slice(0,6).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                      {ev.device_details?.os && (
                        <div><span className="font-medium">os:</span> {ev.device_details.os} {ev.device_details.osVersion ?? ""}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {when.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (canPrev) setPage((p) => p - 1)
                }}
                className={!canPrev ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>

            {buildPageList().map((p, idx) => (
              <PaginationItem key={`${p}-${idx}`}>
                {p === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault()
                      setPage(p)
                    }}
                  >
                    {p}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (canNext) setPage((p) => p + 1)
                }}
                className={!canNext ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <CreateEventModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  )
}