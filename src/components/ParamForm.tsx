import React from 'react';
import { Calculator, Link, Unlink, AlertTriangle, RefreshCw, CheckCircle2, Percent, TrendingUp, Sliders } from 'lucide-react';
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
  // Editable derived parameters
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
}) => {
  // Required debt to satisfy flashloan
  const minRequiredBorrow = flashAmount * (1 + feeTier);
  const isBorrowInsufficient = borrowAmount < minRequiredBorrow - 0.000001;
  const maxBorrowFromDeposit = depositAmount * (ltv / 100);
  const isDepositInsufficient = maxBorrowFromDeposit < borrowAmount - 0.000001;

  const fixBorrowDebt = () => {
    const fixed = minRequiredBorrow + (profitTarget > 0 ? profitTarget : 0.5);
    setBorrowAmount(parseFloat(fixed.toFixed(6)));
  };

  const fixDepositFromLtv = () => {
    const slipFactor = Math.max(0.01, 1 - slippage / 100);
    const requiredDeposit = (borrowAmount / (ltv / 100)) / slipFactor;
    setDepositAmount(parseFloat(requiredDeposit.toFixed(6)));
  };

  return (
    <div className="bg-[#12141f] border border-[#23273c] rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header with Title and Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Flashloan &amp; Loop Parameters</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetAutoMath}
            title="Recalculate all parameters according to formula"
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-[#2b3047] bg-[#171a28] text-slate-300 hover:text-white hover:bg-[#202538] transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-purple-400" />
            <span>Recalculate</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLinked(!isLinked)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isLinked
                ? 'bg-purple-950/60 border-purple-700/60 text-purple-300'
                : 'bg-[#181b29] border-[#292e44] text-slate-400'
            }`}
          >
            {isLinked ? <Link className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
            <span>{isLinked ? 'Auto-link Active' : 'Manual Override'}</span>
          </button>
        </div>
      </div>

      {/* Row 1: Primary Flashloan Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Flashloan Input */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Flashloan ({tokenSymbol})
          </label>
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

        {/* Profit Target */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Target Profit ({tokenSymbol})
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={profitTarget || ''}
            onChange={(e) => setProfitTarget(parseFloat(e.target.value) || 0)}
            className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
            placeholder="25"
          />
        </div>

        {/* Pool Flash Fee */}
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
        </div>

        {/* Loops Count */}
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
        </div>
      </div>

      {/* Row 2: LTV & Slippage Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#1c1f30]">
        {/* LTV % */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <Percent className="w-3 h-3 text-purple-400" />
              <span>Aave V3 LTV Ratio</span>
            </label>
            <div className="flex gap-1">
              {[70, 75, 80, 82.5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setLtv(val)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    ltv === val ? 'bg-purple-600 text-white font-bold' : 'bg-[#1a1d2e] text-slate-400 hover:text-white'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              min="10"
              max="95"
              step="0.5"
              value={ltv}
              onChange={(e) => setLtv(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 pr-8"
              placeholder="75"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">%</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Aave V3 stablecoin maximum loan-to-value threshold (typically 75% - 80%).
          </span>
        </div>

        {/* Slippage % */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-purple-400" />
              <span>DEX Route Slippage</span>
            </label>
            <div className="flex gap-1">
              {[0.1, 0.5, 1.0, 2.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSlippage(val)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    slippage === val ? 'bg-purple-600 text-white font-bold' : 'bg-[#1a1d2e] text-slate-400 hover:text-white'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0.01"
              max="15"
              step="0.1"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0a0b12] border border-[#262a3f] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 pr-8"
              placeholder="0.5"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">%</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Enso swap route tolerance ({Math.round(slippage * 100)} BPS). Protects from frontrunning.
          </span>
        </div>
      </div>

      {/* Row 3: Fully Editable Execution Amounts (Repay, Borrow, Deposit) */}
      <div className="bg-[#0a0b14] border border-[#1e2235] rounded-lg p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Execution Amounts (Fully Editable)</span>
          </span>
          <span className="text-[10px] text-purple-300 font-mono">
            {isLinked ? 'Syncing to Formula' : 'Manual Override Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Repay Debt Amount */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 block">
              1. Repay Flashloan Debt ({tokenSymbol})
            </label>
            <input
              type="number"
              step="0.001"
              value={repayAmount || ''}
              onChange={(e) => {
                setIsLinked(false);
                setRepayAmount(parseFloat(e.target.value) || 0);
              }}
              className="w-full bg-[#121422] border border-[#282d46] rounded px-3 py-2 text-xs font-mono font-bold text-purple-200 focus:outline-none focus:border-purple-500"
            />
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {repayWei} (wei)
            </div>
            <div className="text-[10px] text-slate-400">
              Min Debt: {(flashAmount * (1 + feeTier)).toFixed(4)} {tokenSymbol}
            </div>
          </div>

          {/* Borrow Amount */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-slate-400 block">
                2. Aave Borrow Amount ({tokenSymbol})
              </label>
              {isBorrowInsufficient && (
                <span className="text-[10px] text-amber-400 font-bold">Too Low!</span>
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
              className={`w-full bg-[#121422] border rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none ${
                isBorrowInsufficient
                  ? 'border-amber-600 text-amber-200 focus:border-amber-500'
                  : 'border-[#282d46] text-emerald-300 focus:border-purple-500'
              }`}
            />
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {borrowWei} (wei)
            </div>
            <div className="text-[10px] text-slate-400">
              Covers Debt + Profit: {(minRequiredBorrow + profitTarget).toFixed(4)}
            </div>
          </div>

          {/* Deposit Amount */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-slate-400 block">
                3. Aave Deposit Collateral ({collTokenSymbol})
              </label>
              {isDepositInsufficient && (
                <span className="text-[10px] text-amber-400 font-bold">LTV Limit!</span>
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
              className={`w-full bg-[#121422] border rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none ${
                isDepositInsufficient
                  ? 'border-amber-600 text-amber-200 focus:border-amber-500'
                  : 'border-[#282d46] text-sky-200 focus:border-purple-500'
              }`}
            />
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {depositWei} (wei)
            </div>
            <div className="text-[10px] text-slate-400">
              Allows Borrow: {maxBorrowFromDeposit.toFixed(2)} ({ltv}% LTV)
            </div>
          </div>
        </div>

        {/* Warning if Borrow < Repay (The exact error the user encountered) */}
        {isBorrowInsufficient && (
          <div className="bg-amber-950/40 border border-amber-700/60 rounded p-2.5 text-xs text-amber-200 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Repayment Insufficient Warning:</span>
                <p className="text-[11px] text-amber-300 mt-0.5">
                  Borrowing <strong>{borrowAmount} {tokenSymbol}</strong> is less than the required flashloan debt of{' '}
                  <strong>{minRequiredBorrow.toFixed(4)} {tokenSymbol}</strong> (Principal: {flashAmount} + Fee: {(flashAmount * feeTier).toFixed(4)}).
                  Enso will reject this transaction with <em>"Flashloan repayment insufficient"</em>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fixBorrowDebt}
              className="px-2.5 py-1 text-xs font-bold rounded bg-amber-600 hover:bg-amber-500 text-white shrink-0 transition-colors"
            >
              Auto-Fix Borrow
            </button>
          </div>
        )}

        {/* Warning if Collateral / LTV insufficient */}
        {isDepositInsufficient && (
          <div className="bg-amber-950/40 border border-amber-700/60 rounded p-2.5 text-xs text-amber-200 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">LTV Margin Warning:</span>
                <p className="text-[11px] text-amber-300 mt-0.5">
                  Depositing <strong>{depositAmount} {collTokenSymbol}</strong> with {ltv}% LTV only allows borrowing up to{' '}
                  <strong>{maxBorrowFromDeposit.toFixed(4)}</strong>, which is below your target borrow of <strong>{borrowAmount}</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fixDepositFromLtv}
              className="px-2.5 py-1 text-xs font-bold rounded bg-amber-600 hover:bg-amber-500 text-white shrink-0 transition-colors"
            >
              Adjust Deposit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
