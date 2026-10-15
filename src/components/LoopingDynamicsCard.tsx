import React, { useState } from 'react';
import {
  Repeat,
  TrendingUp,
  ShieldCheck,
  Calculator,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  ArrowRight,
  Scale,
  Sparkles,
} from 'lucide-react';
import { LoopingDynamics, calculateLoopingDynamics } from '../utils/loopingMath';

interface LoopingDynamicsCardProps {
  flashAmount: number;
  ltv: number;
  loops: number;
  setLoops: (n: number) => void;
  feeTier: number;
  tokenSymbol: string;
  collTokenSymbol: string;
}

export const LoopingDynamicsCard: React.FC<LoopingDynamicsCardProps> = ({
  flashAmount,
  ltv,
  loops,
  setLoops,
  feeTier,
  tokenSymbol,
  collTokenSymbol,
}) => {
  const [showTable, setShowTable] = useState<boolean>(true);
  const [showEquations, setShowEquations] = useState<boolean>(false);

  const dynamics: LoopingDynamics = calculateLoopingDynamics(
    flashAmount,
    ltv,
    loops,
    feeTier
  );

  return (
    <div className="bg-[#0b0d18] border border-[#232942] rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1d2238] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-950/70 border border-purple-800/60 text-purple-400">
            <Repeat className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Recursive Looping &amp; Leverage Dynamics
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/50 text-purple-200 font-mono font-semibold">
                {loops} {loops === 1 ? 'Loop' : 'Loops'} @ {ltv}% LTV
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live compounding equations: Collateral doubling multiplier, total debts, and net equity difference.
            </p>
          </div>
        </div>

        {/* Quick Loop Presets */}
        <div className="flex items-center gap-1.5 bg-[#121526] p-1 rounded-lg border border-[#20253d]">
          <span className="text-[10px] text-slate-400 px-1 font-medium">Loops:</span>
          {[1, 2, 3, 4, 5].map((n) => {
            const preview = calculateLoopingDynamics(flashAmount, ltv, n, feeTier);
            return (
              <button
                key={n}
                type="button"
                onClick={() => setLoops(n)}
                title={`${n} Loops = ${preview.collateralMultiplier}x Collateral`}
                className={`text-[11px] px-2 py-1 rounded font-mono font-bold transition-all ${
                  loops === n
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30 ring-1 ring-purple-400'
                    : 'bg-[#181c33] text-slate-400 hover:text-slate-200 hover:bg-[#202542]'
                }`}
              >
                {n}x {n >= 3 ? '✨' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Main Stat Metric Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Metric 1: Collateral Doubling & Multiplier */}
        <div className="bg-[#121526] border border-[#232a48] rounded-xl p-3.5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              Collateral Multiplier
            </span>
            {dynamics.isDoubled ? (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                DOUBLED (+{Math.round((dynamics.collateralMultiplier - 1) * 100)}%)
              </span>
            ) : (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80 font-medium">
                {dynamics.doublingPercentage}% toward 2.0x
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-purple-300 tracking-tight">
              {dynamics.collateralMultiplier.toFixed(2)}x
            </span>
            <span className="text-[11px] text-slate-400">
              ({dynamics.totalCollateral.toFixed(3)} {collTokenSymbol})
            </span>
          </div>

          {/* Progress to Doubling (2.0x) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>Doubling Target (2.0x):</span>
              <span className={dynamics.isDoubled ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {dynamics.collateralMultiplier >= 2.0 ? 'Achieved at Loop 3+' : `${dynamics.collateralMultiplier.toFixed(2)} / 2.00x`}
              </span>
            </div>
            <div className="w-full bg-[#1e233a] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  dynamics.isDoubled
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-400'
                }`}
                style={{ width: `${Math.min(100, (dynamics.collateralMultiplier / 2.0) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Base: 1.00x</span>
              <span>Theoretical Max: {dynamics.maxTheoreticalMultiplier}x (limit)</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Collateral vs Total Debts Comparison */}
        <div className="bg-[#121526] border border-[#232a48] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-sky-400" />
              Total Collateral vs Total Debt
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
              LTV: {dynamics.effectiveLtv}%
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-sky-200">
              <span className="text-slate-400 text-[11px]">Total Collateral:</span>
              <span className="font-bold text-sky-300">
                {dynamics.totalCollateral.toFixed(4)} {collTokenSymbol}
              </span>
            </div>
            <div className="flex justify-between items-center text-amber-200">
              <span className="text-slate-400 text-[11px]">Total Borrow Debt:</span>
              <span className="font-bold text-amber-300">
                {dynamics.totalBorrowDebt.toFixed(4)} {tokenSymbol}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-[10px]">
              <span>Flashloan Repay (Fee incl):</span>
              <span className="font-mono text-slate-300">
                {dynamics.flashloanRepayDebt.toFixed(4)} {tokenSymbol}
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-[#1e233d] flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Position Health Factor:</span>
            <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              {dynamics.healthFactor > 50 ? 'Safe' : `${dynamics.healthFactor} (Safe > 1.0)`}
            </span>
          </div>
        </div>

        {/* Metric 3: Difference (Net Position Equity Buffer) */}
        <div className="bg-[#121526] border border-[#232a48] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Net Equity Difference (Δ)
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              +{dynamics.netEquityPercentage}% buffer
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-300 tracking-tight">
              +{dynamics.difference.toFixed(4)}
            </span>
            <span className="text-[11px] text-slate-400">
              {collTokenSymbol}
            </span>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            Equity remaining after subtracting all protocol debts:
            <span className="text-slate-200 font-mono font-semibold block mt-0.5">
              Collateral ({dynamics.totalCollateral.toFixed(2)}) &minus; Debts ({dynamics.totalBorrowDebt.toFixed(2)}) = +{dynamics.difference.toFixed(4)}
            </span>
          </p>

          <div className="pt-1 border-t border-[#1e233d] text-[10px] text-slate-400 flex justify-between">
            <span>Buffer to Liquidation:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              +{dynamics.liquidationBuffer.toFixed(4)} {collTokenSymbol}
            </span>
          </div>
        </div>
      </div>

      {/* General Equations Toggle & Formula Explanations */}
      <div className="bg-[#0e1120] border border-[#1e243c] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowEquations(!showEquations)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-slate-300 hover:bg-[#14182b] transition-colors"
        >
          <span className="flex items-center gap-2 font-semibold">
            <Calculator className="w-3.5 h-3.5 text-purple-400" />
            <span>Mathematical Equations: Recursive Leverage &amp; Collateral Growth</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-purple-400">
            {showEquations ? 'Hide Formulas' : 'Show Fixed Equations'}
            {showEquations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {showEquations && (
          <div className="p-3.5 border-t border-[#1a1f36] space-y-3 bg-[#0a0c17] text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2.5 rounded bg-[#101324] border border-[#1f2540] space-y-1 font-mono text-[11px]">
                <div className="text-purple-300 font-bold">1. Collateral Multiplier Equation:</div>
                <div className="text-slate-300 bg-[#080910] p-1.5 rounded border border-[#1b1f33]">
                  M = &sum;<sub>k=0</sub><sup>N-1</sup> (LTV)<sup>k</sup> = (1 &minus; LTV<sup>N</sup>) / (1 &minus; LTV)
                </div>
                <div className="text-[10px] text-slate-400">
                  For N={loops}, LTV={ltv / 100} &rarr; M = {dynamics.collateralMultiplier.toFixed(4)}x
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#101324] border border-[#1f2540] space-y-1 font-mono text-[11px]">
                <div className="text-sky-300 font-bold">2. Total Collateral Equation:</div>
                <div className="text-slate-300 bg-[#080910] p-1.5 rounded border border-[#1b1f33]">
                  C<sub>total</sub> = Flashloan &times; M = {flashAmount} &times; {dynamics.collateralMultiplier.toFixed(2)} = {dynamics.totalCollateral.toFixed(4)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Compounded collateral supplied to Aave V3.
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#101324] border border-[#1f2540] space-y-1 font-mono text-[11px]">
                <div className="text-amber-300 font-bold">3. Total Debts Equation:</div>
                <div className="text-slate-300 bg-[#080910] p-1.5 rounded border border-[#1b1f33]">
                  D<sub>total</sub> = C<sub>total</sub> &times; LTV = {dynamics.totalCollateral.toFixed(4)} &times; {ltv / 100} = {dynamics.totalBorrowDebt.toFixed(4)}
                </div>
                <div className="text-[10px] text-slate-400">
                  Accumulated borrowed debt balance across all folding cycles.
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#101324] border border-[#1f2540] space-y-1 font-mono text-[11px]">
                <div className="text-emerald-300 font-bold">4. Net Difference (Equity Buffer):</div>
                <div className="text-slate-300 bg-[#080910] p-1.5 rounded border border-[#1b1f33]">
                  &Delta; = C<sub>total</sub> &minus; D<sub>total</sub> = +{dynamics.difference.toFixed(4)} {collTokenSymbol}
                </div>
                <div className="text-[10px] text-slate-400">
                  Net equity preserving solvency against liquidation risk.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step-by-Step Looping Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Loop-by-Loop Breakdown ({dynamics.iterations.length} {dynamics.iterations.length === 1 ? 'Cycle' : 'Cycles'})</span>
            {showTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <span className="text-[10px] text-slate-400">
            {dynamics.isDoubled ? '✨ Collateral doubles at Loop 3' : 'Set Loops to 3+ to double collateral'}
          </span>
        </div>

        {showTable && (
          <div className="overflow-x-auto rounded-lg border border-[#1f243b]">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-[#121528] text-slate-400 text-[10px] uppercase border-b border-[#1f243b]">
                <tr>
                  <th className="py-2 px-2.5">Cycle</th>
                  <th className="py-2 px-2.5">Deposit In</th>
                  <th className="py-2 px-2.5">Borrow Out</th>
                  <th className="py-2 px-2.5">Cum. Collateral</th>
                  <th className="py-2 px-2.5">Cum. Debt</th>
                  <th className="py-2 px-2.5">Multiplier</th>
                  <th className="py-2 px-2.5">Net Equity (Δ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181d33] bg-[#0c0e1a]">
                {dynamics.iterations.map((item) => (
                  <tr
                    key={item.loopNumber}
                    className={`hover:bg-[#14182e] transition-colors ${
                      item.loopNumber === loops ? 'bg-purple-950/20' : ''
                    }`}
                  >
                    <td className="py-2 px-2.5 font-bold text-slate-200 flex items-center gap-1">
                      <span>Loop {item.loopNumber}</span>
                      {item.multiplier >= 2.0 && item.loopNumber === 3 && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          2x Doubled!
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-sky-300">
                      {item.depositAmount.toFixed(4)}
                    </td>
                    <td className="py-2 px-2.5 text-amber-300">
                      {item.borrowAmount.toFixed(4)}
                    </td>
                    <td className="py-2 px-2.5 text-sky-200 font-bold">
                      {item.cumulativeDeposit.toFixed(4)}
                    </td>
                    <td className="py-2 px-2.5 text-amber-200 font-bold">
                      {item.cumulativeBorrow.toFixed(4)}
                    </td>
                    <td className="py-2 px-2.5">
                      <span
                        className={`font-bold ${
                          item.multiplier >= 2.0 ? 'text-emerald-400' : 'text-purple-300'
                        }`}
                      >
                        {item.multiplier.toFixed(2)}x
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-emerald-400 font-semibold">
                      +{item.netEquity.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
