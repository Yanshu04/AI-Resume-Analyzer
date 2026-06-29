import { useState, useEffect } from 'react'
import axios from 'axios'
import type { ParsedResume } from '../utils/types'
import { Loader, Edit3, Copy, Check } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ResumeRewritePageProps {
  parsedResume: ParsedResume
}

type RewriteStyle = 'Professional' | 'Technical' | 'Google Style' | 'Microsoft Style' | 'Startup Style'

export default function ResumeRewritePage({ parsedResume }: ResumeRewritePageProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rewritten, setRewritten] = useState('')
  const [activeStyle, setActiveStyle] = useState<RewriteStyle | null>(null)
  const [copied, setCopied] = useState(false)

  // Autofill text area and clear rewritten text on resume change
  useEffect(() => {
    setRewritten('')
    setActiveStyle(null)
    if (parsedResume && parsedResume.experience.length > 0) {
      let concatText = ""
      parsedResume.experience.forEach(exp => {
        concatText += `ROLE: ${exp.title} | COMPANY: ${exp.company} | DURATION: ${exp.duration}\n`
        exp.bullets.forEach(b => {
          concatText += `• ${b}\n`
        })
        concatText += "\n"
      })
      setText(concatText.trim())
    }
  }, [parsedResume])

  const handleRewrite = async (style: RewriteStyle) => {
    if (!text.trim()) return

    setLoading(true)
    setError(null)
    setActiveStyle(style)
    setRewritten('')
    setCopied(false)

    try {
      const res = await axios.post<{ rewritten: string }>(`${API_URL}/api/rewrite`, {
        experience: text,
        style: style
      })
      setRewritten(res.data.rewritten)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to rewrite resume experience.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(rewritten)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stylesList: RewriteStyle[] = [
    'Professional',
    'Technical',
    'Google Style',
    'Microsoft Style',
    'Startup Style'
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">RESUME STYLE REWRITE</h2>
        <p className="text-muted mt-2">Rewrite your resume text matching the exact brand voice of top employers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Editor source */}
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <label htmlFor="rewrite-source" className="text-xs font-mono uppercase tracking-wider text-muted">
              Source Resume Experience Text
            </label>
            <span className="text-xs text-muted font-mono">{text.length} characters</span>
          </div>

          <textarea
            id="rewrite-source"
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-background border border-border rounded p-4 text-sm text-text focus:outline-none focus:border-accent font-mono leading-relaxed resize-y"
            required
          />
        </div>

        {/* Styles picker */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <span className="text-xs uppercase tracking-widest text-muted font-mono block border-b border-border pb-2">Select Rewrite Style</span>
          <div className="space-y-2">
            {stylesList.map((style) => (
              <button
                key={style}
                onClick={() => handleRewrite(style)}
                disabled={loading || !text.trim()}
                className={`w-full py-3 px-4 border rounded font-mono text-xs text-left tracking-wide font-bold transition-all disabled:opacity-40 flex items-center justify-between ${
                  activeStyle === style && loading
                    ? 'bg-hover border-accent text-accent'
                    : 'border-border text-text hover:border-accent/50 hover:bg-hover'
                }`}
              >
                <span>{style.toUpperCase()}</span>
                {activeStyle === style && loading ? (
                  <Loader className="h-4 w-4 animate-spin text-accent" />
                ) : (
                  <Edit3 className="h-4 w-4 text-muted shrink-0" />
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-800/40 text-red-400 rounded text-xs font-mono">
              {error}
            </div>
          )}
        </div>

      </div>

      {/* Output rewritten section */}
      {rewritten && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-accent">
              Rewritten Output ({activeStyle?.toUpperCase()})
            </span>
            <button
              onClick={handleCopy}
              className="text-muted hover:text-accent transition-all flex items-center gap-1.5 text-xs font-mono"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-accent" />
                  <span className="text-accent">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>COPY TEXT</span>
                </>
              )}
            </button>
          </div>
          
          <pre className="text-sm font-mono leading-relaxed text-text bg-background border border-border p-6 rounded overflow-auto whitespace-pre-wrap max-h-96">
            {rewritten}
          </pre>
        </div>
      )}
    </div>
  )
}
