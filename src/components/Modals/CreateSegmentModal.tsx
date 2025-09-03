import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, X, Calendar as CalendarIcon, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
// For proper Excel file generation
import * as XLSX from 'xlsx'
// For proper PDF generation
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import {
  fetchUserPropsCatalog,
  fetchEventsCatalog,
  fetchEventCatalogDetails,
  fetchOperatorsCatalog,
  fetchFieldCatalog,
  fetchSegmentById,
  type EventsCatalogItem,
  type OperatorsCatalogPayload,
  type UserPropsCatalogPayload,
  type FieldCatalogData,
  previewSegment,
  createSegment,
  updateSegment,
  type SegmentsPreviewItem,
  type SegmentDefinition,
} from "@/lib/api"

interface CreateSegmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "create" | "edit"
  segmentId?: string | null
  initial?: {
    name?: string
    description?: string
    definition?: SegmentDefinition
  }
  onSegmentSaved?: () => void
}

type CatalogType = "string" | "number" | "date" | "bool"

type FilterRow = {
  id: string
  entity: "Users" | "Events"
  eventName?: string
  field: string
  fieldType?: CatalogType
  operator: string
  value: string
  props?: Array<{ id: string; field: string; fieldType?: CatalogType; operator: string; value: string }>
}

export function CreateSegmentModal({ open, onOpenChange, mode = "create", segmentId, initial, onSegmentSaved }: CreateSegmentModalProps) {
  const [segmentName, setSegmentName] = useState("")
  const [filters, setFilters] = useState<FilterRow[]>([])
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewItems, setPreviewItems] = useState<SegmentsPreviewItem[]>([])
  const [previewCount, setPreviewCount] = useState<number>(0)
  const [eventsCatalog, setEventsCatalog] = useState<EventsCatalogItem[]>([])
  const [userPropsCatalog, setUserPropsCatalog] = useState<UserPropsCatalogPayload | null>(null)
  const [operatorsCatalog, setOperatorsCatalog] = useState<OperatorsCatalogPayload | null>(null)
  const [fieldCatalogValues, setFieldCatalogValues] = useState<Record<string, string[]>>({})
  const [loadingFieldCatalog, setLoadingFieldCatalog] = useState(false)
  const [dateValues, setDateValues] = useState<Record<string, Date | undefined>>({})
  const [timeValues, setTimeValues] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Load catalogs when modal opens
  useEffect(() => {
    let mounted = true
    if (!open) return
    setLoading(true)
    Promise.all([
      fetchEventsCatalog(),
      fetchUserPropsCatalog(),
      fetchOperatorsCatalog(),
    ])
      .then(([eventsRes, userPropsRes, opsRes]) => {
        if (!mounted) return
        setEventsCatalog(eventsRes.data.items || [])
        setUserPropsCatalog(userPropsRes.data)
        setOperatorsCatalog(opsRes.data)
      })
      .catch((err) => {
        toast({ title: "Failed to load catalogs", description: err instanceof Error ? err.message : String(err) })
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [open])

  // Load segment data when in edit mode
  useEffect(() => {
    if (!open || mode !== "edit" || !segmentId) return
    
    const loadSegmentData = async () => {
      try {
        setLoading(true)
        const response = await fetchSegmentById(segmentId)
        
        if (response.data && response.data.items && response.data.items.length > 0) {
          const segment = response.data.items[0] // Get the first (and should be only) item
          setSegmentName(segment.name || "")
          
          // Parse the filters JSON string
          if (segment.filters) {
            try {
              const filtersData = JSON.parse(segment.filters)
              const newFilters: FilterRow[] = []
              
              // Handle user criteria
              if (filtersData.criteria) {
                Object.entries(filtersData.criteria).forEach(([field, config]: [string, any]) => {
                  if (typeof config === 'object' && config.operator && config.value !== undefined) {
                    newFilters.push({
                      id: Date.now().toString() + Math.random(),
                      entity: "Users",
                      field,
                      fieldType: typeof config.value === 'number' ? 'number' : 
                                 typeof config.value === 'boolean' ? 'bool' : 'string',
                      operator: config.operator,
                      value: String(config.value)
                    })
                  }
                })
              }
              
              // Handle event criteria (if any)
              if (filtersData.anyOfEvents) {
                filtersData.anyOfEvents.forEach((eventObj: any) => {
                  if (eventObj.name && eventObj.name.operator === 'eq') {
                    const eventFilter: FilterRow = {
                      id: Date.now().toString() + Math.random(),
                      entity: "Events",
                      eventName: eventObj.name.value,
                      field: "",
                      fieldType: undefined,
                      operator: "eq",
                      value: "",
                      props: []
                    }
                    
                    // Add event properties
                    Object.entries(eventObj).forEach(([key, config]: [string, any]) => {
                      if (key !== 'name' && typeof config === 'object' && config.operator && config.value !== undefined) {
                        eventFilter.props!.push({
                          id: Date.now().toString() + Math.random(),
                          field: key,
                          fieldType: typeof config.value === 'number' ? 'number' : 
                                     typeof config.value === 'boolean' ? 'bool' : 'string',
                          operator: config.operator,
                          value: String(config.value)
                        })
                      }
                    })
                    
                    newFilters.push(eventFilter)
                  }
                })
              }
              
              setFilters(newFilters)
            } catch (parseError) {
              console.error('Failed to parse filters JSON:', parseError)
              toast({ title: "Warning", description: "Failed to parse segment filters. Starting with empty filters." })
            }
          }
        }
      } catch (err) {
        toast({ title: "Failed to load segment", description: err instanceof Error ? err.message : String(err) })
      } finally {
        setLoading(false)
      }
    }
    
    loadSegmentData()
  }, [open, mode, segmentId])

  const addFilter = () => {
    const newFilter = {
      id: Date.now().toString(),
      entity: "Events" as const,
      eventName: "",
      field: "",
      fieldType: undefined,
      operator: "eq",
      value: "",
    }
    setFilters([...filters, newFilter])
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id))
  }

  const updateFilter = (id: string, key: string, value: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [key]: value } : f))
  }

  // Function to fetch field catalog values
  const fetchFieldValues = async (fieldName: string) => {
    if (fieldCatalogValues[fieldName]) {
      return // Already cached
    }
    
    setLoadingFieldCatalog(true)
    try {
      const res = await fetchFieldCatalog(fieldName)
      setFieldCatalogValues(prev => ({
        ...prev,
        [fieldName]: res.data.values || []
      }))
    } catch (err) {
      console.error(`Failed to fetch values for field ${fieldName}:`, err)
      // Set empty array to prevent repeated failed requests
      setFieldCatalogValues(prev => ({
        ...prev,
        [fieldName]: []
      }))
    } finally {
      setLoadingFieldCatalog(false)
    }
  }

  // Function to determine input type for field
  const getFieldInputType = (fieldName: string, fieldType?: CatalogType) => {
    // Special fields that should use combobox (typable dropdown)
    const comboboxFields = ['gender', 'company_name', 'status']
    
    if (fieldName === 'login_date') {
      return 'date'
    }
    if (fieldName === 'event_time') {
      return 'time'
    }
    if (comboboxFields.includes(fieldName)) {
      return 'combobox'
    }
    if (fieldType === 'date') {
      return 'date'
    }
    if (fieldType === 'number') {
      return 'number'
    }
    if (fieldType === 'bool') {
      return 'boolean'
    }
    return 'dropdown' // Default to dropdown for other string fields
  }

  // Function to determine input type for event properties
  const getEventFieldInputType = (fieldName: string, fieldType?: CatalogType) => {
    // Special event fields that might need specific input types
    if (fieldName === 'event_time' || fieldName === 'timestamp') {
      return 'time'
    }
    if (fieldName === 'event_date' || fieldName === 'date') {
      return 'date'
    }
    if (fieldType === 'date') {
      return 'date'
    }
    if (fieldType === 'number') {
      return 'number'
    }
    if (fieldType === 'bool') {
      return 'boolean'
    }
    return 'text' // Default to text input for other types
  }

  const applicableOperators = (type?: CatalogType) => {
    if (!operatorsCatalog || !type) return ["eq"]
    return operatorsCatalog[type] ?? ["eq"]
  }

  const userFields = useMemo(() => {
    const base = Object.entries(userPropsCatalog?.base_schema ?? {})
    const props = Object.entries(userPropsCatalog?.properties_schema ?? {})
    return [
      ...base.map(([k, t]) => ({ key: k, type: t })),
      ...props.map(([k, t]) => ({ key: k, type: t })),
    ] as Array<{ key: string; type: CatalogType }>
  }, [userPropsCatalog])

  const eventNames = useMemo(() => eventsCatalog.map(e => e.event_name), [eventsCatalog])

  const getEventFields = (eventName?: string) => {
    const item = eventsCatalog.find(e => e.event_name === eventName)
    if (!item) return [] as Array<{ key: string; type: CatalogType }>
    return Object.entries(item.properties_schema || {}).map(([k, t]) => ({ key: k, type: t as CatalogType }))
  }

  const getEventSamples = (eventName?: string, field?: string) => {
    const item = eventsCatalog.find(e => e.event_name === eventName)
    if (!item || !field) return [] as Array<string>
    const samples = item.samples?.[field]
    if (!Array.isArray(samples)) return []
    return samples.map(String)
  }

  const prettify = (key: string) =>
    key
      .replace(/\./g, " ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase())

  const buildDefinition = (): SegmentDefinition => {
    const anyOfEvents = filters
      .filter(f => f.entity === "Events" && f.eventName)
      .map(f => {
        const eventObj: Record<string, { operator: string; value: unknown }> = {}
        
        // Add event name with operator
        eventObj.name = { operator: "eq", value: f.eventName! }
        
        // Build props from multi-props if present, else from single field/value
        if (Array.isArray(f.props) && f.props.length > 0) {
          f.props.forEach(p => {
            if (p.field && p.value !== "") {
              eventObj[p.field] = { 
                operator: p.operator, 
                value: coerceValue(p.value, p.fieldType) 
              }
            }
          })
        } else if (f.field && f.value !== "") {
          eventObj[f.field] = { 
            operator: f.operator, 
            value: coerceValue(f.value, f.fieldType) 
          }
        }
        
        return eventObj
      })

    const userPropFilters = filters.filter(f => f.entity === "Users" && f.field && f.value !== "")
    const criteriaProps = userPropFilters.reduce<Record<string, { operator: string; value: unknown }>>((acc, f) => {
      acc[f.field] = { 
        operator: f.operator, 
        value: coerceValue(f.value, f.fieldType) 
      }
      return acc
    }, {})

    const definition: SegmentDefinition = {}
    // Always include criteria field, even if empty
    definition.criteria = { ...criteriaProps }
    if (anyOfEvents.length > 0) definition.anyOfEvents = anyOfEvents
    return definition
  }

  const coerceValue = (val: string, type?: CatalogType) => {
    if (!type) return val
    switch (type) {
      case "number":
        return Number(val)
      case "bool":
        return val === "true" || val === "1"
      case "date":
        // For date fields, ensure proper MySQL datetime format
        // If the value is already in yyyy-MM-dd format, keep it
        // If it's a time value (HH:mm), combine with current date
        if (val.match(/^\d{2}:\d{2}$/)) {
          // Time value like "14:30" - combine with current date
          const today = new Date()
          const [hours, minutes] = val.split(':')
          today.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          return format(today, "yyyy-MM-dd HH:mm:ss")
        } else if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Date value like "2025-01-20" - convert to datetime
          return val + " 00:00:00"
        } else if (val.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
          // Already in correct format
          return val
        }
        // Fallback: return as-is
        return val
      default:
        return val
    }
  }

  // no event time range in filters per spec

  const handlePreview = async () => {
    setPreviewLoading(true)
    try {
      const definition = buildDefinition()
      console.log("Preview payload:", JSON.stringify({ definition }, null, 2))
      const res = await previewSegment({ definition, page: 1, limit: 20, sortBy: "event_time", sortDir: "desc" })
      setPreviewCount(res.data.total || res.data.items?.length || 0)
    } catch (err) {
      toast({ title: "Preview failed", description: err instanceof Error ? err.message : String(err) })
    } finally {
      setPreviewLoading(false)
    }
  }

  const [downloadFormat, setDownloadFormat] = useState<string>("csv")

  const handleDownload = async () => {
    try {
      const definition = buildDefinition()
      console.log("Download payload:", JSON.stringify({ definition }, null, 2))
      
      // Call the export API using the API function (which handles base URL)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/app/segments/preview/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ definition }),
      })

      console.log("Response status:", response.status)
      console.log("Response status text:", response.statusText)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))
      console.log("Response URL:", response.url)

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`)
      }

      // Check content type first
      const contentType = response.headers.get('content-type')
      console.log("Content-Type:", contentType)
      
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, get the text to see what we're actually receiving
        const textResponse = await response.text()
        console.error("Expected JSON but received:", textResponse.substring(0, 500))
        console.error("Full response length:", textResponse.length)
        throw new Error(`Expected JSON response but received ${contentType || 'unknown content type'}`)
      }

      // Parse the JSON response to get base64 data
      const responseData = await response.json()
      
      if (!responseData.status || !responseData.data) {
        throw new Error('Invalid response format')
      }

      // Decode base64 data
      const decodedData = atob(responseData.data)
      const jsonData = JSON.parse(decodedData)
      
      console.log("Decoded data:", jsonData)
      
             // Convert data to selected format
       let fileContent: string | ArrayBuffer
       let fileName: string
       let mimeType: string
      
             switch (downloadFormat) {
         case "csv":
           fileContent = convertToCSV(jsonData.items || [])
           fileName = `segment_preview_${Date.now()}.csv`
           mimeType = 'text/csv;charset=utf-8;'
           break
         case "json":
           fileContent = JSON.stringify(jsonData, null, 2)
           fileName = `segment_preview_${Date.now()}.json`
           mimeType = 'application/json'
           break
         case "txt":
           fileContent = convertToText(jsonData.items || [])
           fileName = `segment_preview_${Date.now()}.txt`
           mimeType = 'text/plain;charset=utf-8;'
           break
         case "xlsx":
           // For Excel, we'll create a proper XLSX file
           fileContent = convertToXLSX(jsonData.items || [])
           fileName = `segment_preview_${Date.now()}.xlsx`
           mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
           break
         case "pdf":
           // For PDF, use improved PDF generation via Excel conversion
           fileContent = convertToPDF(jsonData.items || [])
           fileName = `segment_preview_${Date.now()}.pdf`
           mimeType = 'application/pdf'
           break

         case "html":
           // Separate HTML option
           fileContent = convertToHTML(jsonData.items || [])
           fileName = `segment_preview_${Date.now()}.html`
           mimeType = 'text/html;charset=utf-8;'
           break
         default:
           fileContent = convertToCSV(jsonData.items || [])
           fileName = `segment_preview_${Date.now()}.csv`
           mimeType = 'text/csv;charset=utf-8;'
       }
      
      // Create a blob from the content
      const blob = new Blob([fileContent], { type: mimeType })
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({ title: "Download Started", description: `${downloadFormat.toUpperCase()} file download has begun.` })
    } catch (err) {
      toast({ title: "Download failed", description: err instanceof Error ? err.message : String(err) })
    }
  }

  // Helper function to convert data to CSV
  const convertToCSV = (items: any[]): string => {
    if (!items || items.length === 0) return "No data available"
    
    const headers = Object.keys(items[0]).filter(key => key !== 'id' && key !== 'properties')
    const csvRows = [headers.join(',')]
    
    items.forEach(item => {
      const row = headers.map(header => {
        const value = item[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`
        return String(value)
      })
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }

  // Helper function to convert data to plain text
  const convertToText = (items: any[]): string => {
    if (!items || items.length === 0) return "No data available"
    
    let text = "Segment Preview Data\n"
    text += "=".repeat(50) + "\n\n"
    
    items.forEach((item, index) => {
      text += `Record ${index + 1}:\n`
      text += "-".repeat(30) + "\n"
      
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'properties') {
          text += `${key}: ${value || 'N/A'}\n`
        }
      })
      text += "\n"
    })
    
    return text
  }

     // Helper function to convert data to XLSX (proper Excel format)
   const convertToXLSX = (items: any[]): ArrayBuffer => {
     if (!items || !Array.isArray(items) || items.length === 0) {
       return new ArrayBuffer(0)
     }
     
     // Ensure items[0] exists and has properties
     if (!items[0] || typeof items[0] !== 'object') {
       return new ArrayBuffer(0)
     }
     
     const headers = Object.keys(items[0]).filter(key => key !== 'id' && key !== 'properties')
     if (headers.length === 0) {
       return new ArrayBuffer(0)
     }
     
     // Create worksheet data
     const wsData = [
       headers.map(header => header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
       ...items.map(item => 
         item && typeof item === 'object' ? 
         headers.map(header => {
           const value = item[header]
           if (value === null || value === undefined) return ''
           return String(value)
         }) : 
         headers.map(() => '')
       )
     ]
     
     // Create workbook and worksheet
     const wb = XLSX.utils.book_new()
     const ws = XLSX.utils.aoa_to_sheet(wsData)
     
     // Add worksheet to workbook
     XLSX.utils.book_append_sheet(wb, ws, 'Segment Data')
     
     // Generate Excel file as ArrayBuffer
     const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
     return excelBuffer
   }

   // Helper function to convert data to PDF via Excel
   const convertToPDF = (items: any[]): ArrayBuffer => {
     try {
       // Validate items array
       if (!items || !Array.isArray(items) || items.length === 0) {
         return new ArrayBuffer(0)
       }
       
       // Ensure items[0] exists and has properties
       if (!items[0] || typeof items[0] !== 'object') {
         return new ArrayBuffer(0)
       }
       
       // Get headers from first item
       const headers = Object.keys(items[0]).filter(key => key !== 'id' && key !== 'properties')
       
       if (headers.length === 0) {
         return new ArrayBuffer(0)
       }
       
       // Create header row
       const headerRow = headers.map(header => header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
       
       // Create data rows
       const dataRows = items.map(item => 
         item && typeof item === 'object' ? 
         headers.map(header => {
           const value = item[header]
           if (value === null || value === undefined) return ''
           return String(value)
         }) : 
         headers.map(() => '')
       )
       
       // Now convert to PDF using jsPDF
       const doc = new jsPDF()
       
       // Add title
       doc.setFontSize(16)
       doc.text(`Segment Preview: ${segmentName}`, 14, 22)
       
       // Add table using autoTable plugin
       (doc as any).autoTable({
         head: [headerRow],
         body: dataRows,
         startY: 30,
         styles: {
           fontSize: 10,
           cellPadding: 3,
         },
         headStyles: {
           fillColor: [66, 139, 202],
           textColor: 255,
           fontStyle: 'bold',
         },
         alternateRowStyles: {
           fillColor: [245, 245, 245],
         },
       })
       
       // Convert PDF to ArrayBuffer
       const pdfBytes = (doc as any).output('arraybuffer')
       return pdfBytes
     } catch (error) {
       return new ArrayBuffer(0)
     }
   }

   // Helper function to convert data to HTML
   const convertToHTML = (items: any[]): string => {
     if (!items || items.length === 0) return "<html><body><p>No data available</p></body></html>"
     
     const headers = Object.keys(items[0]).filter(key => key !== 'id' && key !== 'properties')
     
     let html = `
       <html>
         <head>
           <title>Segment Preview Data</title>
           <style>
             body { font-family: Arial, sans-serif; margin: 20px; }
             table { border-collapse: collapse; width: 100%; margin-top: 20px; }
             th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
             th { background-color: #f2f2f2; font-weight: bold; }
             tr:nth-child(even) { background-color: #f9f9f9; }
             h1 { color: #333; }
           </style>
         </head>
         <body>
           <h1>Segment Preview Data</h1>
           <table>
             <thead>
               <tr>
                 ${headers.map(header => `<th>${header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>`).join('')}
               </tr>
             </thead>
             <tbody>
     `
     
     items.forEach(item => {
       html += '<tr>'
       headers.forEach(header => {
         const value = item[header] || 'N/A'
         html += `<td>${value}</td>`
       })
       html += '</tr>'
     })
     
     html += `
             </tbody>
           </table>
         </body>
       </html>
     `
     
     return html
   }

    const handleSave = async () => {
    try {
      const definition = buildDefinition()
      
      if (mode === "edit" && segmentId) {
        // Update existing segment
        await updateSegment(segmentId, {
          name: segmentName,
          description: "",
          definition
        })
        toast({ title: "Segment Updated Successfully", description: `${segmentName} has been updated.` })
      } else {
        // Create new segment
        await createSegment({
          name: segmentName,
          description: "",
          status: "DRAFT",
          is_active: 1,
          definition,
        })
        toast({ title: "Segment Created Successfully", description: `${segmentName} has been saved.` })
      }
      
      onOpenChange(false)
      setSegmentName("")
      setFilters([])
      setPreviewItems([])
      setPreviewCount(0)
      
      // Call refresh callback to update the segments list
      if (onSegmentSaved) {
        onSegmentSaved()
      }
    } catch (err) {
      toast({ title: mode === "edit" ? "Update failed" : "Create failed", description: err instanceof Error ? err.message : String(err) })
    }
  }

  const hasAnyDefinition = () => {
    const hasUserCriteria = filters.some(f => f.entity === "Users" && f.field && f.value !== "")
    const hasEventCriteria = filters.some(f => f.entity === "Events" && !!f.eventName)
    return hasUserCriteria || hasEventCriteria
  }

  const estimatedCount = Math.floor(Math.random() * 5000) + 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Segment" : "Create Segment"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="segmentName">Segment Name</Label>
            <Input
              id="segmentName"
              placeholder="Enter segment name"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {/* Removed User ID field as it's not required */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Button onClick={addFilter} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Filter
              </Button>
            </div>

            {filters.map((filter) => (
              <Card key={filter.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Select value={filter.entity} onValueChange={(value) => {
                      if (value === "Users") {
                        setFilters(filters.map(f => f.id === filter.id ? { ...f, entity: "Users", eventName: undefined, field: "", fieldType: undefined } : f))
                      } else {
                        setFilters(filters.map(f => f.id === filter.id ? { ...f, entity: "Events", eventName: "", field: "", fieldType: undefined } : f))
                      }
                    }}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Users">Users</SelectItem>
                        <SelectItem value="Events">Events</SelectItem>
                      </SelectContent>
                    </Select>
                    {filter.entity === "Events" && (
                      <>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-48 justify-between">
                              {filter.eventName || "Select event"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-64">
                            <Command>
                              <CommandInput placeholder="Search events..." />
                              <CommandEmpty>No event found.</CommandEmpty>
                              <CommandGroup>
                                {eventNames.map((name) => (
                                  <CommandItem key={name} value={name} onSelect={() => updateFilter(filter.id, "eventName", name)}>
                                    {name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <div className="flex flex-col gap-2 flex-1">
                          {(filter.props ?? []).map((p) => (
                            <div key={p.id} className="flex items-center gap-2">
                              <Select value={p.field} onValueChange={(value) => {
                                const fields = getEventFields(filter.eventName)
                                const ft = fields.find(f => f.key === value)?.type
                                setFilters(filters.map(f => f.id === filter.id ? {
                                  ...f,
                                  props: (f.props ?? []).map(x => x.id === p.id ? { ...x, field: value, fieldType: ft } : x)
                                } : f))
                              }}>
                                <SelectTrigger className="w-56">
                                  <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                                  {getEventFields(filter.eventName).map((f) => (
                                    <SelectItem key={f.key} value={f.key}>{prettify(f.key)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                              <Select value={p.operator} onValueChange={(value) => {
                                setFilters(filters.map(f => f.id === filter.id ? {
                                  ...f,
                                  props: (f.props ?? []).map(x => x.id === p.id ? { ...x, operator: value } : x)
                                } : f))
                              }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                                  {applicableOperators(p.fieldType).map((op) => (
                                    <SelectItem key={op} value={op}>{op}</SelectItem>
                                  ))}
                      </SelectContent>
                    </Select>
                              {/* Value control: hide for exists; show compact. If samples available and op eq/in, use a Select. */}
                              {p.operator !== "exists" && (
                                (() => {
                                  const sampleValues = getEventSamples(filter.eventName, p.field)
                                  if ((p.operator === "eq" || p.operator === "in") && sampleValues.length > 0) {
                                    return (
                                      <Select value={p.value} onValueChange={(val) => {
                                        setFilters(filters.map(f => f.id === filter.id ? {
                                          ...f,
                                          props: (f.props ?? []).map(x => x.id === p.id ? { ...x, value: val } : x)
                                        } : f))
                                      }}>
                                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                                          {sampleValues.map((sv) => (
                                            <SelectItem key={sv} value={sv}>{sv}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )
                                  }
                                  // Enhanced input handling for different field types
                                  return (() => {
                                    const inputType = getEventFieldInputType(p.field, p.fieldType)
                                    
                                    // Date picker for date fields
                                    if (inputType === 'date') {
                                      return (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              className="w-40 justify-start text-left font-normal"
                                            >
                                              <CalendarIcon className="mr-2 h-4 w-4" />
                                              {p.value ? format(new Date(p.value), "PPP") : "Pick a date"}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0">
                                            <Calendar
                                              mode="single"
                                              selected={p.value ? new Date(p.value) : undefined}
                                              onSelect={(date) => {
                                                if (date) {
                                                  const formattedDate = format(date, "yyyy-MM-dd")
                                                  setFilters(filters.map(f => f.id === filter.id ? {
                                                    ...f,
                                                    props: (f.props ?? []).map(x => x.id === p.id ? { ...x, value: formattedDate } : x)
                                                  } : f))
                                                }
                                              }}
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      )
                                    }
                                    
                                    // Time picker for time fields
                                    if (inputType === 'time') {
                                      return (
                                        <Input
                                          type="time"
                                          value={p.value || ""}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setFilters(filters.map(f => f.id === filter.id ? {
                                              ...f,
                                              props: (f.props ?? []).map(x => x.id === p.id ? { ...x, value: val } : x)
                                            } : f))
                                          }}
                                          className="w-40"
                                        />
                                      )
                                    }
                                    
                                    // Number input for number fields
                                    if (inputType === 'number') {
                                      return (
                                        <Input
                                          type="number"
                                          placeholder="Enter number"
                                          value={p.value}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            setFilters(filters.map(f => f.id === filter.id ? {
                                              ...f,
                                              props: (f.props ?? []).map(x => x.id === p.id ? { ...x, value: val } : x)
                                            } : f))
                                          }}
                                          className="w-40"
                                        />
                                      )
                                    }
                                    
                                    // Boolean select for bool fields
                                    if (inputType === 'boolean') {
                                      return (
                                        <Select
                                          value={p.value}
                                          onValueChange={(value) => {
                                            setFilters(filters.map(f => f.id === filter.id ? {
                                              ...f,
                                              props: (f.props ?? []).map(x => x.id === p.id ? { ...x, value } : x)
                                            } : f))
                                          }}
                                        >
                                          <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Select value" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="true">True</SelectItem>
                                            <SelectItem value="false">False</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )
                                    }
                                    
                                    // Default input for other types
                                    return (
                                      <Input
                                        placeholder={p.operator === "in" ? "Comma-separated" : "Enter value"}
                                        value={p.value}
                                        onChange={(e) => {
                                          const val = e.target.value
                                          setFilters(filters.map(f => f.id === filter.id ? {
                                            ...f,
                                            props: (f.props ?? []).map(x => x.id === p.id ? { ...x, value: val } : x)
                                          } : f))
                                        }}
                                        className="w-40"
                                      />
                                    )
                                  })()
                                })()
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setFilters(filters.map(f => f.id === filter.id ? {
                                  ...f,
                                  props: (f.props ?? []).filter(x => x.id !== p.id)
                                } : f))}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFilters(filters.map(f => f.id === filter.id ? {
                                ...f,
                                props: [
                                  ...(f.props ?? []),
                                  { id: `${Date.now()}-${Math.random()}`, field: "", fieldType: undefined, operator: "eq", value: "" },
                                ]
                              } : f))}
                            >
                              Add property
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                    {filter.entity === "Users" && (
                      <Select value={filter.field} onValueChange={(value) => {
                        const ft = userFields.find(u => u.key === value)?.type
                        setFilters(filters.map(f => f.id === filter.id ? { ...f, field: value, fieldType: ft } : f))
                        // Fetch field catalog values when field is selected
                        if (value) {
                          fetchFieldValues(value)
                        }
                        // Initialize date/time values for specific fields
                        if (value === 'login_date') {
                          setDateValues(prev => ({ ...prev, [filter.id]: undefined }))
                        }
                        if (value === 'event_time') {
                          setTimeValues(prev => ({ ...prev, [filter.id]: "" }))
                        }
                      }}>
                        <SelectTrigger className="w-60">
                          <SelectValue placeholder="Select user property" />
                        </SelectTrigger>
                        <SelectContent>
                          {userFields.map((f) => (
                            <SelectItem key={f.key} value={f.key}>{prettify(f.key)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {filter.entity === "Users" && filter.field && (
                      <>
                        <Select value={filter.operator} onValueChange={(value) => updateFilter(filter.id, "operator", value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {applicableOperators(filter.fieldType).map((op) => (
                              <SelectItem key={op} value={op}>{op}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                        {filter.operator !== "exists" && (
                          <>
                            {(() => {
                              const inputType = getFieldInputType(filter.field, filter.fieldType)
                              
                              // Date picker for login_date and date fields
                              if (inputType === 'date') {
                                return (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="w-40 justify-start text-left font-normal"
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateValues[filter.id] ? format(dateValues[filter.id]!, "PPP") : "Pick a date"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={dateValues[filter.id]}
                                        onSelect={(date) => {
                                          setDateValues(prev => ({ ...prev, [filter.id]: date }))
                                          if (date) {
                                            updateFilter(filter.id, "value", format(date, "yyyy-MM-dd"))
                                          }
                                        }}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                )
                              }
                              
                              // Time picker for event_time
                              if (inputType === 'time') {
                                return (
                                  <Input
                                    type="time"
                                    value={timeValues[filter.id] || ""}
                                    onChange={(e) => {
                                      setTimeValues(prev => ({ ...prev, [filter.id]: e.target.value }))
                                      updateFilter(filter.id, "value", e.target.value)
                                    }}
                                    className="w-40"
                                  />
                                )
                              }
                              
                              // Number input for number fields
                              if (inputType === 'number') {
                                return (
                                  <Input
                                    type="number"
                                    placeholder="Enter number"
                                    value={filter.value}
                                    onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                                    className="w-40"
                                  />
                                )
                              }
                              
                              // Boolean select for bool fields
                              if (inputType === 'boolean') {
                                return (
                                  <Select
                                    value={filter.value}
                                    onValueChange={(value) => updateFilter(filter.id, "value", value)}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue placeholder="Select value" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="true">True</SelectItem>
                                      <SelectItem value="false">False</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )
                              }
                              
                              // Combobox for gender, company_name, status
                              if (inputType === 'combobox') {
                                return (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-40 justify-between"
                                      >
                                        {filter.value || "Select value..."}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-40 p-0">
                                      <Command>
                                        <CommandInput 
                                          placeholder="Search or type..." 
                                          value={filter.value}
                                          onValueChange={(value) => updateFilter(filter.id, "value", value)}
                                        />
                                        <CommandEmpty>No value found.</CommandEmpty>
                                        <CommandGroup>
                                          {fieldCatalogValues[filter.field]?.map((value) => (
                                            <CommandItem
                                              key={value}
                                              value={value}
                                              onSelect={(currentValue) => {
                                                updateFilter(filter.id, "value", currentValue)
                                              }}
                                            >
                                              {value}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                )
                              }
                              
                              // Default dropdown for other fields
                              if (fieldCatalogValues[filter.field] && fieldCatalogValues[filter.field].length > 0) {
                                return (
                                  <Select
                                    value={filter.value}
                                    onValueChange={(value) => updateFilter(filter.id, "value", value)}
                                    disabled={loadingFieldCatalog}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue placeholder={loadingFieldCatalog ? "Loading..." : "Select value"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {fieldCatalogValues[filter.field]?.map((value) => (
                                        <SelectItem key={value} value={value}>{value}</SelectItem>
                                      ))}
                                      {fieldCatalogValues[filter.field]?.length === 0 && !loadingFieldCatalog && (
                                        <SelectItem value="" disabled>No values available</SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                )
                              }
                              
                              // Fallback to input
                              return (
                                <Input
                                  placeholder={filter.operator === "in" ? "Comma-separated" : "Enter value"}
                                  value={filter.value}
                                  onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                                  className="w-40"
                                />
                              )
                            })()}
                          </>
                        )}
                      </>
                    )}

                    <Button variant="outline" size="icon" onClick={() => removeFilter(filter.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No filters added yet. Click "Add Filter" to start building your segment.
              </div>
            )}
          </div>

                     <Card>
             <CardHeader>
               <CardTitle className="flex items-center justify-between">
                 Live Preview
                 <Badge variant="outline">
                   {previewLoading ? "Loading…" : `${previewCount} users`}
                 </Badge>
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-center py-8">
                 <p className="text-2xl font-bold text-primary">{previewCount}</p>
                 <p className="text-muted-foreground">Total users matching criteria</p>
               </div>
                               <div className="mt-4 flex gap-2 justify-center items-center">
                                     <Button variant="outline" onClick={handlePreview} disabled={previewLoading || !hasAnyDefinition()}>
                     Preview
                   </Button>
                  
                  <div className="flex items-center gap-2">
                                         <Select value={downloadFormat} onValueChange={setDownloadFormat}>
                       <SelectTrigger className="w-32">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="csv">CSV</SelectItem>
                         <SelectItem value="json">JSON</SelectItem>
                         <SelectItem value="txt">Text</SelectItem>
                         <SelectItem value="xlsx">Excel</SelectItem>
                         <SelectItem value="html">HTML</SelectItem>
                         <SelectItem value="pdf">PDF</SelectItem>
        
                       </SelectContent>
                     </Select>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleDownload} 
                      disabled={previewLoading || previewCount === 0 || !hasAnyDefinition()}
                    >
                      Download {downloadFormat.toUpperCase()}
                    </Button>
                  </div>
                </div>
             </CardContent>
           </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!segmentName.trim() || !hasAnyDefinition()}>
            {mode === "edit" ? "Update Segment" : "Save Segment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}