import { ethers } from 'ethers';
import { POLYGON_CHAIN_ID, POLYGON_NETWORK_PARAMS } from '../constants/tokens';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isPolygon: boolean;
  polBalance: string;
  tokenBalance: string;
  isConnected: boolean;
}

export function checksumAddressSafe(address: string): string {
  if (!address || typeof address !== 'string') return '';
  const trimmed = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return trimmed;
  try {
    return ethers.getAddress(trimmed.toLowerCase());
  } catch {
    return trimmed;
  }
}

export function isValidAddress(address: string): boolean {
  if (!address) return false;
  return ethers.isAddress(address.trim());
}

export async function checkWalletProvider(): Promise<boolean> {
  return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
}

export async function connectWallet(): Promise<{ address: string; chainId: number }> {
  if (!await checkWalletProvider()) {
    throw new Error('No EVM wallet detected. Please install MetaMask, Rabby, or a Web3 wallet.');
  }

  const ethereum = (window as any).ethereum;
  const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts authorized.');
  }

  const provider = new ethers.BrowserProvider(ethereum);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  return {
    address: ethers.getAddress(accounts[0]),
    chainId,
  };
}

export async function switchToPolygon(): Promise<void> {
  if (!await checkWalletProvider()) {
    throw new Error('No EVM wallet detected.');
  }

  const ethereum = (window as any).ethereum;
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_NETWORK_PARAMS.chainId }],
    });
  } catch (switchError: any) {
    // 4902 code indicates chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [POLYGON_NETWORK_PARAMS],
      });
    } else {
      throw switchError;
    }
  }
}

export async function getBalances(
  walletAddress: string,
  tokenAddress?: string
): Promise<{ polBalance: string; tokenBalance: string }> {
  try {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return { polBalance: '0.0', tokenBalance: '0.0' };
    }

    const rpcUrl = POLYGON_NETWORK_PARAMS.rpcUrls[0];
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // 1. POL balance
    const polWei = await provider.getBalance(walletAddress);
    const polBalance = parseFloat(ethers.formatEther(polWei)).toFixed(4);

    // 2. Token balance (if requested)
    let tokenBalance = '0.0';
    if (tokenAddress && ethers.isAddress(tokenAddress)) {
      try {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const [rawBalance, decimals] = await Promise.all([
          contract.balanceOf(walletAddress),
          contract.decimals().catch(() => 6),
        ]);
        tokenBalance = parseFloat(ethers.formatUnits(rawBalance, decimals)).toFixed(2);
      } catch {
        tokenBalance = '0.0';
      }
    }

    return { polBalance, tokenBalance };
  } catch (err) {
    console.warn('Error querying balances:', err);
    return { polBalance: '0.0', tokenBalance: '0.0' };
  }
}

export async function sendBundleTransaction(txData: {
  to: string;
  data: string;
  value?: string;
  gasLimit?: string;
}): Promise<string> {
  if (!await checkWalletProvider()) {
    throw new Error('No EVM wallet detected.');
  }

  if (!txData.to || !ethers.isAddress(txData.to)) {
    throw new Error('Invalid target contract address in transaction');
  }

  if (!txData.data || txData.data === '0x' || txData.data.length < 10) {
    throw new Error('Transaction calldata is empty (0x). Aborting to prevent gas loss.');
  }

  const ethereum = (window as any).ethereum;
  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();

  const formattedTx: any = {
    to: ethers.getAddress(txData.to),
    data: txData.data,
  };

  if (txData.value && txData.value !== '0' && txData.value !== '0x0') {
    formattedTx.value = txData.value.startsWith('0x')
      ? BigInt(txData.value)
      : BigInt(txData.value);
  }

  if (txData.gasLimit) {
    formattedTx.gasLimit = BigInt(txData.gasLimit);
  }

  const txResponse = await signer.sendTransaction(formattedTx);
  return txResponse.hash;
}
