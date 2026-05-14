import type { Allocation, FormInput } from "./types";

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
