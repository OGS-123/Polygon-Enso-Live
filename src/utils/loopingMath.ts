/**
 * Looping & Recursive Leverage Mathematics Engine
 * Calculates recursive collateral growth, leverage multiplier, total debt compounding,
 * collateral doubling thresholds, and net equity difference for Aave / DeFi looping.
 */

export interface LoopIteration {
  loopNumber: number;
  depositAmount: number;
  borrowAmount: number;
  cumulativeDeposit: number;
  cumulativeBorrow: number;
  multiplier: number;
  netEquity: number;
  netLtv: number;
}

export interface LoopingDynamics {
  loops: number;
  flashAmount: number;
  ltv: number;
  feeTier: number;
  collateralMultiplier: number;
  isDoubled: boolean;
  doublingPercentage: number;
  maxTheoreticalMultiplier: number;
  multiplierProgressPercent: number;
  totalCollateral: number;
  totalBorrowDebt: number;
  flashloanRepayDebt: number;
  totalAllDebt: number;
  difference: number;
  netEquity: number;
  effectiveLtv: number;
  liquidationThreshold: number;
  liquidationBuffer: number;
  healthFactor: number;
  netEquityPercentage: number;
  iterations: LoopIteration[];
}

export function calculateLoopingDynamics(
  flashAmount: number,
  ltvPercent: number,
  loopsCount: number,
  feeTierRate: number = 0.0005,
  liquidationThresholdPercent: number = 82.5
): LoopingDynamics {
  const f = Math.max(0, flashAmount || 0);
  const r = Math.max(0, Math.min(0.95, (ltvPercent || 0) / 100));
  const n = Math.max(1, Math.min(10, Math.round(loopsCount || 1)));
  const fee = Math.max(0, feeTierRate || 0);
  const liqThresh = Math.max(0.5, Math.min(0.99, liquidationThresholdPercent / 100));

  const iterations: LoopIteration[] = [];
  let currentDeposit = f;
  let cumDeposit = 0;
  let cumBorrow = 0;

  for (let k = 1; k <= n; k++) {
    const borrowForStep = currentDeposit * r;
    cumDeposit += currentDeposit;
    cumBorrow += borrowForStep;

    const stepMultiplier = f > 0 ? cumDeposit / f : 1;
    const stepEquity = cumDeposit - cumBorrow;
    const stepLtv = cumDeposit > 0 ? (cumBorrow / cumDeposit) * 100 : r * 100;

    iterations.push({
      loopNumber: k,
      depositAmount: parseFloat(currentDeposit.toFixed(6)),
      borrowAmount: parseFloat(borrowForStep.toFixed(6)),
      cumulativeDeposit: parseFloat(cumDeposit.toFixed(6)),
      cumulativeBorrow: parseFloat(cumBorrow.toFixed(6)),
      multiplier: parseFloat(stepMultiplier.toFixed(4)),
      netEquity: parseFloat(stepEquity.toFixed(6)),
      netLtv: parseFloat(stepLtv.toFixed(2)),
    });

    // In recursive looping, the borrowed asset from cycle k becomes the collateral deposit in cycle k+1
    currentDeposit = borrowForStep;
  }

  // Multiplier formula: (1 - r^n) / (1 - r) when r < 1
  const collateralMultiplier = f > 0 ? cumDeposit / f : 1;
  const maxTheoreticalMultiplier = r < 1 ? 1 / (1 - r) : 10;
  const isDoubled = collateralMultiplier >= 2.0;
  const doublingPercentage = Math.round((collateralMultiplier / 2.0) * 100);
  const multiplierProgressPercent = Math.min(
    100,
    Math.round((collateralMultiplier / maxTheoreticalMultiplier) * 100)
  );

  const totalCollateral = parseFloat(cumDeposit.toFixed(6));
  const totalBorrowDebt = parseFloat(cumBorrow.toFixed(6));
  const flashloanRepayDebt = parseFloat((f * (1 + fee)).toFixed(6));
  const totalAllDebt = parseFloat((totalBorrowDebt + flashloanRepayDebt).toFixed(6));
  const difference = parseFloat((totalCollateral - totalBorrowDebt).toFixed(6));
  const netEquity = difference;
  const effectiveLtv = totalCollateral > 0 ? (totalBorrowDebt / totalCollateral) * 100 : 0;
  const liquidationBuffer = parseFloat((totalCollateral * liqThresh - totalBorrowDebt).toFixed(6));
  const healthFactor =
    totalBorrowDebt > 0 ? parseFloat(((totalCollateral * liqThresh) / totalBorrowDebt).toFixed(3)) : 999;
  const netEquityPercentage = totalCollateral > 0 ? (netEquity / totalCollateral) * 100 : 0;

  return {
    loops: n,
    flashAmount: f,
    ltv: ltvPercent,
    feeTier: fee,
    collateralMultiplier: parseFloat(collateralMultiplier.toFixed(4)),
    isDoubled,
    doublingPercentage,
    maxTheoreticalMultiplier: parseFloat(maxTheoreticalMultiplier.toFixed(4)),
    multiplierProgressPercent,
    totalCollateral,
    totalBorrowDebt,
    flashloanRepayDebt,
    totalAllDebt,
    difference,
    netEquity,
    effectiveLtv: parseFloat(effectiveLtv.toFixed(2)),
    liquidationThreshold: liquidationThresholdPercent,
    liquidationBuffer,
    healthFactor,
    netEquityPercentage: parseFloat(netEquityPercentage.toFixed(2)),
    iterations,
  };
}
