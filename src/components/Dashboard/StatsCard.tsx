import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
  }
  icon: LucideIcon
  gradient?: boolean
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  gradient = false,
  className 
}: StatsCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden hover-lift transition-all duration-300",
      gradient && "bg-gradient-card border-0 shadow-glow",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn(
          "text-sm font-medium",
          gradient ? "text-white/90" : "text-muted-foreground"
        )}>
          {title}
        </CardTitle>
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          gradient ? "bg-white/20" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            gradient ? "text-white" : "text-primary"
          )} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-2xl font-bold mb-1",
          gradient ? "text-white" : "text-foreground"
        )}>
          {value}
        </div>
        {change && (
          <p className={cn(
            "text-xs",
            gradient ? "text-white/80" : "text-muted-foreground"
          )}>
            <span className={cn(
              "font-medium",
              gradient ? "text-white" : change.trend === 'up' && "text-success",
              !gradient && change.trend === 'down' && "text-destructive",
              !gradient && change.trend === 'neutral' && "text-muted-foreground"
            )}>
              {change.value}
            </span>
            {" from last month"}
          </p>
        )}
      </CardContent>
    </Card>
  )
}