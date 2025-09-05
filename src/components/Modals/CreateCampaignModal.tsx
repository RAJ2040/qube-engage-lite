import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// removed unused Select imports after refactor to Popover/Command
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { ChevronLeft, ChevronRight, Check, Mail, MessageCircle, Smartphone, Bell, Calendar as CalendarIcon, Clock, Repeat, Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState as useReactState } from "react"
import { createCampaign, fetchCampaignByRef, fetchTemplateByName, fetchTemplateIds, launchCampaign, searchSegments, updateCampaign, type TemplateIdItem } from "@/lib/api"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => void
}

const channels = [
  { id: "email", name: "Email", icon: Mail, description: "Send emails to your audience" },
  { id: "sms", name: "SMS", icon: MessageCircle, description: "Send text messages" },
  { id: "whatsapp", name: "WhatsApp", icon: Smartphone, description: "Send WhatsApp messages" },
  { id: "push", name: "Push", icon: Bell, description: "Send push notifications" }
]

const recurrenceOptions = [
  { value: "ONE_TIME", label: "One Time" },
  { value: "RECURRING", label: "Recurring" }
]

const oneTimeOptions = [
  { value: "IMMEDIATE", label: "Immediate" },
  { value: "SCHEDULED", label: "Scheduled" }
]

const recurringPatterns = [
  { value: "MINUTE", label: "Minute" },
  { value: "HOUR", label: "Hour" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" }
]

const weekDays = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" }
]

const monthOptions = [
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "4th" },
  { value: "5", label: "5th" },
  { value: "6", label: "6th" },
  { value: "7", label: "7th" },
  { value: "8", label: "8th" },
  { value: "9", label: "9th" },
  { value: "10", label: "10th" },
  { value: "11", label: "11th" },
  { value: "12", label: "12th" },
  { value: "13", label: "13th" },
  { value: "14", label: "14th" },
  { value: "15", label: "15th" },
  { value: "16", label: "16th" },
  { value: "17", label: "17th" },
  { value: "18", label: "18th" },
  { value: "19", label: "19th" },
  { value: "20", label: "20th" },
  { value: "21", label: "21st" },
  { value: "22", label: "22nd" },
  { value: "23", label: "23rd" },
  { value: "24", label: "24th" },
  { value: "25", label: "25th" },
  { value: "26", label: "26th" },
  { value: "27", label: "27th" },
  { value: "28", label: "28th" },
  { value: "29", label: "29th" },
  { value: "30", label: "30th" },
  { value: "31", label: "31st" },
  { value: "last", label: "Last" }
]

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]



// Dynamic search replaces static segments

