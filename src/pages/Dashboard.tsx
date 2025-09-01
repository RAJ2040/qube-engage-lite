import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { StatsCard } from "@/components/Dashboard/StatsCard"
import { ActivityChart } from "@/components/Dashboard/ActivityChart"
import { RecentActivity } from "@/components/Dashboard/RecentActivity"
import { CreateSegmentModal } from "@/components/Modals/CreateSegmentModal"
import { CreateCampaignModal } from "@/components/Modals/CreateCampaignModal"
import { CreateEventModal } from "@/components/Modals/CreateEventModal"
import { 
  Users, 
  MessageSquare, 
  Zap, 
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  const navigate = useNavigate()
  const [showSegmentModal, setShowSegmentModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your campaigns.
          </p>
        </div>
        <Button 
          className="bg-gradient-primary hover:opacity-90 text-white shadow-glow"
          onClick={() => setShowCampaignModal(true)}
        >
          Create Campaign
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value="24,567"
          change={{ value: "+12.5%", trend: "up" }}
          icon={Users}
        />
        <StatsCard
          title="Active Campaigns"
          value="12"
          change={{ value: "+2", trend: "up" }}
          icon={MessageSquare}
        />
        <StatsCard
          title="Events Captured"
          value="89,431"
          change={{ value: "+8.2%", trend: "up" }}
          icon={Zap}
        />
        <StatsCard
          title="Conversion Rate"
          value="3.42%"
          change={{ value: "-0.3%", trend: "down" }}
          icon={TrendingUp}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-7">
        <ActivityChart />
        <RecentActivity />
      </div>

      {/* Quick Actions & Campaign Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4 flex-col items-start gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setShowSegmentModal(true)}
              >
                <Users className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Create Segment</div>
                  <div className="text-xs opacity-80">Build user groups</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4 flex-col items-start gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setShowCampaignModal(true)}
              >
                <MessageSquare className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">New Campaign</div>
                  <div className="text-xs opacity-80">Send messages</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4 flex-col items-start gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setShowEventModal(true)}
              >
                <Zap className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Track Events</div>
                  <div className="text-xs opacity-80">Monitor activity</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4 flex-col items-start gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => navigate("/analytics")}
              >
                <TrendingUp className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">View Reports</div>
                  <div className="text-xs opacity-80">Analyze performance</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Campaign Status
            </CardTitle>
            <CardDescription>
              Overview of your running campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <div>
                    <p className="font-medium text-sm">Welcome Email Series</p>
                    <p className="text-xs text-muted-foreground">Running • 1,247 sent</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-success border-success">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-warning" />
                  <div>
                    <p className="font-medium text-sm">Flash Sale Reminder</p>
                    <p className="text-xs text-muted-foreground">Scheduled • Tomorrow 9 AM</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-warning border-warning">Scheduled</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Retention Campaign</p>
                    <p className="text-xs text-muted-foreground">Draft • Ready to send</p>
                  </div>
                </div>
                <Badge variant="outline">Draft</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateSegmentModal 
        open={showSegmentModal} 
        onOpenChange={setShowSegmentModal} 
      />
      <CreateCampaignModal 
        open={showCampaignModal} 
        onOpenChange={setShowCampaignModal} 
      />
      <CreateEventModal 
        open={showEventModal} 
        onOpenChange={setShowEventModal} 
      />
    </div>
  )
}