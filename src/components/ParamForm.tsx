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

  // 1. Match Deposit Collateral directly to Flashloan Amount (Zero upfront capital)
  const handleAutoFixDeposit = () => {
    setDepositAmount(parseFloat((flashAmount || 0).toFixed(6)));
  };

  // 2. Set Borrow Amount to 70% (or current LTV%) of collateral
  const handleAutoFixBorrow = () => {
    const ltvRatio = Math.max(0.01, (ltv || 70) / 100);
    setBorrowAmount(parseFloat((depositAmount * ltvRatio).toFixed(6)));
  };

  // 2b. Match Borrow to 100% of Debt for 1-Shot Atomic Flashloan Closeout
  const handleMatchBorrowToDebt = () => {
    const safeBorrow = minRequiredDebt + (profitTarget > 0 ? profitTarget : 0.01);
    setBorrowAmount(parseFloat(safeBorrow.toFixed(6)));
  };

  // 3. Set Repay Flashloan Debt plus fee if needed
  const handleAutoFixRepay = () => {
    setRepayAmount(parseFloat(minRequiredDebt.toFixed(6)));
  };

  // Complete Safe Auto-Balance: adjusts Deposit (100% matched), Borrow (70%), and Repay (Debt + Fee) together
  const handleSafeAutoBalance = () => {
    onResetAutoMath();
  };

  // Auto-adjust all 3 execution parameters when Flashloan Amount changes:
  // 1. Deposit Collateral matches flashloan amount (zero upfront capital)
  // 2. Borrow Amount is 70% (or current LTV%) of deposit
  // 3. Repay Flashloan Debt plus fee if needed
  const handleFlashAmountChange = (newFlash: number) => {
    setFlashAmount(newFlash);
    const f = Math.max(0, newFlash || 0);
    const fee = Math.max(0, feeTier || 0);
    const ltvRatio = Math.max(0.01, (ltv || 70) / 100);

    const calculatedDeposit = parseFloat(f.toFixed(6));
    const calculatedBorrow = parseFloat((calculatedDeposit * ltvRatio).toFixed(6));
    const calculatedRepay = parseFloat((f * (1 + fee)).toFixed(6));

    setDepositAmount(calculatedDeposit);
    setBorrowAmount(calculatedBorrow);
    setRepayAmount(calculatedRepay);
  };

  // Auto-adjust Borrow Amount when LTV% changes (e.g. 70%)
  const handleLtvChange = (newLtv: number) => {
    setLtv(newLtv);
    const ltvRatio = Math.max(0.01, (newLtv || 70) / 100);
    const calculatedBorrow = parseFloat((depositAmount * ltvRatio).toFixed(6));
    setBorrowAmount(calculatedBorrow);
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
                setRepayAmount(parseFloat(rep.toFixed(6)));
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
                    setRepayAmount(parseFloat(rep.toFixed(6)));
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
                setRepayAmount(parseFloat(rep.toFixed(6)));
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
                    onClick={() => setSlippage(val)}
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
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
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
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
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
      {/* 1. Deposit Collateral (100% matched to Flashloan, Zero Upfront) */}
      {/* 2. Borrow Amount (70% LTV of Collateral) */}
      {/* 3. Repay Flashloan Debt (Principal + Fee if needed) */}
      <div className="bg-[#0a0b14] border border-[#1e2235] rounded-xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1c1f30] pb-2.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-xs font-bold text-white block">
                Execution Amounts (Fully Editable)
              </span>
              <span className="text-[10px] text-slate-400">
                1. Deposit matches Flashloan ($0 upfront) &bull; 2. Borrow 70% &bull; 3. Repay Debt plus fee if needed
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {isLinked ? 'Auto-Adjusted (Zero Upfront)' : 'Manual Override Active'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLinked(true);
                handleFlashAmountChange(flashAmount);
              }}
              className="text-[10px] px-2 py-0.5 rounded bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-700/60 font-medium transition-colors"
            >
              Re-Sync Formula
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Parameter 1: Deposit Collateral (Matches Flashloan, 0 Upfront) */}
          <div className="space-y-1.5 bg-[#121422] p-3 rounded-lg border border-[#242940] transition-all">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                <span>1. Deposit Collateral</span>
              </label>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-medium">
                {collTokenSymbol}
              </span>
            </div>
            <div className="text-[9px] text-emerald-400 font-mono font-medium flex items-center justify-between">
              <span>Zero Upfront Capital</span>
              <span className="text-slate-400">100% Flash-Funded</span>
            </div>
            <input
              type="number"
              step="any"
              value={depositAmount || ''}
              onChange={(e) => {
                setIsLinked(false);
                setDepositAmount(parseFloat(e.target.value) || 0);
              }}
              className="w-full bg-[#07080e] border border-[#2b304a] text-sky-200 focus:border-purple-500 rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none"
            />
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {depositWei} (wei)
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>Matches Flashloan:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {flashAmount} {tokenSymbol}
              </span>
            </div>
            <div className="pt-1 flex justify-between items-center text-[10px] border-t border-[#1a1c2a]">
              <span className="text-slate-400">User Wallet: $0.00</span>
              <button
                type="button"
                onClick={handleAutoFixDeposit}
                className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 hover:underline"
                title="Match deposit collateral directly to flashloan amount (zero upfront capital)"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Match Flashloan (1:1)
              </button>
            </div>
          </div>

          {/* Parameter 2: Borrow Amount (70% of Collateral) */}
          <div className="space-y-1.5 bg-[#121422] p-3 rounded-lg border border-[#242940] transition-all">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                <span>2. Borrow Amount</span>
              </label>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                {tokenSymbol}
              </span>
            </div>
            <div className="text-[9px] text-purple-300 font-mono font-medium flex items-center justify-between">
              <span>Borrow Ratio: {ltv}%</span>
              <div className="flex gap-1">
                {[50, 70, 75, 80].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setLtv(preset);
                      setBorrowAmount(parseFloat((depositAmount * (preset / 100)).toFixed(6)));
                    }}
                    className={`text-[8px] px-1 py-0.2 rounded ${
                      ltv === preset
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-[#1b1f33] text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              step="any"
              value={borrowAmount || ''}
              onChange={(e) => {
                setIsLinked(false);
                setBorrowAmount(parseFloat(e.target.value) || 0);
              }}
              className="w-full bg-[#07080e] border border-[#2b304a] text-emerald-300 focus:border-purple-500 rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none"
            />
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {borrowWei} (wei)
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>{ltv}% of Collateral:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {(depositAmount * (ltv / 100)).toFixed(4)} {tokenSymbol}
              </span>
            </div>
            <div className="pt-1 flex justify-between items-center text-[10px] border-t border-[#1a1c2a]">
              <span className="text-slate-400">Aave V3 Debt</span>
              <button
                type="button"
                onClick={handleAutoFixBorrow}
                className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 hover:underline"
                title="Set borrow amount to 70% (or current LTV%) of collateral"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Auto-Set 70% LTV
              </button>
            </div>
          </div>

          {/* Parameter 3: Repay Flashloan Debt (Principal + Fee if needed) */}
          <div className="space-y-1.5 bg-[#121422] p-3 rounded-lg border border-[#242940] transition-all">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                <span>3. Repay Flashloan Debt</span>
              </label>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-medium">
                {tokenSymbol}
              </span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between">
              <span>Plus Fee if needed:</span>
              <div className="flex gap-1">
                {[
                  { label: '0%', fee: 0 },
                  { label: '0.05%', fee: 0.0005 },
                  { label: '0.09%', fee: 0.0009 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setFeeTier(item.fee);
                      setRepayAmount(parseFloat((flashAmount * (1 + item.fee)).toFixed(6)));
                    }}
                    className={`text-[8px] px-1 py-0.2 rounded ${
                      feeTier === item.fee
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-[#1b1f33] text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
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
              <span>Pool Debt + Fee:</span>
              <span className="font-mono text-purple-300 font-semibold">
                {minRequiredDebt.toFixed(4)} {tokenSymbol}
              </span>
            </div>
            <div className="pt-1 flex justify-between items-center text-[10px] border-t border-[#1a1c2a]">
              <span className="text-slate-400">Fee: +{(flashAmount * feeTier).toFixed(4)}</span>
              <button
                type="button"
                onClick={handleAutoFixRepay}
                className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 hover:underline"
                title="Set repay amount to flashloan principal plus pool fee"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Exact Debt + Fee
              </button>
            </div>
          </div>
        </div>

        {/* Live Zero-Upfront Execution Status & Quick Action Banner */}
        <div className="bg-[#101322] border border-[#232942] rounded-lg p-3 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block text-xs">
                Zero-Upfront Flashloan Mode Active
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                • <strong>1. Deposit Collateral:</strong> {depositAmount} {collTokenSymbol} (matches {flashAmount} {tokenSymbol} flashloan, $0 upfront user capital)
                <br />
                • <strong>2. Borrow Amount:</strong> {borrowAmount} {tokenSymbol} ({ltv}% LTV of collateral)
                <br />
                • <strong>3. Repay Flashloan Debt:</strong> {repayAmount} {tokenSymbol} (Flashloan {flashAmount} + {(feeTier * 100).toFixed(2)}% fee)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap sm:flex-col gap-1.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAutoFixBorrow}
              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 transition-all text-center"
              title="Reset borrow amount to exactly 70% of collateral"
            >
              Reset 70% Borrow ({ (depositAmount * (ltv / 100)).toFixed(4) })
            </button>
            <button
              type="button"
              onClick={handleMatchBorrowToDebt}
              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 transition-all text-center"
              title="Match borrow to 100% of flashloan debt + profit for 1-shot self-repayment without wallet balance"
            >
              1-Shot Self-Repay ({minRequiredDebt.toFixed(4)})
            </button>
          </div>
        </div>
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
