# Cardinal

A vector-native yield discovery system for crypto investors. Built for the **Qdrant Hackathon 2026**.

## The idea

Most "yield advisor" tools sit an LLM in the decision seat: form goes in, LLM reads the catalog, LLM emits a portfolio. That approach hallucinates protocols, can't see the actual numeric vectors that encode risk and yield-source structure, and produces different output on identical input.

Cardinal inverts the responsibility. The LLM is touched exactly twice per session — once to parse the user's freeform statement into a structured query spec, once to narrate the final allocation in plain English. Every selection decision in between is **vector arithmetic over a curated catalog in Qdrant**. Vectors don't hallucinate, are deterministic, and can be inspected.

## How Qdrant earns its keep

Cardinal would collapse if any of these Qdrant features were removed:

1. **Named vectors** — 5 per protocol (`narrative`, `risk`, `yield_source`, `correlation`, `composability`), so the same portfolio rearranges visibly across orthogonal axes when the user swaps lenses.
2. **Recommend API with positive + negative anchors** — portfolios are constructed from preference signals, not text descriptions.
3. **Universal Query with prefetch + RRF fusion** — multi-vector weighted retrieval in one round trip.
4. **Payload filtering inside HNSW traversal** — hard constraints (chain, audits, TVL floors) compose with vector similarity.
5. **Discovery API with `context_pairs`** — onboarding swipes calibrate user preference without typing.

## Status

In active development. Building against a 2026-06-01 submission deadline.

## Repo layout

```
backend/        FastAPI + Qdrant client + LLM translator/narrator + optimizer
  app/          API surface and core modules
  scripts/      Data ingest, embedding, UMAP precompute, Qdrant upsert
  data/         Manual protocol catalog, ingest cache (gitignored)
frontend/       React + Vite + Tailwind UI (form, allocation bar, lens scatter, drilldown)
```

## Setup

Coming soon. (Backend: Python 3.11+, `pip install -e .` in `backend/`. Frontend: Node 22+, `npm install` in `frontend/`.)

## Demo

Video link will appear here.
