import { useState } from 'react'
import axios from 'axios'
import { Loader, Sparkles, Copy, Check } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AiImprovePage() {
  const [bullet, setBullet] = useState('')
  const [improved, setImproved] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImprove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bullet.trim()) return

    setLoading(true)
    setError(null)
    setImproved('')
    setCopied(false)

    try {
      const res = await axios.post<{ improved: string }>(`${API_URL}/api/improve`, { bullet })
      setImproved(res.data.improved)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to improve bullet point.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(improved)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">AI BULLET IMPROVER</h2>
        <p className="text-muted mt-2">Transform weak duties-based bullets into active, metric-driven accomplishments.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <form onSubmit={handleImprove} className="space-y-4">
          <label htmlFor="bullet-input" className="text-xs font-mono uppercase tracking-wider text-muted">
            Original Bullet Point
          </label>
          <input
            id="bullet-input"
            type="text"
            placeholder="e.g. Was responsible for writing code and debugging the website."
            value={bullet}
            onChange={(e) => setBullet(e.target.value)}
            className="w-full bg-background border border-border rounded p-3.5 text-sm text-text focus:outline-none focus:border-accent"
            required
          />
          <button
            type="submit"
            disabled={loading || !bullet.trim()}
            className="bg-accent text-background px-6 py-2.5 rounded font-mono font-bold hover:opacity-90 transition-all text-sm flex items-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>REWRITING BULLET...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>IMPROVE BULLET</span>
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
        {improved && (
          <div className="bg-background border border-border rounded p-6 space-y-4 relative animate-fadeIn">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-accent">Improved AI Suggestion</span>
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
              {improved}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
