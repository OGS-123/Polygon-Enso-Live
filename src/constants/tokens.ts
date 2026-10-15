import { TokenInfo } from '../types/enso';

export const POLYGON_CHAIN_ID = 137;
export const POLYGON_CHAIN_ID_HEX = '0x89';
export const ENSO_ROUTER_POLYGON = '0xC914A663837Eb21c5a650716E015659686597E55';

export const POLYGON_NETWORK_PARAMS = {
  chainId: POLYGON_CHAIN_ID_HEX,
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: [
    'https://polygon-rpc.com',
    'https://polygon.llamarpc.com',
    'https://rpc-mainnet.maticvigil.com',
  ],
  blockExplorerUrls: ['https://polygonscan.com'],
};

export const POLYGON_TOKENS: TokenInfo[] = [
  {
    symbol: 'USDC.e',
    name: 'Bridged USD Coin (PoS)',
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    decimals: 6,
    isPopular: true,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    decimals: 6,
    isPopular: true,
  },
  {
    symbol: 'USDC',
    name: 'Native USD Coin',
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    decimals: 6,
    isPopular: true,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    decimals: 18,
    isPopular: true,
  },
  {
    symbol: 'POL / WMATIC',
    name: 'Wrapped POL (Matic)',
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    decimals: 18,
    isPopular: true,
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    decimals: 8,
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    decimals: 18,
  },
];

export const POLYGON_PROTOCOLS = {
  aaveV3Pool: {
    name: 'Aave V3 Pool (Polygon)',
    address: '0x794a61358d6845594f94DC1db02A00b6d43b35c2',
    description: 'Main Polygon Lending & Borrowing Pool',
  },
  uniswapV3UsdcUsdtPool: {
    name: 'Uniswap V3 USDC.e/USDT (0.01%)',
    address: '0xDaC8A8E6DBf8c690ec6815e0fF03491B2770255D',
    description: 'Highest liquidity pool for USDT & USDC.e flashloans on Polygon',
  },
  uniswapV3UsdcUsdtPool500: {
    name: 'Uniswap V3 USDC.e/USDT (0.05%)',
    address: '0x3F5228d0e7D75467366be7De2c31D0d098bA2C23',
    description: '0.05% fee pool for USDT & USDC.e flashloans',
  },
  uniswapV3UsdcWethPool: {
    name: 'Uniswap V3 USDC.e/WETH (0.05%)',
    address: '0x45dDa9cb7c25131DF268515131f647d726f50608',
    description: 'Pool for USDC.e & WETH flashloans',
  },
  uniswapV3Router: {
    name: 'Uniswap V3 SwapRouter',
    address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    description: 'Universal swap router',
  },
  balancerVault: {
    name: 'Balancer V2 Vault',
    address: '0xBa12222222228D8BA5359777296044455E13b779',
    description: '0% fee flashloan vault',
  },
};

/**
 * Returns the verified on-chain Uniswap V3 pool address containing the requested token
 */
export function getUniswapV3PoolForToken(tokenAddress: string, feeTierValue?: number): string {
  const addr = (tokenAddress || '').toLowerCase();
  // USDT
  if (addr === '0xc2132d05d31c914a87c6611c10748aeb04b58e8f') {
    return feeTierValue === 0.0005
      ? '0x3F5228d0e7D75467366be7De2c31D0d098bA2C23'
      : '0xDaC8A8E6DBf8c690ec6815e0fF03491B2770255D';
  }
  // USDC.e
  if (addr === '0x2791bca1f2de4661ed88a30c99a7a9449aa84174') {
    return '0xDaC8A8E6DBf8c690ec6815e0fF03491B2770255D';
  }
  // Native USDC
  if (addr === '0x3c499c542cef5e3811e1192ce70d8cC03d5c3359') {
    return '0x31083a78E11B18e450fd139F9ABEa98CD53181B7';
  }
  // WETH
  if (addr === '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619') {
    return '0x45dDa9cb7c25131DF268515131f647d726f50608';
  }
  // POL / WMATIC
  if (addr === '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270') {
    return '0x9B08288C3Be4F62bbf8d1C20Ac9C5e6f9467d8B7';
  }
  // DAI
  if (addr === '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063') {
    return '0x254aa3A898071D6A2dA0DB11dA73b02B4646078F';
  }
  // WBTC
  if (addr === '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6') {
    return '0x50eaEDB835021E4A108B7290636d62E9765cc6d7';
  }
  return '0xDaC8A8E6DBf8c690ec6815e0fF03491B2770255D';
}

export const FEE_TIERS = [
  { label: '0.05% (UniV3 500)', value: 0.0005 },
  { label: '0.01% (UniV3 100)', value: 0.0001 },
  { label: '0.09% (Aave V3 Flash)', value: 0.0009 },
  { label: '0.30% (UniV3 3000)', value: 0.003 },
  { label: '1.00% (UniV3 10000)', value: 0.01 },
  { label: '0.00% (Balancer V2)', value: 0.0 },
];
