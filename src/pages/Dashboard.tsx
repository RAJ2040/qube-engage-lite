import { StatsCard } from "@/components/Dashboard/StatsCard"
import { ActivityChart } from "@/components/Dashboard/ActivityChart"
import { RecentActivity } from "@/components/Dashboard/RecentActivity"
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
        <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-glow">
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
          gradient
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
              <Button variant="outline" className="justify-start h-auto p-4 flex-col items-start gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Create Segment</div>
                  <div className="text-xs text-muted-foreground">Build user groups</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4 flex-col items-start gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">New Campaign</div>
                  <div className="text-xs text-muted-foreground">Send messages</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4 flex-col items-start gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Track Events</div>
                  <div className="text-xs text-muted-foreground">Monitor activity</div>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4 flex-col items-start gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">View Reports</div>
                  <div className="text-xs text-muted-foreground">Analyze performance</div>
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
    </div>
  )
}