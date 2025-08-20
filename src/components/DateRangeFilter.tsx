import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateRangeFilterProps {
  onFilterChange: (range: string, startDate?: Date, endDate?: Date) => void
}

export function DateRangeFilter({ onFilterChange }: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState("last-7-days")
  const [customStartDate, setCustomStartDate] = useState<Date>()
  const [customEndDate, setCustomEndDate] = useState<Date>()
  const [showCustomDates, setShowCustomDates] = useState(false)

  const predefinedRanges = [
    { value: "today", label: "Today" },
    { value: "last-7-days", label: "Last 7 days" },
    { value: "last-30-days", label: "Last 30 days" },
    { value: "last-90-days", label: "Last 90 days" },
    { value: "custom", label: "Custom Range" }
  ]

  const handleRangeChange = (value: string) => {
    setSelectedRange(value)
    setShowCustomDates(value === "custom")
    
    if (value !== "custom") {
      onFilterChange(value)
    }
  }

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      onFilterChange("custom", customStartDate, customEndDate)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {predefinedRanges.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCustomDates && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-32 justify-start text-left font-normal",
                  !customStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? format(customStartDate, "MMM dd") : "Start"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={setCustomStartDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">to</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-32 justify-start text-left font-normal",
                  !customEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? format(customEndDate, "MMM dd") : "End"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={setCustomEndDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button 
            onClick={handleCustomRangeApply}
            disabled={!customStartDate || !customEndDate}
            size="sm"
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  )
}