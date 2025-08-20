import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EventProperty {
  id: string
  key: string
  value: string
}

export function CreateEventModal({ open, onOpenChange }: CreateEventModalProps) {
  const [eventName, setEventName] = useState("")
  const [properties, setProperties] = useState<EventProperty[]>([
    { id: "1", key: "", value: "" }
  ])
  const { toast } = useToast()

  const addProperty = () => {
    const newProperty: EventProperty = {
      id: Date.now().toString(),
      key: "",
      value: ""
    }
    setProperties([...properties, newProperty])
  }

  const removeProperty = (id: string) => {
    if (properties.length > 1) {
      setProperties(properties.filter(p => p.id !== id))
    }
  }

  const updateProperty = (id: string, field: "key" | "value", value: string) => {
    setProperties(properties.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const handleSave = () => {
    const validProperties = properties.filter(p => p.key.trim() && p.value.trim())
    
    toast({
      title: "Event Created Successfully",
      description: `${eventName} has been created with ${validProperties.length} properties.`,
    })
    
    onOpenChange(false)
    setEventName("")
    setProperties([{ id: "1", key: "", value: "" }])
  }

  const handleTestEvent = () => {
    toast({
      title: "Test Event Triggered",
      description: `Test event "${eventName}" has been sent to the system.`,
    })
  }

  const isValid = eventName.trim() !== "" && properties.some(p => p.key.trim() && p.value.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              placeholder="e.g., purchase_completed, user_signup, page_view"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Event Properties</Label>
              <Button onClick={addProperty} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </div>

            <div className="space-y-3">
              {properties.map((property) => (
                <Card key={property.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Property key (e.g., amount, product_id)"
                          value={property.key}
                          onChange={(e) => updateProperty(property.id, "key", e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Property value (e.g., 129.99, premium_plan)"
                          value={property.value}
                          onChange={(e) => updateProperty(property.id, "value", e.target.value)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeProperty(property.id)}
                        disabled={properties.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Test Event</h3>
                  <p className="text-sm text-muted-foreground">
                    Send a test event to verify your configuration
                  </p>
                </div>
                <Button 
                  onClick={handleTestEvent} 
                  disabled={!isValid}
                  variant="outline"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Trigger Test Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}