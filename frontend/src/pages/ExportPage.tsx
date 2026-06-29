import { useState } from 'react'
import axios from 'axios'
import type { ParsedResume } from '../utils/types'
import { Loader, Download, FileText, CheckCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ExportPageProps {
  parsedResume: ParsedResume
}

type ExportFormat = 'pdf' | 'docx' | 'markdown'

export default function ExportPage({ parsedResume }: ExportPageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await axios.post(`${API_URL}/api/export`, {
        resume: parsedResume,
        format: format
      }, {
        responseType: 'blob' // Essential for binary downloads
      })

      // Get filename from response headers or default
      const ext = format === 'pdf' ? '.pdf' : (format === 'docx' ? '.docx' : '.md')
      const filename = `${parsedResume.name.replace(/\s+/g, '_')}_resume${ext}`

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: (response.headers['content-type'] as string) || undefined })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setSuccess(`Successfully exported resume as ${format.toUpperCase()}!`)
    } catch (err: any) {
      console.error(err)
      setError('Failed to generate export file. Please check if backend services are operational.')
    } finally {
      setLoading(false)
    }
  }

  const formats = [
    {
      key: 'pdf' as ExportFormat,
      title: 'PDF FORMAT',
      desc: 'Highly styled, print-ready document featuring Helvetica typography, section rules, and clean margins.',
      badge: 'Recommended for Applications'
    },
    {
      key: 'docx' as ExportFormat,
      title: 'WORD FORMAT',
      desc: 'Standard Microsoft Word document suitable for manual editing or uploading to traditional legacy ATS portals.',
      badge: 'Fully Editable'
    },
    {
      key: 'markdown' as ExportFormat,
      title: 'MARKDOWN FORMAT',
      desc: 'Lightweight plain-text representation of your resume details, perfect for copying into website builders.',
      badge: 'Plain Text'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">EXPORT RESUME</h2>
        <p className="text-muted mt-2">Export your parsed (or rewritten) resume details into print-ready PDF, Word, or Markdown formats.</p>
      </div>

      {/* Grid of export options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {formats.map((fmt) => (
          <div 
            key={fmt.key}
            className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between hover:border-accent/30 transition-all space-y-6"
          >
            <div className="space-y-3">
              <span className="text-[10px] bg-accent/10 border border-accent/20 text-accent font-mono font-bold px-2 py-0.5 rounded">
                {fmt.badge}
              </span>
              <h3 className="font-mono font-bold text-lg text-text mt-2">{fmt.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{fmt.desc}</p>
            </div>

            <button
              onClick={() => handleExport(fmt.key)}
              disabled={loading}
              className="w-full bg-accent text-background py-2.5 rounded font-mono font-bold hover:opacity-90 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? (
                <Loader className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>DOWNLOAD {fmt.key.toUpperCase()}</span>
            </button>
          </div>
        ))}
      </div>

      {success && (
        <div className="p-4 bg-hover/30 border border-accent/20 text-accent rounded text-sm font-mono flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-800/40 text-red-400 rounded text-sm font-mono flex items-center gap-2 animate-fadeIn">
          <FileText className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
