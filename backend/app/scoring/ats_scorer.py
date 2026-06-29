import re
import numpy as np
from typing import Dict, Any, List
from app.models.schemas import ParsedResume

# Try to load SentenceTransformer for semantic keyword matching
try:
    from sentence_transformers import SentenceTransformer
    # Eager load once at startup
    _model = SentenceTransformer('all-MiniLM-L6-v2')
    def get_embedding_model():
        return _model
except Exception:
    get_embedding_model = lambda: None

# Action verbs and metric keywords for scoring achievements
ACTION_VERBS = [
    "delivered", "designed", "developed", "built", "implemented", "optimized", "reduced", "increased",
    "saved", "led", "managed", "created", "spearheaded", "accelerated", "enhanced", "improved",
    "engineered", "architected", "automated", "streamlined", "transformed", "launched", "executed"
]

METRICS_KEYWORDS = [
    "%", "percent", "dollar", "usd", "$", "million", "billion", "hours", "monthly", "yearly",
    "reduced latency", "increased revenue", "accuracy", "speed", "conversion", "retention"
]

TARGET_JOB_PROFILE = (
    "Experienced Software Engineer, Full-Stack Developer, AI Engineer. Highly skilled in Python, "
    "JavaScript, TypeScript, React, FastAPI, Node.js, Next.js, and SQL databases. Experienced with "
    "Docker, AWS cloud deployment, Git version control, CI/CD pipelines, and writing clean, scalable code. "
    "Strong background in algorithms, systems design, API integration, and machine learning."
)

