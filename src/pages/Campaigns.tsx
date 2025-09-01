import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateCampaignModal } from "@/components/Modals/CreateCampaignModal"
import { fetchCampaignByRef, fetchCampaigns, type CampaignListItem } from "@/lib/api"
import { 
  MessageSquare, 
  Plus, 
  Filter,
  Mail,
  MessageCircle,
  Smartphone,
  Play,
  Pause,
  MoreHorizontal,
  Users,
  Send,
  Eye,
  MousePointer
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const campaignsStatic = [
  {
    id: 1,
    referenceId: "welcome-email-series-001",
    name: "Welcome Email Series",
    type: "Email",
    icon: Mail,
    status: "Active",
    segment: "New Users",
    sent: 1247,
    opened: 623,
    clicked: 89,
    scheduled: "Running",
    lastSent: "2 hours ago"
  },
  {
    id: 2,
    referenceId: "flash-sale-whatsapp-002",
    name: "Flash Sale WhatsApp",
    type: "WhatsApp", 
    icon: MessageCircle,
    status: "Scheduled",
    segment: "High-Value Customers",
    sent: 0,
    opened: 0,
    clicked: 0,
    scheduled: "Tomorrow 9:00 AM",
    lastSent: "Not sent"
  },
  {
    id: 3,
    referenceId: "cart-abandonment-sms-003",
    name: "Cart Abandonment SMS",
    type: "SMS",
    icon: Smartphone,
    status: "Active",
    segment: "Cart Abandoners",
    sent: 892,
    opened: 731,
    clicked: 156,
    scheduled: "Running",
    lastSent: "1 hour ago"
  },
  {
    id: 4,
    referenceId: "re-engagement-push-004",
    name: "Re-engagement Push",
    type: "Push",
    icon: Smartphone,
    status: "Draft",
    segment: "Inactive Users",
    sent: 0,
    opened: 0,
    clicked: 0,
    scheduled: "Not scheduled",
    lastSent: "Never"
  }
]

const getStatusBadge = (status: string) => {
  const variants = {
    Active: { variant: "default" as const, className: "bg-success text-success-foreground" },
    Scheduled: { variant: "secondary" as const, className: "bg-warning text-warning-foreground" },
    Draft: { variant: "outline" as const, className: "" },
    Paused: { variant: "secondary" as const, className: "bg-muted" }
  }
  
  const config = variants[status as keyof typeof variants] || variants.Draft
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  )
}

const getTypeIcon = (type: string) => {
  const icons = {
    Email: Mail,
    WhatsApp: MessageCircle,
    SMS: Smartphone,
    Push: Smartphone
  }
  return icons[type as keyof typeof icons] || MessageSquare
}

