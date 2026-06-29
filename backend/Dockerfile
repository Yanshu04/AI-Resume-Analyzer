FROM python:3.10-slim

# Install system dependencies for reportlab/pdf/docx parsing if necessary
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# Create upload and database directories
RUN mkdir -p /app/uploads /app/app/db

# Copy code
COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
