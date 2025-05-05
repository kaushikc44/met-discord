import 'dotenv/config';
import DLMM, {  autoFillYByStrategy, StrategyType ,PositionData}  from '@meteora-ag/dlmm';
import { Connection, PublicKey,sendAndConfirmTransaction,Keypair,LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
//importing of jupiter swap 
import { jupSwap } from "./utils/jupfunctions"
import { summarizePositionData } from './utils/positionSummizer';

import { readPositionAccount } from "./utils/readPositionAccounts";
//crypto library
import crypto from 'crypto';

//file import 
import fs from 'fs';


import { getMint } from '@solana/spl-token';



//pool fetch import 
import { findPoolWithTokenAndSOL } from './utils/findpool';

//solana connection 
const connection = new Connection('https://grateful-jerrie-fast-mainnet.helius-rpc.com');




//pool address can be used for test case
// const poolAddress = '6oFWm7KPLfxnwMb3z5xwBoXNSPP3JJyirAPqPSiVcnsp';
const ENCRYPTION_SECRET = "3e5c4d2a6b8f792a07c9d5a4b2f6e8cf";


//const sol mint value 
let SOL_MINT = 'So11111111111111111111111111111111111111112';

function loadKeypair(USER_ID:string) {
  console.log("Entered Encryption")
  // to fetch the user id from the db
  const db = JSON.parse(fs.readFileSync('./database.json', 'utf8'));
  const encryptedSecretKey = db[USER_ID].encryptedSecretKey;
  const [ivHex, encryptedHex] = encryptedSecretKey.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_SECRET), Buffer.from(ivHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
  return Keypair.fromSecretKey(Uint8Array.from(Buffer.from(decrypted.toString(), 'hex')));
}


//Fetch Tokens decimals 
async function  decimals (mintAddress:PublicKey):Promise<number>  {
  const mintInfo = await getMint(connection, mintAddress);
  console.log('Token decimals:', mintInfo.decimals);
  return mintInfo.decimals
};

//Code to add liquidity 
//user id from the discord 
// address of secondary token 
//amount to put in the liquidity
//stragey type 
type TradeResponse = {
  status: number;
  message: string;
};


export function getTotalRangeInterval({
 totalBaseAmount,
 baseDecimals,
 binStep,
 minTokenPerBin = 5,
 maxBinsPerSide = 25,
 minBinsPerSide = 3,
}: {
 totalBaseAmount: number;
 baseDecimals: number;
 binStep: number;
 minTokenPerBin?: number;
 maxBinsPerSide?: number;
 minBinsPerSide?: number;
}): number {
 const totalBaseTokens = totalBaseAmount / Math.pow(10, baseDecimals); // convert to full tokens

 // Estimate how many bins we can cover with minTokenPerBin per bin
 const binsByTokenCapacity = Math.floor(totalBaseTokens / minTokenPerBin);

 // Estimate how many bins needed to cover ±3% price movement
 const binsByPriceCoverage = Math.floor(3 / (binStep / 100)); // binStep is in basis points

 // Final bins per side: conservative minimum of both
 let binsPerSide = Math.min(binsByTokenCapacity, binsByPriceCoverage);

 // Clamp the range between min and max limits
 binsPerSide = Math.max(minBinsPerSide, Math.min(binsPerSide, maxBinsPerSide));

 return binsPerSide;
}




//return solscan link 
export async function AddLiquidityDLMM(userId:string , tokenAddress:string,amount:number):Promise<TradeResponse>  {
  try {

    
    //swapping using jup 
    const userKeypair = loadKeypair(userId);
    console.log("The keypair is :- ",userKeypair)

  // 🔄 Step 1: Swap 5 USD worth of SOL to BONK
  const totalLamports = Math.round(amount * LAMPORTS_PER_SOL);

  const halfLamports = Math.floor(totalLamports / 2);
  
  // 💱 Swap half of SOL to BONK
  const swapResult = await jupSwap(SOL_MINT, tokenAddress, halfLamports, userKeypair);
  

  // 🧠 Step 2: Find DLMM Pool
    const pool = await findPoolWithTokenAndSOL(tokenAddress);

    //create an inistanec of dlmm
    const dlmmPool = await DLMM.create(connection, new PublicKey(pool.poolAddress));
    console.log("✅ Successfully created DLMM pool:");
    const activeBin = await dlmmPool.getActiveBin();
    console.log("✅ The active bin are :-",Number(activeBin))
    const desiredCoveragePercent = 3; // You want to cover ±3% price movement
   
    
    const userAmountInLamports = 100 * 10 ** 9; // 100 SOL
    const baseDecimals = 9; // SOL
    const binStep = dlmmPool.lbPair.binStep; 
    const tokenDecimal = await decimals(new PublicKey(tokenAddress))

const TOTAL_RANGE_INTERVAL = getTotalRangeInterval({
  totalBaseAmount: Number(swapResult?.outAmount),
  baseDecimals:tokenDecimal,
  binStep,
});
   
  console.log(TOTAL_RANGE_INTERVAL)
    const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
    const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

   
  
    const tokenAmountRaw = new BN(Number(swapResult?.outAmount)); // already in smallest units
    console.log(tokenAmountRaw)
 // remaining SOL for liquidity
  const remainingSol = new BN(totalLamports - halfLamports);
  console.log((totalLamports-halfLamports)*10**9)
  console.log("The reaming lamports are",remainingSol) 



    

    const totalmemeAmount = autoFillYByStrategy(
      activeBin.binId,
      dlmmPool.lbPair.binStep,
      remainingSol,
      activeBin.xAmount,
      activeBin.yAmount,
      minBinId,
      maxBinId,
      StrategyType.Spot
    );

  

    // const newSolAmount = new BN('1c924c4', 16); // or just new BN('29825956')
    // console.log(newSolAmount.toString()); // 

    // const solAmount = newSolAmount.toNumber() / 1_000_000_000;
    // console.log("The Sol amount would be ", solAmount);

    // console.log("The total sol value",totalSolAmount)
    const positionKeypair = Keypair.generate();
    console.log(`The token value is ${tokenAmountRaw} and sol value is ${remainingSol} also types are ${typeof(tokenAmountRaw)} and ${typeof(remainingSol)}}`)

  // 🏗️ Build Transaction
    const createTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
    positionPubKey: positionKeypair.publicKey,
    user: userKeypair.publicKey,
    totalXAmount: remainingSol,
    totalYAmount: totalmemeAmount,
    strategy: {
      minBinId,
      maxBinId,
      strategyType: StrategyType.Spot
    },
  });

  console.log("✅ Created a tranasction :-",createTx)

  const depositSig = await sendAndConfirmTransaction(connection, createTx, [
    userKeypair,
    positionKeypair,
  ]);

  interface ValueResponse{
    status:number,
    message:string
}

  console.log('✅ Liquidity deposited. Position:', positionKeypair.publicKey.toBase58());
  console.log('🔗 View on Solscan:', `https://solscan.io/tx/${depositSig}`);
  return {
    status:200,
    message:depositSig
  }


    
  
  } catch (error) {
    console.error("❌ Error:", error);
    return {
      status:400,
      message:"ERROR"
    }
    
  }
}




