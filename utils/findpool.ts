// DLMM Pool Fetcher - TypeScript version

// ---- Type Definitions ----
export interface Pool {
  poolAddress: string;
  poolName: string;
  mintX: string;
  mintY: string;
  binStep: number;
  baseFee: string;
  liquidity: string;
  trade_volume_24h: string;
}

interface AllWithPaginationResponse {
  pairs: {
    address: string;
    name: string;
    mint_x: string;
    mint_y: string;
    bin_step: number;
    base_fee_percentage: string;
    liquidity: string;
    trade_volume_24h: number;
    fee_tvl_ratio: Record<string, number>;
    volume: Record<string, number>;
  }[];
}

// ---- Retry Logic ----
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

function getJitteredDelay(baseDelay: number): number {
  const jitter = Math.random() * 0.3 + 0.85;
  return Math.min(baseDelay * jitter, RETRY_CONFIG.maxDelay);
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  try {
    const response = await fetch(url, { ...options, cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (retryCount >= RETRY_CONFIG.maxRetries) {
      throw new Error(
        `Failed after ${RETRY_CONFIG.maxRetries} retries: ${errorMessage}`
      );
    }

    const delay = getJitteredDelay(
      RETRY_CONFIG.baseDelay * Math.pow(2, retryCount)
    );
    console.warn(
      `Retry ${retryCount + 1} in ${Math.round(delay / 1000)}s: ${errorMessage}`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry<T>(url, options, retryCount + 1);
  }
}

// ---- Main API Call ----
async function fetchAllWithPagination(limit: number): Promise<AllWithPaginationResponse> {
  return await fetchWithRetry<AllWithPaginationResponse>(
    `https://dlmm-api.meteora.ag/pair/all_with_pagination?limit=${limit}`,
    {
      method: "GET",
      headers: {},
    }
  );
}

// ---- Token-SOL Pool Finder ----
const SOL_MINT = "So11111111111111111111111111111111111111112";

export async function findPoolWithTokenAndSOL(tokenMint: string): Promise<Pool> {
  const allPools = await fetchAllWithPagination(15000);

  const match = allPools.pairs.find(
    (pair) =>
      (pair.mint_x === tokenMint && pair.mint_y === SOL_MINT) ||
      (pair.mint_y === tokenMint && pair.mint_x === SOL_MINT)
  );

  if (!match) throw new Error(`No DLMM pool found for ${tokenMint} paired with SOL`);

  return {
    poolAddress: match.address,
    poolName: match.name,
    mintX: match.mint_x,
    mintY: match.mint_y,
    binStep: match.bin_step,
    baseFee: match.base_fee_percentage,
    liquidity: match.liquidity,
    trade_volume_24h: match.trade_volume_24h.toString(),
  };
}