export default function Campaigns() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editRefId, setEditRefId] = useState<string | null>(null)
  const [editInitial, setEditInitial] = useState<{
    name?: string;
    description?: string;
    channel?: string;
    segmentName?: string;
    segmentRefId?: string | null;
    templateName?: string;
    templateId?: string | null;
    templateBody?: string;
    throttling?: {
      max_messages_per_minute: number;
      max_messages_per_hour: number;
      max_messages_per_day: number;
      burst_limit: number;
    };
    retry_policy?: {
      max_retries: number;
      retry_delay_minutes: number;
      backoff_multiplier: number;
      retry_on_statuses: string[];
    };
  } | null>(null)
  const [items, setItems] = useState<CampaignListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)
    fetchCampaigns({ page: 1, limit: 20 })
      .then((res) => {
        if (!isMounted) return
        setItems(res.data.items || [])
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Failed to load campaigns")
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })
    return () => { isMounted = false }
  }, [])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage multi-channel marketing campaigns
          </p>
        </div>
        <Button 
          className="bg-gradient-primary hover:opacity-90 text-white shadow-glow"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Campaign Types */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { type: "Email", icon: Mail, count: 12, color: "blue" },
          { type: "WhatsApp", icon: MessageCircle, count: 8, color: "green" },
          { type: "SMS", icon: Smartphone, count: 6, color: "purple" },
          { type: "Push", icon: Smartphone, count: 4, color: "orange" }
        ].map((channel) => (
          <Card key={channel.type} className="hover-lift cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <channel.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{channel.type}</h3>
                  <p className="text-sm text-muted-foreground">{channel.count} campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">All Campaigns</CardTitle>
              <CardDescription>
                Monitor performance and manage your marketing campaigns
              </CardDescription>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(items.length ? items : campaignsStatic).map((campaign: CampaignListItem | typeof campaignsStatic[0], index: number) => {
              const displayType = campaign.type || campaign.channel_name || "Push"
              const TypeIcon = getTypeIcon(displayType)
              // Ensure unique key by combining multiple identifiers
              const uniqueKey = campaign.id || campaign.reference_id || `static-${campaign.name}-${index}`
              return (
                <Card key={uniqueKey} className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{campaign.name}</h3>
                            {getStatusBadge(campaign.status ?? "Draft")}
                            <Badge variant="outline">
                              <Users className="w-3 h-3 mr-1" />
                              {campaign.segment ?? campaign.segment_id ?? "Segment"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-6 mb-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                                <Send className="w-3 h-3" />
                                Sent
                              </div>
                              <div className="text-lg font-semibold text-foreground">
                                {(campaign.sent ?? 0).toLocaleString()}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                                <Eye className="w-3 h-3" />
                                Opened
                              </div>
                              <div className="text-lg font-semibold text-foreground">
                                {(campaign.opened ?? 0).toLocaleString()}
                              </div>
                              {(campaign.sent ?? 0) > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {(((campaign.opened ?? 0) / (campaign.sent ?? 1)) * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                            
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                                <MousePointer className="w-3 h-3" />
                                Clicked
                              </div>
                              <div className="text-lg font-semibold text-foreground">
                                {(campaign.clicked ?? 0).toLocaleString()}
                              </div>
                              {(campaign.opened ?? 0) > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {(((campaign.clicked ?? 0) / (campaign.opened ?? 1)) * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground mb-1">Status</div>
                              <div className="text-sm font-medium text-foreground">{campaign.scheduled ?? campaign.scheduleType ?? "-"}</div>
                              <div className="text-xs text-muted-foreground">
                                Last: {campaign.lastSent ?? "-"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {campaign.status === "Active" && (
                          <Button variant="outline" size="sm">
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </Button>
                        )}
                        {campaign.status === "Scheduled" && (
                          <Button variant="outline" size="sm">
                            <Play className="w-3 h-3 mr-1" />
                            Send Now
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={async () => {
                              if (!campaign.reference_id) {
                                console.warn("Cannot edit campaign: reference_id is undefined")
                                return
                              }
                              
                              try {
                                const res = await fetchCampaignByRef(campaign.reference_id)
                                const d = res.data
                                
                                // Parse throttling and retry policy from JSON strings
                                let throttling = undefined
                                let retry_policy = undefined
                                
                                try {
                                  if (d.throttlingJson) {
                                    throttling = JSON.parse(d.throttlingJson)
                                  }
                                } catch (e) {
                                  console.warn("Failed to parse throttling JSON:", e)
                                }
                                
                                try {
                                  if (d.retryPolicyJson) {
                                    retry_policy = JSON.parse(d.retryPolicyJson)
                                  }
                                } catch (e) {
                                  console.warn("Failed to parse retry policy JSON:", e)
                                }
                                
                                setEditInitial({
                                  name: d.name,
                                  description: d.description,
                                  channel: d.channel_name,
                                  segmentName: d.segment_id,
                                  segmentRefId: d.segment_id,
                                  templateName: d.message_template_id,
                                  templateId: d.message_template_id,
                                  templateBody: "",
                                  throttling,
                                  retry_policy,
                                })
                                setEditRefId(campaign.reference_id)
                              } catch (error) {
                                console.error("Failed to fetch campaign details:", error)
                                // For static data, create a mock initial state
                                if (campaign.id && campaign.name) {
                                  setEditInitial({
                                    name: campaign.name,
                                    description: `Edit ${campaign.name}`,
                                    channel: campaign.type?.toLowerCase(),
                                    segmentName: campaign.segment,
                                    segmentRefId: null,
                                    templateName: "",
                                    templateId: null,
                                    templateBody: "",
                                    throttling: {
                                      max_messages_per_minute: 60,
                                      max_messages_per_hour: 1000,
                                      max_messages_per_day: 10000,
                                      burst_limit: 10
                                    },
                                    retry_policy: {
                                      max_retries: 3,
                                      retry_delay_minutes: 5,
                                      backoff_multiplier: 2,
                                      retry_on_statuses: ["5xx", "429"]
                                    }
                                  })
                                  setEditRefId(campaign.reference_id)
                                }
                              }
                            }}>Edit Campaign</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem>View Analytics</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <CreateCampaignModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      {editRefId && (
        <CreateCampaignModal
          open={!!editRefId}
          onOpenChange={(o) => { if (!o) setEditRefId(null) }}
          mode="edit"
          referenceId={editRefId}
          initial={editInitial ?? {}}
        />
      )}
    </div>
  )
}