import os
import json
import httpx
from typing import Dict, Any, List

# Retrieve Ollama host from environment variables (defaults to localhost)
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = "qwen2.5:1.5b"

async def check_ollama_status() -> bool:
    """
    Checks if the Ollama service is reachable.
    """
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{OLLAMA_HOST}/api/tags")
            return res.status_code == 200
    except Exception:
        return False

async def query_ollama(prompt: str, json_mode: bool = False) -> str:
    """
    Sends a generation query to the local Ollama instance.
    """
    url = f"{OLLAMA_HOST}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3
        }
    }
    if json_mode:
        payload["format"] = "json"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                return data.get("response", "").strip()
            else:
                raise ValueError(f"Ollama returned status code {res.status_code}")
    except Exception as e:
        print(f"Ollama connection error: {str(e)}")
        # Raise exception to let caller know it failed, or return empty to trigger fallback
        raise ConnectionError("Ollama service is unreachable. Using local heuristic fallback.")

# Rule-based fallback checks when Ollama is offline
def grammar_check_fallback(text: str) -> Dict[str, Any]:
    """
    Procedural grammar checking fallback based on regex patterns.
    """
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    
    weak_words_list = [
        {"word": "helped", "suggestion": "assisted/facilitated"},
        {"word": "responsible for", "suggestion": "spearheaded/engineered"},
        {"word": "handled", "suggestion": "managed/coordinated"},
        {"word": "worked on", "suggestion": "architected/implemented"},
        {"word": "assisted", "suggestion": "collaborated/executed"},
        {"word": "managed", "suggestion": "directed/orchestrated"},
        {"word": "make", "suggestion": "engineered/formulated"}
    ]
    
    flagged_weak = []
    text_lower = text.lower()
    for item in weak_words_list:
        if re.search(rf"\b{re.escape(item['word'])}\b", text_lower):
            flagged_weak.append(item)
            
    # Simple passive voice matching (e.g. was built, were created, been managed)
    passive_patterns = [
        r"\b(?:was|were|been|is|are)\b\s+\w+ed\b",
        r"\b(?:was|were|been|is|are)\b\s+(?:written|taken|seen|done|built|made|run|gone|kept|chosen|given|shown)\b"
    ]
    
    passive_voice = []
    for sentence in sentences:
        for pattern in passive_patterns:
            if re.search(pattern, sentence, re.IGNORECASE):
                passive_voice.append(sentence)
                break
                
    # Detect repeated words
    clean_words = re.findall(r"\b[a-zA-Z]{3,15}\b", text_lower)
    word_counts = {}
    for w in clean_words:
        if w not in ["the", "and", "for", "with", "that", "this", "our"]:
            word_counts[w] = word_counts.get(w, 0) + 1
            
    repeated_words = [w for w, count in word_counts.items() if count >= 3]
    
    # Detect long sentences (> 25 words)
    long_sentences = []
    for sentence in sentences:
        if len(sentence.split()) > 25:
            long_sentences.append(sentence)
            
    return {
        "weak_words": flagged_weak,
        "passive_voice": passive_voice,
        "repeated_words": repeated_words,
        "long_sentences": long_sentences
    }

import re
