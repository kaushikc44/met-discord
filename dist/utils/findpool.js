import fetch from 'node-fetch';
const METEORA_DLMM_API = 'https://dlmm-api.meteora.ag/pair/all_with_pagination?limit=10000';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
/**
 * Find a DLMM pool for the given token + SOL
 * @param {string} tokenMint - the mint address of token (e.g., BONK)
 */
export async function findPoolWithTokenAndSOL(tokenMint) {
    const response = await fetch(METEORA_DLMM_API);
    const data = await response.json();
    const filtered = data.pairs.filter(pair => (pair.mint_x === SOL_MINT && pair.mint_y === tokenMint) ||
        (pair.mint_y === SOL_MINT && pair.mint_x === tokenMint));
    if (filtered.length === 0) {
        throw new Error(`No DLMM pool found for SOL and token: ${tokenMint}`);
    }
    // Optionally, sort by liquidity or feeTVL ratio
    const bestPool = filtered.sort((a, b) => parseFloat(b.liquidity) - parseFloat(a.liquidity))[0];
    return {
        poolAddress: bestPool.address,
        poolName: bestPool.name,
        liquidity: bestPool.liquidity,
        mintX: bestPool.mint_x,
        mintY: bestPool.mint_y,
        binStep: bestPool.bin_step
    };
}
