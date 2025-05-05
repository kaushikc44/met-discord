import { VersionedTransaction, Keypair, PublicKey } from "@solana/web3.js";
import fetch from "node-fetch";
export async function jupSwap(inputMint, outputMint, amount, userKeypair, retry = 10) {
    for (let i = 0; i < retry; i++) {
        try {
            const ultraSwapTxn = await getUltraSwapTxn(inputMint, outputMint, amount, userKeypair.publicKey.toString());
            const executeSwapTxn = await executeUltraSwapTxn(ultraSwapTxn.transaction, ultraSwapTxn.requestId, userKeypair);
            if (executeSwapTxn?.outAmount) {
                return executeSwapTxn;
            }
            else {
                console.log("Swap failed, retrying...");
                continue;
            }
        }
        catch (error) {
            console.error("Error in jupSwap:", error);
            continue;
        }
    }
    return null;
}
export async function getUltraSwapTxn(inputMint, outputMint, amount, userPublicKey) {
    try {
        const response = await fetch(`https://lite-api.jup.ag/ultra/v1/order?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&taker=${userPublicKey}`);
        const orderResponse = await response.json();
        if (!orderResponse.transaction) {
            throw new Error('No transaction returned. Swap not possible.');
        }
        const transaction = VersionedTransaction.deserialize(Buffer.from(orderResponse.transaction, "base64"));
        const requestId = orderResponse.requestId;
        return { transaction, requestId };
    }
    catch (error) {
        console.error("Error in getUltraSwapTxn:", error);
        throw new Error(`Failed to get ultra swap transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
}
export async function executeUltraSwapTxn(signedTransaction, requestId) {
    try {
        const response = await fetch(`https://lite-api.jup.ag/ultra/v1/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                signedTransaction, // 👈 make sure you pass correctly
                requestId,
            }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(`Failed to execute transaction: ${JSON.stringify(result)}`);
        }
        return result;
    }
    catch (error) {
        console.error('❌ Error in executeUltraSwapTxn:', error);
        throw error;
    }
}
// Export the main function
