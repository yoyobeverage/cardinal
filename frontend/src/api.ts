// Typed fetch wrappers for the Cardinal backend. One function per endpoint.
// VITE_API_BASE is set at build time from .env.production (HF Space URL) or
// at dev time from .env.local; falls back to localhost:8000 for plain `npm run dev`.

import type { Allocation, FormInput, PointPayload } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://127.0.0.1:8000";

export type OptimizerName = "weighted_sum" | "mean_variance";

export async function fetchPortfolio(
  form: FormInput,
  optimizerName: OptimizerName = "weighted_sum",
): Promise<Allocation> {
  const url = `${API_BASE}/api/portfolio?optimizer_name=${optimizerName}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<Allocation>;
}

export interface ProtocolDetail {
  id: string;
  payload: PointPayload;
  per_lens_scores: Record<string, number>;
}

export async function fetchProtocol(
  protocolId: string,
  anchorIds: string[],
): Promise<ProtocolDetail> {
  const anchorParam = anchorIds.length > 0 ? `?anchors=${anchorIds.join(",")}` : "";
  const res = await fetch(`${API_BASE}/api/protocol/${encodeURIComponent(protocolId)}${anchorParam}`);
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<ProtocolDetail>;
}
