import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Check, Mail, MessageCircle, Smartphone, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useMemo, useState as useReactState } from "react"
import { createCampaign, fetchCampaignByRef, fetchTemplateByName, fetchTemplateIds, launchCampaign, searchSegments, type TemplateIdItem } from "@/lib/api"

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

// Dynamic search replaces static segments

export function CreateCampaignModal({ open, onOpenChange }: CreateCampaignModalProps) {
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
    if (!open || step !== 4) return
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

      const res = await createCampaign(payload)
      const reference_id = (res as any).data?.reference_id || (res as any).reference_id
      setCreatedRefId(reference_id || null)

      toast({
        title: "Campaign Created Successfully",
        description: `${campaignData.name} has been created. Ref: ${reference_id ?? "n/a"}`,
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
      case 3: return campaignData.segment !== ""
      case 4: return campaignData.template.trim() !== ""
      default: return true
    }
  }

  useEffect(() => {
    if (!open || step !== 5 || !createdRefId) return
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum < step ? "bg-primary text-primary-foreground" :
                  stepNum === step ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {stepNum < step ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 5 && <div className={`w-8 h-0.5 ${stepNum < step ? "bg-primary" : "bg-muted"}`} />}
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

          {step === 5 && (
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
          
          {step < 5 ? (
            <Button onClick={async () => {
              // Only create the campaign after required selections (end of step 4)
              if (step < 4) {
                nextStep()
                return
              }
              if (step === 4) {
                await handleSubmit()
                nextStep()
                return
              }
              nextStep()
            }} disabled={
              (step === 1 && campaignData.name.trim() === "") ||
              (step === 2 && !campaignData.channel) ||
              (step === 3 && !campaignData.segmentRefId) ||
              (step === 4 && (campaignData.template.trim() === "" || creating))
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