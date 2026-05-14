# Cardinal

**A vector-native yield-discovery system for crypto investors.** Built for the [Qdrant Hackathon 2026](https://try.qdrant.tech/hackathon-vsd).

Cardinal lets a user describe their preferences once — through a structured form, three optional drawdown-scenario swipes, and one freeform sentence — and returns a diversified yield portfolio drawn from a 58-protocol catalog. The interesting part is what Cardinal **does not** do.

## The thesis: keep the LLM out of the selection

Most "AI yield advisors" sit an LLM in the decision seat. Form goes in, LLM reads the catalog, LLM emits a portfolio. This fails in three ways:

- **Hallucinates** protocols that don't exist in the catalog
- **Can't see** the numeric structure (risk vectors, correlations) that distinguishes products
- **Is non-deterministic**, so identical inputs produce different portfolios and the system is uninspectable

Cardinal inverts the responsibility. The LLM is touched exactly twice per session — once to **parse** the freeform statement into a structured query spec, and once to **narrate** the final allocation in plain English. Every selection decision in between is vector arithmetic over a curated catalog in Qdrant. Vectors don't hallucinate, are deterministic, and can be inspected.

## Architecture

```
Form + freeform        Translator              Qdrant (5 named vectors)
       │              (Gemini → JSON)                  │
       └──────────────────┴─────────────► RecommendQuery + ContextQuery
                                                       │
                                                       ▼
                                  Payload-filtered HNSW (audits, TVL, chains, …)
                                                       │
                                                       ▼
                                              ~20 candidates
                                                       │
                                                       ▼
                                Optimizer (weighted-sum | mean-variance)
                                                       │
                                                       ▼
                                     Narrator (Gemini → markdown)
                                                       │
                                                       ▼
                                          Allocation → React UI
                                                       │
                                                       ▼
                                  Lens-swap scatter + drilldown radar
```

## How Qdrant earns its keep

Cardinal would collapse if any of these five Qdrant features were removed:

### 1. Named vectors (5 per point)

Each catalog point carries 4 populated vectors and 1 reserved slot:

| Vector | Dim | Distance | What it captures |
|---|---:|---|---|
| `narrative` | 1024 | cosine | BGE-large-en-v1.5 embedding of protocol description, product, category, audit firms |
| `risk` | 32 | euclidean | Hand-engineered: age z-score, log-audit-count, audit-firm reputation, max drawdown, oracle diversity, chain one-hot, custody one-hot, log-TVL, … |
| `yield_source` | 16 | cosine | Soft one-hot mix of real_yield / lending_spread / AMM fees / options premium / points / emissions / MEV / basis trade / restaking / stablecoin issuance / validator commission |
| `correlation` | 8 | cosine | Rolling correlations vs BTC, ETH, SPX, IEF, HYG, DXY, gold, USDC short rate (category-default fallback at hackathon scope) |
| `composability` | 64 | dot | Reserved for node2vec over the receipt-token graph |

→ See [`backend/scripts/build_vectors.py`](backend/scripts/build_vectors.py) and [`backend/app/qdrant_client.py:VECTOR_CONFIGS`](backend/app/qdrant_client.py)

### 2. Recommend API with positive + negative anchors

The translator extracts catalog ids the user implicitly likes (positive) and rejects (negative) from their freeform input — e.g. "I got rugged by Anchor in 2022" produces RWA T-bill anchors and zero algorithmic-stablecoin anchors. Qdrant's `RecommendQuery` with the `BEST_SCORE` strategy on a chosen lens produces ~20 candidates.

→ `backend/app/qdrant_client.py:recommend()`

### 3. Universal Query with prefetch + RRF fusion

When the user has no anchors but has lens weights, Cardinal builds a multi-vector prefetch — one branch per lens — and fuses results via Reciprocal Rank Fusion in a single round trip.

→ `backend/app/qdrant_client.py:multi_vector_prefetch()`

### 4. Payload filtering inside HNSW traversal

Seven payload indexes (`category`, `chains`, `tvl_usd`, `audit_count`, `lockup_days`, `launched_at`, `tax_treatment`) let hard constraints compose with vector similarity. "Min 3 audits, no Solana, max 30-day lockup" is enforced inside the HNSW walk, not as a post-filter.

→ `backend/app/qdrant_client.py:build_filter()` + `PAYLOAD_INDEXES`

### 5. Discovery API with `context_pairs`

The optional drawdown-swipe onboarding presents 5 historical events (Terra/Luna collapse, FTX, USDC depeg, stETH discount, BTC 70% drawdown) as cards with mini drawdown charts. Each "I held / I sold" decision becomes one `ContextPair` on the risk axis. Qdrant's `ContextQuery` returns protocols consistent with the revealed risk tolerance, which Cardinal prepends to the LLM-extracted anchors before the main recommend.

→ `backend/app/qdrant_client.py:discovery_walk()` + [`frontend/src/components/DrawdownSwipe.tsx`](frontend/src/components/DrawdownSwipe.tsx)

## Two optimizers

Both operate on the same Qdrant candidate set; the frontend has a toggle so the demo can compare them side by side.

- **Weighted-sum** (default) — `score × 1/(1 + max_drawdown_1y)`, cap each position at 25%, redistribute excess uniformly across non-capped positions. Risk-tilted, respects the qualitative preferences encoded in the candidate ranking.
- **Mean-variance (Markowitz)** — scipy SLSQP solves `min wᵀΣw  s.t.  wᵀr ≥ floor,  sum(w) = 1,  0 ≤ wᵢ ≤ cap`. Σ approximated by the pairwise cosine-similarity matrix of correlation vectors, since we don't have real historical return series at hackathon scope. Pure variance minimization; can produce surprising diversifications.

For the Anchor-trauma persona: weighted-sum returns 5 RWA T-bills at ~17% each (4.14% portfolio APY); mean-variance returns 1 lending position at the 25% cap + 7 LSTs/LRTs equal-weighted at 10.7% (2.26% APY, exactly the return floor). Same candidate set, fundamentally different baskets.

→ `backend/app/optimizer.py`

## Catalog (58 protocols, 4 lenses)

Ingested via two sources:

- **DefiLlama `/yields/pools`** — filtered to a whitelisted set of 27 projects (Aave V3, Compound V3, Morpho Blue, SparkLend, Spark Savings, Pendle, Lido, Rocket Pool, Coinbase cbETH, ether.fi, Renzo, Kelp, Swell, Curve, Convex, Aerodrome, Velodrome, Uniswap V3, Yearn, Beefy, GMX V2, Kamino, Ethena, Sky, Frax, Fluid, Ondo). Round-robin selection ensures every project is represented before TVL ranking fills remaining slots. APY floor of 0.5% filters out dormant pools.

- **Hand-curated YAML** — 15 RWA/CeFi products DefiLlama doesn't surface well: BlackRock BUIDL, Maple HY + Cash, Centrifuge Anemoy, Hashnote USYC, OpenEden TBILL, Mountain USDM, Franklin BENJI, Goldfinch Senior, Matrixdock STBT, TrueFi, Clearpool PGF500, Securitize BlackRock US Cash, WisdomTree WTGXX, Mantle mETH.

→ [`backend/scripts/ingest_defillama.py`](backend/scripts/ingest_defillama.py), [`backend/scripts/protocol_meta.py`](backend/scripts/protocol_meta.py), [`backend/data/manual.yaml`](backend/data/manual.yaml)

## Tech stack

| Layer | Choice |
|---|---|
| Vector DB | Qdrant Cloud (free tier, 1 GB cluster) |
| LLM | Gemini 2.5 Flash Lite via `google-genai` SDK |
| Embeddings | `BAAI/bge-large-en-v1.5` via `sentence-transformers` |
| Backend | FastAPI + Python 3.11 + Pydantic v2 |
| Frontend | React 19 + Vite + TypeScript + Tailwind v4 |
| Charts | Recharts (RadarChart, AreaChart) |
| Lens-swap animation | Plain CSS `transition: transform` on SVG `<g>` |
| Optimizer | numpy for weighted-sum, scipy SLSQP for mean-variance |
| Dim-reduction | umap-learn for the 2D scatter |

## Setup

### Prerequisites
- Python 3.11+, Node 22+
- A Qdrant Cloud cluster ([cloud.qdrant.io](https://cloud.qdrant.io), free tier)
- A Google AI Studio API key ([aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey), free tier — 20 requests/day on Flash Lite is fine for development)

### Backend
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate            # Windows; or `source .venv/bin/activate` on Unix
pip install -e .
cp .env.example .env              # fill QDRANT_URL, QDRANT_API_KEY, GOOGLE_API_KEY

# One-time data pipeline (BGE model downloads ~1.3 GB on first run)
python scripts/ingest_defillama.py
python scripts/ingest_manual.py
python scripts/build_vectors.py
python scripts/precompute_umap.py
python scripts/upsert_qdrant.py

# Serve
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

### Verification
```bash
python backend/scripts/verify_day0.py     # pings Qdrant + Gemini
python backend/scripts/explore.py         # exercises every Qdrant query pattern
cd backend && pytest                      # 16 unit tests (translator + optimizer)
```

## Sample personas (built into the form)

Three persona buttons pre-fill the form so the demo can show different shaping behaviors instantly:

1. **House-buyer (anchor trauma)** — $100k, 12 months, taxable, audits ≥ 2, lockup ≤ 270 days. Freeform: *"I got rugged by Anchor in 2022. I need real liquidity by month 10 because I'm buying a house."* Expected output: heavy RWA T-bill allocation (Ondo, Mountain Protocol, Matrixdock, Centrifuge Anemoy) at ~20% each.

2. **Conservative retiree** — $500k, 36 months, traditional_ira, audits ≥ 3, TVL ≥ $50M, lockup ≤ 30 days, no Solana. Expected: highest-audit savings-rate and institutional-lending products (SparkLend, Spark Savings, Maple Cash, Sky Lending).

3. **Degen seeker** — $10k, 6 months, taxable, no audit floor. Freeform: *"Max yield, I know the risks. Give me points, emissions, LRTs, basis trade — the spicy stuff."* Expected: Pendle, LRTs (Renzo, Kelp, Swell), perps LP pools, GMX V2.

## The lens-swap money shot

The most visually distinctive moment in the demo is the lens selector on the results page. Same 58 protocols, same allocation highlighted, but as you click between **Narrative → Risk → Yield Source → Correlation**, every dot animates to its new 2D UMAP projection in 600 ms. LSTs cluster tightly under Narrative, then spread out under Risk, then cluster differently again under Yield Source. The drilldown radar shows a per-lens similarity profile for any allocated protocol.

The point is to make the multi-vector index legible. There's only one portfolio, but it lives in four different similarity spaces simultaneously, and Qdrant's named-vector design is what makes that visible.

## Demo video

Demo video link will appear here once recorded.

## Roadmap (post-hackathon)

- Replace the category-default correlation vector with actual rolling Pearson correlations computed from DefiLlama `/chart/{pool_id}` historical APY series
- Populate the reserved `composability` vector via node2vec over the receipt-token graph (Pendle → underlying → Curve → …)
- Add `tax_treatment` as a 12d categorical vector plus an IRA-aware optimizer post-step
- Frontend code-splitting — current bundle is ~680 KB, chart libraries are the main weight
- Push catalog to 100+ protocols with manual additions for tokenized money-market funds, structured notes, and tax-advantaged products

## License

MIT — see `LICENSE`.
