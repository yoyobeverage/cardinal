// TypeScript mirror of backend/app/schemas.py - keep field names + values exactly aligned.

export type Chain =
  | "ethereum" | "base" | "arbitrum" | "optimism"
  | "polygon"  | "solana" | "bsc"     | "avalanche";

export type Category =
  | "lending" | "fixed_rate" | "lst" | "lrt"
  | "stable_amm" | "volatile_amm" | "options_vault"
  | "rwa_treasury" | "institutional_lending"
  | "perps_lp" | "basis_trade" | "yield_aggregator"
  | "savings_rate" | "stablecoin_issuance";

export type TaxTreatment =
  | "ordinary_income" | "qualified_dividend" | "capital_gain"
  | "return_of_capital" | "qbi" | "uncertain";

export type TaxWrapper = "taxable" | "traditional_ira" | "roth_ira" | "hsa";

export type YieldSource =
  | "real_yield" | "lending_spread" | "amm_fees" | "options_premium"
  | "points_airdrop" | "emissions" | "mev_capture" | "basis_trade"
  | "restaking_reward" | "stablecoin_issuance" | "validator_commission";

export interface DrawdownSwipe {
  scenario_id: string;
  decision: "held" | "sold";
}

export interface PointPayload {
  id: string;
  protocol: string;
  product: string;
  category: Category;
  chains: Chain[];
  current_apy: number;
  tvl_usd: number;
  audit_count: number;
  audit_firms: string[];
  max_drawdown_1y: number;
  lockup_days: number;
  launched_at: string;
  tax_treatment: TaxTreatment;
  yield_source_mix: Record<string, number>;
  description: string;
  url: string;
}

export interface FormInput {
  capital_usd: number;
  horizon_months: number;
  tax_wrapper: TaxWrapper;
  excluded_chains: Chain[];
  min_audit_count: number;
  min_tvl_usd: number;
  max_lockup_days: number | null;
  yield_source_ranking?: YieldSource[] | null;
  drawdown_swipes?: DrawdownSwipe[] | null;
  freeform: string;
}

export interface LensWeights {
  narrative: number;
  risk: number;
  yield_source: number;
  correlation: number;
  composability: number;
}

export interface HardFilters {
  max_lockup_days: number | null;
  min_audit_count: number | null;
  min_tvl_usd: number | null;
  excluded_chains: Chain[];
  excluded_categories: Category[];
}

export interface QuerySpec {
  positive_anchors: string[];
  negative_anchors: string[];
  lens_weights: LensWeights;
  hard_filters: HardFilters;
  extracted_concerns: string[];
}

export interface Position {
  protocol_id: string;
  payload: PointPayload;
  weight: number;
  dollars: number;
  score: number;
  per_lens_scores: Record<string, number>;
}

export interface Allocation {
  positions: Position[];
  explanation: string;
  extracted_concerns: string[];
  query_spec: QuerySpec;
}
