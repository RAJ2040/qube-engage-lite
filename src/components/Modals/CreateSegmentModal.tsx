import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import {
  fetchUserPropsCatalog,
  fetchEventsCatalog,
  fetchEventCatalogDetails,
  fetchOperatorsCatalog,
  type EventsCatalogItem,
  type OperatorsCatalogPayload,
  type UserPropsCatalogPayload,
  previewSegment,
  createSegment,
  type SegmentsPreviewItem,
  type SegmentDefinition,
} from "@/lib/api"

interface CreateSegmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CatalogType = "string" | "number" | "date" | "bool"

type FilterRow = {
  id: string
  entity: "Users" | "Events"
  eventName?: string
  field: string
  fieldType?: CatalogType
  operator: string
  value: string
  props?: Array<{ id: string; field: string; fieldType?: CatalogType; operator: string; value: string }>
}

export function CreateSegmentModal({ open, onOpenChange }: CreateSegmentModalProps) {
  const [segmentName, setSegmentName] = useState("")
  const [filters, setFilters] = useState<FilterRow[]>([])
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewItems, setPreviewItems] = useState<SegmentsPreviewItem[]>([])
  const [eventsCatalog, setEventsCatalog] = useState<EventsCatalogItem[]>([])
  const [userPropsCatalog, setUserPropsCatalog] = useState<UserPropsCatalogPayload | null>(null)
  const [operatorsCatalog, setOperatorsCatalog] = useState<OperatorsCatalogPayload | null>(null)
  const { toast } = useToast()

  // Load catalogs when modal opens
  useEffect(() => {
    let mounted = true
    if (!open) return
    setLoading(true)
    Promise.all([
      fetchEventsCatalog(),
      fetchUserPropsCatalog(),
      fetchOperatorsCatalog(),
    ])
      .then(([eventsRes, userPropsRes, opsRes]) => {
        if (!mounted) return
        setEventsCatalog(eventsRes.data.items || [])
        setUserPropsCatalog(userPropsRes.data)
        setOperatorsCatalog(opsRes.data)
      })
      .catch((err) => {
        toast({ title: "Failed to load catalogs", description: err instanceof Error ? err.message : String(err) })
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [open])

  const addFilter = () => {
    const newFilter = {
      id: Date.now().toString(),
      entity: "Events" as const,
      eventName: "",
      field: "",
      fieldType: undefined,
      operator: "eq",
      value: "",
    }
    setFilters([...filters, newFilter])
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id))
  }

  const updateFilter = (id: string, key: string, value: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [key]: value } : f))
  }

  const applicableOperators = (type?: CatalogType) => {
    if (!operatorsCatalog || !type) return ["eq"]
    return operatorsCatalog[type] ?? ["eq"]
  }

  const userFields = useMemo(() => {
    const base = Object.entries(userPropsCatalog?.base_schema ?? {})
    const props = Object.entries(userPropsCatalog?.properties_schema ?? {})
    return [
      ...base.map(([k, t]) => ({ key: k, type: t })),
      ...props.map(([k, t]) => ({ key: k, type: t })),
    ] as Array<{ key: string; type: CatalogType }>
  }, [userPropsCatalog])

  const eventNames = useMemo(() => eventsCatalog.map(e => e.event_name), [eventsCatalog])

  const getEventFields = (eventName?: string) => {
    const item = eventsCatalog.find(e => e.event_name === eventName)
    if (!item) return [] as Array<{ key: string; type: CatalogType }>
    return Object.entries(item.properties_schema || {}).map(([k, t]) => ({ key: k, type: t as CatalogType }))
  }

  const getEventSamples = (eventName?: string, field?: string) => {
    const item = eventsCatalog.find(e => e.event_name === eventName)
    if (!item || !field) return [] as Array<string>
    const samples = item.samples?.[field]
    if (!Array.isArray(samples)) return []
    return samples.map(String)
  }

  const prettify = (key: string) =>
    key
      .replace(/\./g, " ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase())

  const buildDefinition = (): SegmentDefinition => {
    const anyOfEvents = filters
      .filter(f => f.entity === "Events" && f.eventName)
      .map(f => {
        const base = { name: f.eventName! } as any
        // Build props from multi-props if present, else from single field/value
        const propObj: Record<string, unknown> = {}
        if (Array.isArray(f.props) && f.props.length > 0) {
          f.props.forEach(p => {
            if (p.field && p.value !== "") {
              propObj[p.field] = coerceValue(p.value, p.fieldType)
            }
          })
        } else if (f.field && f.value !== "") {
          propObj[f.field] = coerceValue(f.value, f.fieldType)
        }
        if (Object.keys(propObj).length > 0) base.prop = propObj
        return { event: base }
      })

    const userPropFilters = filters.filter(f => f.entity === "Users" && f.field && f.value !== "")
    const criteriaProps = userPropFilters.reduce<Record<string, unknown>>((acc, f) => {
      acc[f.field] = coerceValue(f.value, f.fieldType)
      return acc
    }, {})

    const definition: SegmentDefinition = {}
    if (Object.keys(criteriaProps).length > 0) {
      definition.criteria = { ...criteriaProps }
    }
    if (anyOfEvents.length > 0) definition.anyOfEvents = anyOfEvents
    return definition
  }

  const coerceValue = (val: string, type?: CatalogType) => {
    if (!type) return val
    switch (type) {
      case "number":
        return Number(val)
      case "bool":
        return val === "true" || val === "1"
      default:
        return val
    }
  }

  // no event time range in filters per spec

  const handlePreview = async () => {
    setPreviewLoading(true)
    try {
      const definition = buildDefinition()
      const res = await previewSegment({ definition, page: 1, limit: 20, sortBy: "event_time", sortDir: "desc" })
      setPreviewItems(res.data.items || [])
    } catch (err) {
      toast({ title: "Preview failed", description: err instanceof Error ? err.message : String(err) })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const definition = buildDefinition()
      await createSegment({
        name: segmentName,
        description: "",
        status: "DRAFT",
        is_active: 1,
        definition,
      })
      toast({ title: "Segment Created Successfully", description: `${segmentName} has been saved.` })
    onOpenChange(false)
    setSegmentName("")
    setFilters([])
      setPreviewItems([])
    } catch (err) {
      toast({ title: "Create failed", description: err instanceof Error ? err.message : String(err) })
    }
  }

  const hasAnyDefinition = () => {
    const hasUserCriteria = filters.some(f => f.entity === "Users" && f.field && f.value !== "")
    const hasEventCriteria = filters.some(f => f.entity === "Events" && !!f.eventName)
    return hasUserCriteria || hasEventCriteria
  }

  const estimatedCount = Math.floor(Math.random() * 5000) + 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Segment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="segmentName">Segment Name</Label>
            <Input
              id="segmentName"
              placeholder="Enter segment name"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {/* Removed User ID field as it's not required */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Button onClick={addFilter} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Filter
              </Button>
            </div>

            {filters.map((filter) => (
              <Card key={filter.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Select value={filter.entity} onValueChange={(value) => {
                      if (value === "Users") {
                        setFilters(filters.map(f => f.id === filter.id ? { ...f, entity: "Users", eventName: undefined, field: "", fieldType: undefined } : f))
                      } else {
                        setFilters(filters.map(f => f.id === filter.id ? { ...f, entity: "Events", eventName: "", field: "", fieldType: undefined } : f))
                      }
                    }}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Users">Users</SelectItem>
                        <SelectItem value="Events">Events</SelectItem>
                      </SelectContent>
                    </Select>
                    {filter.entity === "Events" && (
                      <>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-48 justify-between">
                              {filter.eventName || "Select event"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-64">
                            <Command>
                              <CommandInput placeholder="Search events..." />
                              <CommandEmpty>No event found.</CommandEmpty>
                              <CommandGroup>
                                {eventNames.map((name) => (
                                  <CommandItem key={name} value={name} onSelect={() => updateFilter(filter.id, "eventName", name)}>
                                    {name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <div className="flex flex-col gap-2 flex-1">
                          {(filter.props ?? []).map((p) => (
                            <div key={p.id} className="flex items-center gap-2">
                              <Select value={p.field} onValueChange={(value) => {
                                const fields = getEventFields(filter.eventName)
                                const ft = fields.find(f => f.key === value)?.type
                                setFilters(filters.map(f => f.id === filter.id ? {
                                  ...f,
                                  props: (f.props ?? []).map(x => x.id === p.id ? { ...x, field: value, fieldType: ft } : x)
                                } : f))
                              }}>
                                <SelectTrigger className="w-56">
                                  <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                                  {getEventFields(filter.eventName).map((f) => (
                                    <SelectItem key={f.key} value={f.key}>{prettify(f.key)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                              <Select value={p.operator} onValueChange={(value) => {
                                setFilters(filters.map(f => f.id === filter.id ? {
                                  ...f,
                                  props: (f.props ?? []).map(x => x.id === p.id ? { ...x, operator: value } : x)
                                } : f))
                              }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                                  {applicableOperators(p.fieldType).map((op) => (
                                    <SelectItem key={op} value={op}>{op}</SelectItem>
                                  ))}
                      </SelectContent>
                    </Select>
                              {/* Value control: hide for exists; show compact. If samples available and op eq/in, use a Select. */}
                              {p.operator !== "exists" && (
                                (() => {
                                  const sampleValues = getEventSamples(filter.eventName, p.field)
                                  if ((p.operator === "eq" || p.operator === "in") && sampleValues.length > 0) {
                                    return (
                                      <Select value={p.value} onValueChange={(val) => {
                                        setFilters(filters.map(f => f.id === filter.id ? {
                                          ...f,
                                          props: (f.props ?? []).map(x => x.id === p.id ? { ...x, value: val } : x)
                                        } : f))
                                      }}>
                                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                                          {sampleValues.map((sv) => (
                                            <SelectItem key={sv} value={sv}>{sv}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )
                                  }
                                  return (
                                    <Input
                                      placeholder={p.operator === "in" ? "Comma-separated" : "Enter value"}
                                      value={p.value}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setFilters(filters.map(f => f.id === filter.id ? {
                                          ...f,
                                          props: (f.props ?? []).map(x => x.id === p.id ? { ...x, value: val } : x)
                                        } : f))
                                      }}
                                      className="w-40"
                                    />
                                  )
                                })()
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setFilters(filters.map(f => f.id === filter.id ? {
                                  ...f,
                                  props: (f.props ?? []).filter(x => x.id !== p.id)
                                } : f))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFilters(filters.map(f => f.id === filter.id ? {
                                ...f,
                                props: [
                                  ...(f.props ?? []),
                                  { id: `${Date.now()}-${Math.random()}`, field: "", fieldType: undefined, operator: "eq", value: "" },
                                ]
                              } : f))}
                            >
                              Add property
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                    {filter.entity === "Users" && (
                      <Select value={filter.field} onValueChange={(value) => {
                        const ft = userFields.find(u => u.key === value)?.type
                        setFilters(filters.map(f => f.id === filter.id ? { ...f, field: value, fieldType: ft } : f))
                      }}>
                        <SelectTrigger className="w-60">
                          <SelectValue placeholder="Select user property" />
                        </SelectTrigger>
                        <SelectContent>
                          {userFields.map((f) => (
                            <SelectItem key={f.key} value={f.key}>{prettify(f.key)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {filter.entity === "Users" && filter.field && (
                      <>
                        <Select value={filter.operator} onValueChange={(value) => updateFilter(filter.id, "operator", value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {applicableOperators(filter.fieldType).map((op) => (
                              <SelectItem key={op} value={op}>{op}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                        {filter.operator !== "exists" && (
                      <Input
                            placeholder={filter.operator === "in" ? "Comma-separated" : "Enter value"}
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                            className="w-40"
                      />
                        )}
                      </>
                    )}

                    <Button variant="outline" size="icon" onClick={() => removeFilter(filter.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No filters added yet. Click "Add Filter" to start building your segment.
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Live Preview
                <Badge variant="outline">
                  {previewLoading ? "Loading…" : `${previewItems.length} users`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Event Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.user_id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>{item.event_time ? new Date(item.event_time).toLocaleString() : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={handlePreview} disabled={previewLoading || !hasAnyDefinition()}>
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!segmentName.trim() || !hasAnyDefinition()}>
            Save Segment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}