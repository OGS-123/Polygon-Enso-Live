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
  // Editable execution parameters
  repayAmount: number;
  setRepayAmount: (val: number) => void;
  borrowAmount: number;
  setBorrowAmount: (val: number) => void;
  depositAmount: number;
  setDepositAmount: (val: number) => void;
  onResetAutoMath: () => void;
  repayWei: string;
  borrowWei: string;
  depositWei: string;
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
  repayAmount,
  setRepayAmount,
  borrowAmount,
  setBorrowAmount,
  depositAmount,
  setDepositAmount,
  onResetAutoMath,
  repayWei,
  borrowWei,
  depositWei,
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
    const safeBorrow = minRequiredDebt + (profitTarget > 0 ? profitTarget : 1.0);
    setBorrowAmount(parseFloat(safeBorrow.toFixed(6)));
  };

  // One-click Auto-Fix to adjust collateral deposit to satisfy LTV & Slippage
  const handleAutoFixDeposit = () => {
    const slipFactor = Math.max(0.01, 1 - slippage / 100);
    const safeDeposit = (borrowAmount / (ltv / 100)) / slipFactor;
    setDepositAmount(parseFloat(safeDeposit.toFixed(6)));
  };

  // Complete Safe Auto-Balance: adjusts Repay, Borrow, and Deposit together
  const handleSafeAutoBalance = () => {
    onResetAutoMath();
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
            onClick={() => setIsLinked(!isLinked)}
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
              step="1000"
              value={flashAmount || ''}
              onChange={(e) => setFlashAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              placeholder="50000"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Principal borrowed</span>
        </div>

        {/* 2. Target Profit */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Target Profit ({tokenSymbol})
          </label>
          <input
            type="number"
            min="0"
            step="5"
            value={profitTarget || ''}
            onChange={(e) => setProfitTarget(parseFloat(e.target.value) || 0)}
            className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-purple-500"
            placeholder="25"
          />
          <span className="text-[10px] text-slate-500 mt-0.5 block">Net excess over debt</span>
        </div>

        {/* 3. Pool Flash Fee */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Flash Fee Tier
          </label>
          <select
            value={feeTier}
            onChange={(e) => setFeeTier(parseFloat(e.target.value))}
            className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-2 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
          >
            {FEE_TIERS.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
            Fee: {(flashAmount * feeTier).toFixed(2)} {tokenSymbol}
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
          <span className="text-[10px] text-slate-500 mt-0.5 block">Folding cycles (1-10)</span>
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
                    onClick={() => setLtv(val)}
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
                  onChange={(e) => setLtv(parseFloat(e.target.value) || 0)}
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
                onChange={(e) => setLtv(parseFloat(e.target.value) || 0)}
                className="w-24 accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Max borrow power:</span>
              <span className="font-mono text-purple-300 font-semibold">
                {(depositAmount * (ltv / 100)).toFixed(2)} {tokenSymbol}
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

      {/* SECTION 3: All Automatic Parameters (100% Fully Editable) */}
      <div className="bg-[#0a0b14] border border-[#1e2235] rounded-xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1c1f30] pb-2.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white">
              Derived Execution Amounts (Fully Editable)
            </span>
          </div>
          <span className="text-[10px] text-purple-300 font-mono">
            {isLinked ? '● Synced to Auto-Formula' : '▲ Manual Override Enabled'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Parameter 1: Repay Flashloan Debt */}
          <div className="space-y-1 bg-[#121422] p-3 rounded-lg border border-[#242940]">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                <span>1. Repay Flashloan Debt</span>
              </label>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                {tokenSymbol}
              </span>
            </div>
            <input
              type="number"
              step="0.001"
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
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>Required Debt:</span>
              <span className="font-mono text-slate-200 font-semibold">
                {minRequiredDebt.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Parameter 2: Aave Borrow Amount */}
          <div
            className={`space-y-1 bg-[#121422] p-3 rounded-lg border ${
              isBorrowInsufficient ? 'border-amber-600/80 bg-amber-950/20' : 'border-[#242940]'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                <span>2. Aave Borrow Amount</span>
              </label>
              {isBorrowInsufficient ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-900/80 text-amber-200 font-bold animate-pulse">
                  Insufficient!
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Covers Debt
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.001"
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
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>Debt Coverage:</span>
              <span
                className={`font-mono font-semibold ${
                  debtDifference >= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {debtDifference >= 0 ? `+${debtDifference.toFixed(4)}` : `${debtDifference.toFixed(4)}`}
              </span>
            </div>
          </div>

          {/* Parameter 3: Aave Deposit Collateral */}
          <div
            className={`space-y-1 bg-[#121422] p-3 rounded-lg border ${
              isDepositInsufficient ? 'border-amber-600/80 bg-amber-950/20' : 'border-[#242940]'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                <span>3. Aave Deposit Collateral</span>
              </label>
              {isDepositInsufficient ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-900/80 text-amber-200 font-bold">
                  LTV Exceeded
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  {collTokenSymbol}
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.001"
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
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>Borrow capacity:</span>
              <span className="font-mono text-slate-200 font-semibold">
                {maxBorrowAllowedByDeposit.toFixed(2)}
              </span>
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
