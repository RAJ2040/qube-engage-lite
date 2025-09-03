import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Download } from "lucide-react"

// For proper Excel file generation
import * as XLSX from 'xlsx'
// For proper PDF generation
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface ExportSegmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  segmentReferenceId: string
  segmentName: string
  segmentFilters: string
}

export function ExportSegmentModal({ open, onOpenChange, segmentReferenceId, segmentName, segmentFilters }: ExportSegmentModalProps) {
  const [downloadFormat, setDownloadFormat] = useState<string>("csv")
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    try {
      setExporting(true)
      
      // Parse the segment filters to get the definition
      let segmentDefinition
      try {
        segmentDefinition = JSON.parse(segmentFilters)
      } catch (error) {
        throw new Error('Invalid segment filters format')
      }

      // Call the export API with the segment definition
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/app/segments/preview/export`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          definition: segmentDefinition
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Export failed: ${response.status} ${response.statusText}`)
      }

      // Check content type first
      const contentType = response.headers.get('content-type')
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        throw new Error(`Expected JSON response but received ${contentType || 'unknown content type'}`)
      }

      // Parse the JSON response to get base64 data
      const responseData = await response.json()
      
      if (!responseData.status || !responseData.data) {
        throw new Error('Invalid response format - missing status or data')
      }

      // Decode base64 data
      const decodedData = atob(responseData.data)
      
      let jsonData
      try {
        jsonData = JSON.parse(decodedData)
      } catch (parseError) {
        throw new Error('Failed to parse decoded JSON data')
      }
      
      // Handle different possible data structures
      let items = []
      try {
        if (Array.isArray(jsonData)) {
          items = jsonData
        } else if (jsonData && Array.isArray(jsonData.items)) {
          items = jsonData.items
        } else if (jsonData && Array.isArray(jsonData.data)) {
          items = jsonData.data
        } else if (jsonData && Array.isArray(jsonData.users)) {
          items = jsonData.users
        } else {
          // Fallback: try to find any array in the response
          const arrayKeys = Object.keys(jsonData).filter(key => Array.isArray(jsonData[key]))
          if (arrayKeys.length > 0) {
            items = jsonData[arrayKeys[0]]
          } else {
            throw new Error('No array data found in the response')
          }
        }
        
        if (!Array.isArray(items)) {
          throw new Error('Items is not an array - cannot proceed with export')
        }
        
        if (items.length === 0) {
          toast({ title: "No Data", description: "No data found to export", variant: "destructive" })
          return
        }
        
      } catch (dataError) {
        throw new Error(`Failed to process data structure: ${dataError}`)
      }
      
      // Convert data to selected format
      let fileContent: string | ArrayBuffer
      let fileName: string
      let mimeType: string
     
      try {
        switch (downloadFormat) {
          case "csv":
            fileContent = convertToCSV(items)
            fileName = `${segmentName}_export_${Date.now()}.csv`
            mimeType = 'text/csv;charset=utf-8;'
            break
          case "json":
            fileContent = JSON.stringify(jsonData, null, 2)
            fileName = `${segmentName}_export_${Date.now()}.json`
            mimeType = 'application/json'
            break
          case "txt":
            fileContent = convertToText(items)
            fileName = `${segmentName}_export_${Date.now()}.txt`
            mimeType = 'text/plain;charset=utf-8;'
            break
          case "xlsx":
            fileContent = convertToXLSX(items)
            fileName = `${segmentName}_export_${Date.now()}.xlsx`
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            break
          case "pdf":
            fileContent = convertToPDF(items)
            fileName = `${segmentName}_export_${Date.now()}.pdf`
            mimeType = 'application/pdf'
            break
          case "html":
            fileContent = convertToHTML(items)
            fileName = `${segmentName}_export_${Date.now()}.html`
            mimeType = 'text/html;charset=utf-8;'
            break
          default:
            fileContent = convertToCSV(items)
            fileName = `${segmentName}_export_${Date.now()}.csv`
            mimeType = 'text/csv;charset=utf-8;'
        }
      } catch (conversionError) {
        throw new Error(`Failed to convert data to ${downloadFormat}: ${conversionError}`)
      }
     
      // Create a blob from the content
      try {
        // Handle different content types properly
        let blob
        if (fileContent instanceof ArrayBuffer) {
          // For ArrayBuffer (PDF, Excel), convert to Uint8Array
          blob = new Blob([new Uint8Array(fileContent)], { type: mimeType })
        } else {
          // For string content (CSV, JSON, Text, HTML)
          blob = new Blob([fileContent], { type: mimeType })
        }
        
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
        
        toast({ title: "Export Started", description: `${downloadFormat.toUpperCase()} file download has begun.` })
        onOpenChange(false)
      } catch (blobError) {
        throw new Error(`Failed to create file: ${blobError}`)
      }
    } catch (err) {
      toast({ title: "Export failed", description: err instanceof Error ? err.message : String(err), variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }

  // Helper function to convert data to CSV
  const convertToCSV = (items: any[]): string => {
    if (!items || !Array.isArray(items) || items.length === 0) return "No data available"
    
    // Ensure items[0] exists and has properties
    if (!items[0] || typeof items[0] !== 'object') {
      return "Invalid data format"
    }
    
    const headers = Object.keys(items[0]).filter(key => key !== 'id' && key !== 'properties')
    if (headers.length === 0) return "No valid columns found"
    
    const csvRows = [headers.join(',')]
    
    items.forEach(item => {
      if (item && typeof item === 'object') {
        const row = headers.map(header => {
          const value = item[header]
          if (value === null || value === undefined) return ''
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`
          return String(value)
        })
        csvRows.push(row.join(','))
      }
    })
    
    return csvRows.join('\n')
  }

  // Helper function to convert data to plain text
  const convertToText = (items: any[]): string => {
    if (!items || !Array.isArray(items) || items.length === 0) return "No data available"
    
    let text = `Segment Export: ${segmentName}\n`
    text += "=".repeat(50) + "\n\n"
    
    items.forEach((item, index) => {
      if (item && typeof item === 'object') {
        text += `Record ${index + 1}:\n`
        text += "-".repeat(30) + "\n"
        
        Object.entries(item).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'properties') {
            text += `${key}: ${value || 'N/A'}\n`
          }
        })
        text += "\n"
      }
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
      doc.text(`Segment Export: ${segmentName}`, 14, 22)
      
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
    if (!items || !Array.isArray(items) || items.length === 0) return "<html><body><p>No data available</p></body></html>"
    
    // Ensure items[0] exists and has properties
    if (!items[0] || typeof items[0] !== 'object') {
      return "<html><body><p>Invalid data format</p></body></html>"
    }
    
    const headers = Object.keys(items[0]).filter(key => key !== 'id' && key !== 'properties')
    if (headers.length === 0) {
      return "<html><body><p>No valid columns found</p></body></html>"
    }
    
    let html = `
      <html>
        <head>
          <title>Segment Export: ${segmentName}</title>
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
          <h1>Segment Export: ${segmentName}</h1>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
    `
    
    items.forEach(item => {
      if (item && typeof item === 'object') {
        html += '<tr>'
        headers.forEach(header => {
          const value = item[header] || 'N/A'
          html += `<td>${value}</td>`
        })
        html += '</tr>'
      }
    })
    
    html += `
            </tbody>
          </table>
        </body>
      </html>
    `
    
    return html
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Segment: {segmentName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={downloadFormat} onValueChange={setDownloadFormat}>
              <SelectTrigger>
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
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={exporting}
              className="bg-primary hover:bg-primary/90"
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {downloadFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
