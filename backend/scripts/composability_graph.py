"""Receipt-token composability graph for the catalog.

PROJECT_GRAPH maps each source DefiLlama project slug (or manual.yaml id) to
the list of project slugs that accept its receipt tokens as collateral, LP
inputs, or wrapped underlyings. node2vec runs on the catalog-expanded version
of this graph to produce 64d composability vectors.

The graph is intentionally directional: stETH is accepted by Aave (edge from
lido -> aave-v3), but Aave's aTokens aren't typically deposited back into Lido.

Coverage isn't exhaustive — focus is on the top-30 most composable assets in
the catalog. Long-tail protocols not in the graph get a self-loop only (so
node2vec still produces a vector for them, just one isolated from the cluster).
"""

PROJECT_GRAPH: dict[str, list[str]] = {
    # ETH liquid staking → accepted as collateral/inputs almost everywhere
    "lido": [
        "aave-v3", "morpho-blue", "sparklend", "compound-v3", "fluid-lending",
        "curve-dex", "balancer-v3", "convex-finance", "pendle",
        "ether.fi-stake", "ether.fi-liquid", "ethena-usde", "origin-ether",
        "yearn-finance", "gauntlet",
    ],
    "rocket-pool": [
        "aave-v3", "morpho-blue", "sparklend", "curve-dex", "pendle",
        "balancer-v3", "convex-finance", "fluid-lending", "origin-ether",
        "yearn-finance",
    ],
    "coinbase-wrapped-staked-eth": [
        "aave-v3", "morpho-blue", "compound-v3", "curve-dex", "balancer-v3",
        "pendle",
    ],
    "frax-ether": [
        "aave-v3", "morpho-blue", "curve-dex", "convex-finance", "pendle",
        "fluid-lending", "kelp",
    ],
    "origin-ether": [
        "morpho-blue", "curve-dex", "convex-finance", "pendle",
    ],

    # LRTs — restake into EigenLayer, often re-deposited in Pendle/Aave/Morpho
    "ether.fi-stake": [
        "aave-v3", "morpho-blue", "pendle", "ether.fi-liquid", "renzo",
        "gauntlet", "curve-dex", "balancer-v3",
    ],
    "ether.fi-liquid": [
        "pendle", "morpho-blue", "curve-dex",
    ],
    "renzo": [
        "aave-v3", "morpho-blue", "pendle", "curve-dex", "balancer-v3",
    ],
    "kelp": [
        "pendle", "morpho-blue", "curve-dex", "balancer-v3",
    ],
    "swell-liquid-restaking": [
        "pendle", "morpho-blue", "curve-dex",
    ],
    "swell-liquid-staking": [
        "aave-v3", "morpho-blue", "curve-dex", "pendle",
    ],
    "bedrock-unieth": [
        "pendle", "curve-dex", "balancer-v3",
    ],
    "puffer-stake": [
        "morpho-blue", "pendle", "curve-dex",
    ],

    # Solana LSTs
    "jupiter-staked-sol": [
        "kamino-lend", "jupiter-lend", "sanctum-infinity",
    ],
    "sanctum-infinity": [
        "kamino-lend", "jupiter-lend",
    ],

    # Stablecoins / RWAs — get rehypothecated as Pendle PT bases, lending markets
    "ethena-usde": [
        "pendle", "morpho-blue", "aave-v3", "sparklend", "curve-dex",
        "convex-finance", "fluid-lending", "usual-usd0", "reservoir-protocol",
    ],
    "sky-lending": [
        "spark-savings", "sparklend", "pendle", "morpho-blue", "curve-dex",
    ],
    "spark-savings": [
        "sparklend", "pendle", "morpho-blue", "fluid-lending",
    ],
    "frax": [
        "aave-v3", "morpho-blue", "convex-finance", "curve-dex", "pendle",
    ],
    "ondo-yield-assets": [
        "maple_cash_management", "spark-savings", "pendle",
    ],
    "blackrock_buidl": [
        "maple_cash_management", "ondo-yield-assets",
    ],
    "hashnote_usyc": [
        "usual-usd0", "ondo-yield-assets",
    ],
    "usual-usd0": [
        "pendle", "morpho-blue", "curve-dex",
    ],
    "reservoir-protocol": [
        "pendle", "morpho-blue",
    ],
    "mountain_usdm": [
        "pendle", "curve-dex",
    ],

    # Lending receipts — sometimes used as collateral on other markets
    "aave-v3": [
        "pendle", "morpho-blue", "yearn-finance", "beefy",
    ],
    "compound-v3": [
        "pendle", "yearn-finance",
    ],
    "morpho-blue": [
        "pendle", "gauntlet", "yearn-finance",
    ],
    "sparklend": [
        "pendle",
    ],
    "fluid-lending": [
        "pendle", "yearn-finance",
    ],

    # DEX LPs → aggregators boost them
    "curve-dex": [
        "convex-finance", "yearn-finance", "beefy", "pendle",
    ],
    "balancer-v3": [
        "yearn-finance", "beefy",
    ],
    "aerodrome-v1": [
        "yearn-finance", "beefy",
    ],
    "velodrome-v2": [
        "yearn-finance", "beefy",
    ],
    "uniswap-v3": [
        "gauntlet", "yearn-finance", "beefy",
    ],

    # Yield wrappers
    "yearn-finance": [
        "morpho-blue", "pendle",
    ],
    "convex-finance": [
        "pendle", "yearn-finance",
    ],
    "beefy": [
        "yearn-finance",
    ],

    # Fixed-rate / yield-trading
    "pendle": [
        "morpho-blue", "aave-v3", "curve-dex", "convex-finance",
    ],

    # CeFi-adjacent credit
    "maple_high_yield_secured": [
        "pendle",
    ],
    "maple_cash_management": [
        "morpho-blue",
    ],
    "clearpool_pgf500_usdc": [
        "morpho-blue",
    ],
    "truefi_us_treasury": [
        "pendle",
    ],
}
