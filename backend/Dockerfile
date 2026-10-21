FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies for geospatial libraries (GDAL, GEOS, PROJ) and WeasyPrint (Cairo, Pango)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgdal-dev \
    gdal-bin \
    libgeos-dev \
    libproj-dev \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libcairo2 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip

# Pre-install CPU-only PyTorch to minimize image footprint and build duration
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy requirements file (accommodates context: . or context: ./backend)
COPY backend/requirements.txt* requirements.txt* /tmp/
RUN if [ -f /tmp/requirements.txt ]; then \
        pip install --no-cache-dir -r /tmp/requirements.txt; \
    elif [ -f /tmp/backend/requirements.txt ]; then \
        pip install --no-cache-dir -r /tmp/backend/requirements.txt; \
    fi

# Copy project source code
COPY . /app

ENV PYTHONPATH=/app
ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
