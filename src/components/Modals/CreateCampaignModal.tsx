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
import { ChevronLeft, ChevronRight, Check, Mail, MessageCircle, Smartphone, Bell, Calendar as CalendarIcon, Clock, Repeat } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState as useReactState } from "react"
import { createCampaign, fetchCampaignByRef, fetchTemplateByName, fetchTemplateIds, launchCampaign, searchSegments, updateCampaign, type TemplateIdItem } from "@/lib/api"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const channels = [
  { id: "email", name: "Email", icon: Mail, description: "Send emails to your audience" },
  { id: "sms", name: "SMS", icon: MessageCircle, description: "Send text messages" },
  { id: "whatsapp", name: "WhatsApp", icon: Smartphone, description: "Send WhatsApp messages" },
  { id: "push", name: "Push", icon: Bell, description: "Send push notifications" }
]

const recurrenceOptions = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" }
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

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return { value: `${hour}:00`, label: `${hour}:00` }
})

// Dynamic search replaces static segments

export function CreateCampaignModal({ open, onOpenChange, ...restProps }: CreateCampaignModalProps & { mode?: "create" | "edit"; referenceId?: string | null; initial?: { name?: string; description?: string; channel?: string; segmentName?: string; segmentRefId?: string | null; templateName?: string; templateId?: string | null; templateBody?: string } }) {
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
    recurrence: "once",
    selectedWeekDays: [] as string[],
    customInterval: 1,
    customUnit: "days",
    timezone: "Asia/Kolkata"
  })
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templates, setTemplates] = useReactState<TemplateIdItem[]>([])
  const [loadingTemplates, setLoadingTemplates] = useReactState(false)
  const [templateError, setTemplateError] = useReactState<string | null>(null)
  const [segmentQuery, setSegmentQuery] = useReactState("")
  const [debouncedSegmentQuery, setDebouncedSegmentQuery] = useReactState("")
  const [segmentOpen, setSegmentOpen] = useReactState(false)
  const [segmentResults, setSegmentResults] = useReactState<Array<{ id: number; referenceId?: string; name: string; description?: string }>>([])
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
        setSegmentResults(items.map((i) => ({ id: i.id, referenceId: (i as any).referenceId, name: i.name, description: i.description })))
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
    if (!open || step !== 5) return
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

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

  const [creating, setCreating] = useState(false)
  const [createdRefId, setCreatedRefId] = useState<string | null>(null)
  const [campaignDetails, setCampaignDetails] = useReactState<any | null>(null)
  const [loadingDetails, setLoadingDetails] = useReactState(false)
  const [detailsError, setDetailsError] = useReactState<string | null>(null)

  const handleSubmit = async () => {
    try {
      setCreating(true)
      // Build payload using available info
      const payload: any = {
        name: campaignData.name,
        description: campaignData.description,
      }
      if (campaignData.channel) payload.channel_name = campaignData.channel
      // Require a referenceId for segment
      const segRef = campaignData.segmentRefId || segmentResults.find(s => s.name === campaignData.segment)?.referenceId
      if (segRef) payload.segment_id = segRef
      else throw new Error("Segment is required")
      if (campaignData.templateId) payload.message_template_id = campaignData.templateId

      // Add scheduling data
      if (campaignData.scheduleDate && campaignData.startTime) {
        const scheduleData = {
          start_date: format(campaignData.scheduleDate, "yyyy-MM-dd"),
          start_time: campaignData.startTime,
          end_time: campaignData.endTime || undefined,
          recurrence: campaignData.recurrence,
          selected_week_days: campaignData.selectedWeekDays.length > 0 ? campaignData.selectedWeekDays : undefined,
          custom_interval: campaignData.recurrence === "custom" ? campaignData.customInterval : undefined,
          custom_unit: campaignData.recurrence === "custom" ? campaignData.customUnit : undefined,
          timezone: campaignData.timezone
        }
        
        payload.schedule_type = campaignData.recurrence === "once" ? "IMMEDIATE" : "SCHEDULED"
        payload.schedule_json = JSON.stringify(scheduleData)
      }

      if (restProps.mode === "edit" && restProps.referenceId) {
        const res = await updateCampaign(restProps.referenceId, payload)
        const refId = (res as any).data?.reference_id || restProps.referenceId
        setCreatedRefId(refId || null)
      } else {
        const res = await createCampaign(payload)
        const refId = (res as any).data?.reference_id || (res as any).reference_id
        setCreatedRefId(refId || null)
      }

    toast({
      title: "Campaign Created Successfully",
        description: `${campaignData.name} has been created. Ref: ${createdRefId ?? "n/a"}`,
      })
      // Keep modal open; user can proceed steps normally
    } catch (err) {
      toast({
        title: "Failed to create campaign",
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
      case 4: return !!campaignData.scheduleDate && !!campaignData.startTime
      case 5: return !!campaignData.templateId
      default: return true
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
      }))
      setCreatedRefId(restProps.referenceId ?? null)
    }
  }, [open, restProps.mode, restProps.initial, restProps.referenceId])

  useEffect(() => {
    if (!open || step !== 6 || !createdRefId) return
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
      selectedWeekDays: prev.selectedWeekDays.includes(day)
        ? prev.selectedWeekDays.filter(d => d !== day)
        : [...prev.selectedWeekDays, day]
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{restProps.mode === "edit" ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4, 5, 6].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum < step ? "bg-primary text-primary-foreground" :
                  stepNum === step ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {stepNum < step ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 6 && <div className={`w-8 h-0.5 ${stepNum < step ? "bg-primary" : "bg-muted"}`} />}
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
                            setCampaignData({ ...campaignData, segment: s.name, segmentId: s.id, segmentRefId: s.referenceId ?? null })
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
              
              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
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
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select value={campaignData.startTime} onValueChange={(value) => setCampaignData({ ...campaignData, startTime: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time (Optional)</Label>
                  <Select value={campaignData.endTime} onValueChange={(value) => setCampaignData({ ...campaignData, endTime: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Recurrence Options */}
              <div className="space-y-4">
                <Label>Recurrence</Label>
                <div className="grid grid-cols-2 gap-2">
                  {recurrenceOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={campaignData.recurrence === option.value ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setCampaignData({ ...campaignData, recurrence: option.value })}
                    >
                      <Repeat className="mr-2 h-4 w-4" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Weekly Days Selection */}
              {campaignData.recurrence === "weekly" && (
                <div className="space-y-2">
                  <Label>Select Days</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => (
                      <Button
                        key={day.value}
                        variant={campaignData.selectedWeekDays.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleWeekDay(day.value)}
                      >
                        {day.label.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Interval */}
              {campaignData.recurrence === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Interval</Label>
                    <Input
                      type="number"
                      min="1"
                      value={campaignData.customInterval}
                      onChange={(e) => setCampaignData({ ...campaignData, customInterval: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={campaignData.customUnit} onValueChange={(value) => setCampaignData({ ...campaignData, customUnit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

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
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 5 && (
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

          {step === 6 && (
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
                  <div><strong>Segment ID:</strong> {campaignDetails?.segmentId ?? (campaignData.segmentId ?? "-")}</div>
                  <div><strong>Template ID:</strong> {campaignDetails?.messageTemplateId ?? (campaignData.templateId ?? "-")}</div>
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
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={prevStep} disabled={step === 1}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {step < 6 ? (
            <Button onClick={async () => {
              // Only create the campaign after required selections (end of step 5)
              if (step < 5) {
                nextStep()
                return
              }
              if (step === 5) {
                await handleSubmit()
                nextStep()
                return
              }
              nextStep()
            }} disabled={
              (step === 1 && campaignData.name.trim() === "") ||
              (step === 2 && !campaignData.channel) ||
              (step === 3 && !campaignData.segmentRefId) ||
              (step === 4 && (!campaignData.scheduleDate || !campaignData.startTime)) ||
              (step === 5 && (!campaignData.templateId || creating))
            }>
              Next
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