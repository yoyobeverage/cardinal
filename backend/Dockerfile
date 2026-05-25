FROM python:3.11-slim

# HF Spaces runs containers as a non-root user (UID 1000, named "user").
# Fly.io tolerated root; this layout works on both.
RUN useradd -m -u 1000 user
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Install runtime deps from pyproject.toml. The [pipeline] / [dev] extras are NOT
# installed - only what the FastAPI process imports.
COPY --chown=user:user pyproject.toml ./
COPY --chown=user:user app/ ./app/
RUN pip install --no-cache-dir .

# Catalog artifacts that the runtime reads. Re-generated locally by
# scripts/{ingest_*,build_vectors,precompute_umap}.py.
COPY --chown=user:user data/cache.sqlite data/vectors.json data/umap.json ./data/

USER user

# HF Spaces uses port 7860 by default; Fly.io injected $PORT=8000; local docker
# defaults to 8000. The CMD honors whichever env wins.
EXPOSE 7860
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
