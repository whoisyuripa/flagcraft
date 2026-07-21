function shuffleWith(array, random) {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/**
 * Builds a 20-question correct-answer position plan.
 * Every slot appears 4–6 times, but the exact totals vary by run so
 * players cannot infer the final answers by counting positions.
 */
export function createBalancedAnswerPlan(random = Math.random) {
  const patterns = [
    [6, 5, 5, 4],
    [6, 6, 4, 4],
  ];
  const basePattern = patterns[Math.floor(random() * patterns.length)] || patterns[0];
  const countsByPosition = shuffleWith(basePattern, random);
  const plan = [];
  countsByPosition.forEach((count, position) => {
    for (let index = 0; index < count; index += 1) plan.push(position);
  });
  return shuffleWith(plan, random);
}

/**
 * Removes and returns the next position. When possible, it avoids using
 * the same correct-answer position for the same question in consecutive runs
 * without changing the run-wide 4–6 distribution.
 */
export function takeBalancedAnswerPosition(plan, previousPosition = null) {
  if (!Array.isArray(plan) || plan.length === 0) return null;
  if (Number.isInteger(previousPosition) && plan[0] === previousPosition) {
    const swapIndex = plan.findIndex((position) => position !== previousPosition);
    if (swapIndex > 0) [plan[0], plan[swapIndex]] = [plan[swapIndex], plan[0]];
  }
  return plan.shift();
}
