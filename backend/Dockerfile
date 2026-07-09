FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5001

# Run with gunicorn in production
ENV FLASK_ENV=production
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "app:app"]
