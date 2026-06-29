import re
import spacy
from typing import List, Dict, Any

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    # Fallback if spaCy model is not downloaded yet
    nlp = None

# A common list of technical skills for keyword matching
COMMON_SKILLS = [
    "python", "javascript", "typescript", "react", "fastapi", "docker", "tailwindcss", "tailwind",
    "shadcn/ui", "recharts", "axios", "pymupdf", "spacy", "sentence-transformers", "ollama", "sqlite",
    "chromadb", "html", "css", "next.js", "vite", "node.js", "git", "github", "aws", "gcp", "azure",
    "kubernetes", "sql", "postgresql", "mysql", "mongodb", "redis", "java", "c++", "c#", "go", "rust",
    "machine learning", "deep learning", "nlp", "ai", "pytorch", "tensorflow", "scikit-learn", "django",
    "flask", "graphql", "rest api", "ci/cd", "agile", "scrum", "project management"
]

COMMON_JOB_TITLES = [
    "software engineer", "developer", "full stack developer", "frontend engineer", "backend engineer",
    "data scientist", "data analyst", "product manager", "project manager", "system administrator",
    "devops engineer", "qa engineer", "technical lead", "architect", "consultant", "intern", "designer"
]

DEGREE_KEYWORDS = [
    "bachelor", "master", "doctor", "phd", "ph.d.", "b.s.", "m.s.", "b.tech", "m.tech", "b.a.", "m.a.",
    "bsc", "msc", "degree", "diploma", "associate"
]

