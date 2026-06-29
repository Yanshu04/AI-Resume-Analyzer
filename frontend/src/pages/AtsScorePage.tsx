import { useEffect, useState } from 'react'
import axios from 'axios'
import type { ParsedResume, ScoreResponse } from '../utils/types'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts'
import { Loader, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface AtsScorePageProps {
  parsedResume: ParsedResume
  atsScore: ScoreResponse | null
  setAtsScore: (score: ScoreResponse | null) => void
}

export default function AtsScorePage({ parsedResume, atsScore, setAtsScore }: AtsScorePageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch score only if it hasn't been fetched yet
    if (!atsScore) {
      const fetchScore = async () => {
        setLoading(true)
        setError(null)
        try {
          const res = await axios.post<ScoreResponse>(`${API_URL}/api/score`, parsedResume)
          setAtsScore(res.data)
        } catch (err: any) {
          console.error(err)
          setError(err.response?.data?.detail || 'Failed to fetch ATS score.')
        } finally {
          setLoading(false)
        }
      }
      fetchScore()
    }
  }, [parsedResume, atsScore, setAtsScore])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader className="h-10 w-10 text-accent animate-spin" />
        <p className="font-mono text-sm tracking-wider text-muted">COMPUTING ATS SCORES AND SEMANTIC KEYWORDS...</p>
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

  if (!atsScore) return null

  // Prepare data for Recharts
  const data = [
    { name: 'KEYWORDS', score: atsScore.categories.keywords.score, rawName: 'keywords' },
    { name: 'EXPERIENCE', score: atsScore.categories.experience.score, rawName: 'experience' },
    { name: 'SKILLS', score: atsScore.categories.skills.score, rawName: 'skills' },
    { name: 'FORMATTING', score: atsScore.categories.formatting.score, rawName: 'formatting' },
    { name: 'PROJECTS', score: atsScore.categories.projects.score, rawName: 'projects' },
    { name: 'EDUCATION', score: atsScore.categories.education.score, rawName: 'education' },
    { name: 'ACHIEVEMENTS', score: atsScore.categories.achievements.score, rawName: 'achievements' }
  ]

  // Color mappings
  const getColor = (score: number) => {
    if (score >= 80) return '#C8F135' // Accent lime
    if (score >= 50) return '#FCD34D' // Amber yellow
    return '#EF4444' // Red
  }

  const getBadgeColor = (score: number) => {
    if (score >= 80) return 'text-accent border-accent/20 bg-accent/5'
    if (score >= 50) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5'
    return 'text-red-400 border-red-500/20 bg-red-500/5'
  }

  const getIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-accent shrink-0" />
    if (score >= 50) return <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
    return <AlertOctagon className="h-5 w-5 text-red-500 shrink-0" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">ATS SCORING ENGINE</h2>
        <p className="text-muted mt-2">Evaluate how well your resume matches search systems and automated screeners.</p>
      </div>

      {/* Main Score & Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Overall Score Dial */}
        <div className="bg-card border border-border rounded-lg p-6 flex flex-col justify-center items-center text-center space-y-4">
          <span className="text-xs uppercase tracking-widest text-muted font-mono">Overall ATS Score</span>
          <div className="relative flex items-center justify-center">
            {/* Circular Ring Frame */}
            <div className="h-44 w-44 rounded-full border-4 border-border flex flex-col items-center justify-center relative">
              <span className="text-5xl font-mono font-bold" style={{ color: getColor(atsScore.overall_score) }}>
                {atsScore.overall_score}
              </span>
              <span className="text-xs text-muted font-mono mt-1">/ 100</span>
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent transition-all duration-1000"
                style={{ 
                  borderTopColor: getColor(atsScore.overall_score),
                  borderRightColor: atsScore.overall_score >= 50 ? getColor(atsScore.overall_score) : 'transparent',
                  borderBottomColor: atsScore.overall_score >= 80 ? getColor(atsScore.overall_score) : 'transparent',
                  transform: 'rotate(-45deg)' 
                }} 
              />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-mono text-sm uppercase tracking-wide">
              {atsScore.overall_score >= 80 ? 'READY TO APPLY' : (atsScore.overall_score >= 50 ? 'NEEDS IMPROVEMENT' : 'HIGH RISK OF REJECTION')}
            </h3>
            <p className="text-xs text-muted max-w-[200px]">
              Weighted across keywords, formatting, structure, and impact bullets.
            </p>
          </div>
        </div>

        {/* Recharts Breakdown */}
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted mb-4">Category Breakdown</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#A3A3A3', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataVal = payload[0].payload
                      return (
                        <div className="bg-hover border border-border p-2 rounded text-xs font-mono">
                          <span className="text-text">{dataVal.name}:</span>
                          <span className="ml-2 font-bold" style={{ color: getColor(dataVal.score) }}>{dataVal.score}%</span>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="score" radius={2} barSize={14}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Detailed Feedback Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-mono font-bold tracking-tight text-accent">DETAILED AUDIT REVIEW</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((cat, idx) => {
            const raw = cat.rawName as keyof typeof atsScore.categories
            const detail = atsScore.categories[raw]
            return (
              <div 
                key={idx}
                className="bg-card border border-border rounded-lg p-5 flex items-start gap-4 hover:border-border/80 transition-all"
              >
                <div className="mt-0.5">
                  {getIcon(detail.score)}
                </div>
                <div className="space-y-1.5 flex-grow">
                  <div className="flex justify-between items-center">
                    <h4 className="font-mono text-sm font-bold tracking-wide">{cat.name}</h4>
                    <span className={`text-xs border px-2 py-0.5 rounded font-mono font-bold ${getBadgeColor(detail.score)}`}>
                      {detail.score} / 100
                    </span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{detail.feedback}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
