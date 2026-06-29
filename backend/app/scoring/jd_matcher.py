import re
import numpy as np
from typing import Dict, Any, List, Tuple
from app.models.schemas import ParsedResume

# Try to load spaCy and SentenceTransformer
try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None

try:
    from sentence_transformers import SentenceTransformer
    # Eager load once at startup
    _model = SentenceTransformer('all-MiniLM-L6-v2')
    def get_embedding_model():
        return _model
except Exception:
    get_embedding_model = lambda: None

GENERIC_STOPWORDS = {
    "experience", "role", "team", "company", "candidate", "responsibilities", "requirements",
    "work", "job", "development", "ability", "skills", "knowledge", "design", "year", "years",
    "business", "technology", "support", "management", "client", "customer", "project", "product",
    "professional", "position", "opportunity", "application", "environment", "system", "systems",
    "process", "processes", "tools", "service", "services", "team", "members", "member", "solutions",
    "tasks", "needs", "qualifications", "education", "degree", "field", "industry", "office", "duties"
}

def extract_jd_keywords(jd_text: str) -> List[Tuple[str, int]]:
    """
    Extracts key technical terms and important noun keywords from the job description
    and counts their frequency to determine importance.
    """
    words = []
    
    # 1. Direct regex scan of known technical skills (to ensure accuracy for tech terms)
    from app.parsers.extractor import COMMON_SKILLS
    jd_lower = jd_text.lower()
    for skill in COMMON_SKILLS:
        pattern = rf"\b{re.escape(skill)}\b"
        matches = len(re.findall(pattern, jd_lower))
        if matches > 0:
            words.append((skill.title(), matches))
            
    # 2. Extract general nouns/proper nouns using spaCy if available
    if nlp:
        doc = nlp(jd_text)
        general_nouns = {}
        for token in doc:
            if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop:
                word = token.text.strip().lower()
                # Clean up word
                word = re.sub(r"[^\w\+\-#]", "", word)
                if len(word) > 2 and word not in GENERIC_STOPWORDS and not word.isdigit():
                    # Format title-case
                    title_word = word.title()
                    # Skip if we already captured it in skills
                    if not any(title_word.lower() == s[0].lower() for s in words):
                        general_nouns[title_word] = general_nouns.get(title_word, 0) + 1
                        
        for word, count in general_nouns.items():
            words.append((word, count))
    else:
        # Simple regex split fallback
        raw_words = re.findall(r"\b[a-zA-Z\+\-#]{3,20}\b", jd_lower)
        fallback_nouns = {}
        for w in raw_words:
            if w not in GENERIC_STOPWORDS and len(w) > 2:
                title_word = w.title()
                if not any(title_word.lower() == s[0].lower() for s in words):
                    fallback_nouns[title_word] = fallback_nouns.get(title_word, 0) + 1
        for word, count in fallback_nouns.items():
            words.append((word, count))

    # Sort descending by count/importance
    words.sort(key=lambda x: x[1], reverse=True)
    return words

def match_job_description(resume: ParsedResume, jd_text: str) -> Dict[str, Any]:
    """
    Matches parsed resume text with target job description and returns match scores + keywords breakdown.
    """
    # 1. Build resume text corpus
    resume_corpus = f"{' '.join(resume.skills)} "
    for exp in resume.experience:
        resume_corpus += f"{exp.title} {exp.company} {' '.join(exp.bullets)} "
    for proj in resume.projects:
        resume_corpus += f"{proj.name} {proj.description} {' '.join(proj.tech)} "
        
    resume_lower = resume_corpus.lower()
    
    # 2. Extract keywords from JD
    jd_keywords_with_freq = extract_jd_keywords(jd_text)
    
    present_keywords = []
    missing_keywords = []
    keyword_importance = []
    
    # Check which keywords exist in the resume
    for kw, freq in jd_keywords_with_freq:
        # Match as whole word or partial match for compound terms
        pattern = rf"\b{re.escape(kw.lower())}\b"
        if re.search(pattern, resume_lower):
            present_keywords.append(kw)
        else:
            missing_keywords.append(kw)
            
        keyword_importance.append({
            "keyword": kw,
            "importance": "High" if freq >= 3 else ("Medium" if freq == 2 else "Low"),
            "frequency_in_jd": freq
        })

    # 3. Compute semantic similarity score
    model = get_embedding_model()
    match_score = 50  # Fallback score if embedding fails
    
    if model:
        try:
            embeddings = model.encode([resume_corpus, jd_text])
            sim = np.dot(embeddings[0], embeddings[1]) / (np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1]))
            # Map cosine similarity (typically 0.1 to 0.8) to 0 - 100 range
            mapped_score = int(((sim - 0.1) / 0.65) * 100)
            match_score = min(100, max(10, mapped_score))
        except Exception:
            # Fallback to keyword density overlap calculation
            overlap_ratio = len(present_keywords) / max(1, len(jd_keywords_with_freq))
            match_score = min(100, int(overlap_ratio * 100))
    else:
        # Overlap-based score
        overlap_ratio = len(present_keywords) / max(1, len(jd_keywords_with_freq))
        match_score = min(100, int(overlap_ratio * 100))

    return {
        "match_score": match_score,
        "present_keywords": present_keywords,
        "missing_keywords": missing_keywords,
        "keyword_importance": keyword_importance[:30]  # Return top 30 key terms
    }
