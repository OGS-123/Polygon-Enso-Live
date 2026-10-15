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
import { calculateLoopingDynamics } from '../utils/loopingMath';

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
  isZeroCapital?: boolean;
  setIsZeroCapital?: (val: boolean) => void;
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
  flashloanProtocol?: 'aave-v3' | 'uniswap-v3';
  setFlashloanProtocol?: (val: 'aave-v3' | 'uniswap-v3') => void;
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
  isZeroCapital,
  setIsZeroCapital,
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
  flashloanProtocol = 'aave-v3',
  setFlashloanProtocol,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isZeroCap = isZeroCapital !== undefined ? isZeroCapital : true;

  // Final Total Collateral, Total Debts, and General Difference / Equity Dynamics
  const loopDynamics = calculateLoopingDynamics(flashAmount, ltv, loops, feeTier);

  // Exact required flashloan debt to repay
  const minRequiredDebt = flashAmount * (1 + feeTier);

  // Position Health & Solvency based on Final Total Collateral vs Final Total Debts
  const isPositionSolvent = loopDynamics.difference >= 0;
  const isPositionHealthy = loopDynamics.healthFactor >= 1.05;

  // 1. Match Deposit Collateral directly to Flashloan Amount (Zero upfront capital)
  const handleAutoFixDeposit = () => {
    setDepositAmount(parseFloat((flashAmount || 0).toFixed(6)));
  };

  // 2. Set Borrow Amount to 70% (or current LTV%) of collateral
  const handleAutoFixBorrow = () => {
    const ltvRatio = Math.max(0.01, (ltv || 70) / 100);
    setBorrowAmount(parseFloat((depositAmount * ltvRatio).toFixed(6)));
  };

  // 3. Set Repay Flashloan Debt plus fee if needed
  const handleAutoFixRepay = () => {
    setRepayAmount(parseFloat(minRequiredDebt.toFixed(6)));
  };

  // Complete Safe Auto-Balance: aligns all parameters to guarantee positive net equity & safe LTV
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
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Loop Iterations
            </label>
            <span className="text-[10px] font-mono text-purple-300 font-bold">
              {loopDynamics.collateralMultiplier.toFixed(2)}x Multiplier
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="1"
              max="10"
              step="1"
              value={loops}
              onChange={(e) => setLoops(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="w-16 bg-[#0a0b12] border border-[#262a3f] rounded px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-500"
            />
            {/* Loop Presets */}
            <div className="flex gap-1 flex-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setLoops(val)}
                  className={`text-[10px] px-1 py-1 rounded flex-1 font-mono transition-colors ${
                    loops === val
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-[#1b1f33] text-slate-400 hover:text-white'
                  }`}
                >
                  {val}x{val >= 3 ? '✨' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>
              {loopDynamics.isDoubled ? (
                <span className="text-emerald-400 font-bold">✨ Collateral Doubled!</span>
              ) : (
                <span>{loopDynamics.doublingPercentage}% to 2.0x</span>
              )}
            </span>
            <span className="text-purple-300 font-semibold">
              Net Δ: +{loopDynamics.difference.toFixed(4)}
            </span>
          </div>
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

      {/* SECTION 3: Final Execution Amounts & Position Equity (Total Collateral vs Total Debts) */}
      <div className="bg-[#0a0b14] border border-[#1e2235] rounded-xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1c1f30] pb-2.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-xs font-bold text-white block">
                Final Execution Amounts &amp; Position Equity
              </span>
              <span className="text-[10px] text-slate-400">
                Governed by Final Total Collateral vs Final Total Debts &bull; Net Difference (&Delta;) guarantees smooth execution
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Zero Upfront Capital Mode Switch */}
            <label className="flex items-center gap-1.5 cursor-pointer bg-[#141829] px-2.5 py-1 rounded-lg border border-purple-800/60 hover:border-purple-600 transition-colors">
              <input
                type="checkbox"
                checked={isZeroCap}
                onChange={(e) => setIsZeroCapital && setIsZeroCapital(e.target.checked)}
                className="accent-purple-500 w-3.5 h-3.5 cursor-pointer rounded"
              />
              <span className="text-[11px] font-semibold text-purple-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Zero Upfront Capital
              </span>
            </label>

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

        {/* Primary Position Cards: Final Total Collateral vs Final Total Debts vs Net Equity Difference */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Final Total Collateral */}
          <div className="bg-[#121422] p-3 rounded-lg border border-[#242940] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide">
                Final Total Collateral (C)
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono font-bold">
                {collTokenSymbol}
              </span>
            </div>
            <div className="text-base sm:text-lg font-mono font-extrabold text-sky-200">
              {loopDynamics.totalCollateral.toFixed(4)}
            </div>
            <div className="text-[10px] text-purple-300 font-mono flex items-center justify-between">
              <span>Multiplier:</span>
              <span className="font-bold">{loopDynamics.collateralMultiplier.toFixed(2)}x Compounded</span>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-[#1c1f30] pt-1 flex items-center justify-between">
              <span>{loops} Folding Cycles:</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {isZeroCap ? '$0 Upfront Capital' : `${depositAmount} Seed`}
              </span>
            </div>
          </div>

          {/* Card 2: Final Total Debts */}
          <div className="bg-[#121422] p-3 rounded-lg border border-[#242940] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide">
                Final Total Debts (D)
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                {tokenSymbol}
              </span>
            </div>
            <div className="text-base sm:text-lg font-mono font-extrabold text-amber-200">
              {loopDynamics.totalBorrowDebt.toFixed(4)}
            </div>
            <div className="text-[10px] text-amber-300/90 font-mono flex items-center justify-between">
              <span>Effective LTV:</span>
              <span className="font-bold">{loopDynamics.effectiveLtv}%</span>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-[#1c1f30] pt-1 flex items-center justify-between">
              <span>Liq. Buffer:</span>
              <span className="text-sky-300 font-mono font-semibold">
                +{loopDynamics.liquidationBuffer.toFixed(4)} {tokenSymbol}
              </span>
            </div>
          </div>

          {/* Card 3: Net Position Equity & General Difference */}
          <div className="bg-[#121422] p-3 rounded-lg border border-emerald-900/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wide">
                Net Equity Difference (&Delta;)
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                C &minus; D
              </span>
            </div>
            <div className="text-base sm:text-lg font-mono font-extrabold text-emerald-300">
              +{loopDynamics.difference.toFixed(4)}
            </div>
            <div className="text-[10px] text-emerald-300/90 font-mono flex items-center justify-between">
              <span>Health Factor:</span>
              <span className="font-bold text-white">{loopDynamics.healthFactor} (Safe)</span>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-[#1c1f30] pt-1 flex items-center justify-between">
              <span>Equity Ratio:</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {loopDynamics.netEquityPercentage}% Solvent
              </span>
            </div>
          </div>
        </div>

        {/* General Difference / Equity Verification Banner */}
        {isPositionSolvent ? (
          <div className="bg-[#0b1b16] border border-emerald-600/70 rounded-lg p-3 text-xs text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-xs block">
                  ✨ General Difference &amp; Equity Verified Solvent (+{loopDynamics.difference.toFixed(4)} {collTokenSymbol})
                </span>
                <span className="text-[11px] text-emerald-300/90 mt-0.5 block leading-relaxed">
                  Final Collateral ({loopDynamics.totalCollateral.toFixed(4)} {collTokenSymbol}) exceeds Total Debts ({loopDynamics.totalBorrowDebt.toFixed(4)} {tokenSymbol}) by +{loopDynamics.difference.toFixed(4)} with safe Health Factor {loopDynamics.healthFactor}. Ready to execute transactions smoothly without upfront capital barriers.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-mono font-bold text-[10px]">
                SOLVENT &bull; HF {loopDynamics.healthFactor}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-950/40 border border-amber-700/70 rounded-lg p-3 text-xs text-amber-200 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-white text-xs block">Negative Equity Warning</span>
                <span className="text-[11px] text-amber-300/90 mt-0.5 block">
                  Total Debts exceed Total Collateral. Adjust borrow ratio or click Safe Auto-Balance below to restore positive equity.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSafeAutoBalance}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white shrink-0"
            >
              Safe Auto-Balance
            </button>
          </div>
        )}

        {/* Detailed Per-Cycle Execution Parameters (Fully Editable) */}
        <div className="border border-[#1e233d] rounded-lg p-3 bg-[#0d0f1c] space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 pb-1.5 border-b border-[#1b1e32]">
            <span>Per-Cycle Seed Parameters (Synchronized to Totals)</span>
            <span className="text-[10px] text-slate-400 font-normal">
              1. Seed Collateral &bull; 2. Borrow 70% &bull; 3. Flashloan Fee Debt
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Step 1: Deposit Collateral */}
            <div className="bg-[#121422] p-2.5 rounded border border-[#242940] space-y-1">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300">
                <span>1. Cycle 1 Collateral</span>
                <span className="text-sky-300 font-mono">{collTokenSymbol}</span>
              </div>
              <input
                type={isZeroCap ? "text" : "number"}
                step="any"
                value={isZeroCap ? "0 (zero capital → uses 1 wei internally)" : (depositAmount || '')}
                disabled={isZeroCap}
                onChange={(e) => {
                  if (isZeroCap) return;
                  setIsLinked(false);
                  setDepositAmount(parseFloat(e.target.value) || 0);
                }}
                className={`w-full bg-[#07080e] border ${
                  isZeroCap
                    ? 'border-purple-800/80 text-purple-300/90 cursor-not-allowed bg-purple-950/20'
                    : 'border-[#2b304a] text-sky-200 focus:border-purple-500'
                } rounded px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none`}
              />
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                <span>{isZeroCap ? 'Validation mode:' : '100% Flash-funded:'}</span>
                {isZeroCap ? (
                  <span className="text-purple-300 font-mono text-[9px] flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    Zero Capital (1 wei pass)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleAutoFixDeposit}
                    className="text-purple-400 hover:underline flex items-center gap-0.5"
                  >
                    <RefreshCw className="w-2 h-2" /> Match Flashloan
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Borrow Amount */}
            <div className="bg-[#121422] p-2.5 rounded border border-[#242940] space-y-1">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300">
                <span>2. Cycle 1 Borrow ({ltv}%)</span>
                <span className="text-emerald-300 font-mono">{tokenSymbol}</span>
              </div>
              <input
                type="number"
                step="any"
                value={borrowAmount || ''}
                onChange={(e) => {
                  setIsLinked(false);
                  setBorrowAmount(parseFloat(e.target.value) || 0);
                }}
                className="w-full bg-[#07080e] border border-[#2b304a] text-emerald-300 focus:border-purple-500 rounded px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
              />
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                <span>70% Ratio:</span>
                <button
                  type="button"
                  onClick={handleAutoFixBorrow}
                  className="text-purple-400 hover:underline flex items-center gap-0.5"
                >
                  <RefreshCw className="w-2 h-2" /> Auto-Set 70%
                </button>
              </div>
            </div>

            {/* Step 3: Repay Flashloan Debt */}
            <div className="bg-[#121422] p-2.5 rounded border border-[#242940] space-y-1">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300">
                <span>3. Flashloan Debt</span>
                <span className="text-purple-300 font-mono">{tokenSymbol}</span>
              </div>
              <input
                type="number"
                step="any"
                value={repayAmount || ''}
                onChange={(e) => {
                  setIsLinked(false);
                  setRepayAmount(parseFloat(e.target.value) || 0);
                }}
                className="w-full bg-[#07080e] border border-[#2b304a] text-purple-200 focus:border-purple-500 rounded px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
              />
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                <span>Fee: +{(flashAmount * feeTier).toFixed(4)}</span>
                <button
                  type="button"
                  onClick={handleAutoFixRepay}
                  className="text-purple-400 hover:underline flex items-center gap-0.5"
                >
                  <RefreshCw className="w-2 h-2" /> Exact Debt + Fee
                </button>
              </div>
            </div>
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
              {/* Flashloan Protocol / Provider */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Flashloan Provider Protocol
                </label>
                <select
                  value={flashloanProtocol}
                  onChange={(e) => setFlashloanProtocol?.(e.target.value as 'aave-v3' | 'uniswap-v3')}
                  className="w-full bg-[#121422] border border-[#2b304a] rounded px-3 py-1.5 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="aave-v3">Aave V3 (Zero-Capital Native Lending - Recommended)</option>
                  <option value="uniswap-v3">Uniswap V3 (DEX Liquidity Pool)</option>
                </select>
              </div>

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
            </div>

            {/* Safe Mode Info */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-[#121422] p-2.5 rounded border border-[#232840]">
              <Info className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Zero-capital mode supplies collateral directly from flashloaned liquidity without demanding upfront wallet token balances.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
