from pydantic import BaseModel, Field
from typing import List, Optional

class EducationItem(BaseModel):
    degree: str
    institution: str
    year: str

class ExperienceItem(BaseModel):
    title: str
    company: str
    duration: str
    bullets: List[str]

class ProjectItem(BaseModel):
    name: str
    description: str
    tech: List[str]

class ParsedResume(BaseModel):
    name: str
    email: str
    phone: str
    skills: List[str]
    education: List[EducationItem]
    experience: List[ExperienceItem]
    projects: List[ProjectItem]
    certifications: List[str]
    links: List[str]

class ParseRequest(BaseModel):
    file_path: str

class ScoreCategoryDetail(BaseModel):
    score: int
    feedback: str

class ScoreCategories(BaseModel):
    keywords: ScoreCategoryDetail
    experience: ScoreCategoryDetail
    skills: ScoreCategoryDetail
    formatting: ScoreCategoryDetail
    projects: ScoreCategoryDetail
    education: ScoreCategoryDetail
    achievements: ScoreCategoryDetail

class ScoreResponse(BaseModel):
    overall_score: int
    categories: ScoreCategories

class MatchRequest(BaseModel):
    resume: ParsedResume
    jd_text: str

class KeywordImportanceDetail(BaseModel):
    keyword: str
    importance: str
    frequency_in_jd: int

class MatchResponse(BaseModel):
    match_score: int
    present_keywords: List[str]
    missing_keywords: List[str]
    keyword_importance: List[KeywordImportanceDetail]

class ImproveRequest(BaseModel):
    bullet: str

class ImproveResponse(BaseModel):
    improved: str

class RewriteRequest(BaseModel):
    experience: str
    style: str

class RewriteResponse(BaseModel):
    rewritten: str

class WeakWordDetail(BaseModel):
    word: str
    suggestion: str

class GrammarRequest(BaseModel):
    text: str

class GrammarResponse(BaseModel):
    weak_words: List[WeakWordDetail]
    passive_voice: List[str]
    repeated_words: List[str]
    long_sentences: List[str]

class AchievementRequest(BaseModel):
    accomplishment: str

class AchievementResponse(BaseModel):
    expanded: str

class SkillsGapRequest(BaseModel):
    resume: ParsedResume
    jd_text: str

class SkillsGapResponse(BaseModel):
    current_skills: List[str]
    missing_skills: List[str]
    recommended_skills: List[str]

class KeywordDensityResponse(BaseModel):
    keyword: str
    count: int

class CompareRequest(BaseModel):
    v1: ParsedResume
    v2: ParsedResume

class ResumeMetricsDetail(BaseModel):
    ats_score: int
    grammar_issues: int
    keyword_coverage: int
    avg_sentence_length: float
    flesch_score: float
    word_count: int
    section_count: int

class ComparativeWinners(BaseModel):
    ats_score_winner: str
    grammar_issues_winner: str
    keyword_coverage_winner: str
    readability_winner: str
    length_winner: str

class CompareResponse(BaseModel):
    v1: ResumeMetricsDetail
    v2: ResumeMetricsDetail
    comparison: ComparativeWinners

class SectionAuditItem(BaseModel):
    id: str
    title: str
    status: bool
    severity: str
    suggestion: str

class ExportRequest(BaseModel):
    resume: ParsedResume
    format: str




