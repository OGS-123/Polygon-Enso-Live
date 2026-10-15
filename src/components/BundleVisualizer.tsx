import React from 'react';
import { ArrowDown, Check, GitCommit, ArrowRight, Zap, Database, Repeat, DollarSign } from 'lucide-react';

interface BundleVisualizerProps {
  flashTokenSymbol: string;
  collTokenSymbol: string;
  flashAmount: number;
  calculated: {
    repay: number;
    borrow: number;
    deposit: number;
  };
  ltv?: number;
  slippage?: number;
  loops?: number;
}

export const BundleVisualizer: React.FC<BundleVisualizerProps> = ({
  flashTokenSymbol,
  collTokenSymbol,
  flashAmount,
  calculated,
  ltv = 70,
  slippage = 0.5,
  loops = 1,
}) => {
  const isMultiLoop = loops > 1;
  const isSameToken = flashTokenSymbol.toUpperCase() === collTokenSymbol.toUpperCase();

  const steps = [
    {
      num: 1,
      title: 'Uniswap V3 Flashloan',
      action: 'Borrow Uncollateralized Capital',
      detail: `Borrow ${flashAmount} ${flashTokenSymbol} from UniV3 pool with zero upfront capital`,
      icon: Zap,
      color: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
    },
    {
      num: 2,
      title: isSameToken
        ? 'Direct Supply (Same Asset)'
        : (isMultiLoop ? `Enso Router: Swap (x${loops} Cycles)` : 'Enso Router: Swap'),
      action: isSameToken
        ? 'Direct Supply (0% Swap Slippage)'
        : `Convert Flash Asset (Slippage: ${slippage}%)`,
      detail: isSameToken
        ? `Flashloan asset (${flashTokenSymbol}) matches collateral asset directly. No DEX swap needed.`
        : (isMultiLoop
            ? `Swaps flashloan asset ${flashTokenSymbol} → ${collTokenSymbol}, repeated on each recursive cycle`
            : `Swap ${flashAmount} ${flashTokenSymbol} → ${collTokenSymbol} with ${Math.round(slippage * 100)} BPS slippage protection`),
      icon: isSameToken ? Check : Repeat,
      color: isSameToken
        ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60'
        : 'text-purple-400 bg-purple-950/40 border-purple-800/60',
    },
    {
      num: 3,
      title: 'Enso Check: Balance',
      action: 'Query Received Balance in Callback',
      detail: `Inspect token balance of ${collTokenSymbol} dynamically to feed next supply call`,
      icon: GitCommit,
      color: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
    },
    {
      num: 4,
      title: isMultiLoop ? `Aave V3: Supply Collateral (x${loops})` : 'Aave V3: Supply Collateral',
      action: `Deposit Collateral (LTV: ${ltv}%)`,
      detail: isMultiLoop
        ? `Deposits compounded collateral into Aave V3 across ${loops} iterations with zero upfront capital`
        : `Deposit ${isSameToken ? 'flashloaned funds' : 'output of swap'} into Aave V3 pool as collateral backing`,
      icon: Database,
      color: 'text-sky-400 bg-sky-950/40 border-sky-800/60',
    },
    {
      num: 5,
      title: isMultiLoop ? `Aave V3: Borrow (x${loops})` : 'Aave V3: Borrow',
      action: `Draw ${ltv}% Borrow Capital`,
      detail: isMultiLoop
        ? `Borrows ${ltv}% against deposited collateral at each step to fund recursive cycles and final repayment`
        : `Borrow ${calculated.borrow.toFixed(4)} ${flashTokenSymbol} (Repay debt: ${calculated.repay.toFixed(4)})`,
      icon: DollarSign,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
    },
    {
      num: 6,
      title: 'Uniswap V3: Repay Flashloan',
      action: 'Automatic Pool Settling',
      detail: `Pool claims ${calculated.repay.toFixed(4)} ${flashTokenSymbol} (Principal + Fee). All compounded collateral stays locked in Aave.`,
      icon: Check,
      color: 'text-purple-300 bg-purple-950/40 border-purple-800/60',
    },
  ];

  return (
    <div className="bg-[#12141f] border border-[#23273c] rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold text-white">
            Execution Pipeline &amp; Callback Flow
          </h2>
          {isMultiLoop && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 border border-purple-700 text-purple-300 font-mono font-bold">
              {loops} Folding Cycles Active
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">Atomic single-transaction bundle</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="bg-[#0b0c14] border border-[#21253a] rounded-lg p-3.5 flex flex-col justify-between space-y-2 relative group hover:border-purple-600/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <span className="w-5 h-5 rounded-full bg-[#181a28] border border-[#2f354f] text-[10px] font-mono font-bold flex items-center justify-center text-slate-300">
                  {step.num}
                </span>
                <span className={`p-1.5 rounded-md border ${step.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-white leading-tight">{step.title}</h3>
                <div className="text-[11px] text-purple-300 font-medium mt-0.5">{step.action}</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