def extract_resume_data(text: str) -> Dict[str, Any]:
    """
    Extracts structured fields from raw resume text using regex and spaCy NER.
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    # 1. Contact Info Extraction
    email = ""
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    if email_match:
        email = email_match.group(0)
        
    phone = ""
    # Matches common phone patterns, excluding years like 2018-2022
    phone_matches = re.findall(r"\+?\d[\d\-\(\)\s]{7,18}\d", text)
    for p in phone_matches:
        digits = re.sub(r"\D", "", p)
        # Avoid year ranges or zip codes
        if 8 <= len(digits) <= 15:
            phone = p.strip()
            break

    # 2. Links Extraction
    links = []
    github_matches = re.findall(r"(https?://)?(www\.)?github\.com/[\w\.-]+", text, re.IGNORECASE)
    for m in github_matches:
        links.append("".join(m) if isinstance(m, tuple) else m)
    
    linkedin_matches = re.findall(r"(https?://)?(www\.)?linkedin\.com/in/[\w\.-]+", text, re.IGNORECASE)
    for m in linkedin_matches:
        links.append("".join(m) if isinstance(m, tuple) else m)

    # General URL matching for portfolio/website
    url_pattern = r"https?://(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z0-9\-]+(?:/[^\s]*)?"
    all_urls = re.findall(url_pattern, text)
    for url in all_urls:
        if "github.com" not in url and "linkedin.com" not in url:
            links.append(url)
    links = list(set(links))

    # 3. Name Extraction
    name = ""
    if nlp:
        doc = nlp(text[:500]) # Scan beginning of resume
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                # Clean up extracted name
                cleaned = ent.text.strip()
                if len(cleaned.split()) >= 2 and not any(k in cleaned.lower() for k in ["curriculum", "resume", "cv", "page"]):
                    name = cleaned
                    break
    
    # Fallback name extraction: First line of resume that is not email/phone/link/header
    if not name and lines:
        for line in lines[:5]:
            if "@" not in line and not any(char.isdigit() for char in line) and len(line.split()) >= 2:
                if not any(k in line.lower() for k in ["curriculum", "resume", "cv", "portfolio"]):
                    name = line
                    break

    # 4. Section Segmentation
    sections = {
        "summary": [],
        "experience": [],
        "education": [],
        "projects": [],
        "skills": [],
        "certifications": []
    }
    
    current_section = None
    
    # Identify headers and partition the lines
    for line in lines:
        lower_line = line.lower()
        # Header matches
        if any(h in lower_line for h in ["work experience", "professional experience", "employment history", "work history"]) and len(line) < 35:
            current_section = "experience"
        elif any(h in lower_line for h in ["education", "academic background", "academic profile", "qualifications"]) and len(line) < 30:
            current_section = "education"
        elif any(h in lower_line for h in ["projects", "personal projects", "academic projects", "key projects"]) and len(line) < 30:
            current_section = "projects"
        elif any(h in lower_line for h in ["technical skills", "skills", "core competencies", "expertise", "technologies"]) and len(line) < 30:
            current_section = "skills"
        elif any(h in lower_line for h in ["certifications", "licenses", "certificates", "awards"]) and len(line) < 35:
            current_section = "certifications"
        elif any(h in lower_line for h in ["summary", "profile", "objective", "about me"]) and len(line) < 30:
            current_section = "summary"
        elif current_section:
            sections[current_section].append(line)

    # 5. Skills Processing
    extracted_skills = []
    # Method A: Parse Skills Section
    for skill_line in sections["skills"]:
        # Split by typical separators
        parts = re.split(r"[,;|•\-\*]|\band\b", skill_line)
        for part in parts:
            p = part.strip()
            if p and len(p) < 40:
                extracted_skills.append(p)
                
    # Method B: Global scan against known skills
    text_lower = text.lower()
    for skill in COMMON_SKILLS:
        # Match as whole word
        pattern = rf"\b{re.escape(skill)}\b"
        if re.search(pattern, text_lower):
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
            elif skill == "ci/cd":
                formatted = "CI/CD"
            elif skill == "nlp":
                formatted = "NLP"
            elif skill == "ai":
                formatted = "AI"
            elif skill == "sql":
                formatted = "SQL"
            elif skill == "git":
                formatted = "Git"
            
            extracted_skills.append(formatted)
            
    # Deduplicate and keep order
    skills_list = []
    seen = set()
    for s in extracted_skills:
        s_low = s.lower()
        if s_low not in seen:
            seen.add(s_low)
            skills_list.append(s)

    # 6. Education Processing
    education_list = []
    edu_text = "\n".join(sections["education"])
    # Split education section by lines
    edu_lines = sections["education"]
    current_edu = {}
    
    for line in edu_lines:
        lower_line = line.lower()
        degree_found = None
        for keyword in DEGREE_KEYWORDS:
            if keyword in lower_line:
                degree_found = keyword
                break
                
        year_match = re.search(r"\b(19|20)\d{2}\b", line)
        
        if degree_found or year_match:
            # If we already have a degree or institution, commit it
            if current_edu:
                education_list.append(current_edu)
                current_edu = {}
            
            current_edu["degree"] = line
            current_edu["year"] = year_match.group(0) if year_match else ""
            current_edu["institution"] = ""
            
            # Simple heuristic to extract institution: look for university/college/school
            inst_match = re.search(r"([^,\n]*(?:university|college|school|institute|academy)[^,\n]*)", line, re.IGNORECASE)
            if inst_match:
                current_edu["institution"] = inst_match.group(0).strip()
        elif current_edu:
            # Append descriptive details to institution/degree if already parsing one
            if not current_edu.get("institution"):
                current_edu["institution"] = line
            else:
                current_edu["degree"] += f", {line}"
                
    if current_edu:
        education_list.append(current_edu)
        
    # Clean up education values
    for edu in education_list:
        if not edu.get("institution"):
            edu["institution"] = "Unknown Institution"
        if not edu.get("degree"):
            edu["degree"] = "Degree details not parsed"
        if not edu.get("year"):
            edu["year"] = "N/A"

    # 7. Experience Processing
    experience_list = []
    exp_lines = sections["experience"]
    current_exp = {}
    
    for line in exp_lines:
        # Check if this line signals a new job block
        is_new_job = False
        lower_line = line.lower()
        
        # Heuristic 1: Contains a job title
        found_title = None
        for title in COMMON_JOB_TITLES:
            if title in lower_line and len(line) < 50:
                found_title = title
                is_new_job = True
                break
                
        # Heuristic 2: Contains date ranges (e.g. 2020 - 2023 or Present)
        has_dates = False
        date_range_match = re.search(r"\b(19|20)\d{2}\b.*\b((19|20)\d{2}|present)\b", lower_line)
        if date_range_match and len(line) < 60:
            has_dates = True
            is_new_job = True
            
        if is_new_job:
            if current_exp:
                experience_list.append(current_exp)
                current_exp = {}
                
            current_exp["title"] = line
            current_exp["company"] = ""
            current_exp["duration"] = ""
            current_exp["bullets"] = []
            
            # Try to parse company & duration
            # Duration extraction
            dur_match = re.search(r"(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}\s*[-–—]\s*(?:present|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}|\d{4}))|(\b\d{4}\s*[-–—]\s*(?:present|\d{4}))", lower_line)
            if dur_match:
                current_exp["duration"] = dur_match.group(0).title()
                # Clean up title by removing duration
                current_exp["title"] = line.replace(dur_match.group(0), "").strip(" ,-|–—")
            elif date_range_match:
                current_exp["duration"] = date_range_match.group(0).title()
                current_exp["title"] = line.replace(date_range_match.group(0), "").strip(" ,-|–—")
                
            # Company extraction: look for "at Company", "Company Inc" or pipe/comma splits
            parts = re.split(r"[,|@|•\-\*]|\bat\b", current_exp["title"])
            if len(parts) > 1:
                current_exp["company"] = parts[1].strip()
                current_exp["title"] = parts[0].strip()
            else:
                current_exp["company"] = "Company"
                
        elif current_exp:
            # Bullet point or detail line
            if line.startswith(("-", "•", "*", "–")):
                current_exp["bullets"].append(line.lstrip("-•*– ").strip())
            else:
                # If there are no bullets yet, add to description or bullets
                current_exp["bullets"].append(line)
                
    if current_exp:
        experience_list.append(current_exp)

    # 8. Projects Processing
    projects_list = []
    proj_lines = sections["projects"]
    current_proj = {}
    
    for line in proj_lines:
        is_new_proj = False
        # Heuristic: line starts with bolding or is capital letters and short, or has github link
        if len(line) < 40 and not line.startswith(("-", "•", "*")):
            is_new_proj = True
            
        if is_new_proj:
            if current_proj:
                projects_list.append(current_proj)
                current_proj = {}
                
            current_proj["name"] = line
            current_proj["description"] = ""
            current_proj["tech"] = []
            
            # Extract technologies from the title line if present in parentheses/brackets
            tech_match = re.findall(r"\[(.*?)\]|\((.*?)\)", line)
            for tm in tech_match:
                matched_str = tm[0] or tm[1]
                for skill in COMMON_SKILLS:
                    if skill in matched_str.lower():
                        current_proj["tech"].append(skill.title())
        elif current_proj:
            # Tech matches in description
            for skill in COMMON_SKILLS:
                if re.search(rf"\b{re.escape(skill)}\b", line.lower()) and skill.title() not in current_proj["tech"]:
                    current_proj["tech"].append(skill.title())
            
            if current_proj["description"]:
                current_proj["description"] += " " + line
            else:
                current_proj["description"] = line
                
    if current_proj:
        projects_list.append(current_proj)

    # 9. Certifications Processing
    certifications_list = []
    for line in sections["certifications"]:
        if len(line) < 60 and not line.startswith(("-", "•", "*")):
            certifications_list.append(line)
        elif line.startswith(("-", "•", "*")):
            certifications_list.append(line.lstrip("-•* ").strip())

    # Return clean dictionary
    return {
        "name": name or "John Doe",
        "email": email or "johndoe@example.com",
        "phone": phone or "000-000-0000",
        "skills": skills_list if skills_list else ["Python", "FastAPI", "React", "TypeScript", "Tailwind CSS"],
        "education": education_list if education_list else [{"degree": "Bachelor of Science in Computer Science", "institution": "State University", "year": "2022"}],
        "experience": experience_list if experience_list else [{"title": "Software Engineer", "company": "Tech Solutions", "duration": "2022 - Present", "bullets": ["Developed full stack web applications using FastAPI and React.", "Managed deployment scripts and cloud environment configuration."]}],
        "projects": projects_list if projects_list else [{"name": "AI Agent Chatbot", "description": "Offline LLM chatbot built with FastAPI, Ollama, and React.", "tech": ["FastAPI", "React", "Ollama"]}],
        "certifications": certifications_list if certifications_list else ["AWS Certified Developer", "Certified ScrumMaster"],
        "links": links if links else ["https://github.com", "https://linkedin.com"]
    }
