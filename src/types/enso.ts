export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon?: string;
  isPopular?: boolean;
}

export interface ShortcutItem {
  id?: string;
  protocol: 'uniswap-v3' | 'enso' | 'aave-v3' | 'balancer-v2' | string;
  action: 'flashloan' | 'route' | 'balance' | 'deposit' | 'borrow' | 'repay' | 'transfer' | string;
  args: Record<string, any>;
}

export interface EnsoBundlePayload {
  chainId: number;
  fromAddress: string;
  receiver: string;
  spender: string;
  routingStrategy: string;
  shortcuts: ShortcutItem[];
}

export interface EnsoTxData {
  to: string;
  data: string;
  value?: string;
  from?: string;
  chainId?: number;
  gas?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface EnsoBundleResponse {
  tx?: EnsoTxData;
  gas?: string;
  amountOut?: string;
  priceImpact?: number;
  fee?: string;
  error?: string;
  message?: string;
  details?: any;
  createdAt?: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  data?: any;
}

export type StrategyType = 'aave-folding' | 'flashloan-arb' | 'custom-builder';
