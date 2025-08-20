import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DateRangeFilter } from "@/components/DateRangeFilter"
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Mail,
  Smartphone,
  Calendar,
  Download
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useState } from "react"

const campaignPerformanceData = [
  { name: 'Email', sent: 12450, opened: 6225, clicked: 934 },
  { name: 'SMS', sent: 8920, opened: 7300, clicked: 1460 },
  { name: 'WhatsApp', sent: 5680, opened: 4850, clicked: 970 },
  { name: 'Push', sent: 15200, opened: 9120, clicked: 1368 }
]

const engagementData = [
  { name: 'High Engagement', value: 35, color: '#4CAF50' },
  { name: 'Medium Engagement', value: 45, color: '#66BB6A' },
  { name: 'Low Engagement', value: 20, color: '#FFC107' }
]

const monthlyTrends = [
  { month: 'Jan', campaigns: 24, conversion: 3.2 },
  { month: 'Feb', campaigns: 31, conversion: 3.8 },
  { month: 'Mar', campaigns: 28, conversion: 4.1 },
  { month: 'Apr', campaigns: 35, conversion: 3.9 },
  { month: 'May', campaigns: 42, conversion: 4.5 },
  { month: 'Jun', campaigns: 38, conversion: 4.2 }
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [selectedDateRange, setSelectedDateRange] = useState("last-7-days")

  const handleFilterChange = (range: string, startDate?: Date, endDate?: Date) => {
    setSelectedDateRange(range)
    console.log("Filter changed:", { range, startDate, endDate })
    // In a real app, this would trigger API calls to refresh chart data
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">
            Track performance and gain insights into your marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter onFilterChange={handleFilterChange} />
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Reach</p>
                <p className="text-2xl font-bold text-foreground">42,250</p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span className="text-success">+12.5%</span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Open Rate</p>
                <p className="text-2xl font-bold text-foreground">68.4%</p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span className="text-success">+3.2%</span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Click Rate</p>
                <p className="text-2xl font-bold text-foreground">12.8%</p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingDown className="w-3 h-3 text-destructive" />
                  <span className="text-destructive">-1.1%</span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Conversion</p>
                <p className="text-2xl font-bold text-foreground">4.2%</p>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span className="text-success">+0.8%</span>
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Campaign Performance */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-lg">Campaign Performance by Channel</CardTitle>
            <CardDescription>
              Compare performance across different communication channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sent" fill="#4CAF50" name="Sent" />
                <Bar dataKey="opened" fill="#66BB6A" name="Opened" />
                <Bar dataKey="clicked" fill="#388E3C" name="Clicked" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Engagement */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-lg">User Engagement Distribution</CardTitle>
            <CardDescription>
              Breakdown of user engagement levels across your audience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {engagementData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Welcome Email Series</h4>
                  <p className="text-sm text-muted-foreground">Email Campaign</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">89.2%</p>
                  <p className="text-xs text-muted-foreground">Open Rate</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">18.4%</p>
                  <p className="text-xs text-muted-foreground">Click Rate</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-lg">Best Performing Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">High-Value Customers</h4>
                  <p className="text-sm text-muted-foreground">1,247 users</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">92.1%</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">7.8%</p>
                  <p className="text-xs text-muted-foreground">Conversion</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">$24,580</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
              <div className="flex items-center justify-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-success font-medium">+23.5%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="bg-success/10 text-success border-success">
                  ROI: 340%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}