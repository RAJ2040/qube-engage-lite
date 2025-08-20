import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

const recentActivities = [
  {
    id: 1,
    type: 'campaign',
    title: 'Welcome Series Campaign',
    status: 'sent',
    user: 'System',
    time: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    details: 'Sent to 1,247 users',
  },
  {
    id: 2,
    type: 'segment',
    title: 'High-Value Customers',
    status: 'updated',
    user: 'John Doe',
    time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    details: 'Added 156 new users',
  },
  {
    id: 3,
    type: 'journey',
    title: 'Onboarding Flow',
    status: 'started',
    user: 'Alice Smith',
    time: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    details: '89 users entered journey',
  },
  {
    id: 4,
    type: 'event',
    title: 'Purchase Completed',
    status: 'received',
    user: 'API',
    time: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    details: '23 events in last hour',
  },
]

const getStatusBadge = (status: string) => {
  const variants = {
    sent: 'default',
    updated: 'secondary',
    started: 'default',
    received: 'outline',
  } as const

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {status}
    </Badge>
  )
}

export function RecentActivity() {
  return (
    <Card className="col-span-3 hover-lift">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>
          Latest updates from your campaigns and segments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <Avatar className="w-8 h-8 mt-1">
                <AvatarFallback className="bg-gradient-primary text-white text-xs">
                  {activity.user.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  {getStatusBadge(activity.status)}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {activity.details}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.time, { addSuffix: true })} by {activity.user}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}