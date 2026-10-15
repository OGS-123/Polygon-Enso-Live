/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { ParamForm, CalculatedParams } from './components/ParamForm';
import { TokenAddressPicker } from './components/TokenAddressPicker';
import { BundleVisualizer } from './components/BundleVisualizer';
import { LoopingDynamicsCard } from './components/LoopingDynamicsCard';
import { calculateLoopingDynamics } from './utils/loopingMath';
import { TxPreview } from './components/TxPreview';
import { LiveConsole } from './components/LiveConsole';
import { ExportModal } from './components/ExportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import {
  POLYGON_TOKENS,
  POLYGON_PROTOCOLS,
  POLYGON_CHAIN_ID,
  ENSO_ROUTER_POLYGON,
  getUniswapV3PoolForToken,
} from './constants/tokens';
import {
  WalletState,
  connectWallet,
  switchToPolygon,
  getBalances,
  checksumAddressSafe,
  isValidAddress,
  sendBundleTransaction,
} from './utils/web3';
import { toTokenWei, buildEnsoBundle } from './utils/ensoApi';
import { EnsoBundlePayload, EnsoBundleResponse, LogEntry } from './types/enso';
import { Activity, ShieldCheck, HelpCircle, Layers, ArrowRight } from 'lucide-react';

export default function App() {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'builder' | 'inspector' | 'export'>('builder');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Authentication & API Key
  const [apiKey, setApiKey] = useState<string>('');

  // Web3 Wallet state
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    isPolygon: false,
    polBalance: '0.0',
    tokenBalance: '0.0',
    isConnected: false,
  });

  // Parameters
  const [flashAmount, setFlashAmount] = useState<number>(1000);
  const [profitTarget, setProfitTarget] = useState<number>(0.01);
  const [feeTier, setFeeTier] = useState<number>(0.0005); // 0.05%
  const [ltv, setLtv] = useState<number>(70); // 70% default
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5%
  const [loops, setLoops] = useState<number>(1);
  const [isLinked, setIsLinked] = useState<boolean>(true);
  const [isZeroCapital, setIsZeroCapital] = useState<boolean>(true);
  const [flashloanProtocol, setFlashloanProtocol] = useState<'aave-v3' | 'uniswap-v3'>('aave-v3');

  // Directly editable execution amounts:
  // 1. Deposit Collateral: Matches flashloan amount automatically (zero upfront capital)
  // 2. Borrow Amount: In zero capital mode, covers repay amount + safety profit (e.g. 1005 for 1000)
  // 3. Repay Flashloan Debt: Flashloan debt plus fee (e.g. 1000.5 for 1000)
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [borrowAmount, setBorrowAmount] = useState<number>(1005);
  const [repayAmount, setRepayAmount] = useState<number>(1000.5);

  // Active looping & equity dynamics
  const activeDynamics = useMemo(() => {
    return calculateLoopingDynamics(flashAmount, ltv, loops, feeTier);
  }, [flashAmount, ltv, loops, feeTier]);

  // Addresses
  const [flashToken, setFlashToken] = useState<string>(POLYGON_TOKENS[1].address); // USDT
  const [collToken, setCollToken] = useState<string>(POLYGON_TOKENS[1].address); // USDT
  const [aavePool, setAavePool] = useState<string>(POLYGON_PROTOCOLS.aaveV3Pool.address);
  const [uniPool, setUniPool] = useState<string>(POLYGON_PROTOCOLS.uniswapV3UsdcUsdtPool.address);
  const [routingStrategy, setRoutingStrategy] = useState<string>('ensowallet-v2');
  const [walletAddress, setWalletAddress] = useState<string>('');

  // Automatically keep Uniswap V3 pool aligned with chosen flashToken and fee tier
  useEffect(() => {
    const pool = getUniswapV3PoolForToken(flashToken, feeTier);
    setUniPool(pool);
  }, [flashToken, feeTier]);

  // Execution & Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [bundleResponse, setBundleResponse] = useState<EnsoBundleResponse | null>(null);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Token metadata resolution
  const flashTokenMeta = useMemo(() => {
    return (
      POLYGON_TOKENS.find((t) => t.address.toLowerCase() === flashToken.toLowerCase()) || {
        symbol: 'TOKEN',
        decimals: 6,
      }
    );
  }, [flashToken]);

  const collTokenMeta = useMemo(() => {
    return (
      POLYGON_TOKENS.find((t) => t.address.toLowerCase() === collToken.toLowerCase()) || {
        symbol: 'COLL',
        decimals: 6,
      }
    );
  }, [collToken]);

  // Logging helper
  const addLog = useCallback(
    (level: 'info' | 'success' | 'warn' | 'error', message: string, data?: any) => {
      const entry: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
        data,
      };
      setLogs((prev) => [...prev.slice(-150), entry]);
    },
    []
  );

  // Load API Key and test on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('enso_key') || '';
    if (savedKey) {
      setApiKey(savedKey);
      addLog('info', `Loaded Enso API Key from localStorage (${savedKey.length} chars)`);
    } else {
      addLog('warn', 'No Enso API Key found. Configure via "Set Enso Key" to build live bundles.');
    }

    addLog('info', 'Polygon Enso Live runtime initialized. Target Chain: Polygon PoS (137).');
  }, [addLog]);

  // Auto-connect wallet if previously authorized
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      eth
        .request({ method: 'eth_accounts' })
        .then(async (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            const addr = checksumAddressSafe(accounts[0]);
            const chainIdHex = await eth.request({ method: 'eth_chainId' });
            const chainId = parseInt(chainIdHex, 16);
            const isPoly = chainId === POLYGON_CHAIN_ID;

            setWalletState((prev) => ({
              ...prev,
              address: addr,
              chainId,
              isPolygon: isPoly,
              isConnected: true,
            }));
            setWalletAddress(addr);
            addLog('success', `Wallet detected & auto-connected: ${addr}`);

            // Fetch balances
            const balances = await getBalances(addr, flashToken);
            setWalletState((prev) => ({
              ...prev,
              polBalance: balances.polBalance,
              tokenBalance: balances.tokenBalance,
            }));
          }
        })
        .catch((err: any) => {
          console.warn('Auto-wallet check error:', err);
        });

      // Listen for account and chain changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletState((prev) => ({
            ...prev,
            address: null,
            isConnected: false,
          }));
          addLog('info', 'Wallet disconnected by user.');
        } else {
          const addr = checksumAddressSafe(accounts[0]);
          setWalletState((prev) => ({ ...prev, address: addr }));
          setWalletAddress(addr);
          addLog('info', `Active wallet account switched to ${addr}`);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const cId = parseInt(chainIdHex, 16);
        const isPoly = cId === POLYGON_CHAIN_ID;
        setWalletState((prev) => ({
          ...prev,
          chainId: cId,
          isPolygon: isPoly,
        }));
        addLog(
          isPoly ? 'success' : 'warn',
          `Network changed: Chain ID ${cId} (${isPoly ? 'Polygon' : 'Non-Polygon'})`
        );
      };

      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('chainChanged', handleChainChanged);

      return () => {
        eth.removeListener('accountsChanged', handleAccountsChanged);
        eth.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [addLog, flashToken]);

  // Connect Wallet handler
  const handleConnectWallet = async () => {
    try {
      addLog('info', 'Connecting EVM wallet...');
      const { address, chainId } = await connectWallet();
      const isPoly = chainId === POLYGON_CHAIN_ID;

      setWalletState((prev) => ({
        ...prev,
        address,
        chainId,
        isPolygon: isPoly,
        isConnected: true,
      }));
      setWalletAddress(address);
      addLog('success', `Connected to wallet ${address} (Chain: ${chainId})`);

      if (!isPoly) {
        addLog('warn', `Chain ${chainId} is not Polygon (137). Prompting switch to Polygon...`);
        await handleSwitchPolygon();
      }

      const balances = await getBalances(address, flashToken);
      setWalletState((prev) => ({
        ...prev,
        polBalance: balances.polBalance,
        tokenBalance: balances.tokenBalance,
      }));
    } catch (err: any) {
      addLog('error', `Wallet connection failed: ${err.message}`);
    }
  };

  // Switch to Polygon
  const handleSwitchPolygon = async () => {
    try {
      addLog('info', 'Switching network to Polygon Mainnet (137)...');
      await switchToPolygon();
      setWalletState((prev) => ({
        ...prev,
        chainId: POLYGON_CHAIN_ID,
        isPolygon: true,
      }));
      addLog('success', 'Successfully switched network to Polygon PoS (137).');
    } catch (err: any) {
      addLog('error', `Failed to switch network: ${err.message}`);
    }
  };

  // Save API Key
  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('enso_key', newKey);
  };

  // Synchronize derived amounts when auto-linking is active:
  // 1. Deposit Collateral matches flashloan amount automatically (zero upfront capital from users)
  // 2. Borrow Amount is 70% of collateral (based on LTV%)
  // 3. Repay Flashloan Debt plus fee if needed
  useEffect(() => {
    if (!isLinked) return;
    const f = Math.max(0, flashAmount || 0);
    const fee = Math.max(0, feeTier || 0);
    const ltvRatio = Math.max(0.01, (ltv || 70) / 100);

    const calculatedDeposit = parseFloat(f.toFixed(6));
    const calculatedRepay = parseFloat((f * (1 + fee)).toFixed(6));
    // In zero-capital mode, borrow must cover repay plus safety profit margin (e.g. 1005 for 1000)
    const calculatedBorrow = isZeroCapital
      ? parseFloat((calculatedRepay * 1.0045).toFixed(6))
      : parseFloat((calculatedDeposit * ltvRatio).toFixed(6));

    setDepositAmount(calculatedDeposit);
    setBorrowAmount(calculatedBorrow);
    setRepayAmount(calculatedRepay);
  }, [flashAmount, feeTier, ltv, isLinked, isZeroCapital]);

  const handleResetAutoMath = useCallback(() => {
    setIsLinked(true);
    const f = Math.max(0, flashAmount || 0);
    const fee = Math.max(0, feeTier || 0);
    const ltvRatio = Math.max(0.01, (ltv || 70) / 100);

    const calculatedDeposit = parseFloat(f.toFixed(6));
    const calculatedRepay = parseFloat((f * (1 + fee)).toFixed(6));
    const calculatedBorrow = isZeroCapital
      ? parseFloat((calculatedRepay * 1.0045).toFixed(6))
      : parseFloat((calculatedDeposit * ltvRatio).toFixed(6));

    setDepositAmount(calculatedDeposit);
    setBorrowAmount(calculatedBorrow);
    setRepayAmount(calculatedRepay);
    addLog(
      'info',
      `Auto-adjusted execution amounts: 1. Deposit Collateral=${calculatedDeposit} (100% matched to flashloan, $0 upfront), 2. Borrow Amount=${calculatedBorrow} (covers flashloan + profit), 3. Repay Debt=${calculatedRepay} (Flashloan + Fee)`
    );
  }, [flashAmount, feeTier, ltv, isZeroCapital, addLog]);

  // Wei conversions for active amounts
  const activeWei = useMemo(() => {
    return {
      flashWei: toTokenWei(flashAmount, flashTokenMeta.decimals),
      collWei: toTokenWei(depositAmount, collTokenMeta.decimals),
      repayWei: toTokenWei(repayAmount, flashTokenMeta.decimals),
      borrowWei: toTokenWei(borrowAmount, flashTokenMeta.decimals),
      depositWei: toTokenWei(depositAmount, collTokenMeta.decimals),
    };
  }, [
    flashAmount,
    repayAmount,
    borrowAmount,
    depositAmount,
    flashTokenMeta.decimals,
    collTokenMeta.decimals,
  ]);

  // Build the complete Enso bundle payload
  const currentBundlePayload: EnsoBundlePayload = useMemo(() => {
    const fromAddr = checksumAddressSafe(walletAddress) || '0x000000000000000000000000000000000000dEaD';
    const flashWei = activeWei.flashWei;
    const collWei = activeWei.collWei;
    const borrowWei = activeWei.borrowWei;
    const repayWei = activeWei.repayWei;
    const slippageBps = String(Math.round(slippage * 100)); // 0.5% = 50 BPS

    const dynamics = calculateLoopingDynamics(flashAmount, ltv, loops, feeTier);
    const callbackList: any[] = [];

    const isSameToken = flashToken.toLowerCase() === collToken.toLowerCase();

    // Cycle 1:
    if (!isSameToken) {
      callbackList.push({
        protocol: 'enso',
        action: 'route',
        args: {
          tokenIn: checksumAddressSafe(flashToken),
          tokenOut: checksumAddressSafe(collToken),
          amountIn: flashWei,
          slippage: slippageBps,
        },
      });
      callbackList.push({
        protocol: 'aave-v3',
        action: 'deposit',
        args: {
          primaryAddress: checksumAddressSafe(aavePool),
          tokenIn: checksumAddressSafe(collToken),
          tokenOut: checksumAddressSafe(collToken),
          amountIn: { useOutputOfCallAt: 0 },
          onBehalfOf: fromAddr,
        },
      });
    } else {
      // Same-token zero capital: directly supply flashloan output to Aave collateral
      callbackList.push({
        protocol: 'aave-v3',
        action: 'deposit',
        args: {
          primaryAddress: checksumAddressSafe(aavePool),
          tokenIn: checksumAddressSafe(collToken),
          tokenOut: checksumAddressSafe(collToken),
          amountIn: collWei,
          onBehalfOf: fromAddr,
        },
      });
    }

    // Call: Borrow flashToken from Aave V3
    const cycle1BorrowWei =
      loops === 1 ? borrowWei : toTokenWei(dynamics.iterations[0].borrowAmount, flashTokenMeta.decimals);
    callbackList.push({
      protocol: 'aave-v3',
      action: 'borrow',
      args: {
        primaryAddress: checksumAddressSafe(aavePool),
        tokenOut: checksumAddressSafe(flashToken),
        amountOut: cycle1BorrowWei,
        onBehalfOf: fromAddr,
      },
    });

    // Subsequent folding cycles if loops > 1
    for (let k = 2; k <= loops; k++) {
      const prevBorrowIndex = callbackList.length - 1;
      const stepInfo = dynamics.iterations[k - 1];
      const stepBorrowWei =
        k === loops && isLinked
          ? borrowWei
          : toTokenWei(stepInfo.borrowAmount, flashTokenMeta.decimals);

      if (!isSameToken) {
        callbackList.push({
          protocol: 'enso',
          action: 'route',
          args: {
            tokenIn: checksumAddressSafe(flashToken),
            tokenOut: checksumAddressSafe(collToken),
            amountIn: { useOutputOfCallAt: prevBorrowIndex },
            slippage: slippageBps,
          },
        });
        const routeIdx = callbackList.length - 1;
        callbackList.push({
          protocol: 'aave-v3',
          action: 'deposit',
          args: {
            primaryAddress: checksumAddressSafe(aavePool),
            tokenIn: checksumAddressSafe(collToken),
            tokenOut: checksumAddressSafe(collToken),
            amountIn: { useOutputOfCallAt: routeIdx },
            onBehalfOf: fromAddr,
          },
        });
      } else {
        callbackList.push({
          protocol: 'aave-v3',
          action: 'deposit',
          args: {
            primaryAddress: checksumAddressSafe(aavePool),
            tokenIn: checksumAddressSafe(collToken),
            tokenOut: checksumAddressSafe(collToken),
            amountIn: { useOutputOfCallAt: prevBorrowIndex },
            onBehalfOf: fromAddr,
          },
        });
      }

      callbackList.push({
        protocol: 'aave-v3',
        action: 'borrow',
        args: {
          primaryAddress: checksumAddressSafe(aavePool),
          tokenOut: checksumAddressSafe(flashToken),
          amountOut: stepBorrowWei,
          onBehalfOf: fromAddr,
        },
      });
    }

    const resolvedPool =
      uniPool &&
      uniPool.toLowerCase() !== '0x45dda9cb7c25131df268515131f647d726f50608'
        ? uniPool
        : getUniswapV3PoolForToken(flashToken, feeTier);

    const flashloanArgs: any = {
      primaryAddress:
        flashloanProtocol === 'aave-v3'
          ? checksumAddressSafe(aavePool)
          : checksumAddressSafe(resolvedPool),
      flashloanToken: checksumAddressSafe(flashToken),
      flashloanAmount: flashWei,
      tokenIn: [checksumAddressSafe(flashToken)],
      amountIn: [flashWei],
      callback: callbackList,
    };

    if (flashloanProtocol === 'uniswap-v3') {
      flashloanArgs.tokenOut = checksumAddressSafe(flashToken);
      flashloanArgs.amountOut = repayWei;
    }

    const shortcutsList = [
      {
        protocol: flashloanProtocol,
        action: 'flashloan',
        args: flashloanArgs,
      },
    ];

    const payload: EnsoBundlePayload = {
      chainId: POLYGON_CHAIN_ID,
      fromAddress: fromAddr,
      receiver: isZeroCapital ? ENSO_ROUTER_POLYGON : fromAddr,
      spender: isZeroCapital ? ENSO_ROUTER_POLYGON : fromAddr,
      routingStrategy: routingStrategy || 'ensowallet-v2',
      shortcuts: shortcutsList,
    };

    return payload;
  }, [
    walletAddress,
    activeWei,
    slippage,
    uniPool,
    flashToken,
    collToken,
    aavePool,
    routingStrategy,
    loops,
    flashAmount,
    ltv,
    feeTier,
    isLinked,
    isZeroCapital,
    flashloanProtocol,
    flashTokenMeta.decimals,
  ]);

  // 1. Build Bundle Handler
  const handleBuildBundle = async () => {
    if (!apiKey) {
      addLog('error', 'Enso API key required. Please click "Set Enso Key" to add your API key.');
      setIsApiKeyModalOpen(true);
      return;
    }

    if (!walletAddress || !isValidAddress(walletAddress)) {
      addLog('error', 'Valid EVM wallet address is required for fromAddress / receiver.');
      return;
    }

    // Solvency & execution validation based on Final Total Collateral vs Final Total Debts & Equity
    const dynamics = calculateLoopingDynamics(flashAmount, ltv, loops, feeTier);
    if (dynamics.difference >= 0) {
      addLog(
        'success',
        `✨ General Difference & Equity Verified: +${dynamics.difference.toFixed(4)} ${collTokenMeta.symbol} Net Equity | Final Collateral: ${dynamics.totalCollateral.toFixed(4)} | Final Debts: ${dynamics.totalBorrowDebt.toFixed(4)} | Health Factor: ${dynamics.healthFactor} (Safe). Executing bundle smoothly...`
      );
    } else {
      addLog(
        'warn',
        `Notice: Position Equity difference is negative (${dynamics.difference.toFixed(4)}). Consider clicking "Safe Auto-Balance" to restore safe positive equity.`
      );
    }

    setIsBuilding(true);
    setTxHash(null);
    addLog(
      'info',
      `Building bundle: Flashloan=${flashAmount} ${flashTokenMeta.symbol}, Final Collateral=${dynamics.totalCollateral.toFixed(4)}, Final Debt=${dynamics.totalBorrowDebt.toFixed(4)}, Zero Capital=${isZeroCapital ? 'Yes' : 'No'}...`
    );
    if (flashToken.toLowerCase() === collToken.toLowerCase()) {
      addLog(
        'info',
        `⚡ Same-token mode active (${flashTokenMeta.symbol}): Direct collateral supply without DEX swap (zero swap slippage).`
      );
    }

    try {
      const response = await buildEnsoBundle(currentBundlePayload, apiKey);
      setBundleResponse(response);

      if (response.tx && response.tx.data && response.tx.data.length > 20) {
        addLog(
          'success',
          `Bundle generated successfully! Target: ${response.tx.to}, Calldata bytes: ${Math.round(
            response.tx.data.length / 2
          )}`
        );
      } else {
        addLog('warn', `Bundle returned with empty calldata (0x): ${JSON.stringify(response).slice(0, 200)}`);
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      addLog('error', `Bundle build failed: ${errMsg}`);
      if (errMsg.includes('Flashloan repayment insufficient') || errMsg.includes('debt')) {
        addLog(
          'warn',
          'Fix: Borrow amount is lower than flashloan debt repayment. Click "Auto-Fix Borrow" or "Safe Auto-Balance" in the Parameters panel.'
        );
      } else if (errMsg.includes('404')) {
        addLog(
          'warn',
          'Fix: Proxy 404 received. Open "Set Enso Key" and switch Gateway Mode to "Direct Enso API" to bypass proxy.'
        );
      }
    } finally {
      setIsBuilding(false);
    }
  };

  // 2. Send Transaction Handler
  const handleSendTransaction = async () => {
    if (!bundleResponse?.tx) {
      addLog('error', 'No active bundle transaction. Build bundle first.');
      return;
    }

    const tx = bundleResponse.tx;
    if (!tx.data || tx.data.length < 20 || tx.data === '0x') {
      addLog('error', 'Safety lock: calldata is empty (0x). Aborted to prevent gas loss.');
      return;
    }

    if (!walletState.isConnected) {
      addLog('warn', 'Wallet not connected. Connecting wallet before sending...');
      try {
        await handleConnectWallet();
      } catch {
        return;
      }
    }

    if (!walletState.isPolygon) {
      addLog('warn', 'Connected network is not Polygon (137). Switching...');
      try {
        await handleSwitchPolygon();
      } catch {
        return;
      }
    }

    setIsSending(true);
    addLog('info', `Initiating Web3 transaction to ${tx.to}... Please approve in wallet.`);

    try {
      const hash = await sendBundleTransaction({
        to: tx.to,
        data: tx.data,
        value: tx.value,
        gasLimit: tx.gas || tx.gasLimit,
      });

      setTxHash(hash);
      addLog('success', `Transaction broadcasted! Tx Hash: ${hash}`);
      addLog('info', `View on Polygonscan: https://polygonscan.com/tx/${hash}`);
    } catch (err: any) {
      addLog('error', `Transaction send failed: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const canSendTx = !!(
    bundleResponse?.tx &&
    bundleResponse.tx.data &&
    bundleResponse.tx.data.length > 20 &&
    bundleResponse.tx.data !== '0x'
  );

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col selection:bg-purple-900/60 selection:text-purple-100">
      {/* Top Bar Navigation */}
      <Header
        walletState={walletState}
        onConnectWallet={handleConnectWallet}
        onSwitchPolygon={handleSwitchPolygon}
        hasApiKey={!!apiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Network & Live Status Banner */}
        <div className="bg-[#12141f] border border-[#23273c] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-200">
              Polygon PoS Active
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-400">
              Backend proxy <code className="text-purple-300 font-mono">/api/enso</code> ready (CORS bypassed)
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>
              API Key:{' '}
              <strong className={apiKey ? 'text-emerald-400' : 'text-amber-400'}>
                {apiKey ? 'Configured' : 'Missing'}
              </strong>
            </span>
            <span>·</span>
            <span>
              Target:{' '}
              <strong className="text-slate-200 font-mono">
                {flashAmount} {flashTokenMeta.symbol}
              </strong>
            </span>
          </div>
        </div>

        {/* Tab 1: Flashloan Builder View */}
        {activeTab === 'builder' && (
          <div className="space-y-5">
            {/* 2-Column: Parameters + Addresses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ParamForm
                flashAmount={flashAmount}
                setFlashAmount={setFlashAmount}
                profitTarget={profitTarget}
                setProfitTarget={setProfitTarget}
                feeTier={feeTier}
                setFeeTier={setFeeTier}
                ltv={ltv}
                setLtv={setLtv}
                slippage={slippage}
                setSlippage={setSlippage}
                loops={loops}
                setLoops={setLoops}
                isLinked={isLinked}
                setIsLinked={setIsLinked}
                isZeroCapital={isZeroCapital}
                setIsZeroCapital={setIsZeroCapital}
                depositAmount={depositAmount}
                setDepositAmount={setDepositAmount}
                borrowAmount={borrowAmount}
                setBorrowAmount={setBorrowAmount}
                repayAmount={repayAmount}
                setRepayAmount={setRepayAmount}
                onResetAutoMath={handleResetAutoMath}
                depositWei={activeWei.depositWei}
                borrowWei={activeWei.borrowWei}
                repayWei={activeWei.repayWei}
                tokenSymbol={flashTokenMeta.symbol}
                collTokenSymbol={collTokenMeta.symbol}
                uniPool={uniPool}
                setUniPool={setUniPool}
                aavePool={aavePool}
                setAavePool={setAavePool}
                routingStrategy={routingStrategy}
                setRoutingStrategy={setRoutingStrategy}
                flashloanProtocol={flashloanProtocol}
                setFlashloanProtocol={setFlashloanProtocol}
              />

              <TokenAddressPicker
                flashToken={flashToken}
                setFlashToken={setFlashToken}
                collToken={collToken}
                setCollToken={setCollToken}
                aavePool={aavePool}
                setAavePool={setAavePool}
                uniPool={uniPool}
                setUniPool={setUniPool}
                walletAddress={walletAddress}
                setWalletAddress={setWalletAddress}
                connectedWallet={walletState.address}
              />
            </div>

            {/* Recursive Looping & Leverage Dynamics Details (Collateral Doubling & Equations) */}
            <LoopingDynamicsCard
              flashAmount={flashAmount}
              ltv={ltv}
              loops={loops}
              setLoops={setLoops}
              feeTier={feeTier}
              tokenSymbol={flashTokenMeta.symbol}
              collTokenSymbol={collTokenMeta.symbol}
            />

            {/* Visual Flow Diagram */}
            <BundleVisualizer
              flashTokenSymbol={flashTokenMeta.symbol}
              collTokenSymbol={collTokenMeta.symbol}
              flashAmount={flashAmount}
              calculated={{
                repay: repayAmount,
                borrow: borrowAmount,
                deposit: depositAmount,
              }}
              ltv={ltv}
              slippage={slippage}
              loops={loops}
              flashloanProtocol={flashloanProtocol}
            />

            {/* Transaction Builder & Execution Card */}
            <TxPreview
              bundleResponse={bundleResponse}
              isBuilding={isBuilding}
              isSending={isSending}
              onBuildBundle={handleBuildBundle}
              onSendTx={handleSendTransaction}
              txHash={txHash}
              walletConnected={walletState.isConnected}
              canSend={canSendTx}
              totalCollateral={activeDynamics.totalCollateral}
              totalDebt={activeDynamics.totalBorrowDebt}
              netEquity={activeDynamics.difference}
              healthFactor={activeDynamics.healthFactor}
              collTokenSymbol={collTokenMeta.symbol}
              debtTokenSymbol={flashTokenMeta.symbol}
              isZeroCapital={isZeroCapital}
            />
          </div>
        )}

        {/* Tab 2: Bundle Inspector View */}
        {activeTab === 'inspector' && (
          <div className="space-y-5">
            <LoopingDynamicsCard
              flashAmount={flashAmount}
              ltv={ltv}
              loops={loops}
              setLoops={setLoops}
              feeTier={feeTier}
              tokenSymbol={flashTokenMeta.symbol}
              collTokenSymbol={collTokenMeta.symbol}
            />

            <BundleVisualizer
              flashTokenSymbol={flashTokenMeta.symbol}
              collTokenSymbol={collTokenMeta.symbol}
              flashAmount={flashAmount}
              calculated={{
                repay: repayAmount,
                borrow: borrowAmount,
                deposit: depositAmount,
              }}
              ltv={ltv}
              slippage={slippage}
              loops={loops}
              flashloanProtocol={flashloanProtocol}
            />

            <TxPreview
              bundleResponse={bundleResponse}
              isBuilding={isBuilding}
              isSending={isSending}
              onBuildBundle={handleBuildBundle}
              onSendTx={handleSendTransaction}
              txHash={txHash}
              walletConnected={walletState.isConnected}
              canSend={canSendTx}
              totalCollateral={activeDynamics.totalCollateral}
              totalDebt={activeDynamics.totalBorrowDebt}
              netEquity={activeDynamics.difference}
              healthFactor={activeDynamics.healthFactor}
              collTokenSymbol={collTokenMeta.symbol}
              debtTokenSymbol={flashTokenMeta.symbol}
              isZeroCapital={isZeroCapital}
            />
          </div>
        )}

        {/* Tab 3: Script & cURL Export View */}
        {activeTab === 'export' && (
          <div className="space-y-5">
            <ExportModal payload={currentBundlePayload} apiKey={apiKey} />
          </div>
        )}

        {/* Live Execution Console */}
        <LiveConsole logs={logs} onClearLogs={() => setLogs([])} />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#181a28] bg-[#090a10] py-4 px-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>Polygon Enso Live · Built with Enso Finance Shortcuts API &amp; Ethers v6</div>
          <div className="flex items-center gap-4">
            <a
              href="https://polygonscan.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-400 transition-colors"
            >
              Polygonscan
            </a>
            <a
              href="https://docs.enso.finance"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-400 transition-colors"
            >
              Enso Docs
            </a>
            <button
              onClick={() => setActiveTab('export')}
              className="hover:text-purple-400 transition-colors"
            >
              Export Node Fallback
            </button>
          </div>
        </div>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
        onLog={addLog}
      />
    </div>
  );
}
