export interface UltraSwapResponse {
    swapType: string;
    requestId: string;
    inAmount: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: string;
    slippageBps: number;
    priceImpactPct: string;
    routePlan: RoutePlan[];
    inputMint: string;
    outputMint: string;
    feeBps: number;
    taker: string;
    gasless: boolean;
    transaction: string;
    prioritizationType: string;
    prioritizationFeeLamports: number;
    lastValidBlockHeight: number;
    dynamicSlippageReport: DynamicSlippageReport;
    totalTime: number;
  }
  
  export interface DynamicSlippageReport {
    slippageBps: number;
    otherAmount: null;
    simulatedIncurredSlippageBps: null;
    amplificationRatio: null;
    categoryName: string;
    heuristicMaxSlippageBps: number;
    rtseSlippageBps: number;
    failedTxnEstSlippage: number;
    priceMovementEstSlippage: number;
    emaEstSlippage: number;
  }
  
  export interface RoutePlan {
    swapInfo: SwapInfo;
    percent: number;
  }
  
  export interface SwapInfo {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  }
  
  export interface ExecuteSwapResponse {
    status: string;
    signature: string;
    slot: string;
    code: number;
    inputAmountResult: string;
    outputAmountResult: string;
    swapEvents: SwapEvent[];
  }
  
  export interface SwapEvent {
    inputMint: string;
    inputAmount: string;
    outputMint: string;
    outputAmount: string;
  }
  