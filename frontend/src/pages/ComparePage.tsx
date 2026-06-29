import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import type { ParsedResume, CompareResponse } from '../utils/types'
import { Loader, Upload, RefreshCw, ArrowRight } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ComparePageProps {
  activeResume: ParsedResume | null
}

export default function ComparePage({ activeResume }: ComparePageProps) {
  const [v1, setV1] = useState<ParsedResume | null>(activeResume)
  const [v2, setV2] = useState<ParsedResume | null>(null)
  
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [loadingCompare, setLoadingCompare] = useState(false)
  
  const [v1Name, setV1Name] = useState(activeResume ? 'Active Resume' : '')
  const [v2Name, setV2Name] = useState('')

  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputV1 = useRef<HTMLInputElement>(null)
  const fileInputV2 = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeResume) {
      setV1(activeResume)
      setV1Name('Active Resume')
      setCompareResult(null)
    }
  }, [activeResume])

  const processFile = async (file: File, slot: 1 | 2) => {
    const setLoader = slot === 1 ? setLoading1 : setLoading2
    const setDoc = slot === 1 ? setV1 : setV2
    const setName = slot === 1 ? setV1Name : setV2Name

    setLoader(true)
    setError(null)
    setCompareResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // 1. Upload
      const uploadRes = await axios.post<{ file_path: string }>(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      // 2. Parse
      const parseRes = await axios.post<ParsedResume>(`${API_URL}/api/parse`, {
        file_path: uploadRes.data.file_path
      })

      setDoc(parseRes.data)
      setName(file.name)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || `Failed to process Resume V${slot}`)
    } finally {
      setLoader(false)
    }
  }

  const handleCompare = async () => {
    if (!v1 || !v2) return

    setLoadingCompare(true)
    setError(null)

    try {
      const res = await axios.post<CompareResponse>(`${API_URL}/api/compare`, { v1, v2 })
      setCompareResult(res.data)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to compare resumes.')
    } finally {
      setLoadingCompare(false)
    }
  }

  const isWinner = (metricKey: 'ats_score' | 'grammar_issues' | 'keyword_coverage' | 'readability' | 'length', slot: 'v1' | 'v2') => {
    if (!compareResult) return false
    const key = `${metricKey}_winner` as keyof typeof compareResult.comparison
    return compareResult.comparison[key] === slot
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">RESUME COMPARISON</h2>
        <p className="text-muted mt-2">Upload two versions of your resume to compare ATS scoring, keywords, grammar, and readability side-by-side.</p>
      </div>

      {/* Upload slots grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Slot 1 */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <span className="text-xs uppercase tracking-widest text-muted font-mono block">Resume Version 1 (Baseline)</span>
          
          <input 
            type="file" 
            ref={fileInputV1} 
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 1)} 
            className="hidden" 
            accept=".pdf,.docx"
          />

          {v1 ? (
            <div className="border border-accent/20 bg-accent/5 p-4 rounded flex items-center justify-between">
              <div className="truncate">
                <p className="text-sm font-bold text-accent truncate">{v1Name}</p>
                <p className="text-xs text-muted font-mono mt-1">{v1.name}</p>
              </div>
              <button 
                onClick={() => fileInputV1.current?.click()}
                className="text-xs text-muted hover:text-accent font-mono shrink-0 ml-4"
              >
                REPLACE
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputV1.current?.click()}
              disabled={loading1}
              className="w-full py-8 border-2 border-dashed border-border rounded hover:border-accent/40 flex flex-col items-center justify-center text-muted gap-2"
            >
              {loading1 ? (
                <Loader className="h-6 w-6 animate-spin text-accent" />
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="text-xs font-mono">UPLOAD V1</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Slot 2 */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <span className="text-xs uppercase tracking-widest text-muted font-mono block">Resume Version 2 (Revised)</span>
          
          <input 
            type="file" 
            ref={fileInputV2} 
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 2)} 
            className="hidden" 
            accept=".pdf,.docx"
          />

          {v2 ? (
            <div className="border border-accent/20 bg-accent/5 p-4 rounded flex items-center justify-between">
              <div className="truncate">
                <p className="text-sm font-bold text-accent truncate">{v2Name}</p>
                <p className="text-xs text-muted font-mono mt-1">{v2.name}</p>
              </div>
              <button 
                onClick={() => fileInputV2.current?.click()}
                className="text-xs text-muted hover:text-accent font-mono shrink-0 ml-4"
              >
                REPLACE
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputV2.current?.click()}
              disabled={loading2}
              className="w-full py-8 border-2 border-dashed border-border rounded hover:border-accent/40 flex flex-col items-center justify-center text-muted gap-2"
            >
              {loading2 ? (
                <Loader className="h-6 w-6 animate-spin text-accent" />
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="text-xs font-mono">UPLOAD V2</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

      {/* Run comparison action */}
      {v1 && v2 && (
        <button
          onClick={handleCompare}
          disabled={loadingCompare}
          className="w-full bg-accent text-background py-3 rounded font-mono font-bold hover:opacity-90 transition-all text-sm flex items-center justify-center gap-2"
        >
          {loadingCompare ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>RUNNING COMPARATIVE METRICS...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>COMPARE RESUMES</span>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-800/40 text-red-400 rounded text-sm">
          {error}
        </div>
      )}

      {/* Comparison table */}
      {compareResult && (
        <div className="bg-card border border-border rounded-lg overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-border bg-hover/20">
            <h3 className="font-mono text-sm font-bold tracking-wider text-accent">COMPARATIVE METRICS REPORT</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] text-muted uppercase tracking-wider bg-hover/10">
                  <th className="p-4">ANALYSIS MATRIX</th>
                  <th className="p-4 w-1/3">V1: {v1Name.toUpperCase()}</th>
                  <th className="p-4 w-1/3">V2: {v2Name.toUpperCase()}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-sm">
                
                {/* ATS Score */}
                <tr className="hover:bg-hover/20 transition-all">
                  <td className="p-4 font-sans font-bold">ATS Score</td>
                  <td className={`p-4 ${isWinner('ats_score', 'v1') ? 'text-accent font-bold bg-accent/[0.02]' : 'text-muted'}`}>
                    {compareResult.v1.ats_score} / 100
                    {isWinner('ats_score', 'v1') && <span className="ml-2 text-[10px] bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded text-accent font-bold">WINNER</span>}
                  </td>
                  <td className={`p-4 ${isWinner('ats_score', 'v2') ? 'text-accent font-bold bg-accent/[0.02]' : 'text-muted'}`}>
                    {compareResult.v2.ats_score} / 100
                    {isWinner('ats_score', 'v2') && <span className="ml-2 text-[10px] bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded text-accent font-bold">WINNER</span>}
                  </td>
                </tr>

                {/* Grammar Issues */}
                <tr className="hover:bg-hover/20 transition-all">
                  <td className="p-4 font-sans font-bold">Writing Quality Issues</td>
                  <td className={`p-4 ${isWinner('grammar_issues', 'v1') ? 'text-accent font-bold bg-accent/[0.02]' : 'text-muted'}`}>
                    {compareResult.v1.grammar_issues} warnings
                    {isWinner('grammar_issues', 'v1') && <span className="ml-2 text-[10px] bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded text-accent font-bold">FEWER</span>}
                  </td>
                  <td className={`p-4 ${isWinner('grammar_issues', 'v2') ? 'text-accent font-bold bg-accent/[0.02]' : 'text-muted'}`}>
                    {compareResult.v2.grammar_issues} warnings
                    {isWinner('grammar_issues', 'v2') && <span className="ml-2 text-[10px] bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded text-accent font-bold">FEWER</span>}
                  </td>
                </tr>

                {/* Keyword Coverage */}
                <tr className="hover:bg-hover/20 transition-all">
                  <td className="p-4 font-sans font-bold">Keyword Coverage</td>
                  <td className={`p-4 ${isWinner('keyword_coverage', 'v1') ? 'text-accent font-bold bg-accent/[0.02]' : 'text-muted'}`}>
                    {compareResult.v1.keyword_coverage} skills matched
                    {isWinner('keyword_coverage', 'v1') && <span className="ml-2 text-[10px] bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded text-accent font-bold">WINNER</span>}
                  </td>
                  <td className={`p-4 ${isWinner('keyword_coverage', 'v2') ? 'text-accent font-bold bg-accent/[0.02]' : 'text-muted'}`}>
                    {compareResult.v2.keyword_coverage} skills matched
                    {isWinner('keyword_coverage', 'v2') && <span className="ml-2 text-[10px] bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded text-accent font-bold">WINNER</span>}
                  </td>
                </tr>

                {/* Flesch Score */}
                <tr className="hover:bg-hover/20 transition-all">
                  <td className="p-4 font-sans font-bold">Flesch Reading Ease</td>
                  <td className={`p-4 ${isWinner('readability', 'v1') ? 'text-accent font-bold bg-accent/[0.02]' : 'text-muted'}`}>
                    {compareResult.v1.flesch_score} (ASL: {compareResult.v1.avg_sentence_length})
                    {isWinner('readability', 'v1') && <span className="ml-2 text-[10px] bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded text-accent font-bold">WINNER</span>}
                  </td>
                  <td className={`p-4 ${isWinner('readability', 'v2') ? 'text-accent font-bold bg-accent/[0.02]' : 'text-muted'}`}>
                    {compareResult.v2.flesch_score} (ASL: {compareResult.v2.avg_sentence_length})
                    {isWinner('readability', 'v2') && <span className="ml-2 text-[10px] bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded text-accent font-bold">WINNER</span>}
                  </td>
                </tr>

                {/* Length */}
                <tr className="hover:bg-hover/20 transition-all">
                  <td className="p-4 font-sans font-bold">Length & Integrity</td>
                  <td className={`p-4 ${isWinner('length', 'v1') ? 'text-accent font-bold bg-accent/[0.02]' : 'text-muted'}`}>
                    {compareResult.v1.word_count} words ({compareResult.v1.section_count} sections)
                    {isWinner('length', 'v1') && <span className="ml-2 text-[10px] bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded text-accent font-bold">OPTIMIZED</span>}
                  </td>
                  <td className={`p-4 ${isWinner('length', 'v2') ? 'text-accent font-bold bg-accent/[0.02]' : 'text-muted'}`}>
                    {compareResult.v2.word_count} words ({compareResult.v2.section_count} sections)
                    {isWinner('length', 'v2') && <span className="ml-2 text-[10px] bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded text-accent font-bold">OPTIMIZED</span>}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          <div className="p-6 bg-hover/10 border-t border-border flex items-start gap-4">
            <ArrowRight className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm leading-relaxed text-muted">
              <span className="font-mono text-accent font-bold block uppercase text-xs">Comparison Conclusion</span>
              {compareResult.comparison.ats_score_winner === 'v2' ? (
                <p>
                  <strong>Resume V2</strong> yields better overall ATS compatibility. We recommend exporting this revised version for applications.
                </p>
              ) : (
                <p>
                  <strong>Resume V1</strong> matches target criteria better or has a more balanced keyword density. Refine V2 formatting or expand technical descriptors before applying.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
