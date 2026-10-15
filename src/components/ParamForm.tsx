import React, { useState } from 'react';
import {
  Calculator,
  Link,
  Unlink,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Percent,
  Sliders,
  DollarSign,
  ShieldCheck,
  Zap,
  Repeat,
  Layers,
  Settings2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { FEE_TIERS } from '../constants/tokens';

export interface CalculatedParams {
  repay: number;
  borrow: number;
  deposit: number;
  repayWei: string;
  borrowWei: string;
  depositWei: string;
}

interface ParamFormProps {
  flashAmount: number;
  setFlashAmount: (val: number) => void;
  profitTarget: number;
  setProfitTarget: (val: number) => void;
  feeTier: number;
  setFeeTier: (val: number) => void;
  ltv: number;
  setLtv: (val: number) => void;
  slippage: number;
  setSlippage: (val: number) => void;
  loops: number;
  setLoops: (val: number) => void;
  isLinked: boolean;
  setIsLinked: (val: boolean) => void;
  // Editable execution parameters in order: 1. Deposit Collateral, 2. Borrow Amount, 3. Repay Flashloan Debt
  depositAmount: number;
  setDepositAmount: (val: number) => void;
  borrowAmount: number;
  setBorrowAmount: (val: number) => void;
  repayAmount: number;
  setRepayAmount: (val: number) => void;
  onResetAutoMath: () => void;
  depositWei: string;
  borrowWei: string;
  repayWei: string;
  tokenSymbol: string;
  collTokenSymbol: string;
  // Advanced contract parameters
  uniPool: string;
  setUniPool: (val: string) => void;
  aavePool: string;
  setAavePool: (val: string) => void;
  routingStrategy: string;
  setRoutingStrategy: (val: string) => void;
}

export const ParamForm: React.FC<ParamFormProps> = ({
  flashAmount,
  setFlashAmount,
  profitTarget,
  setProfitTarget,
  feeTier,
  setFeeTier,
  ltv,
  setLtv,
  slippage,
  setSlippage,
  loops,
  setLoops,
  isLinked,
  setIsLinked,
  depositAmount,
  setDepositAmount,
  borrowAmount,
  setBorrowAmount,
  repayAmount,
  setRepayAmount,
  onResetAutoMath,
  depositWei,
  borrowWei,
  repayWei,
  tokenSymbol,
  collTokenSymbol,
  uniPool,
  setUniPool,
  aavePool,
  setAavePool,
  routingStrategy,
  setRoutingStrategy,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Exact required flashloan debt to repay
  const minRequiredDebt = flashAmount * (1 + feeTier);
  const debtDifference = borrowAmount - minRequiredDebt;
  const isBorrowInsufficient = borrowAmount < minRequiredDebt - 0.000001;

  // Maximum borrow permitted by deposit collateral given LTV
  const maxBorrowAllowedByDeposit = depositAmount * (ltv / 100);
  const isDepositInsufficient = maxBorrowAllowedByDeposit < borrowAmount - 0.000001;

  // One-click Auto-Fix to ensure repayment is 100% sufficient
  const handleAutoFixBorrow = () => {
    const safeBorrow = minRequiredDebt + (profitTarget > 0 ? profitTarget : 0.01);
    setBorrowAmount(parseFloat(safeBorrow.toFixed(6)));
  };

  // One-click Auto-Fix to adjust collateral deposit to satisfy LTV & Slippage
  const handleAutoFixDeposit = () => {
    const slipFactor = Math.max(0.01, 1 - slippage / 100);
    const safeDeposit = (borrowAmount / (ltv / 100)) / slipFactor;
    setDepositAmount(parseFloat(safeDeposit.toFixed(6)));
  };

  // One-click Auto-Fix to set exact pool debt
  const handleAutoFixRepay = () => {
    setRepayAmount(parseFloat(minRequiredDebt.toFixed(6)));
  };

  // Complete Safe Auto-Balance: adjusts Deposit, Borrow, and Repay together
  const handleSafeAutoBalance = () => {
    onResetAutoMath();
  };

  // Auto-adjust all 3 execution parameters when Flashloan Amount changes
  const handleFlashAmountChange = (newFlash: number) => {
    setFlashAmount(newFlash);
    const f = Math.max(0, newFlash || 0);
    const fee = Math.max(0, feeTier || 0);
    const profit = Math.max(0, profitTarget || 0);
    const ltvRatio = Math.max(0.01, (ltv || 75) / 100);
    const slipFactor = Math.max(0.01, 1 - (slippage || 0) / 100);

    const calculatedRepay = parseFloat((f * (1 + fee)).toFixed(6));
    const calculatedBorrow = parseFloat((calculatedRepay + profit).toFixed(6));
    const calculatedDeposit = parseFloat(((calculatedBorrow / ltvRatio) / slipFactor).toFixed(6));

    setRepayAmount(calculatedRepay);
    setBorrowAmount(calculatedBorrow);
    setDepositAmount(calculatedDeposit);
  };

  // Auto-adjust Deposit Collateral when LTV% changes
  const handleLtvChange = (newLtv: number) => {
    setLtv(newLtv);
    const ltvRatio = Math.max(0.01, (newLtv || 75) / 100);
    const slipFactor = Math.max(0.01, 1 - (slippage || 0) / 100);
    const calculatedDeposit = parseFloat(((borrowAmount / ltvRatio) / slipFactor).toFixed(6));
    setDepositAmount(calculatedDeposit);
  };

  return (
    <div className="bg-[#12141f] border border-[#23273c] rounded-xl p-4 sm:p-5 space-y-4 shadow-lg">
      {/* Header with Mode Switch & Auto-Balance */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1f2338] pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Strategy &amp; Loop Parameters</h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/50 font-mono">
            Polygon PoS
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Safe Auto-Balance Button */}
          <button
            type="button"
            onClick={handleSafeAutoBalance}
            title="Auto-calculate all parameters using exact mathematical constraints to guarantee repayment debt is satisfied"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safe Auto-Balance</span>
          </button>

          {/* Auto-Link / Manual Override Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isLinked;
              setIsLinked(next);
              if (next) onResetAutoMath();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isLinked
                ? 'bg-purple-950/60 border-purple-700/60 text-purple-200'
                : 'bg-[#181b29] border-amber-600/60 text-amber-300'
            }`}
          >
            {isLinked ? <Link className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
            <span>{isLinked ? 'Formula Sync (Auto)' : 'Manual Override Active'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Primary Flashloan Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Flashloan Amount */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Flashloan ({tokenSymbol})
          </label>
          <div className="relative">
            <input
              type="number"
              min="0.000001"
              step="any"
              value={flashAmount || ''}
              onChange={(e) => handleFlashAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              placeholder="1"
            />
          </div>
          {/* Quick presets for Flashloan Amount */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {[1, 10, 100, 1000, 50000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleFlashAmountChange(amt)}
                className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                  flashAmount === amt
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-[#1b1f33] text-slate-400 hover:text-white'
                }`}
              >
                {amt === 1 ? '1 Safe' : amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Principal borrowed</span>
        </div>

        {/* 2. Target Profit */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Target Profit ({tokenSymbol})
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={profitTarget || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setProfitTarget(val);
              if (isLinked) {
                const rep = flashAmount * (1 + feeTier);
                const bor = rep + val;
                setRepayAmount(parseFloat(rep.toFixed(6)));
                setBorrowAmount(parseFloat(bor.toFixed(6)));
                const slipFactor = Math.max(0.01, 1 - slippage / 100);
                const ltvRatio = Math.max(0.01, ltv / 100);
                setDepositAmount(parseFloat(((bor / ltvRatio) / slipFactor).toFixed(6)));
              }
            }}
            className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-purple-500"
            placeholder="0.01"
          />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {[0.01, 0.1, 1.0, 25.0].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setProfitTarget(p);
                  if (isLinked) {
                    const rep = flashAmount * (1 + feeTier);
                    const bor = rep + p;
                    setRepayAmount(parseFloat(rep.toFixed(6)));
                    setBorrowAmount(parseFloat(bor.toFixed(6)));
                    const slipFactor = Math.max(0.01, 1 - slippage / 100);
                    const ltvRatio = Math.max(0.01, ltv / 100);
                    setDepositAmount(parseFloat(((bor / ltvRatio) / slipFactor).toFixed(6)));
                  }
                }}
                className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                  profitTarget === p
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-[#1b1f33] text-slate-400 hover:text-white'
                }`}
              >
                +{p}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Net excess over debt</span>
        </div>

        {/* 3. Pool Flash Fee */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Flash Fee Tier
          </label>
          <select
            value={feeTier}
            onChange={(e) => {
              const newFee = parseFloat(e.target.value);
              setFeeTier(newFee);
              if (isLinked) {
                const rep = flashAmount * (1 + newFee);
                const bor = rep + profitTarget;
                setRepayAmount(parseFloat(rep.toFixed(6)));
                setBorrowAmount(parseFloat(bor.toFixed(6)));
                const slipFactor = Math.max(0.01, 1 - slippage / 100);
                const ltvRatio = Math.max(0.01, ltv / 100);
                setDepositAmount(parseFloat(((bor / ltvRatio) / slipFactor).toFixed(6)));
              }
            }}
            className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-2 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
          >
            {FEE_TIERS.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-500 mt-2 block font-mono">
            Fee: {(flashAmount * feeTier).toFixed(4)} {tokenSymbol}
          </span>
        </div>

        {/* 4. Loops Count */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Loop Iterations
          </label>
          <input
            type="number"
            min="1"
            max="10"
            step="1"
            value={loops}
            onChange={(e) => setLoops(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
          />
          <span className="text-[10px] text-slate-500 mt-2 block">Folding cycles (1-10)</span>
        </div>
      </div>

      {/* SECTION 2: LTV & Slippage Controls (Both clearly displayed, with sliders + inputs + chips) */}
      <div className="bg-[#0e101a] border border-[#1e2338] rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Risk &amp; Execution Controls: LTV % and Slippage %</span>
          </span>
          <span className="text-[10px] text-slate-400">
            Affects Aave borrowing capacity &amp; swap pricing tolerance
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* LTV % (Loan-to-Value) */}
          <div className="space-y-1.5 bg-[#131624] p-3 rounded-lg border border-[#232840]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-purple-400" />
                <span>Aave V3 LTV Ratio (%)</span>
              </label>
              {/* LTV Presets */}
              <div className="flex gap-1">
                {[65, 70, 75, 80, 82.5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleLtvChange(val)}
                    className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                      ltv === val
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-[#1b1f33] text-slate-400 hover:text-white'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="95"
                  step="0.5"
                  value={ltv}
                  onChange={(e) => handleLtvChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0a0b12] border border-[#2b314d] rounded px-3 py-1.5 text-xs font-mono font-bold text-purple-200 focus:outline-none focus:border-purple-500 pr-8"
                  placeholder="75"
                />
                <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-mono">%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="1"
                value={ltv}
                onChange={(e) => handleLtvChange(parseFloat(e.target.value) || 0)}
                className="w-24 accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Max borrow power:</span>
              <span className="font-mono text-purple-300 font-semibold">
                {(depositAmount * (ltv / 100)).toFixed(4)} {tokenSymbol}
              </span>
            </div>
          </div>

          {/* Slippage % */}
          <div className="space-y-1.5 bg-[#131624] p-3 rounded-lg border border-[#232840]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>DEX Route Slippage (%)</span>
              </label>
              {/* Slippage Presets */}
              <div className="flex gap-1">
                {[0.1, 0.5, 1.0, 2.0].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setSlippage(val);
                      if (isLinked) {
                        const rep = flashAmount * (1 + feeTier);
                        const bor = rep + profitTarget;
                        const slipFactor = Math.max(0.01, 1 - val / 100);
                        const ltvRatio = Math.max(0.01, ltv / 100);
                        setDepositAmount(parseFloat(((bor / ltvRatio) / slipFactor).toFixed(6)));
                      }
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                      slippage === val
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-[#1b1f33] text-slate-400 hover:text-white'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0.01"
                  max="15"
                  step="0.1"
                  value={slippage}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSlippage(val);
                    if (isLinked) {
                      const rep = flashAmount * (1 + feeTier);
                      const bor = rep + profitTarget;
                      const slipFactor = Math.max(0.01, 1 - val / 100);
                      const ltvRatio = Math.max(0.01, ltv / 100);
                      setDepositAmount(parseFloat(((bor / ltvRatio) / slipFactor).toFixed(6)));
                    }
                  }}
                  className="w-full bg-[#0a0b12] border border-[#2b314d] rounded px-3 py-1.5 text-xs font-mono font-bold text-purple-200 focus:outline-none focus:border-purple-500 pr-8"
                  placeholder="0.5"
                />
                <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-mono">%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={slippage}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setSlippage(val);
                  if (isLinked) {
                    const rep = flashAmount * (1 + feeTier);
                    const bor = rep + profitTarget;
                    const slipFactor = Math.max(0.01, 1 - val / 100);
                    const ltvRatio = Math.max(0.01, ltv / 100);
                    setDepositAmount(parseFloat(((bor / ltvRatio) / slipFactor).toFixed(6)));
                  }
                }}
                className="w-24 accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Tolerance in basis points:</span>
              <span className="font-mono text-purple-300 font-semibold">
                {Math.round(slippage * 100)} BPS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Execution Amounts (Fully Editable) */}
      {/* Ordered as: 1. Deposit Collateral, 2. Borrow Amount, 3. Repay Flashloan Debt */}
      <div className="bg-[#0a0b14] border border-[#1e2235] rounded-xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1c1f30] pb-2.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-xs font-bold text-white block">
                Execution Amounts (Fully Editable)
              </span>
              <span className="text-[10px] text-slate-400">
                Auto-adjusted from Flashloan + LTV% &bull; Fully editable parameters
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-purple-300 font-mono">
              {isLinked ? '● Synced to Flashloan & LTV' : '▲ Manual Override Active'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLinked(true);
                handleFlashAmountChange(flashAmount);
              }}
              className="text-[10px] px-2 py-0.5 rounded bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-700/60 font-medium transition-colors"
            >
              Re-Sync All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Parameter 1: Deposit Collateral */}
          <div
            className={`space-y-1.5 bg-[#121422] p-3 rounded-lg border transition-all ${
              isDepositInsufficient ? 'border-amber-600/80 bg-amber-950/20' : 'border-[#242940]'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                <span>1. Deposit Collateral</span>
              </label>
              {isDepositInsufficient ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200 font-bold">
                  LTV Exceeded
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-medium">
                  {collTokenSymbol}
                </span>
              )}
            </div>
            <input
              type="number"
              step="any"
              value={depositAmount || ''}
              onChange={(e) => {
                setIsLinked(false);
                setDepositAmount(parseFloat(e.target.value) || 0);
              }}
              className={`w-full bg-[#07080e] border rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none ${
                isDepositInsufficient
                  ? 'border-amber-500 text-amber-200 focus:border-amber-400'
                  : 'border-[#2b304a] text-sky-200 focus:border-purple-500'
              }`}
            />
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {depositWei} (wei)
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>Borrow power ({ltv}% LTV):</span>
              <span className="font-mono text-slate-200 font-semibold">
                {maxBorrowAllowedByDeposit.toFixed(4)} {tokenSymbol}
              </span>
            </div>
            <div className="pt-1 flex justify-between items-center text-[10px] border-t border-[#1a1c2a]">
              <span className="text-slate-400">Backs Aave Loan</span>
              <button
                type="button"
                onClick={handleAutoFixDeposit}
                className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 hover:underline"
                title="Auto-adjust collateral to satisfy LTV and borrow requirements"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Auto-Fit to LTV
              </button>
            </div>
          </div>

          {/* Parameter 2: Borrow Amount */}
          <div
            className={`space-y-1.5 bg-[#121422] p-3 rounded-lg border transition-all ${
              isBorrowInsufficient ? 'border-amber-600/80 bg-amber-950/20' : 'border-[#242940]'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                <span>2. Borrow Amount</span>
              </label>
              {isBorrowInsufficient ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200 font-bold animate-pulse">
                  Insufficient!
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                  {tokenSymbol}
                </span>
              )}
            </div>
            <input
              type="number"
              step="any"
              value={borrowAmount || ''}
              onChange={(e) => {
                setIsLinked(false);
                setBorrowAmount(parseFloat(e.target.value) || 0);
              }}
              className={`w-full bg-[#07080e] border rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none ${
                isBorrowInsufficient
                  ? 'border-amber-500 text-amber-200 focus:border-amber-400'
                  : 'border-[#2b304a] text-emerald-300 focus:border-purple-500'
              }`}
            />
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {borrowWei} (wei)
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>Debt Coverage:</span>
              <span
                className={`font-mono font-semibold ${
                  debtDifference >= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {debtDifference >= 0 ? `+${debtDifference.toFixed(4)}` : `${debtDifference.toFixed(4)}`} {tokenSymbol}
              </span>
            </div>
            <div className="pt-1 flex justify-between items-center text-[10px] border-t border-[#1a1c2a]">
              <span className="text-slate-400">Repays Flashloan</span>
              <button
                type="button"
                onClick={handleAutoFixBorrow}
                className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 hover:underline"
                title="Auto-calculate borrow amount to cover exact debt + profit"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Auto-Fit to Debt
              </button>
            </div>
          </div>

          {/* Parameter 3: Repay Flashloan Debt */}
          <div className="space-y-1.5 bg-[#121422] p-3 rounded-lg border border-[#242940] transition-all">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                <span>3. Repay Flashloan Debt</span>
              </label>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                {tokenSymbol}
              </span>
            </div>
            <input
              type="number"
              step="any"
              value={repayAmount || ''}
              onChange={(e) => {
                setIsLinked(false);
                setRepayAmount(parseFloat(e.target.value) || 0);
              }}
              className="w-full bg-[#07080e] border border-[#2b304a] rounded px-3 py-2 text-xs font-mono font-bold text-purple-200 focus:outline-none focus:border-purple-500"
            />
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {repayWei} (wei)
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>Exact Pool Debt:</span>
              <span className="font-mono text-slate-200 font-semibold">
                {minRequiredDebt.toFixed(4)} {tokenSymbol}
              </span>
            </div>
            <div className="pt-1 flex justify-between items-center text-[10px] border-t border-[#1a1c2a]">
              <span className="text-slate-400">Pool Fee ({(feeTier * 100).toFixed(2)}%)</span>
              <button
                type="button"
                onClick={handleAutoFixRepay}
                className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 hover:underline"
                title="Reset repay amount to exact Uniswap flashloan pool debt"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Exact Pool Debt
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Repayment Debt Safety Banner (Fixes the exact callback balance debt error) */}
        {isBorrowInsufficient && (
          <div className="bg-amber-950/50 border border-amber-600 rounded-lg p-3 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 block text-xs">
                  Repayment Debt Shortfall Detected
                </span>
                <p className="text-[11px] text-amber-200/90 mt-0.5">
                  Flashloan requires returning at least{' '}
                  <strong className="text-white underline">{minRequiredDebt.toFixed(4)} {tokenSymbol}</strong>{' '}
                  (Principal {flashAmount} + Fee {(flashAmount * feeTier).toFixed(4)}). Currently borrowing{' '}
                  <strong className="text-amber-300">{borrowAmount}</strong> leaves a shortage of{' '}
                  <strong className="text-white">{(minRequiredDebt - borrowAmount).toFixed(4)} {tokenSymbol}</strong>.
                  Enso will reject this with <em>"Flashloan repayment insufficient"</em>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutoFixBorrow}
              className="w-full sm:w-auto px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shrink-0 shadow-sm transition-all"
            >
              Auto-Fix Borrow Amount
            </button>
          </div>
        )}

        {/* Real-Time LTV / Collateral Margin Banner */}
        {isDepositInsufficient && (
          <div className="bg-amber-950/50 border border-amber-600 rounded-lg p-3 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 block text-xs">
                  Aave LTV Collateral Insufficient
                </span>
                <p className="text-[11px] text-amber-200/90 mt-0.5">
                  Depositing <strong>{depositAmount} {collTokenSymbol}</strong> with {ltv}% LTV only allows borrowing up to{' '}
                  <strong>{maxBorrowAllowedByDeposit.toFixed(4)}</strong>, which is less than your borrow target of{' '}
                  <strong>{borrowAmount}</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAutoFixDeposit}
              className="w-full sm:w-auto px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shrink-0 shadow-sm transition-all"
            >
              Adjust Deposit Collateral
            </button>
          </div>
        )}
      </div>

      {/* SECTION 4: Advanced Protocol & Contract Parameters (Expandable & Editable) */}
      <div className="border border-[#1f2338] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0e101a] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Advanced Contract &amp; Protocol Parameters (Pools &amp; Routing)</span>
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="p-4 bg-[#0a0c16] space-y-3 border-t border-[#1f2338]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Uniswap V3 Pool */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Uniswap V3 Flashloan Pool Contract
                </label>
                <input
                  type="text"
                  value={uniPool}
                  onChange={(e) => setUniPool(e.target.value.trim())}
                  className="w-full bg-[#121422] border border-[#2b304a] rounded px-3 py-1.5 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Aave V3 Pool */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Aave V3 Lending Pool Contract
                </label>
                <input
                  type="text"
                  value={aavePool}
                  onChange={(e) => setAavePool(e.target.value.trim())}
                  className="w-full bg-[#121422] border border-[#2b304a] rounded px-3 py-1.5 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Routing Strategy */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Enso Routing Strategy
                </label>
                <select
                  value={routingStrategy}
                  onChange={(e) => setRoutingStrategy(e.target.value)}
                  className="w-full bg-[#121422] border border-[#2b304a] rounded px-3 py-1.5 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="ensowallet-v2">ensowallet-v2 (Recommended: Multi-shortcut Atomic)</option>
                  <option value="router">router (Standard Router)</option>
                </select>
              </div>

              {/* Safe Mode Info */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-[#121422] p-2.5 rounded border border-[#232840]">
                <Info className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  All contract addresses are strictly EIP-55 checksummed before transmission to Enso Shortcuts API.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
