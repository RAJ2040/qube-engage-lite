import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Check, Mail, MessageCircle, Smartphone, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const channels = [
  { id: "email", name: "Email", icon: Mail, description: "Send emails to your audience" },
  { id: "sms", name: "SMS", icon: MessageCircle, description: "Send text messages" },
  { id: "whatsapp", name: "WhatsApp", icon: Smartphone, description: "Send WhatsApp messages" },
  { id: "push", name: "Push", icon: Bell, description: "Send push notifications" }
]

const segments = [
  { id: "all", name: "All Users", count: 12400 },
  { id: "high-value", name: "High-Value Customers", count: 1247 },
  { id: "cart-abandoners", name: "Cart Abandoners", count: 3891 },
  { id: "new-york", name: "New York Users", count: 892 },
  { id: "trial", name: "Trial Users", count: 456 }
]

export function CreateCampaignModal({ open, onOpenChange }: CreateCampaignModalProps) {
  const [step, setStep] = useState(1)
  const [campaignData, setCampaignData] = useState({
    name: "",
    description: "",
    channel: "",
    segment: "",
    template: ""
  })
  const { toast } = useToast()

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

  const handleSubmit = () => {
    // Mock API call
    toast({
      title: "Campaign Created Successfully",
      description: `${campaignData.name} has been created and is ready to launch.`,
    })
    onOpenChange(false)
    setStep(1)
    setCampaignData({ name: "", description: "", channel: "", segment: "", template: "" })
  }

  const isStepValid = () => {
    switch (step) {
      case 1: return campaignData.name.trim() !== ""
      case 2: return campaignData.channel !== ""
      case 3: return campaignData.segment !== ""
      case 4: return campaignData.template.trim() !== ""
      default: return true
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum < step ? "bg-primary text-primary-foreground" :
                  stepNum === step ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {stepNum < step ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 5 && <div className={`w-8 h-0.5 ${stepNum < step ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Campaign Details</h3>
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="Enter campaign name"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your campaign"
                  value={campaignData.description}
                  onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Channel</h3>
              <div className="grid grid-cols-2 gap-4">
                {channels.map((channel) => (
                  <Card
                    key={channel.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      campaignData.channel === channel.id ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setCampaignData({ ...campaignData, channel: channel.id })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <channel.icon className="w-8 h-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{channel.name}</h4>
                          <p className="text-sm text-muted-foreground">{channel.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Target Segment</h3>
              <Select value={campaignData.segment} onValueChange={(value) => setCampaignData({ ...campaignData, segment: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose target audience" />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{segment.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {segment.count.toLocaleString()} users
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Message Template</h3>
              <div className="space-y-2">
                <Label htmlFor="template">Message Content</Label>
                <Textarea
                  id="template"
                  placeholder="Enter your message template here..."
                  rows={6}
                  value={campaignData.template}
                  onChange={(e) => setCampaignData({ ...campaignData, template: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preview & Launch</h3>
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div><strong>Name:</strong> {campaignData.name}</div>
                  <div><strong>Channel:</strong> {channels.find(c => c.id === campaignData.channel)?.name}</div>
                  <div><strong>Segment:</strong> {segments.find(s => s.id === campaignData.segment)?.name}</div>
                  <div><strong>Target Audience:</strong> {segments.find(s => s.id === campaignData.segment)?.count.toLocaleString()} users</div>
                  {campaignData.description && <div><strong>Description:</strong> {campaignData.description}</div>}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={prevStep} disabled={step === 1}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {step < 5 ? (
            <Button onClick={nextStep} disabled={!isStepValid()}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              Launch Campaign
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}