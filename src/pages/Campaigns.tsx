import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

const campaigns = [
  {
    id: 1,
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
        <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-glow">
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
            {campaigns.map((campaign) => {
              const TypeIcon = getTypeIcon(campaign.type)
              return (
                <Card key={campaign.id} className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                          <TypeIcon className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{campaign.name}</h3>
                            {getStatusBadge(campaign.status)}
                            <Badge variant="outline">
                              <Users className="w-3 h-3 mr-1" />
                              {campaign.segment}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-6 mb-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                                <Send className="w-3 h-3" />
                                Sent
                              </div>
                              <div className="text-lg font-semibold text-foreground">
                                {campaign.sent.toLocaleString()}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                                <Eye className="w-3 h-3" />
                                Opened
                              </div>
                              <div className="text-lg font-semibold text-foreground">
                                {campaign.opened.toLocaleString()}
                              </div>
                              {campaign.sent > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {((campaign.opened / campaign.sent) * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                            
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                                <MousePointer className="w-3 h-3" />
                                Clicked
                              </div>
                              <div className="text-lg font-semibold text-foreground">
                                {campaign.clicked.toLocaleString()}
                              </div>
                              {campaign.opened > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {((campaign.clicked / campaign.opened) * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground mb-1">Status</div>
                              <div className="text-sm font-medium text-foreground">{campaign.scheduled}</div>
                              <div className="text-xs text-muted-foreground">
                                Last: {campaign.lastSent}
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
                            <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
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
    </div>
  )
}