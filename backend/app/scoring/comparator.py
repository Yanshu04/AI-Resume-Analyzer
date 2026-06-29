import re
from typing import Dict, Any, List
from app.models.schemas import ParsedResume
from app.scoring.ats_scorer import calculate_ats_score, ACTION_VERBS, METRICS_KEYWORDS
from app.services.ollama_service import grammar_check_fallback

def count_syllables(word: str) -> int:
    """
    Syllable counting heuristic for readability score.
    """
    word = word.lower().strip(".:;,!?\"'")
    if not word:
        return 0
    vowels = "aeiouy"
    count = 0
    if len(word) > 0 and word[0] in vowels:
        count += 1
    for index in range(1, len(word)):
        if word[index] in vowels and word[index - 1] not in vowels:
            count += 1
    if word.endswith("e"):
        count -= 1
    if word.endswith("le") and len(word) > 2 and word[-3] not in vowels:
        count += 1
    if count <= 0:
        count = 1
    return count

def calculate_readability_metrics(text: str) -> Dict[str, Any]:
    """
    Calculates Average Sentence Length and Flesch Reading Ease score.
    """
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    words = re.findall(r"\b[a-zA-Z']+\b", text.lower())
    
    total_sentences = max(1, len(sentences))
    total_words = max(1, len(words))
    
    # Syllables count
    total_syllables = sum(count_syllables(w) for w in words)
    
    # 1. Average Sentence Length
    avg_sentence_len = round(total_words / total_sentences, 1)
    
    # 2. Flesch Reading Ease
    # FRE = 206.835 - (1.015 * ASL) - (84.6 * ASW)
    asl = total_words / total_sentences
    asw = total_syllables / total_words
    flesch = 206.835 - (1.015 * asl) - (84.6 * asw)
    flesch_score = round(min(100, max(0, flesch)), 1)
    
    return {
        "avg_sentence_length": avg_sentence_len,
        "flesch_score": flesch_score
    }

def get_resume_metrics(resume: ParsedResume) -> Dict[str, Any]:
    """
    Runs metrics evaluation for a single resume.
    """
    # Build text corpus
    resume_corpus = f"{' '.join(resume.skills)} "
    for exp in resume.experience:
        resume_corpus += f"{exp.title} {exp.company} {' '.join(exp.bullets)} "
    for proj in resume.projects:
        resume_corpus += f"{proj.name} {proj.description} {' '.join(proj.tech)} "
    for edu in resume.education:
        resume_corpus += f"{edu.degree} {edu.institution} "
    for cert in resume.certifications:
        resume_corpus += f"{cert} "
        
    words = re.findall(r"\b\w+\b", resume_corpus)
    word_count = len(words)
    
    # Count sections
    section_count = 0
    if resume.skills: section_count += 1
    if resume.experience and len(resume.experience) > 0 and resume.experience[0].title != "Software Engineer": section_count += 1
    if resume.projects and len(resume.projects) > 0 and resume.projects[0].name != "AI Agent Chatbot": section_count += 1
    if resume.education: section_count += 1
    if resume.certifications: section_count += 1
    if resume.links: section_count += 1
    
    # ATS scoring
    ats = calculate_ats_score(resume)
    ats_score = ats["overall_score"]
    
    # Local grammar audit count
    grammar = grammar_check_fallback(resume_corpus)
    grammar_issues = len(grammar["weak_words"]) + len(grammar["passive_voice"]) + len(grammar["repeated_words"]) + len(grammar["long_sentences"])
    
    # Keyword coverage count (technical words)
    from app.parsers.extractor import COMMON_SKILLS
    corpus_lower = resume_corpus.lower()
    keyword_coverage = sum(1 for s in COMMON_SKILLS if re.search(rf"\b{re.escape(s)}\b", corpus_lower))
    
    # Readability
    readability = calculate_readability_metrics(resume_corpus)
    
    return {
        "ats_score": ats_score,
        "grammar_issues": grammar_issues,
        "keyword_coverage": keyword_coverage,
        "avg_sentence_length": readability["avg_sentence_length"],
        "flesch_score": readability["flesch_score"],
        "word_count": word_count,
        "section_count": section_count
    }

def compare_resumes(v1: ParsedResume, v2: ParsedResume) -> Dict[str, Any]:
    """
    Compares two resumes side by side and determines the winner per category.
    """
    metrics1 = get_resume_metrics(v1)
    metrics2 = get_resume_metrics(v2)
    
    # Determine winners (v1 or v2)
    ats_winner = "v1" if metrics1["ats_score"] >= metrics2["ats_score"] else "v2"
    # Less grammar issues is better
    grammar_winner = "v1" if metrics1["grammar_issues"] <= metrics2["grammar_issues"] else "v2"
    keyword_winner = "v1" if metrics1["keyword_coverage"] >= metrics2["keyword_coverage"] else "v2"
    
    # Flesch score closer to standard range (60-80) or higher is better
    readability_winner = "v1" if metrics1["flesch_score"] >= metrics2["flesch_score"] else "v2"
    
    # Word count: target is 450-600 words. Winner is whoever is closer to that range
    dist1 = min(abs(metrics1["word_count"] - 500), abs(metrics1["word_count"] - 600))
    dist2 = min(abs(metrics2["word_count"] - 500), abs(metrics2["word_count"] - 600))
    length_winner = "v1" if dist1 <= dist2 else "v2"
    
    return {
        "v1": metrics1,
        "v2": metrics2,
        "comparison": {
            "ats_score_winner": ats_winner,
            "grammar_issues_winner": grammar_winner,
            "keyword_coverage_winner": keyword_winner,
            "readability_winner": readability_winner,
            "length_winner": length_winner
        }
    }
