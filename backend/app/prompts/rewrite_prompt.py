REWRITE_RESUME_PROMPT = """
You are an elite executive resume writer. Rewrite the following resume experience section in the "{style}" style.

Style Guidelines for "{style}":
- **Professional Style**: Focus on business results, leadership, stakeholder communication, and standard professional phrasing.
- **Technical Style**: Emphasize technical details, architecture, specific languages/frameworks, and concrete technical solutions.
- **Google Style**: Follow the XYZ formula strictly: "Accomplished [X] as measured by [Y], by doing [Z]". Start each bullet with a metric if possible.
- **Microsoft Style**: Focus on system scale, robustness, enterprise integration, collaboration, and structured delivery pipelines.
- **Startup Style**: Highlight speed, high ownership, building products from 0 to 1, cross-functional impact, and rapid iteration.

Input Experience:
{experience}

Instructions:
- Keep the original structure (Job titles, companies, dates) but improve all bullet points to align with the style.
- Maintain professional, clean formatting.
- Do not output any chat meta-text. Return ONLY the rewritten text.

Rewritten Experience:
"""
