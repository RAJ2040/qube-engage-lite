import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Filter, 
  Zap, 
  Calendar,
  User,
  MousePointer,
  ShoppingCart,
  Eye
} from "lucide-react"
import { useState } from "react"

const eventTypes = [
  { name: "Page View", icon: Eye, color: "blue" },
  { name: "Button Click", icon: MousePointer, color: "green" },
  { name: "Purchase", icon: ShoppingCart, color: "purple" },
  { name: "User Signup", icon: User, color: "orange" },
]

const recentEvents = [
  {
    id: 1,
    type: "Purchase",
    user: "john.doe@example.com",
    timestamp: "2 minutes ago",
    data: { amount: "$129.99", product: "Premium Plan" },
    icon: ShoppingCart,
    color: "purple"
  },
  {
    id: 2,
    type: "Page View",
    user: "jane.smith@example.com", 
    timestamp: "5 minutes ago",
    data: { page: "/pricing", duration: "45s" },
    icon: Eye,
    color: "blue"
  },
  {
    id: 3,
    type: "Button Click",
    user: "mike.wilson@example.com",
    timestamp: "8 minutes ago", 
    data: { button: "Start Trial", location: "/homepage" },
    icon: MousePointer,
    color: "green"
  },
  {
    id: 4,
    type: "User Signup",
    user: "sarah.jones@example.com",
    timestamp: "12 minutes ago",
    data: { source: "Google Ads", plan: "Free" },
    icon: User,
    color: "orange"
  },
]

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">
            Monitor real-time user activities and track important actions
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-glow">
          <Zap className="w-4 h-4 mr-2" />
          Send Test Event
        </Button>
      </div>

      {/* Event Types Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {eventTypes.map((event) => (
          <Card key={event.name} className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${event.color}-100 dark:bg-${event.color}-900/20 flex items-center justify-center`}>
                  <event.icon className={`w-5 h-5 text-${event.color}-600 dark:text-${event.color}-400`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{event.name}</h3>
                  <p className="text-sm text-muted-foreground">1,234 today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Events Stream */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Event Stream</CardTitle>
              <CardDescription>
                Real-time view of user activities in your application
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                <div className={`w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center`}>
                  <event.icon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground">{event.type}</h4>
                    <Badge variant="outline">{event.user}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
                    {Object.entries(event.data).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {event.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}