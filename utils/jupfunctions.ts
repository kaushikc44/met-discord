import { ExecuteSwapResponse, UltraSwapResponse } from "../types/jupiterTypes";

import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";

export async function jupSwap(
  inputMint: string,
  outputMint: string,
  amount: number,
  userKeypair: Keypair,
  retry: number = 2
) {
  for (let i = 0; i < retry; i++) {
    try {
      const ultraSwapTxn = await getUltraSwapTxn(
        inputMint,
        outputMint,
        amount,
        userKeypair.publicKey.toString()
      );
      const executeSwapTxn = await executeUltraSwapTxn(
        ultraSwapTxn.transaction,
        ultraSwapTxn.requestId,
        userKeypair
      );
      if (executeSwapTxn?.outAmount) {
        return executeSwapTxn;
      } else {
        console.log("Swap failed, retrying...");
        continue;
      }
    } catch (error) {
      console.error("Error in jupSwap:", error);
      continue;
    }
  }
  return null;
}

export async function getUltraSwapTxn(
  inputMint: string,
  outputMint: string,
  amount: number,
  userPublicKey: string
) {
  try {
    const currentTime = Date.now();
    const orderResponse = (await (
      await fetch(
        `https://api.jup.ag/ultra/v1/order?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&taker=${userPublicKey}&timestamp=${currentTime}`
      )
    ).json()) as UltraSwapResponse;

    console.log("orderResponse", orderResponse);

    // converting it to a versioned transaction
    const transactionBase64 = orderResponse.transaction; // its a base64 encoded string
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(transactionBase64, "base64")
    );

    const requestId = orderResponse.requestId;

    return { transaction, requestId };
  } catch (error: unknown) {
    console.error("Error in getUltraSwapTxn:", error);
    throw new Error(
      `Failed to get ultra swap transaction: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function executeUltraSwapTxn(
  unsignedTransaction: VersionedTransaction, // base64 encoded string
  requestId: string,
  userKeypair: Keypair
) {
  try {
    unsignedTransaction.sign([userKeypair]);

    const signedTransaction = Buffer.from(
      unsignedTransaction.serialize()
    ).toString("base64");

    const executeResponse = (await (
      await fetch("https://api.jup.ag/ultra/v1/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signedTransaction: signedTransaction,
          requestId: requestId,
        }),
      })
    ).json()) as ExecuteSwapResponse;

    if (executeResponse.status === "Success") {
      console.log("Swap successful:", JSON.stringify(executeResponse, null, 2));
      console.log(`https://solscan.io/tx/${executeResponse.signature}`);

      const txnSignature = executeResponse.signature;
      const outAmount = executeResponse.outputAmountResult;
      return { txnSignature, outAmount };
    } else {
      console.error("Swap failed:", JSON.stringify(executeResponse, null, 2));
      console.log(`https://solscan.io/tx/${executeResponse.signature}`);
      return null;
    }
  } catch (error: unknown) {
    console.error("Error in executeUltraSwapTxn:", error);
    throw new Error(
      `Failed to execute ultra swap transaction: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}