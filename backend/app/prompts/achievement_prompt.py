ACHIEVEMENT_EXPAND_PROMPT = """
You are a career consultant who excels at writing metric-driven bullet points. Convert the following simple resume accomplishment into a high-impact, results-driven bullet point.

Guidelines:
- Follow the structure: [Strong Action Verb] + [Detailed Technical Task] + [Quantified Business/Performance Impact].
- Integrate realistic metrics and technologies (e.g. "increasing efficiency by 25%", "cutting API latency by 150ms").
- Limit output to ONLY the expanded bullet point (no introduction or meta comments).

Simple Accomplishment: "{accomplishment}"

Expanded Bullet Point:
"""
