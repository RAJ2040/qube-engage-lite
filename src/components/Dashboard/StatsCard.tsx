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
        <CardTitle className="text-sm font-medium text-muted-foreground">
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
        <div className="text-2xl font-bold text-foreground mb-1">
          {value}
        </div>
        {change && (
          <p className="text-xs text-muted-foreground">
            <span className={cn(
              "font-medium",
              change.trend === 'up' && "text-success",
              change.trend === 'down' && "text-destructive",
              change.trend === 'neutral' && "text-muted-foreground"
            )}>
              {change.value}
            </span>
            {" from last month"}
          </p>
        )}
      </CardContent>
      
      {gradient && (
        <div className="absolute inset-0 bg-gradient-primary opacity-90 -z-10 rounded-lg" />
      )}
    </Card>
  )
}