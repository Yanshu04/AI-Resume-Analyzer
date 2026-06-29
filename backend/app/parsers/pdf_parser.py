import fitz  # PyMuPDF

def parse_pdf(file_path: str) -> str:
    """
    Extract text from a PDF file using PyMuPDF.
    """
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        raise ValueError(f"Failed to parse PDF file: {str(e)}")
    
    return text
