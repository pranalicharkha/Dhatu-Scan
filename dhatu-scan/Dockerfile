# Use Python 3.11 for TensorFlow compatibility
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY python-backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install uvicorn and gunicorn for production
RUN pip install --no-cache-dir uvicorn gunicorn

# Copy application code
COPY python-backend/ .

# Expose port 8000 (Railway will set PORT env var)
EXPOSE 8000

# Run with gunicorn for production
CMD ["gunicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
