import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  GitBranch, 
  Plus, 
  Play,
  Pause,
  Users,
  Mail,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react"

const journeys = [
  {
    id: 1,
    name: "Welcome Onboarding",
    description: "Guide new users through product features",
    status: "Active",
    triggers: "User Signup",
    steps: 5,
    activeUsers: 234,
    completed: 1847,
    conversionRate: 78.5,
    lastUpdated: "2 hours ago"
  },
  {
    id: 2,
    name: "Cart Recovery",
    description: "Re-engage users who abandoned their cart",
    status: "Active", 
    triggers: "Cart Abandonment",
    steps: 3,
    activeUsers: 156,
    completed: 892,
    conversionRate: 45.2,
    lastUpdated: "1 day ago"
  },
  {
    id: 3,
    name: "Trial Conversion",
    description: "Convert trial users to paid subscriptions",
    status: "Draft",
    triggers: "Trial Day 5",
    steps: 4,
    activeUsers: 0,
    completed: 0,
    conversionRate: 0,
    lastUpdated: "3 days ago"
  }
]

const journeyTemplates = [
  {
    name: "Welcome Series",
    description: "Onboard new users with a series of helpful emails",
    steps: ["Welcome Email", "Feature Tour", "First Action", "Support Offer"],
    icon: Mail,
    color: "blue"
  },
  {
    name: "Re-engagement",
    description: "Win back inactive users with targeted messages",
    steps: ["Inactive Alert", "Special Offer", "Feedback Request", "Final Notice"],
    icon: Users,
    color: "purple"
  },
  {
    name: "Purchase Follow-up",
    description: "Thank customers and encourage repeat purchases",
    steps: ["Thank You", "Usage Tips", "Review Request", "Upsell Offer"],
    icon: CheckCircle,
    color: "green"
  }
]

const getStatusBadge = (status: string) => {
  const variants = {
    Active: { variant: "default" as const, className: "bg-success text-success-foreground" },
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

export default function Journeys() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Journeys</h1>
          <p className="text-muted-foreground mt-1">
            Create automated workflows to guide users through their experience
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Create Journey
        </Button>
      </div>

      {/* Journey Templates */}
      <div className="grid gap-4 md:grid-cols-3">
        {journeyTemplates.map((template) => (
          <Card key={template.name} className="hover-lift cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <template.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.steps.length} steps</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
              
              <div className="flex flex-wrap gap-1">
                {template.steps.map((step, index) => (
                  <div key={step} className="flex items-center">
                    <Badge variant="secondary" className="text-xs">
                      {step}
                    </Badge>
                    {index < template.steps.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Journeys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Your Journeys</CardTitle>
          <CardDescription>
            Monitor and manage your automated customer workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {journeys.map((journey) => (
              <Card key={journey.id} className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{journey.name}</h3>
                        {getStatusBadge(journey.status)}
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{journey.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Trigger</div>
                          <div className="font-medium text-foreground">{journey.triggers}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Steps</div>
                          <div className="font-medium text-foreground">{journey.steps}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Active Users</div>
                          <div className="font-medium text-foreground">
                            {journey.activeUsers.toLocaleString()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Completed</div>
                          <div className="font-medium text-foreground">
                            {journey.completed.toLocaleString()}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Conversion Rate</div>
                          <div className="font-medium text-foreground">
                            {journey.conversionRate}%
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Last updated: {journey.lastUpdated}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {journey.status === "Active" && (
                        <Button variant="outline" size="sm">
                          <Pause className="w-3 h-3 mr-1" />
                          Pause
                        </Button>
                      )}
                      {journey.status === "Draft" && (
                        <Button variant="outline" size="sm">
                          <Play className="w-3 h-3 mr-1" />
                          Activate
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journey Builder Preview */}
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
            <GitBranch className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Visual Journey Builder</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create complex customer journeys with our drag-and-drop visual builder. Set triggers, add delays, and create branches based on user behavior.
          </p>
          <Button className="bg-gradient-primary hover:opacity-90 text-white shadow-glow">
            <GitBranch className="w-4 h-4 mr-2" />
            Open Journey Builder
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}