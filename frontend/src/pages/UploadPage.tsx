import React, { useState, useRef } from 'react'
import axios from 'axios'
import type { ParsedResume, UploadResponse } from '../utils/types'
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react'

// Backend URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface UploadPageProps {
  parsedResume: ParsedResume | null
  setParsedResume: (resume: ParsedResume | null) => void
  setFilePath: (path: string) => void
}

export default function UploadPage({ parsedResume, setParsedResume, setFilePath }: UploadPageProps) {
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0])
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf' && ext !== 'docx') {
      setStatusMsg({ type: 'error', text: 'Unsupported format. Only PDF and DOCX are allowed.' })
      return
    }

    setLoading(true)
    setStatusMsg(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // 1. Upload file to backend
      setStatusMsg({ type: 'success', text: 'Uploading document...' })
      const uploadRes = await axios.post<UploadResponse>(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const path = uploadRes.data.file_path
      setFilePath(path)

      // 2. Parse file
      setStatusMsg({ type: 'success', text: 'Parsing text and analyzing keywords...' })
      const parseRes = await axios.post<ParsedResume>(`${API_URL}/api/parse`, { file_path: path })

      setParsedResume(parseRes.data)
      setStatusMsg({ type: 'success', text: 'Resume successfully parsed!' })
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.response?.data?.detail || 'Failed to process the file. Please check if the server is running.'
      setStatusMsg({ type: 'error', text: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-mono tracking-tight text-accent">RESUME UPLOAD</h2>
        <p className="text-muted mt-2">Upload your resume to extract and view structured data.</p>
      </div>

      {/* Drag & Drop Area */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
          dragActive 
            ? 'border-accent bg-hover/50' 
            : 'border-border bg-card hover:border-accent/50'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept=".pdf,.docx"
          onChange={handleFileChange}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-background border border-border rounded-full text-accent">
            {loading ? (
              <Loader className="h-10 w-10 animate-spin" />
            ) : (
              <Upload className="h-10 w-10" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium">Drag & drop your resume file here</p>
            <p className="text-xs text-muted mt-1">Supports PDF and DOCX formats</p>
          </div>
          <button 
            type="button"
            className="bg-accent text-background px-6 py-2 rounded font-mono font-bold hover:opacity-90 transition-all text-sm"
          >
            BROWSE FILES
          </button>
        </div>
      </div>

      {/* Upload Status */}
      {statusMsg && (
        <div className={`p-4 rounded border flex items-center gap-3 ${
          statusMsg.type === 'success' 
            ? 'bg-hover/30 border-accent/20 text-accent font-mono' 
            : 'bg-red-950/20 border-red-800/40 text-red-400'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{statusMsg.text}</span>
        </div>
      )}

      {/* Parsed Output Structured View */}
      {parsedResume && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-8 animate-fadeIn">
          <div className="border-b border-border pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-accent font-mono">{parsedResume.name.toUpperCase()}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted">
                <span>Email: <strong className="text-text font-mono">{parsedResume.email}</strong></span>
                <span>Phone: <strong className="text-text font-mono">{parsedResume.phone}</strong></span>
              </div>
            </div>
            {parsedResume.links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {parsedResume.links.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.startsWith('http') ? link : `https://${link}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs border border-border bg-background px-3 py-1 rounded hover:border-accent hover:text-accent transition-all font-mono"
                  >
                    {link.replace(/(https?:\/\/)?(www\.)?/, '').split('/')[0]}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Grid Layout for details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Skills & Certs */}
            <div className="space-y-6 lg:col-span-1">
              <div>
                <h4 className="text-sm font-mono uppercase tracking-wider text-accent border-b border-border pb-2 mb-3">SKILLS</h4>
                <div className="flex flex-wrap gap-2">
                  {parsedResume.skills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="text-xs bg-background border border-border px-3 py-1 rounded text-text font-mono font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {parsedResume.certifications.length > 0 && (
                <div>
                  <h4 className="text-sm font-mono uppercase tracking-wider text-accent border-b border-border pb-2 mb-3">CERTIFICATIONS</h4>
                  <ul className="space-y-2">
                    {parsedResume.certifications.map((cert, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-accent shrink-0">▪</span>
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Exp, Proj, Edu */}
            <div className="space-y-8 lg:col-span-2">
              
              {/* Experience */}
              <div>
                <h4 className="text-sm font-mono uppercase tracking-wider text-accent border-b border-border pb-2 mb-4">EXPERIENCE</h4>
                <div className="space-y-6">
                  {parsedResume.experience.map((exp, idx) => (
                    <div key={idx} className="space-y-2 border-l border-border pl-4 relative">
                      <div className="absolute w-2 h-2 bg-accent rounded-full -left-[4.5px] top-1.5" />
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                        <h5 className="font-bold text-text">{exp.title}</h5>
                        <span className="text-xs text-accent font-mono">{exp.duration}</span>
                      </div>
                      <div className="text-xs text-muted font-mono">{exp.company}</div>
                      <ul className="list-disc pl-4 space-y-1 text-sm mt-2">
                        {exp.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="text-muted leading-relaxed">{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              {parsedResume.projects.length > 0 && (
                <div>
                  <h4 className="text-sm font-mono uppercase tracking-wider text-accent border-b border-border pb-2 mb-4">PROJECTS</h4>
                  <div className="space-y-6">
                    {parsedResume.projects.map((proj, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <h5 className="font-bold text-text">{proj.name}</h5>
                          <div className="flex gap-1.5">
                            {proj.tech.map((t, tIdx) => (
                              <span key={tIdx} className="text-[10px] bg-background border border-border px-2 py-0.5 rounded text-accent font-mono">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted leading-relaxed">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              <div>
                <h4 className="text-sm font-mono uppercase tracking-wider text-accent border-b border-border pb-2 mb-4">EDUCATION</h4>
                <div className="space-y-4">
                  {parsedResume.education.map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4">
                      <div>
                        <h5 className="font-bold text-text">{edu.degree}</h5>
                        <div className="text-xs text-muted mt-1 font-mono">{edu.institution}</div>
                      </div>
                      <span className="text-xs text-accent font-mono shrink-0">{edu.year}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
