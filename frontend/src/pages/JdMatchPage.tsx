import React, { useState } from 'react'
import axios from 'axios'
import type { ParsedResume, MatchResponse } from '../utils/types'
import { Loader, Play, Check, AlertTriangle, FileText } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface JdMatchPageProps {
  parsedResume: ParsedResume
}

export default function JdMatchPage({ parsedResume }: JdMatchPageProps) {
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null)

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jdText.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await axios.post<MatchResponse>(`${API_URL}/api/match`, {
        resume: parsedResume,
        jd_text: jdText
      })
      setMatchResult(res.data)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to compare resume and job description.')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'border-accent/20 bg-accent/5'
    if (score >= 50) return 'border-yellow-500/20 bg-yellow-500/5'
    return 'border-red-500/20 bg-red-500/5'
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">JOB DESCRIPTION MATCH</h2>
        <p className="text-muted mt-2">Paste a job description to calculate semantic overlap and identify keyword gaps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Input Panel */}
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2 space-y-4">
          <form onSubmit={handleMatch} className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="jd" className="text-sm font-mono uppercase tracking-wider text-muted">
                Job Description Text
              </label>
              <span className="text-xs text-muted font-mono">{jdText.length} characters</span>
            </div>
            
            <textarea
              id="jd"
              rows={10}
              placeholder="Paste the full job posting requirements and responsibilities here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="w-full bg-background border border-border rounded p-4 text-sm text-text focus:outline-none focus:border-accent font-sans leading-relaxed resize-y"
              required
            />

            <button
              type="submit"
              disabled={loading || !jdText.trim()}
              className="w-full bg-accent text-background px-6 py-3 rounded font-mono font-bold hover:opacity-90 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>ANALYZING SEMANTIC SIMILARITY...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>COMPUTE MATCH PERCENTAGE</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-800/40 text-red-400 rounded text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Match Circle Dial */}
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col justify-center items-center text-center space-y-6">
          <span className="text-xs uppercase tracking-widest text-muted font-mono">Job Match Score</span>
          
          {matchResult ? (
            <div className={`h-40 w-40 rounded-full border-4 border-border flex flex-col items-center justify-center relative ${getScoreBg(matchResult.match_score)}`}>
              <span className={`text-4xl font-mono font-bold ${getScoreColor(matchResult.match_score)}`}>
                {matchResult.match_score}%
              </span>
              <span className="text-xs text-muted font-mono mt-1">Match Rate</span>
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent transition-all duration-1000"
                style={{ 
                  borderTopColor: matchResult.match_score >= 50 ? '#C8F135' : '#EF4444',
                  borderRightColor: matchResult.match_score >= 80 ? '#C8F135' : 'transparent',
                  transform: 'rotate(-45deg)' 
                }} 
              />
            </div>
          ) : (
            <div className="h-40 w-40 rounded-full border-2 border-dashed border-border flex flex-col items-center justify-center text-muted">
              <FileText className="h-8 w-8 mb-2" />
              <span className="text-xs font-mono">Awaiting Input</span>
            </div>
          )}

          <div className="space-y-1">
            <h3 className="font-mono text-xs uppercase tracking-wide">
              {matchResult 
                ? (matchResult.match_score >= 80 ? 'EXCELLENT MATCH' : (matchResult.match_score >= 50 ? 'PARTIAL MATCH' : 'WEAK OVERLAP')) 
                : 'NO ANALYSIS YET'}
            </h3>
            <p className="text-[11px] text-muted max-w-[200px]">
              Calculated using semantic context and sentence embedding vectors.
            </p>
          </div>
        </div>

      </div>

      {/* Keywords Breakdown */}
      {matchResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
          
          {/* Present Keywords */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <h3 className="font-mono text-sm font-bold tracking-wider text-accent">PRESENT KEYWORDS ({matchResult.present_keywords.length})</h3>
            </div>
            
            {matchResult.present_keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2">
                {matchResult.present_keywords.map((kw, idx) => (
                  <span 
                    key={idx}
                    className="text-xs bg-accent/5 border border-accent/20 px-2.5 py-1 rounded text-accent font-mono flex items-center gap-1.5"
                  >
                    <Check className="h-3 w-3" />
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No matching keywords found. Try tailoring your resume skills.</p>
            )}
          </div>

          {/* Missing Keywords */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <h3 className="font-mono text-sm font-bold tracking-wider text-red-400">MISSING KEYWORDS ({matchResult.missing_keywords.length})</h3>
            </div>
            
            {matchResult.missing_keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2">
                {matchResult.missing_keywords.map((kw, idx) => (
                  <span 
                    key={idx}
                    className="text-xs bg-red-950/10 border border-red-900/30 px-2.5 py-1 rounded text-red-400 font-mono flex items-center gap-1.5"
                  >
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-accent font-mono">100% keyword coverage! No missing terms identified.</p>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
