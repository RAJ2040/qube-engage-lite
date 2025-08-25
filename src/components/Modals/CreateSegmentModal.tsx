import { useState } from "react"
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

interface CreateSegmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const filterOptions = [
  { value: "country", label: "Country", type: "select", options: ["United States", "Canada", "United Kingdom", "Australia"] },
  { value: "lastActive", label: "Last Active", type: "select", options: ["Today", "Last 7 days", "Last 30 days", "Last 90 days"] },
  { value: "purchaseAmount", label: "Purchase Amount", type: "number", placeholder: "Enter amount" },
  { value: "signupDate", label: "Signup Date", type: "date" },
  { value: "appUsage", label: "App Usage", type: "select", options: ["Heavy", "Medium", "Light", "None"] },
]

const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com", country: "United States", lastActive: "Today" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", country: "Canada", lastActive: "Last 7 days" },
  { id: 3, name: "Mike Wilson", email: "mike@example.com", country: "United Kingdom", lastActive: "Today" },
  { id: 4, name: "Sarah Jones", email: "sarah@example.com", country: "Australia", lastActive: "Last 7 days" },
  { id: 5, name: "Alex Brown", email: "alex@example.com", country: "United States", lastActive: "Today" },
]

export function CreateSegmentModal({ open, onOpenChange }: CreateSegmentModalProps) {
  const [segmentName, setSegmentName] = useState("")
  const [filters, setFilters] = useState<Array<{ id: string; entity: "Users" | "Events"; field: string; operator: string; value: string }>>([])
  const { toast } = useToast()

  const addFilter = () => {
    const newFilter = {
      id: Date.now().toString(),
      entity: "Users" as const,
      field: "",
      operator: "equals",
      value: ""
    }
    setFilters([...filters, newFilter])
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id))
  }

  const updateFilter = (id: string, key: string, value: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [key]: value } : f))
  }

  const handleSave = () => {
    toast({
      title: "Segment Created Successfully",
      description: `${segmentName} has been saved with ${filters.length} filters.`,
    })
    onOpenChange(false)
    setSegmentName("")
    setFilters([])
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
                      // When switching to Users, clear field selection
                      if (value === "Users") {
                        setFilters(filters.map(f => f.id === filter.id ? { ...f, entity: "Users", field: "" } : f))
                      } else {
                        updateFilter(filter.id, "entity", value)
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
                      <Select value={filter.field} onValueChange={(value) => updateFilter(filter.id, "field", value)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {filterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Select value={filter.operator} onValueChange={(value) => updateFilter(filter.id, "operator", value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                      </SelectContent>
                    </Select>

                    {filter.entity === "Events" && filter.field && filterOptions.find(opt => opt.value === filter.field)?.type === "select" ? (
                      <Select value={filter.value} onValueChange={(value) => updateFilter(filter.id, "value", value)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {filterOptions.find(opt => opt.value === filter.field)?.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Enter value"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                        className="flex-1"
                      />
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
                  {estimatedCount.toLocaleString()} users
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.slice(0, 5).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.country}</TableCell>
                      <TableCell>{user.lastActive}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!segmentName.trim()}>
            Save Segment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}