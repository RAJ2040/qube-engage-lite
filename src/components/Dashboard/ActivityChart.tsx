import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Mon', events: 2400, campaigns: 240 },
  { name: 'Tue', events: 1398, campaigns: 139 },
  { name: 'Wed', events: 9800, campaigns: 980 },
  { name: 'Thu', events: 3908, campaigns: 390 },
  { name: 'Fri', events: 4800, campaigns: 480 },
  { name: 'Sat', events: 3800, campaigns: 380 },
  { name: 'Sun', events: 4300, campaigns: 430 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ActivityChart() {
  return (
    <Card className="col-span-4 hover-lift">
      <CardHeader>
        <CardTitle className="text-lg">Activity Overview</CardTitle>
        <CardDescription>
          Events captured and campaigns sent over the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              className="text-xs text-muted-foreground"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              className="text-xs text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="events" 
              stroke="hsl(262 83% 58%)" 
              strokeWidth={2}
              dot={{ fill: 'hsl(262 83% 58%)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(262 83% 58%)' }}
            />
            <Line 
              type="monotone" 
              dataKey="campaigns" 
              stroke="hsl(217 91% 60%)" 
              strokeWidth={2}
              dot={{ fill: 'hsl(217 91% 60%)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(217 91% 60%)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}