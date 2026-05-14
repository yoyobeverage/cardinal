FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install runtime deps from pyproject.toml. The [pipeline] / [dev] extras are NOT
# installed — only what the FastAPI process imports.
COPY pyproject.toml ./
COPY app/ ./app/
RUN pip install --no-cache-dir .

# Catalog artifacts that the runtime reads. Re-generated locally by
# scripts/{ingest_*,build_vectors,precompute_umap}.py.
COPY data/cache.sqlite data/vectors.json data/umap.json ./data/

EXPOSE 8000

# Fly.io populates $PORT dynamically; default to 8000 for local docker runs.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