def calculate_ats_score(resume: ParsedResume) -> Dict[str, Any]:
    """
    Computes a detailed ATS score breakdown (0-100) and weighted overall score.
    """
    # 1. Keywords Score (via sentence-transformers semantic matching)
    keywords_score = 70  # Default fallback score
    keywords_feedback = "Your resume has standard industry keywords."
    
    # Concatenate resume text for comparison
    resume_corpus = f"{' '.join(resume.skills)} "
    for exp in resume.experience:
        resume_corpus += f"{exp.title} {exp.company} {' '.join(exp.bullets)} "
    for proj in resume.projects:
        resume_corpus += f"{proj.name} {proj.description} {' '.join(proj.tech)} "
        
    model = get_embedding_model()
    if model:
        try:
            # Semantic similarity between resume corpus and the target profile
            embeddings = model.encode([resume_corpus, TARGET_JOB_PROFILE])
            sim = np.dot(embeddings[0], embeddings[1]) / (np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1]))
            # Map cosine similarity (typically 0.2 to 0.8) to 0 - 100 range
            mapped_score = int(((sim - 0.15) / 0.65) * 100)
            keywords_score = min(100, max(30, mapped_score))
            if keywords_score >= 80:
                keywords_feedback = "Excellent keyword coverage! Your resume aligns highly with standard technical roles."
              
            elif keywords_score >= 50:
                keywords_feedback = "Moderate keyword coverage. Add more specific tech skills and industry-standard terms."
            else:
                keywords_feedback = "Low keyword matching. Incorporate core technical terms relevant to the target job."
        except Exception as e:
            keywords_feedback = f"Error in semantic scoring ({str(e)}). Fell back to keyword counting."
    else:
        # Fallback keyword matching
        matched_skills = [s for s in resume.skills if s.lower() in TARGET_JOB_PROFILE.lower()]
        ratio = len(matched_skills) / max(1, len(resume.skills))
        keywords_score = min(100, int(ratio * 100 + 40))
        keywords_feedback = "Semantic model unavailable. Keywords scored using exact matches."

    # 2. Experience Score
    exp_score = 0
    exp_feedback = ""
    num_jobs = len(resume.experience)
    
    if num_jobs == 0:
        exp_score = 0
        exp_feedback = "No professional experience listed. Consider adding internships, volunteering, or projects."
    else:
        # Base points for job count
        exp_score += min(50, num_jobs * 20)
        
        # Points for bullet details
        avg_bullets = sum(len(job.bullets) for job in resume.experience) / num_jobs
        if avg_bullets >= 3:
            exp_score += 30
        elif avg_bullets >= 1:
            exp_score += 15
            
        # Check for duration details
        has_duration = all(job.duration for job in resume.experience)
        if has_duration:
            exp_score += 20
            
        exp_score = min(100, exp_score)
        if exp_score >= 80:
            exp_feedback = "Strong experience section with multiple roles and detailed descriptions."
        elif exp_score >= 50:
            exp_feedback = "Good experience base. Expand your bullet points to show your responsibilities."
        else:
            exp_feedback = "Weak experience section. Detail your professional history and list key contributions."

    # 3. Skills Score
    skills_score = 0
    skills_feedback = ""
    num_skills = len(resume.skills)
    
    if num_skills == 0:
        skills_score = 0
        skills_feedback = "No skills listed. You must add a technical skills section."
    else:
        # Points based on number of skills listed
        skills_score = min(100, num_skills * 7)
        if skills_score >= 80:
            skills_feedback = "Comprehensive skills inventory. Broad range of technical competencies listed."
        elif skills_score >= 50:
            skills_feedback = "Adequate skills list. Add more specialized libraries, frameworks, or tools."
        else:
            skills_feedback = "Too few skills. Expand your skills section to cover core tools and methodologies."

    # 4. Formatting Score
    format_score = 100
    format_issues = []
    
    # Check contact fields
    if not resume.name or resume.name == "John Doe":
        format_score -= 15
        format_issues.append("Name is generic or missing.")
    if not resume.email or "@" not in resume.email:
        format_score -= 15
        format_issues.append("Email is missing or invalid.")
    if not resume.phone:
        format_score -= 10
        format_issues.append("Phone number is missing.")
    if not resume.links:
        format_score -= 10
        format_issues.append("Consider adding links to LinkedIn or GitHub.")
        
    # Check bullet density
    long_bullets = 0
    for job in resume.experience:
        for bullet in job.bullets:
            if len(bullet.split()) > 35:
                long_bullets += 1
                
    if long_bullets > 2:
        format_score -= 15
        format_issues.append("Some bullet points are too long. Keep them under 30 words.")
        
    format_score = max(30, format_score)
    if format_score >= 85:
        format_feedback = "Excellent formatting! Clean structure, complete contact details, and readable layout."
    else:
        format_feedback = f"Formatting issues detected: {'; '.join(format_issues)}"

    # 5. Projects Score
    proj_score = 0
    proj_feedback = ""
    num_projects = len(resume.projects)
    
    if num_projects == 0:
        proj_score = 0
        proj_feedback = "No projects listed. Adding personal or academic projects boosts your score."
    else:
        proj_score += min(60, num_projects * 30)
        # Check if technology tags are specified
        has_tech = all(len(p.tech) > 0 for p in resume.projects)
        if has_tech:
            proj_score += 40
            
        proj_score = min(100, proj_score)
        if proj_score >= 80:
            proj_feedback = "Great projects section detailing tools and implementation context."
        else:
            proj_feedback = "Add technology tags to all your projects to highlight tool proficiency."

    # 6. Education Score
    edu_score = 0
    edu_feedback = ""
    
    if len(resume.education) == 0:
        edu_score = 0
        edu_feedback = "No education details found. Please list your academic background."
    else:
        # Check degrees and details
        edu_score += 60
        has_details = all(edu.degree and edu.institution and edu.year for edu in resume.education)
        if has_details:
            edu_score += 40
            
        edu_score = min(100, edu_score)
        if edu_score >= 80:
            edu_feedback = "Education credentials are clear and fully detailed."
        else:
            edu_feedback = "Provide complete details (institution, graduation year) for all listed degrees."

    # 7. Achievements Score
    ach_score = 0
    ach_feedback = ""
    
    # Check for metrics and action verbs in bullet points
    verb_matches = 0
    metric_matches = 0
    
    corpus_lower = resume_corpus.lower()
    
    for verb in ACTION_VERBS:
        if re.search(rf"\b{re.escape(verb)}\b", corpus_lower):
            verb_matches += 1
            
    for metric in METRICS_KEYWORDS:
        if metric in corpus_lower:
            metric_matches += 1
            
    # Calculate score based on findings
    ach_score = min(100, (verb_matches * 10) + (metric_matches * 15))
    
    if ach_score >= 75:
        ach_feedback = "Exceptional result-oriented phrasing. Good use of action verbs and quantifiable metrics."
    elif ach_score >= 40:
        ach_feedback = "Good action verbs. Try to quantify your results with percentages, savings, or numbers."
    else:
        ach_feedback = "Your bullets focus on duties rather than results. Add action verbs and measurable metrics."

    # 8. Weighted Overall Score
    # Keywords: 20%, Experience: 20%, Skills: 15%, Formatting: 10%, Projects: 15%, Education: 10%, Achievements: 10%
    overall_score = int(
        (keywords_score * 0.20) +
        (exp_score * 0.20) +
        (skills_score * 0.15) +
        (format_score * 0.10) +
        (proj_score * 0.15) +
        (edu_score * 0.10) +
        (ach_score * 0.10)
    )
    
    return {
        "overall_score": overall_score,
        "categories": {
            "keywords": {"score": keywords_score, "feedback": keywords_feedback},
            "experience": {"score": exp_score, "feedback": exp_feedback},
            "skills": {"score": skills_score, "feedback": skills_feedback},
            "formatting": {"score": format_score, "feedback": format_feedback},
            "projects": {"score": proj_score, "feedback": proj_feedback},
            "education": {"score": edu_score, "feedback": edu_feedback},
            "achievements": {"score": ach_score, "feedback": ach_feedback}
        }
    }
