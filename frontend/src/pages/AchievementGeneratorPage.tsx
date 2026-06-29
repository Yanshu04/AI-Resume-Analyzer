import { useState } from 'react'
import axios from 'axios'
import { Loader, Cpu, Copy, Check } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AchievementGeneratorPage() {
  const [task, setTask] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task.trim()) return

    setLoading(true)
    setError(null)
    setResult('')
    setCopied(false)

    try {
      const res = await axios.post<{ expanded: string }>(`${API_URL}/api/achievements`, { accomplishment: task })
      setResult(res.data.expanded)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to expand achievement.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">ACHIEVEMENT GENERATOR</h2>
        <p className="text-muted mt-2">Expand simple task descriptions into high-impact, technical, metric-driven accomplishments.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <form onSubmit={handleGenerate} className="space-y-4">
          <label htmlFor="task-input" className="text-xs font-mono uppercase tracking-wider text-muted">
            Simple Accomplishment
          </label>
          <input
            id="task-input"
            type="text"
            placeholder="e.g. Built chatbot"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="w-full bg-background border border-border rounded p-3.5 text-sm text-text focus:outline-none focus:border-accent"
            required
          />
          <button
            type="submit"
            disabled={loading || !task.trim()}
            className="bg-accent text-background px-6 py-2.5 rounded font-mono font-bold hover:opacity-90 transition-all text-sm flex items-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>EXPANDING ACCOMPLISHMENT...</span>
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" />
                <span>GENERATE METRIC BULLET</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-800/40 text-red-400 rounded text-sm font-mono">
            {error}
          </div>
        )}

        {/* Output Panel */}
        {result && (
          <div className="bg-background border border-border rounded p-6 space-y-4 relative animate-fadeIn">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-accent">Expanded Metric Achievement</span>
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
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-sm font-mono leading-relaxed text-text">
              {result}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
