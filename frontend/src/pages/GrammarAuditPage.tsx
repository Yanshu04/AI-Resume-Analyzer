import React, { useState, useEffect } from 'react'
import axios from 'axios'
import type { ParsedResume, GrammarResponse } from '../utils/types'
import { Loader, BookOpen, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface GrammarAuditPageProps {
  parsedResume: ParsedResume
}

export default function GrammarAuditPage({ parsedResume }: GrammarAuditPageProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [auditResult, setAuditResult] = useState<GrammarResponse | null>(null)

  // Autofill with experience text and clear old result on resume change
  useEffect(() => {
    setAuditResult(null)
    if (parsedResume && parsedResume.experience.length > 0) {
      let concatText = ""
      parsedResume.experience.forEach(exp => {
        concatText += `${exp.title} at ${exp.company}\n`
        exp.bullets.forEach(b => {
          concatText += `• ${b}\n`
        })
        concatText += "\n"
      })
      setText(concatText.trim())
    }
  }, [parsedResume])

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    setLoading(true)
    setError(null)
    setAuditResult(null)

    try {
      const res = await axios.post<GrammarResponse>(`${API_URL}/api/grammar`, { text })
      setAuditResult(res.data)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to complete grammar audit.')
    } finally {
      setLoading(false)
    }
  }

  // Highlights the occurrences inside the text in HTML
  const getHighlightedText = () => {
    if (!auditResult) return text

    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>")

    // Highlight long sentences first to avoid nested issues breaking HTML tags
    auditResult.long_sentences.forEach(sentence => {
      const escaped = sentence.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      const regex = new RegExp(escaped, 'i')
      html = html.replace(regex, `<span class="bg-red-500/20 border-b border-red-500 text-red-100 px-1 rounded" title="Sentence too long (recommend splitting)">$&</span>`)
    })

    // Highlight passive voice sentences
    auditResult.passive_voice.forEach(sentence => {
      // If it's already inside a long sentence tag, we try to highlight inside it, but to prevent broken HTML let's do simple matching
      const escaped = sentence.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      const regex = new RegExp(escaped, 'i')
      html = html.replace(regex, `<span class="bg-blue-500/20 border-b border-blue-400 text-blue-200 px-1 rounded" title="Passive voice used">$&</span>`)
    })

    // Highlight weak words
    auditResult.weak_words.forEach(item => {
      const regex = new RegExp(`\\b${reEscape(item.word)}\\b`, 'gi')
      html = html.replace(regex, `<span class="bg-yellow-500/20 border-b border-yellow-500 text-yellow-200 px-0.5 rounded font-bold" title="Weak Word (Try: ${item.suggestion})">$&</span>`)
    })

    // Highlight repeated words
    auditResult.repeated_words.forEach(word => {
      const regex = new RegExp(`\\b${reEscape(word)}\\b`, 'gi')
      html = html.replace(regex, `<span class="bg-purple-500/20 border-b border-purple-400 text-purple-200 px-0.5 rounded" title="Word repeated frequently">$&</span>`)
    })

    return html
  }

  const reEscape = (str: string) => {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">GRAMMAR & WRITING AUDIT</h2>
        <p className="text-muted mt-2">Audit writing quality, passive voice, weak words, and readability. Experience section text is populated below by default.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Editor Area */}
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2 space-y-4">
          <form onSubmit={handleAudit} className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="grammar-textarea" className="text-xs font-mono uppercase tracking-wider text-muted">
                Audit Text Source
              </label>
              <button 
                type="button" 
                onClick={() => setText('')} 
                className="text-xs text-muted hover:text-accent font-mono"
              >
                CLEAR
              </button>
            </div>
            
            <textarea
              id="grammar-textarea"
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-background border border-border rounded p-4 text-sm text-text focus:outline-none focus:border-accent font-mono leading-relaxed resize-y"
              required
            />

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="flex-grow bg-accent text-background px-6 py-3 rounded font-mono font-bold hover:opacity-90 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>AUDITING WRITING STYLE...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" />
                    <span>RUN GRAMMAR AUDIT</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-800/40 text-red-400 rounded text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Audit Dashboard Summary */}
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-widest text-muted font-mono block border-b border-border pb-2">Audit Issues Summary</span>
            
            {auditResult ? (
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between items-center p-2.5 bg-background border border-border rounded">
                  <span className="text-yellow-400">WEAK WORDS:</span>
                  <span className="font-bold">{auditResult.weak_words.length}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-background border border-border rounded">
                  <span className="text-blue-400">PASSIVE VOICE:</span>
                  <span className="font-bold">{auditResult.passive_voice.length}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-background border border-border rounded">
                  <span className="text-purple-400">REPEATED TERMS:</span>
                  <span className="font-bold">{auditResult.repeated_words.length}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-background border border-border rounded">
                  <span className="text-red-400">LONG SENTENCES:</span>
                  <span className="font-bold">{auditResult.long_sentences.length}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted text-xs font-mono space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto" />
                <p>Run audit on input text to generate diagnostics.</p>
              </div>
            )}
          </div>

          <div className="text-xs text-muted font-mono leading-relaxed border-t border-border pt-4">
            <span className="text-accent">PRO-TIP:</span> Active, metric-driven accomplishments improve ATS discovery and interview rates.
          </div>
        </div>

      </div>

      {/* Inline Highlights and Category breakdown */}
      {auditResult && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-6 animate-fadeIn">
          <h3 className="font-mono text-sm font-bold tracking-wider text-accent border-b border-border pb-2">DIAGNOSTIC PREVIEW</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Inline Highlighted Text Preview */}
            <div className="lg:col-span-2 space-y-3">
              <span className="text-xs font-mono text-muted uppercase">Visual Audit View</span>
              <div 
                className="bg-background border border-border p-6 rounded text-sm leading-loose font-mono overflow-auto max-h-[400px]"
                dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
              />
            </div>

            {/* List details */}
            <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2">
              
              {/* Weak words replacements */}
              {auditResult.weak_words.length > 0 && (
                <div>
                  <span className="text-xs font-mono text-yellow-400 uppercase font-bold block mb-2">Weak Word Fixes</span>
                  <ul className="space-y-2">
                    {auditResult.weak_words.map((item, i) => (
                      <li key={i} className="text-xs bg-background border border-border p-2 rounded flex justify-between">
                        <span className="line-through text-red-400 font-mono">{item.word}</span>
                        <span className="text-muted">→</span>
                        <span className="text-accent font-bold font-mono">{item.suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Passive Voice list */}
              {auditResult.passive_voice.length > 0 && (
                <div>
                  <span className="text-xs font-mono text-blue-400 uppercase font-bold block mb-2">Passive Phrases</span>
                  <ul className="space-y-1.5 list-disc pl-4 text-xs text-muted">
                    {auditResult.passive_voice.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Long sentences list */}
              {auditResult.long_sentences.length > 0 && (
                <div>
                  <span className="text-xs font-mono text-red-400 uppercase font-bold block mb-2">Long Sentences (Split)</span>
                  <ul className="space-y-1.5 list-disc pl-4 text-xs text-muted">
                    {auditResult.long_sentences.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  )
}