//addressd of the other token to be fetch from the db 
//discord id 

//return the list of position 
//ignore function not required 






// async function  PositionDLMM() {
//   console.log("Fetching ")
//   const userKeypair = loadKeypair();
//   console.log("The keypair is :- ",userKeypair)
//   const pool = await findPoolWithTokenAndSOL(BONK_MINT);
  

//   const dlmmPool = await DLMM.create(connection, new PublicKey(pool.poolAddress));
//   const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(
//     userKeypair.publicKey
  
//   );

  
//   const positionData = userPositions[0].positionData;
// console.log(summarizePositionData(positionData));
  
// }








//provide the user address
//also lookup the decimal points for better readability 



// async function  PositionDlmmAll() {
//   const userKeypair = loadKeypair();
//   const map = await DLMM.getAllLbPairPositionsByUser(connection, userKeypair.publicKey);
//   console.log(map)

  
// for (const [positionKey, positionInfo] of map.entries()) {
//   console.log(`🧾 Position Meteora: ${positionKey}`);

//   for (const lbPosition of positionInfo.lbPairPositionsData) {
//     const positionData: PositionData = lbPosition.positionData;

//     // Optional: clean up positionRewardAmount if needed
//     positionData.positionBinData = positionData.positionBinData.map((bin) => ({
//       ...bin,
//       positionRewardAmount: [
//         bin.positionRewardAmount[0] ?? '0',
//         bin.positionRewardAmount[1] ?? '0'
//       ] as [string, string]
//     }));

//     const summary = summarizePositionData(positionData);
//     console.log(summary);

//     //return the posiition address and 
// }
// }}






// export async function getClosePositionTxn(
//   userWalletAddress: PublicKey,
//   positionPubkey: PublicKey,
//   minBinId: number,
//   maxBinId: number,
//   bps: number,
//   shouldClaimAndClose: boolean
// ) {
//   console.log("The positionPublivkey is ",positionPubkey.toBase58())
//   const positionData = await readPositionAccount(positionPubkey.toBase58());
//   const poolAddress = positionData.parsed.data.lbPair;
//   const dlmmInstance = await DLMM.create(
//     connection,
//     new PublicKey(poolAddress)
//   );


//   const closePositionTxn = await dlmmInstance.removeLiquidity({
//     user: userWalletAddress,
//     position: positionPubkey,
//     fromBinId: minBinId,
//     toBinId: maxBinId,
//     bps: new BN(bps),
//     shouldClaimAndClose: shouldClaimAndClose,
//   });

//   return closePositionTxn;
// }












// async function testFun() {
//   const userKeypair = loadKeypair();

//   //Interface to be used for passing user values
//   interface PositionCrucials {
//     PositionKey: PublicKey;
//     minBinId: number;
//     maxBinId: number;
//   }

//   async function Data(){
//     const map = await DLMM.getAllLbPairPositionsByUser(connection, userKeypair.publicKey);
    

//     for (const [, positionInfo] of map.entries()) {
//       for (const lbPosition of positionInfo.lbPairPositionsData) {
//         const positionData = lbPosition.positionData;
    
//         return {
//           PositionKey: positionInfo.publicKey, // ✅ use the real PublicKey here
//           minBinId: positionData.lowerBinId,
//           maxBinId: positionData.upperBinId,
//         };
//       }
//     }

//     return null;
//   }

//   // ✅ Await the result before logging it
//   const result = await Data();

//   console.log("🧾 Extracted Position Crucials:", result);
  
//   console.log("❌Closing positon")
//   if (result) {
//     const { PositionKey, minBinId, maxBinId } = result;
//     const percent  = 10000
  
//     // Now safe to pass since PositionKey is definitely defined
//     await getClosePositionTxn(userKeypair.publicKey,PositionKey,minBinId,maxBinId,percent,true);
//   } else {
//     console.error("❌ No position data found.");
//   }
  
// }










