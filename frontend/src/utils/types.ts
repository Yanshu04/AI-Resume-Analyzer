export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  tech: string[];
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: string[];
  links: string[];
}

export interface UploadResponse {
  message: string;
  file_path: string;
  filename: string;
}

export interface ScoreCategoryDetail {
  score: number;
  feedback: string;
}

export interface ScoreCategories {
  keywords: ScoreCategoryDetail;
  experience: ScoreCategoryDetail;
  skills: ScoreCategoryDetail;
  formatting: ScoreCategoryDetail;
  projects: ScoreCategoryDetail;
  education: ScoreCategoryDetail;
  achievements: ScoreCategoryDetail;
}

export interface ScoreResponse {
  overall_score: number;
  categories: ScoreCategories;
}

export interface KeywordImportanceDetail {
  keyword: string;
  importance: string;
  frequency_in_jd: number;
}

export interface MatchResponse {
  match_score: number;
  present_keywords: string[];
  missing_keywords: string[];
  keyword_importance: KeywordImportanceDetail[];
}

export interface WeakWordDetail {
  word: string;
  suggestion: string;
}

export interface GrammarResponse {
  weak_words: WeakWordDetail[];
  passive_voice: string[];
  repeated_words: string[];
  long_sentences: string[];
}

export interface ResumeMetricsDetail {
  ats_score: number;
  grammar_issues: number;
  keyword_coverage: number;
  avg_sentence_length: number;
  flesch_score: number;
  word_count: number;
  section_count: number;
}

export interface ComparativeWinners {
  ats_score_winner: string;
  grammar_issues_winner: string;
  keyword_coverage_winner: string;
  readability_winner: string;
  length_winner: string;
}

export interface CompareResponse {
  v1: ResumeMetricsDetail;
  v2: ResumeMetricsDetail;
  comparison: ComparativeWinners;
}

export interface SectionAuditItem {
  id: string;
  title: string;
  status: boolean;
  severity: string;
  suggestion: string;
}





