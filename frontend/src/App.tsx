import { useState, useEffect } from 'react'
import UploadPage from './pages/UploadPage'
import AtsScorePage from './pages/AtsScorePage'
import JdMatchPage from './pages/JdMatchPage'
import AiImprovePage from './pages/AiImprovePage'
import GrammarAuditPage from './pages/GrammarAuditPage'
import ResumeRewritePage from './pages/ResumeRewritePage'
import AchievementGeneratorPage from './pages/AchievementGeneratorPage'
import SkillsGapPage from './pages/SkillsGapPage'
import KeywordDensityPage from './pages/KeywordDensityPage'
import ComparePage from './pages/ComparePage'
import SectionsCheckPage from './pages/SectionsCheckPage'
import ExportPage from './pages/ExportPage'
import type { ParsedResume, ScoreResponse } from './utils/types'
import { 
  Upload, 
  BarChart2, 
  FileCheck, 
  Sparkles, 
  Edit3, 
  CheckSquare, 
  ListOrdered, 
  BookOpen, 
  RefreshCw, 
  FileText, 
  Layers,
  Cpu
} from 'lucide-react'

// Tab keys defined matching the requirements
type TabKey = 
  | 'upload' 
  | 'ats' 
  | 'jd' 
  | 'improve' 
  | 'grammar' 
  | 'skills-gap' 
  | 'keyword-density' 
  | 'sections' 
  | 'rewrite' 
  | 'achievements' 
  | 'compare' 
  | 'export'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('upload')
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null)
  const [filePath, setFilePath] = useState<string>('')
  const [atsScore, setAtsScore] = useState<ScoreResponse | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Toast alert and state reset when resume is parsed
  useEffect(() => {
    if (parsedResume) {
      showToast(`Resume parsed: ${parsedResume.name}`, 'success')
      setAtsScore(null)
    }
  }, [parsedResume])




  // Sidebar items definition
  const navItems = [
    { key: 'upload', label: 'Upload Resume', icon: Upload },
    { key: 'ats', label: 'ATS Score', icon: BarChart2 },
    { key: 'jd', label: 'JD Match', icon: FileCheck },
    { key: 'improve', label: 'AI Improve', icon: Sparkles },
    { key: 'grammar', label: 'Grammar Audit', icon: BookOpen },
    { key: 'skills-gap', label: 'Skills Gap', icon: Layers },
    { key: 'keyword-density', label: 'Keyword Density', icon: ListOrdered },
    { key: 'sections', label: 'Sections Check', icon: CheckSquare },
    { key: 'rewrite', label: 'Resume Rewrite', icon: Edit3 },
    { key: 'achievements', label: 'Achievement Gen', icon: Cpu },
    { key: 'compare', label: 'Compare Resumes', icon: RefreshCw },
    { key: 'export', label: 'Export Resume', icon: FileText },
  ] as const

  const renderContent = () => {
    // Return UploadPage for 'upload' tab
    if (activeTab === 'upload') {
      return (
        <UploadPage 
          parsedResume={parsedResume} 
          setParsedResume={setParsedResume} 
          setFilePath={setFilePath} 
        />
      )
    }

    // Guard other tabs if resume is not uploaded
    if (!parsedResume && activeTab !== 'compare') {
      return (
        <div className="flex flex-col items-center justify-center text-center p-12 border border-border bg-card rounded-lg space-y-4">
          <Upload className="h-12 w-12 text-accent animate-pulse" />
          <h3 className="text-xl font-bold font-mono">NO ACTIVE RESUME LOADED</h3>
          <p className="text-muted max-w-md">
            Please upload a resume in the <strong>Upload Resume</strong> tab first before analyzing or modifying details.
          </p>
          <button
            onClick={() => setActiveTab('upload')}
            className="bg-accent text-background px-6 py-2 rounded font-mono font-bold hover:opacity-90 transition-all text-sm"
          >
            GO TO UPLOAD
          </button>
        </div>
      )
    }

    // Placeholders for subsequent phases (we'll implement components for each)
    switch (activeTab) {
      case 'ats':
        return (
          <AtsScorePage 
            parsedResume={parsedResume!} 
            atsScore={atsScore} 
            setAtsScore={setAtsScore} 
          />
        )
      case 'jd':
        return <JdMatchPage parsedResume={parsedResume!} />
      case 'improve':
        return <AiImprovePage />
      case 'grammar':
        return <GrammarAuditPage parsedResume={parsedResume!} />
      case 'skills-gap':
        return <SkillsGapPage parsedResume={parsedResume!} />
      case 'keyword-density':
        return <KeywordDensityPage parsedResume={parsedResume!} />
      case 'sections':
        return <SectionsCheckPage parsedResume={parsedResume!} />
      case 'rewrite':
        return <ResumeRewritePage parsedResume={parsedResume!} />
      case 'achievements':
        return <AchievementGeneratorPage />
      case 'compare':
        return <ComparePage activeResume={parsedResume} />
      case 'export':
        return <ExportPage parsedResume={parsedResume!} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans selection:bg-accent selection:text-background">
      
      {/* Top Navigation / Status Header */}
      <header className="flex justify-between items-center border-b border-border px-8 py-4 bg-background">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-background p-1.5 rounded font-bold font-mono text-sm tracking-tighter">
            AR
          </div>
          <h1 className="text-lg font-mono font-bold tracking-tight text-accent">
            AI RESUME ANALYZER
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          {parsedResume ? (
            <div className="hidden sm:flex items-center gap-2 border border-accent/20 bg-accent/5 px-3 py-1 rounded text-xs text-accent font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span>ACTIVE: {parsedResume.name.toUpperCase()}</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 border border-border bg-card px-3 py-1 rounded text-xs text-muted font-mono">
              <span>NO RESUME ACTIVE</span>
            </div>
          )}
          <span className="text-xs uppercase tracking-widest text-muted">Offline Mode</span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-grow">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-border bg-card p-4 shrink-0 hidden md:block">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-sm font-mono transition-all text-left ${
                    isActive 
                      ? 'bg-accent text-background font-bold' 
                      : 'text-muted hover:text-text hover:bg-hover'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label.toUpperCase()}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-grow p-8 bg-background overflow-y-auto max-w-5xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      {/* Toast/Status Bar */}
      <footer className="border-t border-border py-3 px-8 text-center text-xs text-muted font-mono flex justify-between bg-card items-center">
        <span>DEV RUNTIME: PYTHON + FASTAPI + REACT + OLLAMA {filePath && `(${filePath})`}</span>
        <span>© 2026 AI Resume Analyzer</span>
      </footer>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 p-4 border rounded shadow-2xl font-mono text-xs flex items-center gap-3 animate-slideIn ${
          toast.type === 'success' 
            ? 'bg-card border-accent text-accent' 
            : 'bg-card border-red-500 text-red-400'
        }`}>
          <span className={`h-2 w-2 rounded-full ${toast.type === 'success' ? 'bg-accent animate-pulse' : 'bg-red-500 animate-ping'}`} />
          <span>{toast.message.toUpperCase()}</span>
        </div>
      )}
    </div>
  )
}
