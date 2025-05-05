import { PublicKey } from '@solana/web3.js';
import type { PositionData } from '@meteora-ag/dlmm';
import BN from 'bn.js';

interface PositionBinData {
  binId: number;
  price: string;
  pricePerToken: string;
  binXAmount: string;
  binYAmount: string;
  binLiquidity: string;
  positionLiquidity: string;
  positionXAmount: string;
  positionYAmount: string;
  positionFeeXAmount: string;
  positionFeeYAmount: string;
  positionRewardAmount: [string, string]; // ✅ tuple with exactly 2 items
}



interface PositionSummary {
  tokenXAmount: string;
  tokenYAmount: string;
  totalLiquidity: string;
  totalFeeX: string;
  totalFeeY: string;
  binCount: number;
  priceRange: string;
}

export function summarizePositionData(positionData: PositionData): PositionSummary {
  let totalLiquidity = BigInt(0);
  let totalX = BigInt(0);
  let totalY = BigInt(0);
  let totalFeeX = BigInt(0);
  let totalFeeY = BigInt(0);
  const prices: number[] = [];

  for (const bin of positionData.positionBinData) {
    totalLiquidity += BigInt(bin.positionLiquidity);
    totalX += BigInt(bin.positionXAmount);
    totalY += BigInt(bin.positionYAmount);
    totalFeeX += BigInt(bin.positionFeeXAmount);
    totalFeeY += BigInt(bin.positionFeeYAmount);
    prices.push(parseFloat(bin.price));
  }

  const format = (n: bigint) => new Intl.NumberFormat().format(Number(n));

  return {
    tokenXAmount: format(totalX),
    tokenYAmount: format(totalY),
    totalLiquidity: totalLiquidity.toString(),
    totalFeeX: format(totalFeeX),
    totalFeeY: format(totalFeeY),
    binCount: positionData.positionBinData.length,
    priceRange: `${Math.min(...prices).toFixed(6)} – ${Math.max(...prices).toFixed(6)}`
  };
}
