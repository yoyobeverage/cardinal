"""Hand-curated metadata for the DefiLlama projects whitelisted into the catalog.

Keys: DefiLlama project slug (lowercase, dash-separated, as returned by /yields/pools).
Values: fields DefiLlama does not provide — audit_count, audit_firms, launched_at,
lockup_days, max_drawdown_1y, tax_treatment, yield_source_mix, category, description, url.

Audit counts and dates are best-guess as of catalog assembly (2026-05). Refine with primary
sources when time permits.
"""
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.schemas import Category, TaxTreatment


PROTOCOL_META: dict[str, dict] = {
    "aave-v3": {
        "category": Category.LENDING,
        "audit_count": 6,
        "audit_firms": ["openzeppelin", "trail_of_bits", "certora", "peckshield", "sigp", "abdk"],
        "launched_at": date(2022, 3, 16),
        "lockup_days": 0,
        "max_drawdown_1y": 0.02,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"lending_spread": 1.0},
        "description": (
            "Aave V3 is a non-custodial money market where suppliers earn interest from borrowers. "
            "V3 added isolation mode for long-tail collateral, high-efficiency mode for correlated "
            "assets, supply caps, and a cross-chain portal. Battle-tested across Ethereum and "
            "multiple L2s with no critical exploits since launch."
        ),
        "url": "https://aave.com",
    },
    "compound-v3": {
        "category": Category.LENDING,
        "audit_count": 5,
        "audit_firms": ["openzeppelin", "chainsecurity", "certora", "trail_of_bits", "code4rena"],
        "launched_at": date(2022, 8, 25),
        "lockup_days": 0,
        "max_drawdown_1y": 0.015,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"lending_spread": 0.9, "emissions": 0.1},
        "description": (
            "Compound V3 is a redesigned lending protocol with a single borrowable asset per market "
            "and isolated collateral. The single-asset design simplifies risk management and "
            "produces tighter spreads. Suppliers of USDC and ETH earn interest plus COMP rewards."
        ),
        "url": "https://compound.finance",
    },
    "morpho-blue": {
        "category": Category.LENDING,
        "audit_count": 7,
        "audit_firms": ["spearbit", "cantina", "certora", "openzeppelin", "trail_of_bits", "runtime_verification", "abdk"],
        "launched_at": date(2024, 1, 11),
        "lockup_days": 0,
        "max_drawdown_1y": 0.02,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"lending_spread": 1.0},
        "description": (
            "Morpho Blue is a permissionless lending primitive where each market is an isolated "
            "tuple of one collateral asset, one loan asset, an oracle, and an interest rate model. "
            "Curated MetaMorpho vaults on top of Blue let allocators pick risk profiles. Heavy "
            "audit coverage and a minimal immutable core."
        ),
        "url": "https://morpho.org",
    },
    "sparklend": {
        "category": Category.LENDING,
        "audit_count": 4,
        "audit_firms": ["chainsecurity", "code4rena", "abdk", "spearbit"],
        "launched_at": date(2023, 5, 9),
        "lockup_days": 0,
        "max_drawdown_1y": 0.02,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"lending_spread": 0.7, "real_yield": 0.3},
        "description": (
            "SparkLend is the Maker/Sky-aligned lending market, a fork of Aave V3 with custom risk "
            "parameters and direct integration with the Maker DSR for DAI/sDAI yield. Natural venue "
            "for DAI-denominated borrowing and stablecoin yield aggregation."
        ),
        "url": "https://spark.fi",
    },
    "spark-savings": {
        "category": Category.SAVINGS_RATE,
        "audit_count": 4,
        "audit_firms": ["chainsecurity", "code4rena", "abdk", "spearbit"],
        "launched_at": date(2024, 1, 17),
        "lockup_days": 0,
        "max_drawdown_1y": 0.005,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"real_yield": 1.0},
        "description": (
            "Spark Savings is the DAI/sDAI savings vehicle integrated with the Maker DSR. "
            "Deposited DAI converts to sDAI, an appreciating receipt token. Backed by Maker's RWA "
            "collateral stream (predominantly T-bills) plus protocol surplus. Effectively a "
            "DAI-denominated T-bill yield with daily liquidity."
        ),
        "url": "https://spark.fi",
    },
    "fluid-lending": {
        "category": Category.LENDING,
        "audit_count": 4,
        "audit_firms": ["mixbytes", "statemind", "trust_security", "cantina"],
        "launched_at": date(2024, 5, 1),
        "lockup_days": 0,
        "max_drawdown_1y": 0.03,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"lending_spread": 0.85, "amm_fees": 0.15},
        "description": (
            "Fluid is Instadapp's unified liquidity layer combining lending, borrowing, and DEX "
            "functionality on shared collateral. Smart collateral and smart debt let positions earn "
            "fees while serving as collateral. Higher capital efficiency than discrete lending "
            "protocols, with a newer codebase."
        ),
        "url": "https://fluid.instadapp.io",
    },
    "pendle": {
        "category": Category.FIXED_RATE,
        "audit_count": 5,
        "audit_firms": ["spearbit", "code4rena", "ackee", "wattpad-security", "chainsecurity"],
        "launched_at": date(2021, 6, 1),
        "lockup_days": 0,
        "max_drawdown_1y": 0.04,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"real_yield": 0.6, "points_airdrop": 0.4},
        "description": (
            "Pendle tokenizes future yield by splitting yield-bearing assets into Principal Tokens "
            "(PT, fixed rate to maturity) and Yield Tokens (YT, long the underlying yield and any "
            "points/airdrops attached). Heavily used for points speculation on LRTs and Ethena."
        ),
        "url": "https://pendle.finance",
    },
    "ethena-usde": {
        "category": Category.STABLECOIN_ISSUANCE,
        "audit_count": 4,
        "audit_firms": ["code4rena", "spearbit", "quantstamp", "pashov"],
        "launched_at": date(2024, 2, 19),
        "lockup_days": 7,
        "max_drawdown_1y": 0.08,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"basis_trade": 0.8, "real_yield": 0.2},
        "description": (
            "Ethena issues USDe, a synthetic dollar backed by delta-neutral positions: long staked "
            "ETH/BTC spot, short perp. Funding rate on the short side generates yield, distributed "
            "to sUSDe stakers. Yield is highly correlated with perp funding regimes and can "
            "compress in bearish markets."
        ),
        "url": "https://ethena.fi",
    },
    "frax": {
        "category": Category.SAVINGS_RATE,
        "audit_count": 5,
        "audit_firms": ["trail_of_bits", "certik", "peckshield", "chainsecurity", "code4rena"],
        "launched_at": date(2024, 2, 8),
        "lockup_days": 0,
        "max_drawdown_1y": 0.01,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"real_yield": 1.0},
        "description": (
            "sFRAX is the Frax Savings Rate. Deposited FRAX earns yield from a basket dominated by "
            "short-dated US Treasuries held through partner SPVs. The rate tracks the IORB (Interest "
            "on Reserve Balances) target plus a Frax-set spread."
        ),
        "url": "https://frax.com",
    },
    "sky-lending": {
        "category": Category.SAVINGS_RATE,
        "audit_count": 6,
        "audit_firms": ["chainsecurity", "trail_of_bits", "peckshield", "spearbit", "runtime_verification", "code4rena"],
        "launched_at": date(2024, 8, 27),
        "lockup_days": 0,
        "max_drawdown_1y": 0.005,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"real_yield": 0.75, "lending_spread": 0.25},
        "description": (
            "Sky (the MakerDAO rebrand) operates the Sky Savings Rate (SSR) for USDS, the new "
            "stablecoin successor to DAI. SSR-backed yield comes from the same protocol surplus "
            "that feeds DSR, predominantly RWA T-bill positions."
        ),
        "url": "https://sky.money",
    },
    "ondo-yield-assets": {
        "category": Category.RWA_TREASURY,
        "audit_count": 4,
        "audit_firms": ["code4rena", "halborn", "nethermind", "certora"],
        "launched_at": date(2023, 1, 30),
        "lockup_days": 0,
        "max_drawdown_1y": 0.002,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"real_yield": 1.0},
        "description": (
            "Ondo tokenizes US Treasury exposure for crypto users. OUSG holds short-term T-bill ETFs "
            "via a regulated SPV; USDY is a yield-bearing stablecoin alternative backed by "
            "short-term T-bills and bank deposits. KYC required for primary mint/redeem; secondary "
            "transfers between whitelisted wallets are permissionless on Ethereum, Polygon, and "
            "Solana."
        ),
        "url": "https://ondo.finance",
    },
    "lido": {
        "category": Category.LST,
        "audit_count": 7,
        "audit_firms": ["openzeppelin", "sigp", "certora", "chainsecurity", "mixbytes", "ackee", "statemind"],
        "launched_at": date(2020, 12, 17),
        "lockup_days": 0,
        "max_drawdown_1y": 0.03,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 1.0},
        "description": (
            "Lido is the largest Ethereum liquid staking provider. Deposit ETH, receive stETH, which "
            "rebases with staking rewards. Validator set curated by Lido DAO, gradually decentralizing "
            "through the Module Staking initiative. Permissionless withdrawals via the Lido queue."
        ),
        "url": "https://lido.fi",
    },
    "rocket-pool": {
        "category": Category.LST,
        "audit_count": 5,
        "audit_firms": ["sigp", "consensys_diligence", "trail_of_bits", "chainsecurity", "code4rena"],
        "launched_at": date(2021, 11, 8),
        "lockup_days": 0,
        "max_drawdown_1y": 0.03,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 1.0},
        "description": (
            "Rocket Pool is a permissionless Ethereum liquid staking protocol. Users hold rETH, an "
            "appreciating receipt token. Anyone can run a node by bonding 8 or 16 ETH plus RPL "
            "collateral. More decentralized validator set than Lido at a small yield cost."
        ),
        "url": "https://rocketpool.net",
    },
    "coinbase-wrapped-staked-eth": {
        "category": Category.LST,
        "audit_count": 3,
        "audit_firms": ["openzeppelin", "halborn", "certora"],
        "launched_at": date(2022, 8, 24),
        "lockup_days": 0,
        "max_drawdown_1y": 0.025,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 1.0},
        "description": (
            "cbETH is Coinbase's liquid staked ETH receipt token. Validator infrastructure operated "
            "entirely by Coinbase. KYC to mint/redeem at par via Coinbase, but cbETH itself is freely "
            "transferable on Ethereum and select L2s. Centralized operator risk for institutional "
            "reliability."
        ),
        "url": "https://www.coinbase.com/cbeth",
    },
    "ether.fi-stake": {
        "category": Category.LRT,
        "audit_count": 5,
        "audit_firms": ["nethermind", "certik", "omniscia", "solidified", "zellic"],
        "launched_at": date(2023, 11, 15),
        "lockup_days": 0,
        "max_drawdown_1y": 0.04,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 0.5, "restaking_reward": 0.3, "points_airdrop": 0.2},
        "description": (
            "ether.fi is the largest liquid restaking token. weETH represents staked ETH also "
            "restaked through EigenLayer and assigned to AVS operators. Earns ETH staking yield "
            "plus restaking rewards plus ether.fi loyalty points. Non-custodial Stake at Home keeps "
            "validator keys with the user."
        ),
        "url": "https://ether.fi",
    },
    "renzo": {
        "category": Category.LRT,
        "audit_count": 3,
        "audit_firms": ["halborn", "code4rena", "sigma_prime"],
        "launched_at": date(2024, 1, 18),
        "lockup_days": 0,
        "max_drawdown_1y": 0.06,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 0.4, "restaking_reward": 0.3, "points_airdrop": 0.3},
        "description": (
            "Renzo issues ezETH, a liquid restaking token built on EigenLayer. Deposit ETH or stETH, "
            "receive ezETH, which accrues staking and restaking yield. Renzo manages AVS allocation "
            "on behalf of holders. Briefly depegged in April 2024 due to thin DEX liquidity around "
            "an airdrop event."
        ),
        "url": "https://renzoprotocol.com",
    },
    "kelp": {
        "category": Category.LRT,
        "audit_count": 3,
        "audit_firms": ["sigma_prime", "code4rena", "halborn"],
        "launched_at": date(2023, 12, 3),
        "lockup_days": 0,
        "max_drawdown_1y": 0.05,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 0.4, "restaking_reward": 0.3, "points_airdrop": 0.3},
        "description": (
            "Kelp DAO issues rsETH, a liquid restaking token built on EigenLayer. Accepts LSTs "
            "(stETH, ETHx, sfrxETH) as deposits, simplifying restaking for users already holding "
            "staked ETH. Kelp Miles loyalty program overlays on EigenLayer points."
        ),
        "url": "https://kelpdao.xyz",
    },
    "swell-liquid-restaking": {
        "category": Category.LRT,
        "audit_count": 3,
        "audit_firms": ["chainsecurity", "sigma_prime", "halborn"],
        "launched_at": date(2024, 1, 23),
        "lockup_days": 0,
        "max_drawdown_1y": 0.05,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 0.45, "restaking_reward": 0.3, "points_airdrop": 0.25},
        "description": (
            "Swell offers swETH (liquid staked ETH) and rswETH (liquid restaking). The team is "
            "building Swellchain, a restaking-secured OP Stack L2, where rswETH holders are early "
            "participants in chain revenue. Decentralized node operator set."
        ),
        "url": "https://www.swellnetwork.io",
    },
    "curve-dex": {
        "category": Category.STABLE_AMM,
        "audit_count": 6,
        "audit_firms": ["trail_of_bits", "quantstamp", "chainsecurity", "mixbytes", "peckshield", "consensys_diligence"],
        "launched_at": date(2020, 1, 19),
        "lockup_days": 0,
        "max_drawdown_1y": 0.03,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"amm_fees": 0.6, "emissions": 0.4},
        "description": (
            "Curve is the dominant stablecoin and pegged-asset AMM. Pools use the StableSwap "
            "invariant to minimize slippage between similar-priced assets. LPs earn swap fees plus "
            "CRV emissions, with boosted yields available via vote-escrowed CRV (veCRV) or Convex."
        ),
        "url": "https://curve.fi",
    },
    "convex-finance": {
        "category": Category.YIELD_AGGREGATOR,
        "audit_count": 3,
        "audit_firms": ["mixbytes", "peckshield", "abdk"],
        "launched_at": date(2021, 5, 17),
        "lockup_days": 0,
        "max_drawdown_1y": 0.03,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"amm_fees": 0.45, "emissions": 0.45, "validator_commission": 0.1},
        "description": (
            "Convex aggregates Curve LP positions to deliver boosted CRV yields without users "
            "needing to lock CRV themselves. Holds a large veCRV position and distributes the boost "
            "across deposited LPs. CVX rewards on top. Extended to Frax, Prisma, and f(x) protocols."
        ),
        "url": "https://www.convexfinance.com",
    },
    "aerodrome-v1": {
        "category": Category.STABLE_AMM,
        "audit_count": 3,
        "audit_firms": ["spearbit", "code4rena", "halborn"],
        "launched_at": date(2023, 8, 28),
        "lockup_days": 0,
        "max_drawdown_1y": 0.04,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"amm_fees": 0.4, "emissions": 0.6},
        "description": (
            "Aerodrome is the dominant DEX on Base, a Velodrome V2 fork. Implements ve(3,3) "
            "tokenomics where AERO emissions are directed to pools that veAERO holders vote for. "
            "Bribes from protocols seeking liquidity provide additional voter income."
        ),
        "url": "https://aerodrome.finance",
    },
    "velodrome-v2": {
        "category": Category.STABLE_AMM,
        "audit_count": 3,
        "audit_firms": ["spearbit", "code4rena", "peckshield"],
        "launched_at": date(2023, 6, 13),
        "lockup_days": 0,
        "max_drawdown_1y": 0.04,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"amm_fees": 0.4, "emissions": 0.6},
        "description": (
            "Velodrome is the leading DEX on Optimism. Same Solidly-style ve(3,3) tokenomics as "
            "Aerodrome, with VELO emissions directed by veVELO voters. V2 added concentrated "
            "liquidity. Cross-listed with Aerodrome via SuperchainERC20."
        ),
        "url": "https://velodrome.finance",
    },
    "uniswap-v3": {
        "category": Category.VOLATILE_AMM,
        "audit_count": 4,
        "audit_firms": ["trail_of_bits", "abdk", "consensys_diligence", "code4rena"],
        "launched_at": date(2021, 5, 5),
        "lockup_days": 0,
        "max_drawdown_1y": 0.15,
        "tax_treatment": TaxTreatment.CAPITAL_GAIN,
        "yield_source_mix": {"amm_fees": 1.0},
        "description": (
            "Uniswap V3 introduced concentrated liquidity: LPs choose a price range and earn "
            "amplified fees within it. Higher capital efficiency than full-range AMMs but exposes "
            "LPs to impermanent loss when price exits the range. Yield depends heavily on chosen "
            "range and volatility."
        ),
        "url": "https://uniswap.org",
    },
    "yearn-finance": {
        "category": Category.YIELD_AGGREGATOR,
        "audit_count": 4,
        "audit_firms": ["chainsecurity", "mixbytes", "trail_of_bits", "consensys_diligence"],
        "launched_at": date(2020, 7, 17),
        "lockup_days": 0,
        "max_drawdown_1y": 0.04,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"lending_spread": 0.4, "amm_fees": 0.3, "emissions": 0.3},
        "description": (
            "Yearn V3 vaults route deposits through curated strategies (lending, LP, looping). Each "
            "vault holds a set of independent strategies with capital allocated based on risk and "
            "yield. Long track record dating to DeFi summer 2020."
        ),
        "url": "https://yearn.fi",
    },
    "beefy": {
        "category": Category.YIELD_AGGREGATOR,
        "audit_count": 3,
        "audit_firms": ["certik", "halborn", "peckshield"],
        "launched_at": date(2020, 10, 8),
        "lockup_days": 0,
        "max_drawdown_1y": 0.05,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"amm_fees": 0.4, "emissions": 0.5, "lending_spread": 0.1},
        "description": (
            "Beefy auto-compounds LP rewards across dozens of chains and DEXes. Vaults harvest "
            "rewards on a regular schedule and re-deposit, saving users gas. Targets long-tail yield "
            "farming opportunities rather than blue-chip lending."
        ),
        "url": "https://beefy.com",
    },
    "gmx-v2-perps": {
        "category": Category.PERPS_LP,
        "audit_count": 4,
        "audit_firms": ["sherlock", "guardian", "abdk", "openzeppelin"],
        "launched_at": date(2023, 8, 1),
        "lockup_days": 0,
        "max_drawdown_1y": 0.10,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"amm_fees": 0.5, "mev_capture": 0.5},
        "description": (
            "GMX V2 lets users LP into specific market pools (e.g. ETH/USD-USDC) and earn the fee "
            "stream from perpetual traders on that market. Pool LPs are the counterparty to trader "
            "PnL: profitable when traders lose, lossy when traders win. Operates on Arbitrum and "
            "Avalanche."
        ),
        "url": "https://gmx.io",
    },
    "kamino-lend": {
        "category": Category.LENDING,
        "audit_count": 3,
        "audit_firms": ["ottersec", "offside_labs", "kudelski_security"],
        "launched_at": date(2024, 3, 14),
        "lockup_days": 0,
        "max_drawdown_1y": 0.04,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"lending_spread": 1.0},
        "description": (
            "Kamino Lend is the largest lending market on Solana. Multi-market design with isolated "
            "main markets (USDC, SOL) and isolated long-tail markets. Tightly integrated with "
            "Kamino CLMM strategies for collateralized borrowing against LP positions."
        ),
        "url": "https://app.kamino.finance",
    },
    "jupiter-staked-sol": {
        "category": Category.LST,
        "audit_count": 3,
        "audit_firms": ["ottersec", "neodyme", "kudelski_security"],
        "launched_at": date(2024, 1, 30),
        "lockup_days": 0,
        "max_drawdown_1y": 0.035,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 0.85, "mev_capture": 0.15},
        "description": (
            "Jupiter's liquid staked SOL token (JupSOL). Stakes SOL through a curated validator set "
            "with MEV-share kickbacks from Jito-style block construction. Yield runs slightly above "
            "vanilla SOL staking due to the MEV uplift. Integrated across Solana lending and AMMs."
        ),
        "url": "https://jup.ag/staked-sol",
    },
    "jupiter-lend": {
        "category": Category.LENDING,
        "audit_count": 3,
        "audit_firms": ["ottersec", "offside_labs", "kudelski_security"],
        "launched_at": date(2024, 7, 15),
        "lockup_days": 0,
        "max_drawdown_1y": 0.04,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"lending_spread": 1.0},
        "description": (
            "Jupiter's lending market on Solana. Supports SOL, JupSOL, USDC, and major Solana LSTs. "
            "Same team behind Jupiter Perps, so the lending side benefits from shared liquidation "
            "infrastructure and JLP-flow rebates."
        ),
        "url": "https://jup.ag/lend",
    },
    "swell-liquid-staking": {
        "category": Category.LST,
        "audit_count": 3,
        "audit_firms": ["chainsecurity", "sigma_prime", "halborn"],
        "launched_at": date(2023, 4, 18),
        "lockup_days": 0,
        "max_drawdown_1y": 0.03,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 1.0},
        "description": (
            "Swell's liquid staked ETH (swETH), the LST product line distinct from the rswETH "
            "restaking variant. Decentralized operator set, non-rebasing appreciating token. Yield "
            "tracks ETH validator rewards minus a 10% protocol fee."
        ),
        "url": "https://www.swellnetwork.io/swETH",
    },
    "ether.fi-liquid": {
        "category": Category.LRT,
        "audit_count": 4,
        "audit_firms": ["nethermind", "certik", "omniscia", "solidified"],
        "launched_at": date(2024, 4, 1),
        "lockup_days": 0,
        "max_drawdown_1y": 0.05,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 0.4, "restaking_reward": 0.3, "lending_spread": 0.2, "amm_fees": 0.1},
        "description": (
            "ether.fi Liquid routes weETH into curated DeFi strategies (lending, LP, basis trades) on "
            "top of base ETH staking + EigenLayer restaking. Returns typically 100-200 bps above "
            "bare weETH at the cost of additional smart-contract surface area."
        ),
        "url": "https://app.ether.fi/liquid",
    },
    "usual-usd0": {
        "category": Category.STABLECOIN_ISSUANCE,
        "audit_count": 4,
        "audit_firms": ["spearbit", "halborn", "cantina", "sherlock"],
        "launched_at": date(2024, 7, 11),
        "lockup_days": 0,
        "max_drawdown_1y": 0.04,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"real_yield": 0.7, "points_airdrop": 0.3},
        "description": (
            "Usual issues USD0, a stablecoin fully backed by tokenized US Treasuries via Hashnote "
            "USYC. Staking USD0 mints USD0++, a 4-year-locked bond that earns the underlying T-bill "
            "yield plus USUAL token rewards. Headline yield is higher than competitors due to the "
            "token incentive layer."
        ),
        "url": "https://usual.money",
    },
    "balancer-v3": {
        "category": Category.STABLE_AMM,
        "audit_count": 3,
        "audit_firms": ["openzeppelin", "trail_of_bits", "certora"],
        "launched_at": date(2024, 12, 5),
        "lockup_days": 0,
        "max_drawdown_1y": 0.05,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"amm_fees": 0.7, "emissions": 0.3},
        "description": (
            "Balancer V3 adds hooks for custom pool logic, simplified vault math, and partial-fee "
            "mechanics. Live primarily on Base, deployed alongside the older V2 infrastructure. "
            "LPs earn swap fees and BAL emissions."
        ),
        "url": "https://balancer.fi",
    },
    "bedrock-unieth": {
        "category": Category.LRT,
        "audit_count": 3,
        "audit_firms": ["secure3", "peckshield", "trust_security"],
        "launched_at": date(2024, 3, 21),
        "lockup_days": 0,
        "max_drawdown_1y": 0.06,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 0.4, "restaking_reward": 0.3, "points_airdrop": 0.3},
        "description": (
            "Bedrock's uniETH is a liquid restaking token on EigenLayer. RockX operates the "
            "underlying validators. Available on Ethereum, BNB Chain, and Arbitrum, with Bedrock "
            "Diamonds loyalty points layered on top of EigenLayer points."
        ),
        "url": "https://bedrock.technology",
    },
    "puffer-stake": {
        "category": Category.LRT,
        "audit_count": 4,
        "audit_firms": ["sigma_prime", "chainsecurity", "code4rena", "nethermind"],
        "launched_at": date(2024, 2, 1),
        "lockup_days": 0,
        "max_drawdown_1y": 0.05,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 0.5, "restaking_reward": 0.3, "points_airdrop": 0.2},
        "description": (
            "Puffer's pufETH combines liquid staking with EigenLayer restaking plus a Secure-Signer "
            "and Anti-Slasher module that lets solo stakers join the operator set with only 1 ETH. "
            "Stronger decentralization story than operator-curated LRTs."
        ),
        "url": "https://puffer.fi",
    },
    "gauntlet": {
        "category": Category.YIELD_AGGREGATOR,
        "audit_count": 3,
        "audit_firms": ["openzeppelin", "spearbit", "trail_of_bits"],
        "launched_at": date(2024, 9, 12),
        "lockup_days": 0,
        "max_drawdown_1y": 0.04,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"lending_spread": 0.5, "amm_fees": 0.3, "emissions": 0.2},
        "description": (
            "Gauntlet runs curated Morpho Blue MetaMorpho vaults on Base with active risk-parameter "
            "tuning and asset allocation. The Gauntlet brand brings institutional risk modeling to "
            "DeFi yield aggregation."
        ),
        "url": "https://gauntlet.network",
    },
    "origin-ether": {
        "category": Category.LST,
        "audit_count": 3,
        "audit_firms": ["openzeppelin", "consensys_diligence", "narya"],
        "launched_at": date(2023, 5, 9),
        "lockup_days": 0,
        "max_drawdown_1y": 0.03,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 0.7, "lending_spread": 0.2, "amm_fees": 0.1},
        "description": (
            "Origin OETH auto-allocates ETH across a curated basket of staking and restaking "
            "strategies (Lido, Rocket Pool, Curve, Morpho). A wrapper-of-wrappers approach that "
            "trades a small yield haircut for diversification across LST issuers."
        ),
        "url": "https://www.originprotocol.com/oeth",
    },
    "reservoir-protocol": {
        "category": Category.STABLECOIN_ISSUANCE,
        "audit_count": 2,
        "audit_firms": ["spearbit", "code4rena"],
        "launched_at": date(2024, 6, 20),
        "lockup_days": 0,
        "max_drawdown_1y": 0.04,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"real_yield": 0.5, "basis_trade": 0.3, "lending_spread": 0.2},
        "description": (
            "Reservoir issues rUSD, a yield-bearing stablecoin backed by a diversified mix of T-bills, "
            "basis trades, and DeFi-native lending. Targets institutional treasuries with claimed "
            "on-chain reserves and a programmable peg-stability module."
        ),
        "url": "https://reservoir.xyz",
    },
    "sanctum-infinity": {
        "category": Category.LST,
        "audit_count": 3,
        "audit_firms": ["ottersec", "neodyme", "trail_of_bits"],
        "launched_at": date(2024, 5, 8),
        "lockup_days": 0,
        "max_drawdown_1y": 0.04,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 0.85, "mev_capture": 0.15},
        "description": (
            "Sanctum's Infinity Pool is a Solana liquid-staking router. Users hold INF, a token that "
            "auto-rebalances across multiple Solana LSTs (jupSOL, jitoSOL, mSOL, ...) to optimize "
            "yield + slippage. Provides deep liquidity for the long tail of Solana LSTs."
        ),
        "url": "https://www.sanctum.so/infinity",
    },
    "frax-ether": {
        "category": Category.LST,
        "audit_count": 4,
        "audit_firms": ["trail_of_bits", "code4rena", "chainsecurity", "peckshield"],
        "launched_at": date(2023, 10, 24),
        "lockup_days": 0,
        "max_drawdown_1y": 0.03,
        "tax_treatment": TaxTreatment.ORDINARY_INCOME,
        "yield_source_mix": {"validator_commission": 1.0},
        "description": (
            "Frax ETH (frxETH / sfrxETH) is Frax Finance's ETH liquid-staking pair. frxETH is the "
            "rebase-free 1:1 wrapper; sfrxETH is the auto-compounding staked variant. Higher yield "
            "than Lido because Frax routes only the sfrxETH portion to validators, concentrating "
            "rewards."
        ),
        "url": "https://frax.com/frax-ether",
    },
}


# Lowercase mapping for case-insensitive lookups against DefiLlama responses.
PROTOCOL_META_LOWER: dict[str, dict] = {k.lower(): v for k, v in PROTOCOL_META.items()}


def get_meta(project_slug: str) -> dict | None:
    """Return metadata for a DefiLlama project slug, or None if not whitelisted."""
    return PROTOCOL_META_LOWER.get(project_slug.lower())
