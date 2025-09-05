import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
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
  const { toast } = useToast()
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
    // Schedule fields
    scheduleDate?: Date;
    startTime?: string;
    endTime?: string;
    recurrence?: string;
    selectedWeekDays?: string[];
    customInterval?: number;
    customUnit?: string;
    timezone?: string;
    // Throttling and retry policy
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

  const refreshCampaigns = () => {
    setLoading(true)
    setError(null)
    fetchCampaigns({ page: 1, limit: 20 })
      .then((res) => {
        setItems(res.data.items || [])
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load campaigns")
      })
      .finally(() => {
        setLoading(false)
      })
  }

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
      {items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(() => {
            const channelCounts = items.reduce((acc, campaign) => {
              const channel = campaign.channel_name || campaign.channelName || "Unknown"
              acc[channel] = (acc[channel] || 0) + 1
              return acc
            }, {} as Record<string, number>)
            
            const channels = [
              { type: "Email", icon: Mail },
              { type: "WhatsApp", icon: MessageCircle },
              { type: "SMS", icon: Smartphone },
              { type: "Push", icon: Smartphone }
            ]
            
            return channels.map((channel) => (
              <Card key={channel.type} className="hover-lift cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <channel.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{channel.type}</h3>
                      <p className="text-sm text-muted-foreground">{channelCounts[channel.type] || 0} campaigns</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          })()}
        </div>
      )}

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
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? "Loading campaigns..." : "No campaigns found. Create your first campaign to get started."}
              </div>
            ) : (
              items.map((campaign: CampaignListItem, index: number) => {
                const displayType = campaign.type || campaign.channel_name || "Push"
                const TypeIcon = getTypeIcon(displayType)
                // Ensure unique key by combining multiple identifiers
                const uniqueKey = campaign.id || campaign.reference_id || `campaign-${index}`
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
                                  
                                  // Parse throttling and retry policy from policy_json
                                  let throttling = undefined
                                  let retry_policy = undefined
                                  
                                  try {
                                    if (d.policyJson) {
                                      const policyData = JSON.parse(d.policyJson)
                                      throttling = policyData.throttling
                                      retry_policy = policyData.retry_policy
                                      console.log("Parsed policy data:", policyData)
                                    } else if (d.throttlingJson) {
                                      // Fallback to old format
                                      throttling = JSON.parse(d.throttlingJson)
                                    }
                                  } catch (e) {
                                    console.warn("Failed to parse policy JSON:", e)
                                  }
                                  
                                  try {
                                    if (!retry_policy && d.retryPolicyJson) {
                                      // Fallback to old format
                                      retry_policy = JSON.parse(d.retryPolicyJson)
                                    }
                                  } catch (e) {
                                    console.warn("Failed to parse retry policy JSON:", e)
                                  }
                                
                                  // Parse schedule data if available
                                  let scheduleData = null
                                  try {
                                    // Try both camelCase and snake_case field names
                                    const scheduleJson = d.scheduleJson || d.schedule_json
                                    if (scheduleJson) {
                                      scheduleData = JSON.parse(scheduleJson)
                                      console.log("Parsed schedule data:", scheduleData)
                                    }
                                  } catch (e) {
                                    console.warn("Failed to parse schedule JSON:", e)
                                  }
                                  
                                  // Debug: Log the campaign data structure
                                  console.log("Campaign data for edit:", d)
                                  console.log("Schedule type:", d.schedule_type || d.scheduleType)
                                  console.log("Schedule JSON field:", d.scheduleJson || d.schedule_json)
                                  console.log("Raw schedule data:", scheduleData)
                                  
                                  setEditInitial({
                                    name: d.name,
                                    description: d.description,
                                    channel: d.channel_name || d.channelName,
                                    segmentName: d.segment?.name || d.segment_id || d.segmentId,
                                    segmentRefId: d.segment?.id || d.segment_id || d.segmentId,
                                    templateName: d.message_template?.name || d.message_template_id || d.messageTemplateId,
                                    templateId: d.message_template?.id || d.message_template_id || d.messageTemplateId,
                                    templateBody: d.message_template?.body || "",
                                    // Schedule data - try multiple possible field names
                                    scheduleDate: scheduleData?.start_date || scheduleData?.startDate || scheduleData?.date ? 
                                      new Date(scheduleData.start_date || scheduleData.startDate || scheduleData.date) : undefined,
                                    startTime: scheduleData?.start_time || scheduleData?.startTime || scheduleData?.time || "",
                                    endTime: scheduleData?.end_time || scheduleData?.endTime || "",
                                    recurrence: d.schedule_type || d.scheduleType || "IMMEDIATE",
                                    selectedWeekDays: scheduleData?.selected_week_days || scheduleData?.weekDays || scheduleData?.weekly_days || scheduleData?.weeklyDays || scheduleData?.weekly_days || [],
                                    customInterval: scheduleData?.custom_interval || scheduleData?.interval || scheduleData?.customInterval || 1,
                                    customUnit: scheduleData?.custom_unit || scheduleData?.unit || scheduleData?.customUnit || "days",
                                    timezone: scheduleData?.timezone || scheduleData?.timeZone || "Asia/Kolkata",
                                    throttling,
                                    retry_policy,
                                  })
                                  setEditRefId(campaign.reference_id)
                                } catch (error) {
                                  console.error("Failed to fetch campaign details:", error)
                                  // Show error toast instead of fallback
                                  toast({ title: "Failed to load campaign", description: "Could not load campaign details for editing." })
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
              })
            )}
          </div>
        </CardContent>
      </Card>

      <CreateCampaignModal open={showCreateModal} onOpenChange={setShowCreateModal} onRefresh={refreshCampaigns} />
      {editRefId && (
        <CreateCampaignModal
          open={!!editRefId}
          onOpenChange={(o) => { if (!o) setEditRefId(null) }}
          mode="edit"
          referenceId={editRefId}
          initial={editInitial ?? {}}
          onRefresh={refreshCampaigns}
        />
      )}
    </div>
  )
}