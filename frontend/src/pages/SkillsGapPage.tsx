import React, { useState } from 'react'
import axios from 'axios'
import type { ParsedResume } from '../utils/types'
import { Loader, Layers, CheckCircle2, XCircle, Lightbulb } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface SkillsGapPageProps {
  parsedResume: ParsedResume
}

interface SkillsGapResult {
  current_skills: string[]
  missing_skills: string[]
  recommended_skills: string[]
}

export default function SkillsGapPage({ parsedResume }: SkillsGapPageProps) {
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SkillsGapResult | null>(null)

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jdText.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await axios.post<SkillsGapResult>(`${API_URL}/api/skills-gap`, {
        resume: parsedResume,
        jd_text: jdText
      })
      setResult(res.data)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to compare skills gap.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">SKILLS GAP ANALYSIS</h2>
        <p className="text-muted mt-2">Compare your resume skills to the job description requirements and discover key technical suggestions.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <form onSubmit={handleAnalysis} className="space-y-4">
          <label htmlFor="skills-jd" className="text-xs font-mono uppercase tracking-wider text-muted">
            Target Job Description
          </label>
          <textarea
            id="skills-jd"
            rows={6}
            placeholder="Paste the job listing requirements here to find missing tools, frameworks, and languages..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            className="w-full bg-background border border-border rounded p-4 text-sm text-text focus:outline-none focus:border-accent font-sans leading-relaxed resize-y"
            required
          />
          <button
            type="submit"
            disabled={loading || !jdText.trim()}
            className="bg-accent text-background px-6 py-2.5 rounded font-mono font-bold hover:opacity-90 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>COMPARING SKILLS MATRIX...</span>
              </>
            ) : (
              <>
                <Layers className="h-4 w-4" />
                <span>ANALYZE SKILLS GAP</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-800/40 text-red-400 rounded text-sm font-mono">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Current Skills Column */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <h3 className="font-mono text-sm font-bold tracking-wider text-accent">CURRENT SKILLS ({result.current_skills.length})</h3>
            </div>
            <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto pr-1">
              {result.current_skills.map((skill, idx) => (
                <span 
                  key={idx}
                  className="text-xs bg-background border border-border px-3 py-1 rounded text-text font-mono font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skills Column */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <h3 className="font-mono text-sm font-bold tracking-wider text-red-400">MISSING REQUIREMENTS ({result.missing_skills.length})</h3>
            </div>
            {result.missing_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto pr-1">
                {result.missing_skills.map((skill, idx) => (
                  <span 
                    key={idx}
                    className="text-xs bg-red-950/10 border border-red-900/30 px-3 py-1 rounded text-red-400 font-mono font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted font-mono">No missing skills detected! Perfect alignment.</p>
            )}
          </div>

          {/* Recommended Skills Column */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              <h3 className="font-mono text-sm font-bold tracking-wider text-yellow-400">SKILLS SUGGESTIONS ({result.recommended_skills.length})</h3>
            </div>
            {result.recommended_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto pr-1">
                {result.recommended_skills.map((skill, idx) => (
                  <span 
                    key={idx}
                    className="text-xs bg-yellow-950/10 border border-yellow-900/30 px-3 py-1 rounded text-yellow-400 font-mono font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted font-mono">No recommendations available.</p>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
