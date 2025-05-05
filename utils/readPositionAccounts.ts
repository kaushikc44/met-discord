import { PublicKey } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import * as borsh from "@project-serum/borsh";
import BN from "bn.js";

// Define types for the deserialized data
interface UserRewardInfo {
  rewardPerTokenCompletes: BN[];
  rewardPendings: BN[];
}

interface FeeInfo {
  feeXPerTokenComplete: BN;
  feeYPerTokenComplete: BN;
  feeXPending: BN;
  feeYPending: BN;
}

export interface PositionV2Data {
  lbPair: PublicKey;
  owner: PublicKey;
  liquidityShares: BN[];
  rewardInfos: UserRewardInfo[];
  feeInfos: FeeInfo[];
  lowerBinId: number;
  upperBinId: number;
  lastUpdatedAt: BN;
  totalClaimedFeeXAmount: BN;
  totalClaimedFeeYAmount: BN;
  totalClaimedRewards: BN[];
  operator: PublicKey;
  lockReleasePoint: BN;
  padding0: number;
  feeOwner: PublicKey;
  reserved: number[];
}

// Define the UserRewardInfo layout
const userRewardInfoLayout = borsh.struct([
  borsh.array(borsh.u128(), 2, "rewardPerTokenCompletes"),
  borsh.array(borsh.u64(), 2, "rewardPendings"),
]);

// Define the FeeInfo layout
const feeInfoLayout = borsh.struct([
  borsh.u128("feeXPerTokenComplete"),
  borsh.u128("feeYPerTokenComplete"),
  borsh.u64("feeXPending"),
  borsh.u64("feeYPending"),
]);

// Define the PositionV2 account layout
// Note: Adjusting layout order based on the expected data structure
export const POSITION_V2_LAYOUT = borsh.struct([
  // Add 8 bytes discriminator at the start
  borsh.array(borsh.u8(), 8, "discriminator"),
  borsh.publicKey("lbPair"),
  borsh.publicKey("owner"),
  borsh.array(borsh.u128(), 70, "liquidityShares"),
  borsh.array(userRewardInfoLayout, 70, "rewardInfos"),
  borsh.array(feeInfoLayout, 70, "feeInfos"),
  borsh.i32("lowerBinId"),
  borsh.i32("upperBinId"),
  borsh.i64("lastUpdatedAt"),
  borsh.u64("totalClaimedFeeXAmount"),
  borsh.u64("totalClaimedFeeYAmount"),
  borsh.array(borsh.u64(), 2, "totalClaimedRewards"),
  borsh.publicKey("operator"),
  borsh.u64("lockReleasePoint"),
  borsh.u8("padding0"),
  borsh.publicKey("feeOwner"),
  borsh.array(borsh.u8(), 87, "reserved"),
]);

export async function readPositionAccount(positionId: string) {
const connection = new Connection('https://grateful-jerrie-fast-mainnet.helius-rpc.com');


  const positionAccount = await connection.getAccountInfo(
    new PublicKey(positionId)
  );
  console.log("Receviing postionAccount",positionAccount)

  if (!positionAccount) {
    throw new Error("Position account not found");
  }

  // validate its a position account
  const owner = positionAccount?.owner.toBase58();
  console.log("The owner is ",owner)
  console.log("📦 Buffer size:", positionAccount);


  if (owner !== "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo") {
    throw new Error("Invalid position account");
  }

  console.log(positionAccount.data);

  // Deserialize the position data
  const positionData = POSITION_V2_LAYOUT.decode(
    positionAccount.data
  ) as PositionV2Data & { discriminator: number[] };
 
  console.log("The position Data is",positionData)

  // Format the data to match SolanaFM explorer format
  const formattedData = {
    parsed: {
      name: "PositionV2",
      data: {
        lbPair: positionData.lbPair.toBase58(),
        owner: positionData.owner.toBase58(),
        liquidityShares: positionData.liquidityShares.map((share: BN) => {
          const str = share.toString(10);
          return str === "0" ? "0" : str;
        }),
        rewardInfos: positionData.rewardInfos.map((info: UserRewardInfo) => ({
          rewardPerTokenCompletes: info.rewardPerTokenCompletes.map((r: BN) =>
            r.toString(10)
          ),
          rewardPendings: info.rewardPendings.map((r: BN) => r.toString(10)),
        })),
        feeInfos: positionData.feeInfos.map((fee: FeeInfo) => ({
          feeXPerTokenComplete: fee.feeXPerTokenComplete.toString(10),
          feeYPerTokenComplete: fee.feeYPerTokenComplete.toString(10),
          feeXPending: fee.feeXPending.toString(10),
          feeYPending: fee.feeYPending.toString(10),
        })),
        lowerBinId: positionData.lowerBinId,
        upperBinId: positionData.upperBinId,
        lastUpdatedAt: positionData.lastUpdatedAt.toString(10),
        totalClaimedFeeXAmount:
          positionData.totalClaimedFeeXAmount.toString(10),
        totalClaimedFeeYAmount:
          positionData.totalClaimedFeeYAmount.toString(10),
        totalClaimedRewards: positionData.totalClaimedRewards.map((r: BN) =>
          r.toString(10)
        ),
        operator: positionData.operator.toBase58(),
        lockReleasePoint: positionData.lockReleasePoint.toString(10),
        padding0: positionData.padding0,
        feeOwner: positionData.feeOwner.toBase58(),
        reserved: Buffer.from(positionData.reserved).toString("base64"),
      },
      type: "account",
    },
    program: "lb_clmm",
    space: positionAccount.data.length,
  };

  return formattedData;
}