export function CreateCampaignModal({ open, onOpenChange, ...restProps }: CreateCampaignModalProps & { 
  mode?: "create" | "edit"; 
  referenceId?: string | null; 
  initial?: { 
    name?: string; 
    description?: string; 
    channel?: string; 
    segmentName?: string; 
    segmentRefId?: string | null; 
    templateName?: string; 
    templateId?: string | null; 
    templateBody?: string;
    // Scheduling fields
    scheduleDate?: string | Date;
    startTime?: string;
    endTime?: string;
         recurrence?: string;
     oneTimeOption?: string;
     recurringPattern?: string;
     weekly_days?: string[];
     custom_interval?: number;
     custom_unit?: string;
     timezone?: string;
    // Enhanced scheduling fields
    isAllDay?: boolean;
    location?: string;
    scheduleDescription?: string;
    endDate?: string | Date;
    customRecurrence?: {
      frequency: string;
      interval: number;
      endAfterOccurrences?: number;
      endOnDate?: Date;
      monthlyPattern?: "day" | "weekday";
      monthlyWeek?: string;
      monthlyDay?: string;
      yearlyPattern?: "day" | "weekday";
      yearlyMonth?: string;
      yearlyWeek?: string;
      yearlyDay?: string;
    };
    // Throttling and retry policy
    throttling?: {
      max_messages_per_minute: number;
      max_messages_per_hour: number;
      max_messages_per_day: number;
      burst_limit: number;
    };
    retry_policy?: {
      max_retries: number;
      retry_delay_minutes: number;
      backoff_multiplier: number;
      retry_on_statuses: string[];
    };
  } 
}) {
  const [step, setStep] = useState(1)
  const [campaignData, setCampaignData] = useState({
    name: "",
    description: "",
    channel: "",
    segment: "",
    segmentId: null as null | number,
    segmentRefId: null as null | string,
    template: "",
    templateName: "",
    templateId: null as null | string,
    // Scheduling data
    scheduleDate: null as Date | null,
    startTime: "",
    endTime: "",
    endDate: null as Date | null,
         recurrence: "ONE_TIME",
     oneTimeOption: "" as string,
     recurringPattern: "WEEKLY" as string,
     weekly_days: [] as string[],
     custom_interval: 1,
     custom_unit: "days",
     timezone: "Asia/Kolkata",
         // Enhanced scheduling fields
     isAllDay: false,
     customRecurrence: {
      frequency: "daily",
      interval: 1,
      endAfterOccurrences: undefined,
      endOnDate: undefined,
      monthlyPattern: "day" as "day" | "weekday",
      monthlyWeek: "1",
      monthlyDay: "1",
      yearlyPattern: "day" as "day" | "weekday",
      yearlyMonth: "1",
      yearlyWeek: "1",
      yearlyDay: "1"
    },
    // Throttling and retry policy
    throttling: {
      max_messages_per_minute: 100,
      max_messages_per_hour: 1000,
      max_messages_per_day: 10000,
      burst_limit: 50
    },
    retry_policy: {
      max_retries: 3,
      retry_delay_minutes: 5,
      backoff_multiplier: 2.0,
      retry_on_statuses: ["FAILED", "TIMEOUT"]
    }
  })
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templates, setTemplates] = useReactState<TemplateIdItem[]>([])
  const [loadingTemplates, setLoadingTemplates] = useReactState(false)
  const [templateError, setTemplateError] = useReactState<string | null>(null)
  const [segmentQuery, setSegmentQuery] = useReactState("")
  const [debouncedSegmentQuery, setDebouncedSegmentQuery] = useReactState("")
  const [segmentOpen, setSegmentOpen] = useReactState(false)
  const [segmentResults, setSegmentResults] = useReactState<Array<{ id: number; referenceId?: string; reference_id?: string; name: string; description?: string }>>([])
  const [loadingSegments, setLoadingSegments] = useReactState(false)
  const [segmentError, setSegmentError] = useReactState<string | null>(null)

  useEffect(() => {
    if (!open || step !== 3) return
    const t = setTimeout(() => setDebouncedSegmentQuery(segmentQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [open, step, segmentQuery])

  useEffect(() => {
    if (!open || step !== 3) return
    let isMounted = true
    setLoadingSegments(true)
    setSegmentError(null)
    if (!debouncedSegmentQuery) {
      // Empty query: clear results and stop loading
      setSegmentResults([])
      setLoadingSegments(false)
      return
    }
    searchSegments(debouncedSegmentQuery, { limit: 20, page: 1 })
      .then((res) => {
        if (!isMounted) return
                 const items = res.data?.items || []
         setSegmentResults(items.map((i) => ({ id: i.id, referenceId: (i as any).referenceId, reference_id: (i as any).reference_id, name: i.name, description: i.description })))
      })
      .catch((err) => {
        if (!isMounted) return
        setSegmentError(err instanceof Error ? err.message : "Failed to search segments")
      })
      .finally(() => {
        if (!isMounted) return
        setLoadingSegments(false)
      })
    return () => { isMounted = false }
  }, [open, step, debouncedSegmentQuery])

  useEffect(() => {
    if (!open || step !== 6) return
    let isMounted = true
    setLoadingTemplates(true)
    setTemplateError(null)
    fetchTemplateIds()
      .then((res) => {
        if (!isMounted) return
        setTemplates(res.data || [])
      })
      .catch((err) => {
        if (!isMounted) return
        setTemplateError(err instanceof Error ? err.message : "Failed to load templates")
      })
      .finally(() => {
        if (!isMounted) return
        setLoadingTemplates(false)
      })
    return () => { isMounted = false }
  }, [open, step])
  const { toast } = useToast()

  const nextStep = async () => {
    // Only save data in create mode, not in edit mode
    if (restProps.mode !== "edit" && isStepValid()) {
      await savePartialCampaign(step)
    }
    setStep(step + 1)
  }
  const prevStep = () => setStep(step - 1)

  const [creating, setCreating] = useState(false)
  const [createdRefId, setCreatedRefId] = useState<string | null>(null)
  const [campaignDetails, setCampaignDetails] = useReactState<any | null>(null)
  const [loadingDetails, setLoadingDetails] = useReactState(false)
  const [detailsError, setDetailsError] = useReactState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [forceUpdate, setForceUpdate] = useState(0)

  // Function to save partial campaign data after each step
  const savePartialCampaign = async (stepNumber: number) => {
    if (!createdRefId && restProps.mode !== "edit") {
      // For new campaigns, we need to create first
      try {
        setSaving(true)
        const payload: any = {
          name: campaignData.name,
          description: campaignData.description,
          status: "SCHEDULED"
        }
        
        // Add data based on current step
        if (stepNumber >= 2 && campaignData.channel) {
          payload.channel_name = campaignData.channel
        }
        if (stepNumber >= 3 && campaignData.segmentRefId) {
          payload.segment_id = campaignData.segmentRefId
        }
        if (stepNumber >= 4) {
          // Handle different schedule types based on recurrence and oneTimeOption
          if (campaignData.recurrence === "ONE_TIME") {
            payload.schedule_type = "ONE_TIME"
            
            if (campaignData.oneTimeOption === "IMMEDIATE") {
              // For immediate campaigns, only send timezone
              payload.schedule_json = {
                timezone: campaignData.timezone
              }
            } else if (campaignData.oneTimeOption === "SCHEDULED" && campaignData.scheduleDate && campaignData.startTime) {
              // For scheduled one-time campaigns, send start_at
              const startAt = format(campaignData.scheduleDate, "yyyy-MM-dd") + "T" + campaignData.startTime + ":00"
              payload.schedule_json = {
                start_at: startAt,
                timezone: campaignData.timezone
              }
            }
          } else if (campaignData.recurrence === "RECURRING") {
            // For recurring campaigns, send full scheduling details
            const scheduleData: any = {
              start_at: campaignData.scheduleDate ? format(campaignData.scheduleDate, "yyyy-MM-dd") + "T" + campaignData.startTime + ":00" : undefined,
              timezone: campaignData.timezone
            }
            
            // Add end_at if end date is provided
            if (campaignData.endDate) {
              scheduleData.end_at = format(campaignData.endDate, "yyyy-MM-dd") + "T" + (campaignData.endTime || "23:59") + ":00"
            }
            
            // Add interval object based on recurring pattern
            const intervalMap = {
              "MINUTE": "minutes",
              "HOUR": "hours", 
              "DAILY": "days",
              "WEEKLY": "weeks",
              "MONTHLY": "months",
              "YEARLY": "years"
            }
            
            scheduleData.interval = {
              value: campaignData.custom_interval,
              unit: intervalMap[campaignData.recurringPattern as keyof typeof intervalMap] || "days"
            }
            
            payload.schedule_type = "RECURRING"
            payload.schedule_json = scheduleData
          }
        }
        if (stepNumber >= 5) {
          // Create policy_json with audience_policy, throttling and retry policy nested inside
          payload.policy_json = {
            audience_policy: {
              max_audience_size: 5000,
              batch_size: 100,
              batch_delay_seconds: 120,
              exclude_inactive_users: true,
              audience_refresh_frequency: "DAILY"
            },
            throttling: campaignData.throttling,
            retry_policy: campaignData.retry_policy
          }
        }
        if (stepNumber >= 6 && campaignData.templateId) {
          payload.message_template_id = campaignData.templateId
        }

        console.log('Debug - savePartialCampaign payload:', payload)
        const res = await createCampaign(payload)
        const refId = (res as any).data?.reference_id || (res as any).reference_id
        setCreatedRefId(refId || null)
        
        toast({
          title: "Campaign Saved",
          description: `Step ${stepNumber} data has been saved.`,
        })
        setLastSaved(Date.now())
      } catch (err) {
        toast({
          title: "Failed to save campaign",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        })
      } finally {
        setSaving(false)
      }
    } else {
      // For existing campaigns, update with current step data
      try {
        setSaving(true)
        const payload: any = {
          name: campaignData.name,
          description: campaignData.description,
          status: "SCHEDULED"
        }
        
        // Add data based on current step
        if (stepNumber >= 2 && campaignData.channel) {
          payload.channel_name = campaignData.channel
        }
        if (stepNumber >= 3 && campaignData.segmentRefId) {
          payload.segment_id = campaignData.segmentRefId
        }
        if (stepNumber >= 4) {
          // Handle different schedule types based on recurrence and oneTimeOption
          if (campaignData.recurrence === "ONE_TIME") {
            payload.schedule_type = "ONE_TIME"
            
            if (campaignData.oneTimeOption === "IMMEDIATE") {
              // For immediate campaigns, only send timezone
              payload.schedule_json = {
                timezone: campaignData.timezone
              }
            } else if (campaignData.oneTimeOption === "SCHEDULED" && campaignData.scheduleDate && campaignData.startTime) {
              // For scheduled one-time campaigns, send start_at
              const startAt = format(campaignData.scheduleDate, "yyyy-MM-dd") + "T" + campaignData.startTime + ":00"
              payload.schedule_json = {
                start_at: startAt,
                timezone: campaignData.timezone
              }
            }
          } else if (campaignData.recurrence === "RECURRING") {
            // For recurring campaigns, send full scheduling details
            const scheduleData: any = {
              start_at: campaignData.scheduleDate ? format(campaignData.scheduleDate, "yyyy-MM-dd") + "T" + campaignData.startTime + ":00" : undefined,
              timezone: campaignData.timezone
            }
            
            // Add end_at if end date is provided
            if (campaignData.endDate) {
              scheduleData.end_at = format(campaignData.endDate, "yyyy-MM-dd") + "T" + (campaignData.endTime || "23:59") + ":00"
            }
            
            // Add interval object based on recurring pattern
            const intervalMap = {
              "MINUTE": "minutes",
              "HOUR": "hours", 
              "DAILY": "days",
              "WEEKLY": "weeks",
              "MONTHLY": "months",
              "YEARLY": "years"
            }
            
            scheduleData.interval = {
              value: campaignData.custom_interval,
              unit: intervalMap[campaignData.recurringPattern as keyof typeof intervalMap] || "days"
            }
            
            payload.schedule_type = "RECURRING"
            payload.schedule_json = scheduleData
          }
        }
        if (stepNumber >= 5) {
          // Create policy_json with audience_policy, throttling and retry policy nested inside
          payload.policy_json = {
            audience_policy: {
              max_audience_size: 5000,
              batch_size: 100,
              batch_delay_seconds: 120,
              exclude_inactive_users: true,
              audience_refresh_frequency: "DAILY"
            },
            throttling: campaignData.throttling,
            retry_policy: campaignData.retry_policy
          }
        }
        if (stepNumber >= 6 && campaignData.templateId) {
          payload.message_template_id = campaignData.templateId
        }

        const refId = createdRefId || restProps.referenceId
        if (refId) {
          await updateCampaign(refId, payload)
          toast({
            title: "Campaign Updated",
            description: `Step ${stepNumber} data has been saved.`,
          })
          setLastSaved(Date.now())
        }
      } catch (err) {
        toast({
          title: "Failed to update campaign",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        })
      } finally {
        setSaving(false)
      }
    }
  }

  const handleSubmit = async () => {
    try {
      setCreating(true)
      // Build payload using available info
      const payload: any = {
        name: campaignData.name,
        description: campaignData.description,
        status: "SCHEDULED"
      }
      if (campaignData.channel) payload.channel_name = campaignData.channel
      // Require a referenceId for segment
      const segRef = campaignData.segmentRefId || segmentResults.find(s => s.name === campaignData.segment)?.referenceId
      if (segRef) payload.segment_id = segRef
      else throw new Error("Segment is required")
      if (campaignData.templateId) payload.message_template_id = campaignData.templateId

             // Add scheduling data
       console.log('Debug - campaignData values:', {
         recurrence: campaignData.recurrence,
         oneTimeOption: campaignData.oneTimeOption,
         scheduleDate: campaignData.scheduleDate,
         startTime: campaignData.startTime
       })
       
       if (campaignData.recurrence === "ONE_TIME") {
         payload.schedule_type = "ONE_TIME"
         
         if (campaignData.oneTimeOption === "IMMEDIATE") {
           // For immediate campaigns, only send timezone
           payload.schedule_json = {
             timezone: campaignData.timezone
           }
         } else if (campaignData.oneTimeOption === "SCHEDULED" && campaignData.scheduleDate && campaignData.startTime) {
           // For scheduled one-time campaigns, send start_at
           const startAt = format(campaignData.scheduleDate, "yyyy-MM-dd") + "T" + campaignData.startTime + ":00"
           payload.schedule_json = {
             start_at: startAt,
             timezone: campaignData.timezone
           }
         }
       } else if (campaignData.recurrence === "RECURRING") {
         // For recurring campaigns, send full scheduling details
         const scheduleData: any = {
           start_at: campaignData.scheduleDate ? format(campaignData.scheduleDate, "yyyy-MM-dd") + "T" + campaignData.startTime + ":00" : undefined,
           timezone: campaignData.timezone
         }
         
         // Add end_at if end date is provided
         if (campaignData.endDate) {
           scheduleData.end_at = format(campaignData.endDate, "yyyy-MM-dd") + "T" + (campaignData.endTime || "23:59") + ":00"
         }
         
         // Add interval object based on recurring pattern
         const intervalMap = {
           "MINUTE": "minutes",
           "HOUR": "hours", 
           "DAILY": "days",
           "WEEKLY": "weeks",
           "MONTHLY": "months",
           "YEARLY": "years"
         }
         
         scheduleData.interval = {
           value: campaignData.custom_interval,
           unit: intervalMap[campaignData.recurringPattern as keyof typeof intervalMap] || "days"
         }
         
         payload.schedule_type = "RECURRING"
         payload.schedule_json = scheduleData
       }

      // Add throttling and retry policy
      payload.policy_json = {
        audience_policy: {
          max_audience_size: 5000,
          batch_size: 100,
          batch_delay_seconds: 120,
          exclude_inactive_users: true,
          audience_refresh_frequency: "DAILY"
        },
        throttling: campaignData.throttling,
        retry_policy: campaignData.retry_policy
      }

      console.log('Debug - Final payload:', payload)

      if (restProps.mode === "edit" && restProps.referenceId) {
        const res = await updateCampaign(restProps.referenceId, payload)
        const refId = (res as any).data?.reference_id || restProps.referenceId
        setCreatedRefId(refId || null)
        
        // Launch the updated campaign
        if (refId) {
          try {
            const launchRes = await launchCampaign(refId)
            toast({ 
              title: "Campaign Updated & Launched", 
              description: `Campaign updated and launch queued. Status: ${launchRes.data?.status ?? "OK"}` 
            })
          } catch (launchErr) {
            console.error('Launch failed:', launchErr)
            toast({
              title: "Campaign Updated",
              description: "Campaign updated successfully, but launch failed. You can launch it manually later.",
              variant: "destructive"
            })
          }
        }
      } else {
        console.log('Debug - handleSubmit createCampaign payload:', payload)
        const res = await createCampaign(payload)
        const refId = (res as any).data?.reference_id || (res as any).reference_id
        setCreatedRefId(refId || null)
        
        // Launch the new campaign
        if (refId) {
          try {
            const launchRes = await launchCampaign(refId)
            toast({ 
              title: "Campaign Created & Launched", 
              description: `Campaign created and launch queued. Status: ${launchRes.data?.status ?? "OK"}` 
            })
          } catch (launchErr) {
            console.error('Launch failed:', launchErr)
            toast({
              title: "Campaign Created",
              description: "Campaign created successfully, but launch failed. You can launch it manually later.",
              variant: "destructive"
            })
          }
        }
      }

    // Toast messages are now handled above with launch status
    
    // Close modal and refresh campaigns list to reflect changes
    onOpenChange(false)
    
    // Call refresh callback to update the campaigns list smoothly
    if (restProps.onRefresh) {
      restProps.onRefresh()
    }
    } catch (err) {
      toast({
        title: restProps.mode === "edit" ? "Failed to update campaign" : "Failed to create campaign",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1: return campaignData.name.trim() !== ""
      case 2: return campaignData.channel !== ""
      case 3: return !!campaignData.segmentRefId
             case 4: {
        // Simple: If IMMEDIATE is selected, enable Next button
        if (campaignData.oneTimeOption === "IMMEDIATE") {
          return true
        }
        // For SCHEDULED and RECURRING, need date and time
        if (campaignData.oneTimeOption === "SCHEDULED" || campaignData.recurrence === "RECURRING") {
          return !!campaignData.scheduleDate && !!campaignData.startTime
        }
        return false
      }
      case 5: return true // Throttling and retry policy step is always valid
      case 6: return !!campaignData.templateId
      default: return true
    }
  }

  // Debug function to check step 4 validation
  const debugStep4Validation = () => {
    if (step === 4) {
      const isImmediate = campaignData.recurrence === "ONE_TIME" && campaignData.oneTimeOption === "IMMEDIATE"
      const isScheduled = campaignData.recurrence === "ONE_TIME" && campaignData.oneTimeOption === "SCHEDULED"
      const isRecurring = campaignData.recurrence === "RECURRING"
      
      console.log('Step 4 Validation Debug:', {
        recurrence: campaignData.recurrence,
        oneTimeOption: campaignData.oneTimeOption,
        isImmediate,
        isScheduled,
        isRecurring,
        scheduleDate: campaignData.scheduleDate,
        startTime: campaignData.startTime,
        scheduleDateValid: !!campaignData.scheduleDate,
        startTimeValid: !!campaignData.startTime,
        step4Valid: isImmediate || (isScheduled && !!campaignData.scheduleDate && !!campaignData.startTime) || (isRecurring && !!campaignData.scheduleDate && !!campaignData.startTime)
      })
    }
  }

  // Debug function to check step 3 validation
  const debugStep3Validation = () => {
    if (step === 3) {
      console.log('Step 3 Validation Debug:', {
        segmentRefId: campaignData.segmentRefId,
        segment: campaignData.segment,
        segmentResults: segmentResults.map(s => ({ name: s.name, referenceId: s.referenceId, reference_id: s.reference_id })),
        isValid: !!campaignData.segmentRefId
      })
    }
  }

  // Prefill on open for edit mode
  useEffect(() => {
    if (!open) return
    if (restProps.mode === "edit" && restProps.initial) {
      setCampaignData((prev) => ({
        ...prev,
        name: restProps.initial?.name ?? prev.name,
        description: restProps.initial?.description ?? prev.description,
        channel: restProps.initial?.channel ?? prev.channel,
        segment: restProps.initial?.segmentName ?? prev.segment,
        segmentRefId: restProps.initial?.segmentRefId ?? prev.segmentRefId,
        templateName: restProps.initial?.templateName ?? prev.templateName,
        templateId: restProps.initial?.templateId ?? prev.templateId,
        template: restProps.initial?.templateBody ?? prev.template,
        throttling: restProps.initial?.throttling ?? prev.throttling,
        retry_policy: restProps.initial?.retry_policy ?? prev.retry_policy,
        // Parse schedule data from schedule_json if available
        ...(() => {
          try {
            const scheduleJson = restProps.initial?.schedule_json ? JSON.parse(restProps.initial.schedule_json) : null
            if (scheduleJson) {
              return {
                scheduleDate: scheduleJson.start_at ? new Date(scheduleJson.start_at.split('T')[0]) : prev.scheduleDate,
                startTime: scheduleJson.start_at ? scheduleJson.start_at.split('T')[1]?.substring(0, 5) : scheduleJson.start_time || prev.startTime,
                endTime: scheduleJson.end_time ?? prev.endTime,
                endDate: scheduleJson.end_at ? new Date(scheduleJson.end_at.split('T')[0]) : prev.endDate,
                recurrence: restProps.initial?.schedule_type ?? prev.recurrence,
                oneTimeOption: restProps.initial?.schedule_type === "ONE_TIME" ? 
                  (scheduleJson.start_at ? "SCHEDULED" : "IMMEDIATE") : prev.oneTimeOption,
                recurringPattern: scheduleJson.recurrence ?? prev.recurringPattern,
                weekly_days: scheduleJson.weekly_days ?? prev.weekly_days,
                custom_interval: scheduleJson.custom_interval ?? prev.custom_interval,
                custom_unit: scheduleJson.custom_unit ?? prev.custom_unit,
                timezone: scheduleJson.timezone ?? prev.timezone,
              }
            }
          } catch (e) {
            console.error('Error parsing schedule_json:', e)
          }
          return {
            scheduleDate: restProps.initial?.scheduleDate ? new Date(restProps.initial.scheduleDate) : prev.scheduleDate,
            startTime: restProps.initial?.startTime ?? prev.startTime,
            endTime: restProps.initial?.endTime ?? prev.endTime,
            endDate: restProps.initial?.endDate ? new Date(restProps.initial.endDate) : prev.endDate,
            recurrence: restProps.initial?.recurrence ?? prev.recurrence,
            oneTimeOption: restProps.initial?.oneTimeOption ?? 
              (restProps.initial?.recurrence === "ONE_TIME" && restProps.initial?.scheduleDate ? "SCHEDULED" : "IMMEDIATE"),
            recurringPattern: restProps.initial?.recurringPattern ?? prev.recurringPattern,
            weekly_days: restProps.initial?.weekly_days ?? prev.weekly_days,
            custom_interval: restProps.initial?.custom_interval ?? prev.custom_interval,
            custom_unit: restProps.initial?.custom_unit ?? prev.custom_unit,
            timezone: restProps.initial?.timezone ?? prev.timezone,
          }
        })(),
                 // Enhanced scheduling fields
         isAllDay: restProps.initial?.isAllDay ?? prev.isAllDay,
         customRecurrence: restProps.initial?.customRecurrence ?? prev.customRecurrence,
      }))
      setCreatedRefId(restProps.referenceId ?? null)
    }
  }, [open, restProps.mode, restProps.initial, restProps.referenceId])

  useEffect(() => {
    if (!open || step !== 7 || !createdRefId) return
    let isMounted = true
    setLoadingDetails(true)
    setDetailsError(null)
    fetchCampaignByRef(createdRefId)
      .then((res) => {
        if (!isMounted) return
        setCampaignDetails(res.data)
      })
      .catch((err) => {
        if (!isMounted) return
        setDetailsError(err instanceof Error ? err.message : "Failed to load campaign details")
      })
      .finally(() => {
        if (!isMounted) return
        setLoadingDetails(false)
      })
    return () => { isMounted = false }
  }, [open, step, createdRefId])

  const toggleWeekDay = (day: string) => {
    setCampaignData(prev => ({
      ...prev,
      weekly_days: prev.weekly_days.includes(day)
        ? prev.weekly_days.filter(d => d !== day)
        : [...prev.weekly_days, day]
    }))
  }

  // Simple close handler
  const handleClose = (open: boolean) => {
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{restProps.mode === "edit" ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4, 5, 6, 7].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum < step ? "bg-primary text-primary-foreground" :
                  stepNum === step ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {stepNum < step ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 7 && <div className={`w-8 h-0.5 ${stepNum < step ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Campaign Details</h3>
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="Enter campaign name"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your campaign"
                  value={campaignData.description}
                  onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Channel</h3>
              <div className="grid grid-cols-2 gap-4">
                {channels.map((channel) => (
                  <Card
                    key={channel.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      campaignData.channel === channel.id ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setCampaignData({ ...campaignData, channel: channel.id })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <channel.icon className="w-8 h-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{channel.name}</h4>
                          <p className="text-sm text-muted-foreground">{channel.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

                     {step === 3 && (
             <div className="space-y-4">
               <h3 className="text-lg font-semibold">Target Segment</h3>
               {(() => { debugStep3Validation(); return null; })()}
              <Popover open={segmentOpen} onOpenChange={setSegmentOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={segmentOpen} className="w-full justify-between">
                    {campaignData.segment || (loadingSegments ? "Searching..." : (segmentError || "Search segments..."))}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-h-80 overflow-y-auto">
                  <Command className="max-h-48 overflow-y-auto">
                    <CommandInput placeholder="Type to search segments..." value={segmentQuery} onValueChange={(v) => setSegmentQuery(v)} />
                    {!debouncedSegmentQuery && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Type at least 1 character to search</div>
                    )}
                    {debouncedSegmentQuery && segmentResults.length === 0 && !loadingSegments && !segmentError && (
                      <CommandEmpty>No segments found.</CommandEmpty>
                    )}
                    <CommandGroup className="max-h-48 overflow-y-auto">
                      {segmentResults.map((s) => (
                                                 <CommandItem
                           key={s.id}
                           value={`${s.id} ${s.name}`}
                           onSelect={() => {
                             setCampaignData({ ...campaignData, segment: s.name, segmentId: s.id, segmentRefId: s.reference_id ?? s.referenceId ?? null })
                             setSegmentOpen(false)
                           }}
                         >
                          {s.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

                     {step === 4 && (
             <div className="space-y-6">
               <h3 className="text-lg font-semibold">Schedule Campaign</h3>
               {(() => { debugStep4Validation(); return null; })()}
               
                               {/* Recurrence Options - Moved to top */}
                <div className="space-y-4">
                  <Label>Recurrence</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {recurrenceOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={campaignData.recurrence === option.value ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setCampaignData({ 
                          ...campaignData, 
                          recurrence: option.value,
                          // Reset recurring pattern when changing recurrence type
                          recurringPattern: option.value === "RECURRING" ? "WEEKLY" : campaignData.recurringPattern,
                          // Reset one-time option when changing recurrence type
                          oneTimeOption: option.value === "ONE_TIME" ? "" : campaignData.oneTimeOption
                        })}
                      >
                        <Repeat className="mr-2 h-4 w-4" />
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* One Time Options - Only show when ONE_TIME is selected */}
                {campaignData.recurrence === "ONE_TIME" && (
                  <div className="space-y-2">
                    <Label>Delivery Option</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {oneTimeOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={campaignData.oneTimeOption === option.value ? "default" : "outline"}
                          className="justify-start"
                          onClick={() => {
                            console.log('Debug - Setting oneTimeOption to:', option.value)
                            setCampaignData({ ...campaignData, oneTimeOption: option.value })
                          }}
                        >
                          {option.value === "IMMEDIATE" ? <Clock className="mr-2 h-4 w-4" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                               {/* Unit Selection - Only show when RECURRING is selected */}
                {campaignData.recurrence === "RECURRING" && (
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select 
                      value={campaignData.recurringPattern} 
                      onValueChange={(value) => setCampaignData({ ...campaignData, recurringPattern: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {recurringPatterns.map((pattern) => (
                          <SelectItem key={pattern.value} value={pattern.value}>
                            {pattern.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}



                               {/* Date & Time Selection - Only show for scheduled campaigns or recurring campaigns */}
                {(campaignData.recurrence === "RECURRING" || 
                  (campaignData.recurrence === "ONE_TIME" && campaignData.oneTimeOption === "SCHEDULED")) && (
                  <div className={cn(
                    "gap-4",
                    // Show single column for one-time scheduled, two columns for recurring
                    campaignData.recurrence === "ONE_TIME" ? "grid grid-cols-1" : "grid grid-cols-2"
                  )}>
                 <div className="space-y-2">
                   <Label>Start Date & Time</Label>
                   <div className="flex gap-2">
                     <Popover>
                       <PopoverTrigger asChild>
                         <Button
                           variant="outline"
                           className={cn(
                             "flex-1 justify-start text-left font-normal",
                             !campaignData.scheduleDate && "text-muted-foreground"
                           )}
                         >
                           <CalendarIcon className="mr-2 h-4 w-4" />
                           {campaignData.scheduleDate ? format(campaignData.scheduleDate, "PPP") : "Pick a date"}
                         </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-auto p-0">
                         <Calendar
                           mode="single"
                           selected={campaignData.scheduleDate}
                           onSelect={(date) => setCampaignData({ ...campaignData, scheduleDate: date })}
                           initialFocus
                           disabled={(date) => {
                             // Allow today's date, only disable past dates
                             const today = new Date()
                             today.setHours(0, 0, 0, 0)
                             const selectedDate = new Date(date)
                             selectedDate.setHours(0, 0, 0, 0)
                             return selectedDate < today
                           }}
                         />
                       </PopoverContent>
                     </Popover>
                     <Input
                       type="time"
                       value={campaignData.startTime}
                       onChange={(e) => setCampaignData({ ...campaignData, startTime: e.target.value })}
                       className="w-24"
                       placeholder="HH:MM"
                     />
                   </div>
                 </div>

                 {/* End Date & Time - Only show for recurring campaigns */}
                 {campaignData.recurrence === "RECURRING" && (
                   <div className="space-y-2">
                     <Label>End Date & Time (Optional)</Label>
                     <div className="flex gap-2">
                       <Popover>
                         <PopoverTrigger asChild>
                           <Button
                             variant="outline"
                             className={cn(
                               "flex-1 justify-start text-left font-normal",
                               !campaignData.endDate && "text-muted-foreground"
                             )}
                           >
                             <CalendarIcon className="mr-2 h-4 w-4" />
                             {campaignData.endDate ? format(campaignData.endDate, "PPP") : "Pick end date"}
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="w-auto p-0">
                           <Calendar
                             mode="single"
                             selected={campaignData.endDate}
                             onSelect={(date) => setCampaignData({ ...campaignData, endDate: date })}
                             initialFocus
                             disabled={(date) => {
                               if (!campaignData.scheduleDate) return true
                               const startDate = new Date(campaignData.scheduleDate)
                               startDate.setHours(0, 0, 0, 0)
                               const selectedDate = new Date(date)
                               selectedDate.setHours(0, 0, 0, 0)
                               return selectedDate < startDate
                             }}
                           />
                         </PopoverContent>
                       </Popover>
                       <Input
                         type="time"
                         value={campaignData.endTime}
                         onChange={(e) => setCampaignData({ ...campaignData, endTime: e.target.value })}
                         className="w-24"
                         placeholder="HH:MM"
                       />
                     </div>
                   </div>
                 )}
               </div>
                 )}

                                            {/* Minute Pattern */}
               {campaignData.recurrence === "RECURRING" && campaignData.recurringPattern === "MINUTE" && (
                 <div className="space-y-2">
                   <Label>Every</Label>
                   <div className="flex items-center gap-2">
                     <Input
                       type="number"
                       min="1"
                       max="59"
                       value={campaignData.custom_interval}
                       onChange={(e) => setCampaignData({ ...campaignData, custom_interval: parseInt(e.target.value) || 1 })}
                       className="w-20"
                     />
                     <span className="text-sm text-muted-foreground">minute(s)</span>
                   </div>
                   <p className="text-xs text-muted-foreground">Campaign will run every {campaignData.custom_interval} minute(s)</p>
                 </div>
               )}

               {/* Hour Pattern */}
               {campaignData.recurrence === "RECURRING" && campaignData.recurringPattern === "HOUR" && (
                 <div className="space-y-2">
                   <Label>Every</Label>
                   <div className="flex items-center gap-2">
                     <Input
                       type="number"
                       min="1"
                       max="23"
                       value={campaignData.custom_interval}
                       onChange={(e) => setCampaignData({ ...campaignData, custom_interval: parseInt(e.target.value) || 1 })}
                       className="w-20"
                     />
                     <span className="text-sm text-muted-foreground">hour(s)</span>
                   </div>
                   <p className="text-xs text-muted-foreground">Campaign will run every {campaignData.custom_interval} hour(s)</p>
                 </div>
               )}

               {/* Daily Pattern */}
               {campaignData.recurrence === "RECURRING" && campaignData.recurringPattern === "DAILY" && (
                 <div className="space-y-2">
                   <Label>Every</Label>
                   <div className="flex items-center gap-2">
                     <Input
                       type="number"
                       min="1"
                       max="31"
                       value={campaignData.custom_interval}
                       onChange={(e) => setCampaignData({ ...campaignData, custom_interval: parseInt(e.target.value) || 1 })}
                       className="w-20"
                     />
                     <span className="text-sm text-muted-foreground">day(s)</span>
                   </div>
                   <p className="text-xs text-muted-foreground">Campaign will run every {campaignData.custom_interval} day(s)</p>
                 </div>
               )}

               {/* Weekly Days Selection */}
               {campaignData.recurrence === "RECURRING" && campaignData.recurringPattern === "WEEKLY" && (
                 <div className="space-y-2">
                   <Label>Select Days</Label>
                   <div className="grid grid-cols-7 gap-2">
                     {weekDays.map((day) => (
                       <Button
                         key={day.value}
                         variant={campaignData.weekly_days.includes(day.value) ? "default" : "outline"}
                         size="sm"
                         onClick={() => toggleWeekDay(day.value)}
                       >
                         {day.label.slice(0, 3)}
                       </Button>
                     ))}
                   </div>
                 </div>
               )}

                             {/* Monthly Pattern */}
               {campaignData.recurrence === "RECURRING" && campaignData.recurringPattern === "MONTHLY" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Monthly Pattern</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="monthlyDay"
                          name="monthlyPattern"
                          value="day"
                          checked={campaignData.customRecurrence.monthlyPattern === "day"}
                          onChange={() => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              monthlyPattern: "day"
                            }
                          })}
                        />
                        <Label htmlFor="monthlyDay">Day of month</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="monthlyWeekday"
                          name="monthlyPattern"
                          value="weekday"
                          checked={campaignData.customRecurrence.monthlyPattern === "weekday"}
                          onChange={() => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              monthlyPattern: "weekday"
                            }
                          })}
                        />
                        <Label htmlFor="monthlyWeekday">Day of week</Label>
                      </div>
                    </div>
                  </div>

                  {campaignData.customRecurrence.monthlyPattern === "day" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Day of Month</Label>
                        <Select 
                          value={campaignData.customRecurrence.monthlyDay} 
                          onValueChange={(value) => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              monthlyDay: value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {campaignData.customRecurrence.monthlyPattern === "weekday" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Week of Month</Label>
                        <Select 
                          value={campaignData.customRecurrence.monthlyWeek} 
                          onValueChange={(value) => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              monthlyWeek: value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.slice(0, 5).map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.value === "last" ? "Last" : `${option.label} week`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Day of Week</Label>
                        <Select 
                          value={campaignData.customRecurrence.monthlyDay} 
                          onValueChange={(value) => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              monthlyDay: value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {weekDays.map((day) => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

                             {/* Yearly Pattern */}
               {campaignData.recurrence === "RECURRING" && campaignData.recurringPattern === "YEARLY" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Yearly Pattern</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="yearlyDay"
                          name="yearlyPattern"
                          value="day"
                          checked={campaignData.customRecurrence.yearlyPattern === "day"}
                          onChange={() => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              yearlyPattern: "day"
                            }
                          })}
                        />
                        <Label htmlFor="yearlyDay">Day of year</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="yearlyWeekday"
                          name="yearlyPattern"
                          value="weekday"
                          checked={campaignData.customRecurrence.yearlyPattern === "weekday"}
                          onChange={() => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              yearlyPattern: "weekday"
                            }
                          })}
                        />
                        <Label htmlFor="yearlyWeekday">Day of week</Label>
                      </div>
                    </div>
                  </div>

                  {campaignData.customRecurrence.yearlyPattern === "day" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Month</Label>
                        <Select 
                          value={campaignData.customRecurrence.yearlyMonth} 
                          onValueChange={(value) => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              yearlyMonth: value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {monthNames.map((month, index) => (
                              <SelectItem key={index + 1} value={(index + 1).toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Day of Month</Label>
                        <Select 
                          value={campaignData.customRecurrence.yearlyDay} 
                          onValueChange={(value) => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              yearlyDay: value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {campaignData.customRecurrence.yearlyPattern === "weekday" && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Month</Label>
                        <Select 
                          value={campaignData.customRecurrence.yearlyMonth} 
                          onValueChange={(value) => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              yearlyMonth: value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {monthNames.map((month, index) => (
                              <SelectItem key={index + 1} value={(index + 1).toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Week of Month</Label>
                        <Select 
                          value={campaignData.customRecurrence.yearlyWeek} 
                          onValueChange={(value) => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              yearlyWeek: value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.slice(0, 5).map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.value === "last" ? "Last" : `${option.label} week`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Day of Week</Label>
                        <Select 
                          value={campaignData.customRecurrence.yearlyDay} 
                          onValueChange={(value) => setCampaignData({
                            ...campaignData,
                            customRecurrence: {
                              ...campaignData.customRecurrence,
                              yearlyDay: value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {weekDays.map((day) => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

                             

                                                           {/* End Conditions - Temporarily commented out */}
                {/* {campaignData.recurrence === "RECURRING" && (
                 <div className="space-y-4">
                   <Label>End Conditions</Label>
                   <div className="space-y-4">
                     <div className="flex items-center space-x-2">
                       <input
                         type="radio"
                         id="endNever"
                         name="endCondition"
                         checked={!campaignData.customRecurrence.endAfterOccurrences && !campaignData.customRecurrence.endOnDate}
                         onChange={() => setCampaignData({
                           ...campaignData,
                           customRecurrence: {
                             ...campaignData.customRecurrence,
                             endAfterOccurrences: undefined,
                             endOnDate: undefined
                           }
                         })}
                       />
                       <Label htmlFor="endNever">Never</Label>
                     </div>
                     <div className="flex items-center space-x-2">
                       <input
                         type="radio"
                         id="endAfter"
                         name="endCondition"
                         checked={!!campaignData.customRecurrence.endAfterOccurrences}
                         onChange={() => setCampaignData({
                           ...campaignData,
                           customRecurrence: {
                             ...campaignData.customRecurrence,
                             endAfterOccurrences: 10,
                             endOnDate: undefined
                           }
                         })}
                       />
                       <Label htmlFor="endAfter">After</Label>
                       <Input
                         type="number"
                         min="1"
                         value={campaignData.customRecurrence.endAfterOccurrences || ""}
                         onChange={(e) => setCampaignData({
                           ...campaignData,
                           customRecurrence: {
                             ...campaignData.customRecurrence,
                             endAfterOccurrences: parseInt(e.target.value) || undefined
                           }
                         })}
                         className="w-20"
                         disabled={!campaignData.customRecurrence.endAfterOccurrences}
                       />
                       <span>occurrences</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <input
                         type="radio"
                         id="endOnDate"
                         name="endCondition"
                         checked={!!campaignData.customRecurrence.endOnDate}
                         onChange={() => setCampaignData({
                           ...campaignData,
                           customRecurrence: {
                             ...campaignData.customRecurrence,
                             endAfterOccurrences: undefined,
                             endOnDate: new Date()
                           }
                         })}
                       />
                       <Label htmlFor="endOnDate">On</Label>
                       <Popover>
                         <PopoverTrigger asChild>
                           <Button
                             variant="outline"
                             className={cn(
                               "w-40 justify-start text-left font-normal",
                               !campaignData.customRecurrence.endOnDate && "text-muted-foreground"
                             )}
                             disabled={!campaignData.customRecurrence.endOnDate}
                           >
                             <CalendarIcon className="mr-2 h-4 w-4" />
                             {campaignData.customRecurrence.endOnDate ? format(campaignData.customRecurrence.endOnDate, "PPP") : "Pick a date"}
                           </Button>
                         </PopoverTrigger>
                         <PopoverContent className="w-auto p-0">
                           <Calendar
                             mode="single"
                             selected={campaignData.customRecurrence.endOnDate}
                             onSelect={(date) => setCampaignData({
                               ...campaignData,
                               customRecurrence: {
                                 ...campaignData.customRecurrence,
                                 endOnDate: date
                               }
                             })}
                             initialFocus
                             disabled={(date) => {
                               if (!campaignData.scheduleDate) return true
                               const startDate = new Date(campaignData.scheduleDate)
                               startDate.setHours(0, 0, 0, 0)
                               const selectedDate = new Date(date)
                               selectedDate.setHours(0, 0, 0, 0)
                               return selectedDate < startDate
                             }}
                           />
                         </PopoverContent>
                       </Popover>
                     </div>
                   </div>
                 </div>
               )} */}

              {/* Timezone */}
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={campaignData.timezone} onValueChange={(value) => setCampaignData({ ...campaignData, timezone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Australia/Sydney (AEDT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Throttling & Retry Policy</h3>
              
              {/* Throttling Settings */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Message Throttling</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Messages per Minute</Label>
                    <Input
                      type="number"
                      min="1"
                      value={campaignData.throttling.max_messages_per_minute}
                      onChange={(e) => setCampaignData({
                        ...campaignData,
                        throttling: {
                          ...campaignData.throttling,
                          max_messages_per_minute: parseInt(e.target.value) || 100
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Messages per Hour</Label>
                    <Input
                      type="number"
                      min="1"
                      value={campaignData.throttling.max_messages_per_hour}
                      onChange={(e) => setCampaignData({
                        ...campaignData,
                        throttling: {
                          ...campaignData.throttling,
                          max_messages_per_hour: parseInt(e.target.value) || 1000
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Messages per Day</Label>
                    <Input
                      type="number"
                      min="1"
                      value={campaignData.throttling.max_messages_per_day}
                      onChange={(e) => setCampaignData({
                        ...campaignData,
                        throttling: {
                          ...campaignData.throttling,
                          max_messages_per_day: parseInt(e.target.value) || 10000
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Burst Limit</Label>
                    <Input
                      type="number"
                      min="1"
                      value={campaignData.throttling.burst_limit}
                      onChange={(e) => setCampaignData({
                        ...campaignData,
                        throttling: {
                          ...campaignData.throttling,
                          burst_limit: parseInt(e.target.value) || 50
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Retry Policy Settings */}
              <div className="space-y-4">
                <h4 className="text-md font-medium">Retry Policy</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Retries</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={campaignData.retry_policy.max_retries}
                      onChange={(e) => setCampaignData({
                        ...campaignData,
                        retry_policy: {
                          ...campaignData.retry_policy,
                          max_retries: parseInt(e.target.value) || 3
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Retry Delay (minutes)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={campaignData.retry_policy.retry_delay_minutes}
                      onChange={(e) => setCampaignData({
                        ...campaignData,
                        retry_policy: {
                          ...campaignData.retry_policy,
                          retry_delay_minutes: parseInt(e.target.value) || 5
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Backoff Multiplier</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.1"
                      value={campaignData.retry_policy.backoff_multiplier}
                      onChange={(e) => setCampaignData({
                        ...campaignData,
                        retry_policy: {
                          ...campaignData.retry_policy,
                          backoff_multiplier: parseFloat(e.target.value) || 2.0
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Retry on Statuses</Label>
                    <Select 
                      value={campaignData.retry_policy.retry_on_statuses.join(",")} 
                      onValueChange={(value) => setCampaignData({
                        ...campaignData,
                        retry_policy: {
                          ...campaignData.retry_policy,
                          retry_on_statuses: value ? value.split(",") : ["FAILED", "TIMEOUT"]
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FAILED,TIMEOUT">Failed & Timeout</SelectItem>
                        <SelectItem value="FAILED">Failed Only</SelectItem>
                        <SelectItem value="TIMEOUT">Timeout Only</SelectItem>
                        <SelectItem value="FAILED,TIMEOUT,REJECTED">Failed, Timeout & Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Message Template</h3>
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={templateOpen} className="w-full justify-between">
                      {campaignData.templateName || (loadingTemplates ? "Loading..." : (templateError || "Select template"))}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-h-80 overflow-y-auto">
                    <Command className="max-h-48 overflow-y-auto">
                      <CommandInput placeholder="Search template..." />
                      <CommandEmpty>No template found.</CommandEmpty>
                      <CommandGroup className="max-h-48 overflow-y-auto">
                        {templates.map((t) => (
                          <CommandItem
                            key={t.reference_id}
                            value={`${t.reference_id} ${t.template_name}`}
                            onSelect={() => {
                              setCampaignData({ ...campaignData, templateName: t.template_name, templateId: t.reference_id })
                              setTemplateOpen(false)
                              // Fetch template body by selected name
                              fetchTemplateByName(t.template_name)
                                .then((res) => {
                                  const body = res.data?.[0]?.template_body || ""
                                  setCampaignData((prev) => ({ ...prev, template: body }))
                                })
                                .catch(() => {
                                  setCampaignData((prev) => ({ ...prev, template: "" }))
                                })
                            }}
                          >
                            {t.template_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Message Content</Label>
                <Textarea
                  id="template"
                  placeholder="Enter your message template here..."
                  rows={6}
                  value={campaignData.template}
                  onChange={(e) => setCampaignData({ ...campaignData, template: e.target.value })}
                  readOnly
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Preview & Launch</h3>
              {createdRefId && (
                <div className="text-sm text-muted-foreground">Reference ID: {createdRefId}</div>
              )}
              {loadingDetails && (
                <div className="text-sm text-muted-foreground">Loading campaign details…</div>
              )}
              {detailsError && (
                <div className="text-sm text-red-600">{detailsError}</div>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div><strong>Name:</strong> {campaignDetails?.name ?? campaignData.name}</div>
                  <div><strong>Channel:</strong> {campaignDetails?.channelName ?? campaignData.channel}</div>
                  <div><strong>Segment Name:</strong> {campaignDetails?.segment?.name ?? campaignData.segment ?? "-"}</div>
                  <div><strong>Template Name:</strong> {campaignDetails?.message_template?.name ?? campaignData.templateName ?? "-"}</div>
                  <div><strong>Status:</strong> {campaignDetails?.status ?? "-"}</div>
                  {campaignDetails?.description || campaignData.description ? (
                    <div><strong>Description:</strong> {campaignDetails?.description ?? campaignData.description}</div>
                  ) : null}
                  {campaignData.scheduleDate && (
                    <div><strong>Schedule:</strong> {format(campaignData.scheduleDate, "PPP")} at {campaignData.startTime}</div>
                  )}
                  {campaignData.recurrence !== "once" && (
                    <div><strong>Recurrence:</strong> {recurrenceOptions.find(r => r.value === campaignData.recurrence)?.label}</div>
                  )}
                  <div><strong>Throttling:</strong> {campaignData.throttling.max_messages_per_minute} msg/min, {campaignData.throttling.max_messages_per_hour} msg/hour</div>
                  <div><strong>Retry Policy:</strong> {campaignData.retry_policy.max_retries} retries, {campaignData.retry_policy.retry_delay_minutes} min delay</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Save Progress Button - Only show in edit mode */}
        {step < 7 && restProps.mode === "edit" && (
          <div className="flex flex-col items-center gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={async () => await savePartialCampaign(step)}
              disabled={saving || !isStepValid()}
              className="w-full max-w-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Progress
                </>
              )}
            </Button>
            {lastSaved && (
              <div className="text-xs text-muted-foreground">
                Last saved: {new Date(lastSaved).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={prevStep} disabled={step === 1}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {step <= 7 ? (
            <Button onClick={async () => {
              // Go to next step for all steps except the final one
              if (step < 7) {
                await nextStep()
                return
              }
              // In step 7, complete the campaign
              if (step === 7) {
                await handleSubmit()
                return
              }
            }} disabled={
              (step === 1 && campaignData.name.trim() === "") ||
              (step === 2 && !campaignData.channel) ||
              (step === 3 && !campaignData.segmentRefId) ||
              (step === 4 && !isStepValid()) ||
              (step === 5 && false) || // Throttling step is always valid
              (step === 6 && (!campaignData.templateId || creating)) ||
              saving // Disable button while saving
            }>
              {saving ? "Saving..." : (step === 7 ? "Launch" : "Next")}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={async () => {
                if (!createdRefId) {
                  await handleSubmit()
                }
                if (createdRefId) {
                  try {
                    setCreating(true)
                    const res = await launchCampaign(createdRefId)
                    toast({ title: "Launch queued", description: `Status: ${res.data?.status ?? "OK"}` })
                    // Refresh details after launch
                    const details = await fetchCampaignByRef(createdRefId)
                    setCampaignDetails(details.data)
                  } catch (err) {
                    toast({ title: "Failed to launch", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
                  } finally {
                    setCreating(false)
                  }
                }
              }}
              className="bg-primary hover:bg-primary/90"
              disabled={creating}
            >
              Launch Campaign
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}