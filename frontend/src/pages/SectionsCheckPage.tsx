import { useEffect, useState } from 'react'
import axios from 'axios'
import type { ParsedResume, SectionAuditItem } from '../utils/types'
import { Loader, AlertOctagon, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface SectionsCheckPageProps {
  parsedResume: ParsedResume
}

export default function SectionsCheckPage({ parsedResume }: SectionsCheckPageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [auditItems, setAuditItems] = useState<SectionAuditItem[]>([])

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.post<SectionAuditItem[]>(`${API_URL}/api/sections`, parsedResume)
        setAuditItems(res.data)
      } catch (err: any) {
        console.error(err)
        setError(err.response?.data?.detail || 'Failed to check resume sections.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAudit()
  }, [parsedResume])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader className="h-10 w-10 text-accent animate-spin" />
        <p className="font-mono text-sm tracking-wider text-muted">AUDITING RESUME STRUCTURE AND CONTENT INTEGRITY...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 border border-red-800/40 bg-red-950/20 text-red-400 rounded flex items-center gap-3">
        <AlertOctagon className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  const passedCount = auditItems.filter(item => item.status).length
  const totalCount = auditItems.length
  const percentHealth = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0

  const getSeverityBadge = (severity: string) => {
    if (severity === 'high') return 'bg-red-950/25 border-red-900/40 text-red-400'
    if (severity === 'medium') return 'bg-yellow-950/25 border-yellow-900/40 text-yellow-400'
    return 'bg-neutral-800 border-neutral-700 text-neutral-400'
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">SECTIONS INTEGRITY CHECK</h2>
        <p className="text-muted mt-2">Audit your resume for missing structural elements, keyword formatting, action verb starters, and quantified metrics.</p>
      </div>

      {/* Compliance Overview Card */}
      {auditItems.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold font-mono">Resume Health: {percentHealth}%</h3>
            <p className="text-sm text-muted">
              Passed {passedCount} out of {totalCount} structural requirements for automated scanning compliance.
            </p>
          </div>
          <div className="w-full md:w-64 bg-background border border-border h-4 rounded-full overflow-hidden">
            <div 
              className="bg-accent h-full transition-all duration-1000"
              style={{ width: `${percentHealth}%` }}
            />
          </div>
        </div>
      )}

      {/* Audit Checklist List */}
      <div className="space-y-4">
        {auditItems.map((item) => (
          <div 
            key={item.id}
            className={`border rounded-lg p-5 flex items-start gap-4 transition-all ${
              item.status 
                ? 'bg-card border-border hover:border-accent/30' 
                : 'bg-card border-border hover:border-border/80'
            }`}
          >
            {/* Status Icons */}
            <div className="mt-1 shrink-0">
              {item.status ? (
                <CheckCircle2 className="h-6 w-6 text-accent" />
              ) : item.severity === 'high' ? (
                <XCircle className="h-6 w-6 text-red-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              )}
            </div>

            {/* Checklist details */}
            <div className="space-y-2 flex-grow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-text text-base">{item.title}</h4>
                {!item.status && (
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 border rounded font-semibold ${getSeverityBadge(item.severity)}`}>
                    {item.severity} severity
                  </span>
                )}
              </div>
              <p className="text-sm text-muted leading-relaxed">{item.suggestion}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
