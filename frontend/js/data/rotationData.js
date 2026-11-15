// Adapt actual algorithm strategies; never fabricate gains, risk scores or dates.
export function normalizeRotationStrategies(strategies) {
  if (!Array.isArray(strategies)) return [];
  return strategies.map(strategy => ({
    ...strategy,
    title: Array.isArray(strategy.cropNames) ? strategy.cropNames.join(' → ') : '',
    sequence: Array.isArray(strategy.cropNames) ? strategy.cropNames : [],
    score: typeof strategy.indicativeSuitabilityIndex0to100 === 'number'
      ? strategy.indicativeSuitabilityIndex0to100 : null
  }));
}
