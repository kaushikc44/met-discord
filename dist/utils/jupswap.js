// jupSwap.js
import { getUltraSwapTxn, executeUltraSwapTxn } from './jupfunctions'; // Your Ultra functions
import { Keypair } from '@solana/web3.js';
// Main swap function
export async function performSwap(inputMint, outputMint, amount, userKeypair) {
    try {
        console.log('⏳ Preparing swap transaction...');
        // 1. Fetch unsigned swap transaction
        const swapping = await getUltraSwapTxn(inputMint, outputMint, amount, userKeypair.publicKey.toBase58());
        console.log('✅ Swap transaction prepared.');
        // 2. Sign the transaction with user's keypair
        swapping.transaction.sign([userKeypair]);
        // 3. Serialize transaction to base64
        const serializedTxn = swapping.transaction.serialize();
        const signedTransaction = Buffer.from(serializedTxn).toString('base64');
        console.log('signedTransaction:', signedTransaction);
        console.log('requestId:', swapping.requestId);
        console.log('✅ Signed transaction ready.');
        const execution = await executeUltraSwapTxn(signedTransaction, swapping.requestId);
        console.log('✅ Swap executed successfully:', execution);
        return execution;
    }
    catch (error) {
        console.error('❌ Error during performSwap:', error);
        throw error;
    }
}
