import { useEffect, useState } from 'react'
import axios from 'axios'
import type { ParsedResume } from '../utils/types'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts'
import { Loader, AlertOctagon } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface KeywordDensityPageProps {
  parsedResume: ParsedResume
}

interface DensityItem {
  keyword: string
  count: number
}

export default function KeywordDensityPage({ parsedResume }: KeywordDensityPageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [densityData, setDensityData] = useState<DensityItem[]>([])

  useEffect(() => {
    const fetchDensity = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.post<DensityItem[]>(`${API_URL}/api/keyword-density`, parsedResume)
        setDensityData(res.data)
      } catch (err: any) {
        console.error(err)
        setError(err.response?.data?.detail || 'Failed to compute keyword density.')
      } finally {
        setLoading(false)
      }
    }
    fetchDensity()
  }, [parsedResume])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader className="h-10 w-10 text-accent animate-spin" />
        <p className="font-mono text-sm tracking-wider text-muted">ANALYZING KEYWORD DENSITY AND TERM FREQUENCIES...</p>
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">KEYWORD DENSITY</h2>
        <p className="text-muted mt-2">View the most frequent words in your resume to ensure key terms are emphasized and avoid keyword stuffing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Graph representation */}
        <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2 space-y-4">
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted">Keyword Frequencies</h3>
          
          {densityData.length > 0 ? (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={densityData}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 50, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="keyword" 
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
                            <span className="text-text">{dataVal.keyword}:</span>
                            <span className="ml-2 font-bold text-accent">{dataVal.count} times</span>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="count" fill="#C8F135" radius={2} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted font-mono py-12 text-center">No keywords counted.</p>
          )}
        </div>

        {/* Breakdown table */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4 max-h-[460px] overflow-y-auto">
          <span className="text-xs uppercase tracking-widest text-muted font-mono block border-b border-border pb-2">Frequency Rank</span>
          
          <div className="space-y-2">
            {densityData.map((item, idx) => (
              <div 
                key={idx} 
                className="flex justify-between items-center p-2.5 bg-background border border-border rounded hover:border-accent/20 transition-all font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted font-bold text-[10px] w-4">{idx + 1}.</span>
                  <span className="text-text font-bold">{item.keyword}</span>
                </div>
                <span className="bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-accent font-bold">
                  {item.count} occurrences
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
