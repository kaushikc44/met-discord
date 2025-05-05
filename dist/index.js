import 'dotenv/config';
import DLMM, { autoFillYByStrategy, StrategyType } from '@meteora-ag/dlmm';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';
//importing of jupiter swap 
import { performSwap } from "./utils/jupswap.js";
//crypto library
import crypto from 'crypto';
//file import 
import fs from 'fs';
//pool fetch import 
import { findPoolWithTokenAndSOL } from './utils/findpool.js';
//solana connection 
const connection = new Connection('https://api.mainnet-beta.solana.com');
//rawdata for testing purpose 
const BONK_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USER_ID = '426939679338659840';
//pool address can be used for test case
// const poolAddress = '6oFWm7KPLfxnwMb3z5xwBoXNSPP3JJyirAPqPSiVcnsp';
const ENCRYPTION_SECRET = "3e5c4d2a6b8f792a07c9d5a4b2f6e8cf";
function loadKeypair() {
    console.log("Entered Encryption");
    const db = JSON.parse(fs.readFileSync('./database.json', 'utf8'));
    const encryptedSecretKey = db[USER_ID].encryptedSecretKey;
    const [ivHex, encryptedHex] = encryptedSecretKey.split(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_SECRET), Buffer.from(ivHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
    return Keypair.fromSecretKey(Uint8Array.from(Buffer.from(decrypted.toString(), 'hex')));
}
async function testDLMM() {
    try {
        //swapping using jup 
        const userKeypair = loadKeypair();
        console.log("The keypair is :- ", userKeypair);
        // 🔄 Step 1: Swap 5 USD worth of SOL to BONK
        const amountSOLInLamports = 5 * 1e9;
        const swapResult = await performSwap(SOL_MINT, BONK_MINT, amountSOLInLamports, userKeypair);
        console.log('✅ Swap completed. Tx Signature:', swapResult.signature);
        // 🧠 Step 2: Find DLMM Pool
        const pool = await findPoolWithTokenAndSOL(BONK_MINT);
        const dlmmPool = await DLMM.create(connection, new PublicKey(pool.poolAddress));
        console.log("✅ Successfully created DLMM pool:");
        const activeBin = await dlmmPool.getActiveBin();
        console.log("✅ The active bin are :-", activeBin);
        const TOTAL_RANGE_INTERVAL = 10;
        const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
        const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;
        const bonkFloat = 256314.23643;
        const bonkDecimals = 5;
        const totalBonkAmount = new BN(Math.floor(bonkFloat * 10 ** bonkDecimals));
        const totalSolAmount = autoFillYByStrategy(activeBin.binId, dlmmPool.lbPair.binStep, totalBonkAmount, activeBin.xAmount, activeBin.yAmount, minBinId, maxBinId, StrategyType.Spot);
        const newSolAmount = new BN('1c924c4', 16); // or just new BN('29825956')
        console.log(newSolAmount.toString()); // 
        const solAmount = newSolAmount.toNumber() / 1000000000;
        console.log("The Sol amount would be ", solAmount);
    }
    catch (error) {
        console.error("❌ Error:", error);
    }
}
testDLMM();
