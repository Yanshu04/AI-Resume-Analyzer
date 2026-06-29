import re
from typing import Dict, Any, List
from app.models.schemas import ParsedResume
from app.parsers.extractor import COMMON_SKILLS

RECOMMENDATION_MAP = {
    "python": ["FastAPI", "Pandas", "NumPy", "PyTest"],
    "react": ["TypeScript", "Next.js", "Redux", "Tailwind CSS"],
    "fastapi": ["Docker", "PostgreSQL", "SQLAlchemy", "Pydantic"],
    "javascript": ["TypeScript", "Node.js", "React", "Express"],
    "typescript": ["React", "Next.js", "Node.js", "ESLint"],
    "docker": ["Kubernetes", "AWS", "CI/CD", "GitHub Actions"],
    "sql": ["PostgreSQL", "Redis", "Database Indexing", "Prisma"],
    "machine learning": ["PyTorch", "TensorFlow", "Scikit-Learn", "MLflow"],
    "deep learning": ["PyTorch", "TensorFlow", "Computer Vision", "NLP"]
}

def compute_skills_gap(resume: ParsedResume, jd_text: str) -> Dict[str, Any]:
    """
    Compares resume skills with skills extracted from the job description.
    """
    jd_lower = jd_text.lower()
    jd_skills = []
    
    # Extract skills from job description
    for skill in COMMON_SKILLS:
        pattern = rf"\b{re.escape(skill)}\b"
        if re.search(pattern, jd_lower):
            # Format nicely
            formatted = skill.title()
            if skill in ["react", "fastapi", "tailwindcss", "sqlite", "chromadb", "html", "css", "vite", "aws", "gcp"]:
                formatted = skill.replace("fastapi", "FastAPI").replace("react", "React").replace("tailwindcss", "Tailwind CSS").replace("sqlite", "SQLite").replace("chromadb", "ChromaDB").replace("html", "HTML").replace("css", "CSS").replace("vite", "Vite").replace("aws", "AWS").replace("gcp", "GCP")
            elif skill == "typescript":
                formatted = "TypeScript"
            elif skill == "javascript":
                formatted = "JavaScript"
            elif skill == "node.js":
                formatted = "Node.js"
            elif skill == "next.js":
                formatted = "Next.js"
            
            jd_skills.append(formatted)
            
    # Compute current and missing skills
    resume_skills_lower = {s.lower() for s in resume.skills}
    missing_skills = [s for s in jd_skills if s.lower() not in resume_skills_lower]
    
    # Generate recommended skills based on matches
    recommended_set = set()
    for skill in jd_skills:
        skill_low = skill.lower()
        if skill_low in RECOMMENDATION_MAP:
            for rec in RECOMMENDATION_MAP[skill_low]:
                if rec.lower() not in resume_skills_lower:
                    recommended_set.add(rec)
                    
    # Fallback recommendations if set is empty
    if not recommended_set:
        recommended_set.update(["Git", "Docker", "REST APIs", "CI/CD"])
        
    return {
        "current_skills": resume.skills,
        "missing_skills": missing_skills,
        "recommended_skills": list(recommended_set)[:8]  # limit to top 8 recommendations
    }

def compute_keyword_density(resume: ParsedResume) -> List[Dict[str, Any]]:
    """
    Calculates term frequencies in the resume corpus, filtering out standard English stopwords.
    """
    # 1. Build resume text corpus
    resume_text = f"{' '.join(resume.skills)} "
    for exp in resume.experience:
        resume_text += f"{exp.title} {exp.company} {' '.join(exp.bullets)} "
    for proj in resume.projects:
        resume_text += f"{proj.name} {proj.description} {' '.join(proj.tech)} "
    for edu in resume.education:
        resume_text += f"{edu.degree} {edu.institution} "
    for cert in resume.certifications:
        resume_text += f"{cert} "
        
    # Clean text: keep alphanumeric and convert to lowercase
    words = re.findall(r"\b[a-zA-Z]{3,20}\b", resume_text.lower())
    
    # Common English stopwords
    stopwords = {
        "and", "the", "for", "with", "that", "this", "our", "you", "your", "are", "was", "were",
        "been", "have", "had", "has", "from", "but", "not", "their", "them", "they", "will", "would",
        "can", "about", "which", "there", "their", "some", "other", "into", "these", "using", "used",
        "implemented", "developed", "built", "managed", "designed", "created", "led", "assisted",
        "responsible", "duties", "role", "key", "working", "work", "project", "projects", "team"
    }
    
    # Filter stopwords
    filtered_words = [w for w in words if w not in stopwords]
    
    # Count frequencies
    freq = {}
    for w in filtered_words:
        # Title case for formatting in graphs
        title_word = w.title()
        # Handle technical formatting abbreviations
        if w in ["sql", "aws", "gcp", "api", "css", "xml", "git", "npm", "ssl"]:
            title_word = w.upper()
        elif w == "fastapi":
            title_word = "FastAPI"
        elif w == "typescript":
            title_word = "TypeScript"
        elif w == "javascript":
            title_word = "JavaScript"
            
        freq[title_word] = freq.get(title_word, 0) + 1
        
    # Sort descending
    sorted_freq = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    
    # Format response as list of dicts
    return [{"keyword": k, "count": c} for k, c in sorted_freq[:15]]  # Return top 15 keywords
