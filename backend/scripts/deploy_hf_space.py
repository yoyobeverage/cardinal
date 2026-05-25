"""One-shot script: create or update the HuggingFace Space for Cardinal backend.

Idempotent. Reads QDRANT_*/GOOGLE_API_KEY from local .env, uploads the runtime
files (Dockerfile, app/, pyproject.toml, data artifacts, and an HF README with
the required Space YAML frontmatter), and registers the secrets so the running
container can reach Qdrant + Gemini.

Run from backend/:
    .venv/Scripts/python scripts/deploy_hf_space.py
"""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from huggingface_hub import HfApi, create_repo

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

HF_TOKEN = os.environ["HF_TOKEN"]
HF_USER = os.environ.get("HF_USER", "nichzhu")
SPACE_NAME = "cardinal"
REPO_ID = f"{HF_USER}/{SPACE_NAME}"

SECRETS = {
    "QDRANT_URL": os.environ["QDRANT_URL"],
    "QDRANT_API_KEY": os.environ["QDRANT_API_KEY"],
    "GOOGLE_API_KEY": os.environ["GOOGLE_API_KEY"],
}

SPACE_README = """\
---
title: Cardinal Backend
emoji: \U0001f426
colorFrom: indigo
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
short_description: FastAPI backend for Cardinal vector-native yield discovery
---

# Cardinal Backend

FastAPI service backing [Cardinal](https://cardinal-qdrant.vercel.app), a vector-native
yield discovery system for the Qdrant Hackathon 2026. Queries a Qdrant Cloud
collection of 83 DeFi + RWA yield products across 6 named vectors, and uses
Gemini 2.5 Flash Lite for freeform-to-QuerySpec translation and allocation
narration.

- **Source code:** https://github.com/yoyobeverage/cardinal
- **Live frontend:** https://cardinal-qdrant.vercel.app
- **Health check:** [GET /health](/health)
- **Universe data:** [GET /api/universe](/api/universe)
"""


def main() -> None:
    api = HfApi(token=HF_TOKEN)

    print(f"[1/4] create_repo({REPO_ID}, type=space, sdk=docker)")
    create_repo(
        repo_id=REPO_ID,
        token=HF_TOKEN,
        repo_type="space",
        space_sdk="docker",
        exist_ok=True,
    )

    print(f"[2/4] set {len(SECRETS)} space secrets")
    for k, v in SECRETS.items():
        api.add_space_secret(repo_id=REPO_ID, key=k, value=v)
        print(f"      - {k}")

    print(f"[3/4] write HF Space README with YAML frontmatter")
    with tempfile.NamedTemporaryFile(
        "w", suffix="README.md", delete=False, encoding="utf-8"
    ) as fh:
        fh.write(SPACE_README)
        readme_path = Path(fh.name)
    api.upload_file(
        path_or_fileobj=readme_path,
        path_in_repo="README.md",
        repo_id=REPO_ID,
        repo_type="space",
        commit_message="Set Space metadata + readme",
    )

    print(f"[4/4] upload runtime artifacts from {BACKEND_DIR}")
    api.upload_folder(
        folder_path=BACKEND_DIR,
        repo_id=REPO_ID,
        repo_type="space",
        commit_message="Deploy Cardinal backend",
        ignore_patterns=[
            ".venv/**",
            "**/__pycache__/**",
            "*.pyc",
            ".env",
            ".env.*",
            "!.env.example",
            "tests/**",
            "scripts/**",
            "data/manual.yaml",
            "data/sample_form.json",
            "data/correlation_cache.json",
            ".pytest_cache/**",
            ".ruff_cache/**",
            "*.md",
            "*.log",
            "fly.toml",
            ".dockerignore",
        ],
    )

    print()
    print(f"DONE - https://huggingface.co/spaces/{REPO_ID}")
    print(f"      runtime URL: https://{HF_USER}-{SPACE_NAME}.hf.space")
    print("      build takes ~3 min; tail logs in the Space UI 'Logs' tab.")


if __name__ == "__main__":
    sys.exit(main())
