import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateSegmentModal } from "@/components/Modals/CreateSegmentModal"
import { 
  Users, 
  Plus, 
  Filter,
  MapPin,
  Calendar,
  ShoppingBag,
  Target
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { fetchSegments, type SegmentItem, type SegmentsPayload } from "@/lib/api"

// Server-driven segments will populate below

const segmentTemplates = [
  {
    name: "Geographic",
    description: "Target users by location",
    icon: MapPin,
    count: 12
  },
  {
    name: "Behavioral",
    description: "Based on user actions",
    icon: Target,
    count: 8
  },
  {
    name: "Purchase History",
    description: "Shopping patterns",
    icon: ShoppingBag,
    count: 6
  },
  {
    name: "Time-based",
    description: "Activity timing",
    icon: Calendar,
    count: 4
  }
]

export default function Segments() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [items, setItems] = useState<SegmentItem[]>([])
  const [page, setPage] = useState<number>(1)
  const [limit] = useState<number>(10)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)
    fetchSegments({ page, limit })
      .then((res) => {
        if (!isMounted) return
        const payload: SegmentsPayload = res.data
        setItems(payload.items || [])
        setTotalPages(payload.totalPages || 1)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Failed to load segments")
        setItems([])
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [page, limit])

  const canPrev = useMemo(() => page > 1, [page])
  const canNext = useMemo(() => page < totalPages, [page, totalPages])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Segments</h1>
          <p className="text-muted-foreground mt-1">
            Create targeted user groups for personalized campaigns
          </p>
        </div>
        <Button 
          className="bg-gradient-primary hover:opacity-90 text-white shadow-glow"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Segment
        </Button>
      </div>

      {/* Quick Templates */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {segmentTemplates.map((template) => (
          <Card key={template.name} className="hover-lift cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <template.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.count} templates</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{template.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Existing Segments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Your Segments</CardTitle>
              <CardDescription>
                Manage and monitor your customer segments
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled={!canPrev || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Prev
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {page} / {Math.max(totalPages, 1)}
                </div>
                <Button variant="outline" disabled={!canNext || loading} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground py-4">Loading segments…</div>
          ) : error ? (
            <div className="text-sm text-red-600 py-4">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">No segments found.</div>
          ) : (
            <div className="space-y-4">
              {items.map((segment) => (
                <Card key={segment.id} className="hover-lift cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{segment.name}</h3>
                          {segment.status ? (
                            <Badge variant="outline" className="bg-gradient-primary text-white border-0">
                              <Users className="w-3 h-3 mr-1" />
                              {segment.status}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-muted-foreground mb-4">{segment.description || ""}</p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {segment.referenceId} • {segment.updatedAt ? new Date(segment.updatedAt).toLocaleString() : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Segment Builder Preview */}
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Create Your First Segment</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Use our intuitive segment builder to create targeted user groups based on behavior, demographics, and more.
          </p>
          <Button 
            className="bg-gradient-primary hover:opacity-90 text-white shadow-glow"
            onClick={() => setShowCreateModal(true)}
          >
            Start Building
          </Button>
        </CardContent>
      </Card>

      <CreateSegmentModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  )
}
