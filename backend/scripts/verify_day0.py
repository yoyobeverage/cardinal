"""Day 0 connectivity check: verify Qdrant Cloud and Gemini are both reachable."""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ENV_PATH = Path(__file__).parent.parent / ".env"
load_dotenv(ENV_PATH)

errors = []

try:
    from qdrant_client import QdrantClient

    client = QdrantClient(
        url=os.environ["QDRANT_URL"],
        api_key=os.environ["QDRANT_API_KEY"],
    )
    collections = client.get_collections()
    names = [c.name for c in collections.collections]
    print(f"[OK] Qdrant reachable. Existing collections: {names}")
except Exception as e:
    errors.append(f"Qdrant: {e}")
    print(f"[FAIL] Qdrant: {e}")

try:
    from google import genai

    gclient = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    response = gclient.models.generate_content(
        model=os.environ["GEMINI_MODEL"],
        contents="Reply with exactly the word 'pong' and nothing else.",
    )
    text = (response.text or "").strip()
    print(f"[OK] Gemini reachable. Model={os.environ['GEMINI_MODEL']} replied: {text!r}")
except Exception as e:
    errors.append(f"Gemini: {e}")
    print(f"[FAIL] Gemini: {e}")

if errors:
    print(f"\nDay 0 verification: FAILED ({len(errors)} error(s))")
    sys.exit(1)

print("\nDay 0 verification: GREEN")
