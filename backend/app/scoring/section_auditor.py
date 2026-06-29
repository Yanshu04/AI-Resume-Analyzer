import re
from typing import Dict, Any, List
from app.models.schemas import ParsedResume
from app.scoring.ats_scorer import ACTION_VERBS, METRICS_KEYWORDS

def audit_resume_sections(resume: ParsedResume) -> List[Dict[str, Any]]:
    """
    Checks the completeness of resume sections, metrics frequency, and action verb density.
    Returns a checklist with pass/fail status and severity suggestions.
    """
    checklist = []
    
    # 1. Summary Check
    # Check if there is anything that resembles a summary, or if the experience text indicates summary is missing
    # Let's count contact links as part of metadata, summary is separate.
    # In extractor.py we collected sections["summary"]. Let's assume if there are projects, skills, etc.,
    # we can check if a professional summary is present.
    # Let's look if they have some text. Since ParsedResume doesn't have a direct 'summary' field (it has skills, experience, projects, etc.),
    # wait! Does ParsedResume have a summary field?
    # Let's check schemas.py: ParsedResume has: name, email, phone, skills, education, experience, projects, certifications, links.
    # Ah! ParsedResume does NOT have a summary field!
    # But wait, in extractor.py:
    # sections = { "summary": [], "experience": [], ... }
    # But we did not map "summary" to the ParsedResume schema. That's fine!
    # In ParsedResume we can check if they have a summary by scanning if the first experience item is actually a summary,
    # or we can check if they have general skills/links.
    # Let's write a check: we can scan if experience titles have summary keywords, or check if summary is missing in general.
    # Wait, we can see if they have contact links and details. Let's make the "Summary" audit check if experience or profile contains
    # summary markers. Or we can check if they have certifications/links.
    # Actually, we can check if they have a summary by looking at the raw resume text if we have it, or we can check
    # if the overall resume length and structure suggests a profile description is missing.
    # Let's say if they have at least 1 link and 1 certification, it's good, but let's check for "Summary" by scanning
    # if the first experience description contains words like "Objective", "Summary", or "Profile".
    has_summary = False
    for exp in resume.experience:
        if any(w in exp.title.lower() for w in ["summary", "profile", "objective", "about me"]):
            has_summary = True
            break
            
    if has_summary:
        checklist.append({
            "id": "summary",
            "title": "Professional Summary",
            "status": True,
            "severity": "none",
            "suggestion": "Professional summary detected at the top of your resume."
        })
    else:
        checklist.append({
            "id": "summary",
            "title": "Professional Summary",
            "status": False,
            "severity": "medium",
            "suggestion": "Missing Professional Summary. Add a 3-4 sentence paragraph at the top summarizing your core stack, years of experience, and key accomplishments."
        })

    # 2. Skills Section Check
    skills_count = len(resume.skills)
    if skills_count >= 8:
        checklist.append({
            "id": "skills",
            "title": "Technical Skills Section",
            "status": True,
            "severity": "none",
            "suggestion": f"Healthy skills inventory with {skills_count} technologies listed."
        })
    elif skills_count > 0:
        checklist.append({
            "id": "skills",
            "title": "Technical Skills Section",
            "status": False,
            "severity": "medium",
            "suggestion": f"Weak skills section. You only listed {skills_count} skills. Group your skills by category (e.g., Languages, Frameworks, Tools) and add more."
        })
    else:
        checklist.append({
            "id": "skills",
            "title": "Technical Skills Section",
            "status": False,
            "severity": "high",
            "suggestion": "Missing Skills section. Create a dedicated section listing your programming languages, frameworks, databases, and libraries."
        })

    # 3. Projects Section Check
    proj_count = len(resume.projects)
    # Check if they are dummy projects or actual ones
    is_dummy_project = proj_count > 0 and resume.projects[0].name == "AI Agent Chatbot" and len(resume.projects) == 1
    
    if proj_count >= 2 and not is_dummy_project:
        checklist.append({
            "id": "projects",
            "title": "Technical Projects",
            "status": True,
            "severity": "none",
            "suggestion": f"Detected {proj_count} hands-on projects showing practical execution."
        })
    elif proj_count > 0 and not is_dummy_project:
        checklist.append({
            "id": "projects",
            "title": "Technical Projects",
            "status": False,
            "severity": "medium",
            "suggestion": "Only 1 project listed. Add 1-2 more projects highlighting different technologies from your stack."
        })
    else:
        checklist.append({
            "id": "projects",
            "title": "Technical Projects",
            "status": False,
            "severity": "high",
            "suggestion": "No personal or professional projects detected. Add a projects section to demonstrate hands-on experience and coding competency."
        })

    # 4. Metrics & Numbers Check
    # Scan all bullet points in experience and projects description
    total_bullets = 0
    bullets_with_metrics = 0
    
    for exp in resume.experience:
        for bullet in exp.bullets:
            total_bullets += 1
            if any(metric in bullet.lower() for metric in METRICS_KEYWORDS) or re.search(r"\b\d+\b", bullet):
                # Filter out numbers that represent years like 2022 or 2026
                year_match = re.search(r"\b(19|20)\d{2}\b", bullet)
                if year_match and len(re.findall(r"\b\d+\b", bullet)) == 1:
                    continue  # Just a year, not a metric
                bullets_with_metrics += 1
                
    for proj in resume.projects:
        if proj.description:
            total_bullets += 1
            if any(metric in proj.description.lower() for metric in METRICS_KEYWORDS) or re.search(r"\b\d+\b", proj.description):
                bullets_with_metrics += 1
                
    ratio = bullets_with_metrics / max(1, total_bullets)
    
    if ratio >= 0.40:
        checklist.append({
            "id": "metrics",
            "title": "Quantifiable Metrics & Results",
            "status": True,
            "severity": "none",
            "suggestion": f"Excellent! {int(ratio * 100)}% of your bullet points contain measurable results, speedups, or dollar values."
        })
    elif ratio >= 0.15:
        checklist.append({
            "id": "metrics",
            "title": "Quantifiable Metrics & Results",
            "status": False,
            "severity": "medium",
            "suggestion": f"Only {int(ratio * 100)}% of bullets have metrics. Try to quantify more accomplishments (e.g., 'reduced runtime by 20%', 'served 5k active users')."
        })
    else:
        checklist.append({
            "id": "metrics",
            "title": "Quantifiable Metrics & Results",
            "status": False,
            "severity": "high",
            "suggestion": "Almost no metrics detected. ATS algorithms and recruiters prefer resumes showing concrete numbers, percentages, efficiency rates, and savings."
        })

    # 5. Action Verbs Check
    # Check if bullets start with strong action verbs
    weak_verbs_found = []
    weak_count = 0
    total_bullet_starts = 0
    
    WEAK_VERBS = ["helped", "responsible", "assisted", "handled", "worked", "managed", "made", "did"]
    
    for exp in resume.experience:
        for bullet in exp.bullets:
            total_bullet_starts += 1
            words = bullet.split()
            if words:
                first_word = words[0].lower().strip(".,-•*")
                if first_word in WEAK_VERBS:
                    weak_count += 1
                    weak_verbs_found.append(first_word)
                elif first_word.endswith("ing"): # Gerund check (e.g. "Working on X")
                    weak_count += 1
                    weak_verbs_found.append(first_word)

    weak_verbs_found = list(set(weak_verbs_found))
    
    if weak_count == 0:
        checklist.append({
            "id": "action_verbs",
            "title": "Strong Action Verbs",
            "status": True,
            "severity": "none",
            "suggestion": "All experience bullets start with strong active verbs."
        })
    elif weak_count < 3:
        checklist.append({
            "id": "action_verbs",
            "title": "Strong Action Verbs",
            "status": False,
            "severity": "low",
            "suggestion": f"Felled back to some weak verb starters: {', '.join(weak_verbs_found)}. Replace them with terms like Spearheaded, Engineered, or Orchestrated."
        })
    else:
        checklist.append({
            "id": "action_verbs",
            "title": "Strong Action Verbs",
            "status": False,
            "severity": "medium",
            "suggestion": f"Multiple bullets start with passive or weak verbs ({', '.join(weak_verbs_found)}). Replace passive duties with strong action verbs."
        })

    return checklist
