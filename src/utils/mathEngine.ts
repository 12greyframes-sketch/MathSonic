import { Topic, MathQuestion } from '../types';

/**
 * Returns a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Helper to shuffle an array
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Finds the Greatest Common Divisor
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Generates distractors (realistic wrong answers)
 */
function generateDistractors(correctVal: number, scale: number = 10, offsetRange: number = 5): number[] {
  const wrongSet = new Set<number>();
  
  // Try classic calculation mistake offsets
  const offsets = [
    -1, 1, -2, 2, -5, 5, -10, 10, -20, 20
  ];
  
  for (const offset of offsets) {
    const val = correctVal + offset;
    if (val !== correctVal && val > 0) {
      wrongSet.add(val);
    }
  }

  // Generate random adjustments in range
  while (wrongSet.size < 5) {
    const delta = randomInt(-Math.max(scale, 2), Math.max(scale, 2));
    const val = correctVal + delta;
    if (val !== correctVal && val > 0) {
      wrongSet.add(val);
    }
  }

  return Array.from(wrongSet);
}

/**
 * Main module generator
 */
export function generateQuestion(topic: Topic, round: number): MathQuestion {
  const id = `${topic}-${round}-${Date.now()}-${randomInt(1000, 9999)}`;
  let text = '';
  let subText: string | undefined = undefined;
  let correctAnswer = '';
  const wrongAnswers: string[] = [];
  let hint = '';

  const diffMultiplier = Math.min(round, 10); // cap scaling calculations
  
  switch (topic) {
    case 'addition': {
      if (diffMultiplier === 1) {
        // Round 1: Simple single-digit or double-digit up to 20
        const lhs = randomInt(2, 20);
        const rhs = randomInt(2, 20);
        const ans = lhs + rhs;
        text = `${lhs} + ${rhs}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 5);
        wrongAnswers.push(...wrongNums.map(String));
        hint = `Add the ones column first, then the tens!`;
      } else if (diffMultiplier === 2) {
        // Round 2: Double digits up to 70
        const lhs = randomInt(11, 60);
        const rhs = randomInt(11, 60);
        const ans = lhs + rhs;
        text = `${lhs} + ${rhs}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 10);
        wrongAnswers.push(...wrongNums.map(String));
        hint = `Break it down: add ${lhs} + ${rhs - (rhs % 10)} first!`;
      } else if (diffMultiplier === 3) {
        // Round 3: Triple-digits adding double digit
        const lhs = randomInt(100, 300);
        const rhs = randomInt(20, 99);
        const ans = lhs + rhs;
        text = `${lhs} + ${rhs}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 15);
        wrongAnswers.push(...wrongNums.map(String));
        hint = `Think of it as ${lhs} + ${(rhs - (rhs % 10))} + ${rhs % 10}`;
      } else if (diffMultiplier === 4) {
        // Round 4: Double triple-digits
        const lhs = randomInt(100, 499);
        const rhs = randomInt(100, 499);
        const ans = lhs + rhs;
        text = `${lhs} + ${rhs}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 30);
        wrongAnswers.push(...wrongNums.map(String));
        hint = `Try adding hundreds first: ${Math.floor(lhs/100)*100} + ${Math.floor(rhs/100)*100}`;
      } else {
        // Round 5+: Addition with Decimals or larger values
        const isDecimal = Math.random() > 0.4;
        if (isDecimal) {
          const lhs = randomInt(10, 99) + (randomInt(1, 9) / 10);
          const rhs = randomInt(10, 99) + (randomInt(1, 9) / 10);
          const ans = parseFloat((lhs + rhs).toFixed(1));
          text = `${lhs} + ${rhs}`;
          correctAnswer = String(ans);
          
          wrongAnswers.push(
            String(parseFloat((ans + 1).toFixed(1))),
            String(parseFloat((ans - 1).toFixed(1))),
            String(parseFloat((ans + 0.5).toFixed(1))),
            String(parseFloat((ans - 0.2).toFixed(1))),
            String(parseFloat((ans + 10).toFixed(1)))
          );
          hint = `Align the decimal points carefully!`;
        } else {
          const lhs = randomInt(400, 1500);
          const rhs = randomInt(400, 1500);
          const ans = lhs + rhs;
          text = `${lhs} + ${rhs}`;
          correctAnswer = String(ans);
          
          const wrongNums = generateDistractors(ans, 50);
          wrongAnswers.push(...wrongNums.map(String));
          hint = `Combine the thousands and hundreds separately!`;
        }
      }
      break;
    }

    case 'subtraction': {
      if (diffMultiplier === 1) {
        // Simple positive subtraction
        const lhs = randomInt(10, 30);
        const rhs = randomInt(2, lhs - 1);
        const ans = lhs - rhs;
        text = `${lhs} - ${rhs}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 5);
        wrongAnswers.push(...wrongNums.map(String));
        hint = `Count backward from ${lhs} by ${rhs}!`;
      } else if (diffMultiplier === 2) {
        // Up to 100
        const lhs = randomInt(40, 99);
        const rhs = randomInt(10, lhs - 5);
        const ans = lhs - rhs;
        text = `${lhs} - ${rhs}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 10);
        wrongAnswers.push(...wrongNums.map(String));
        hint = `Take away ${rhs - (rhs % 10)} first, then subtract the units!`;
      } else if (diffMultiplier === 3) {
        // Over 100 with borrowing
        const lhs = randomInt(120, 299);
        const rhs = randomInt(30, 119);
        const ans = lhs - rhs;
        text = `${lhs} - ${rhs}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 15);
        wrongAnswers.push(...wrongNums.map(String));
        hint = `Borrow 10 or 100 if the right digit is larger than the left!`;
      } else if (diffMultiplier === 4) {
        // Hundreds-level subtraction
        const lhs = randomInt(400, 999);
        const rhs = randomInt(100, lhs - 50);
        const ans = lhs - rhs;
        text = `${lhs} - ${rhs}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 20);
        wrongAnswers.push(...wrongNums.map(String));
        hint = `Subtract from left-to-right to keep it simple!`;
      } else {
        // Negative result or Decimals
        const letsGoNegative = Math.random() > 0.5;
        if (letsGoNegative) {
          const lhs = randomInt(20, 100);
          const rhs = randomInt(110, 200);
          const ans = lhs - rhs;
          text = `${lhs} - ${rhs}`;
          correctAnswer = String(ans);
          
          wrongAnswers.push(
            String(ans - 10),
            String(ans + 10),
            String(-ans), // absolute swap mistaken sign
            String(ans - 1),
            String(ans + 5)
          );
          hint = `The result will be negative! Subtract ${lhs} from ${rhs} and append '-'.`;
        } else {
          // Decimals
          const lhs = randomInt(20, 99) + 0.5;
          const rhs = randomInt(5, 19) + 0.5;
          const ans = lhs - rhs;
          text = `${lhs} - ${rhs}`;
          correctAnswer = String(ans);
          
          wrongAnswers.push(
            String(ans - 1),
            String(ans + 1),
            String(ans + 5),
            String(ans - 0.5),
            String(ans - 10)
          );
          hint = `Subtract fractional parts (.5 - .5) first!`;
        }
      }
      break;
    }

    case 'percentages': {
      if (diffMultiplier === 1) {
        // Round 1: 10% or 50% or 100% of simple tens multiples
        const pArray = [10, 50, 100];
        const pct = pArray[randomInt(0, pArray.length - 1)];
        const base = randomInt(1, 10) * 10;
        const ans = (pct / 100) * base;
        text = `${pct}% of ${base}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 4);
        wrongAnswers.push(...wrongNums.map(String));
        hint = pct === 10 ? `Move the decimal point 1 place to the left!` : `Divide by 2 to get 50%!`;
      } else if (diffMultiplier === 2) {
        // Round 2: 25%, 50%, 75% of multiples of 4 or 10
        const pArray = [25, 50, 75];
        const pct = pArray[randomInt(0, pArray.length - 1)];
        const base = randomInt(1, 10) * 20; // guarantees divisor compatibility
        const ans = (pct / 100) * base;
        text = `${pct}% of ${base}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 5);
        wrongAnswers.push(...wrongNums.map(String));
        hint = pct === 25 ? `Divide the value by 4` : pct === 75 ? `Find 25% first, then multiply that by 3!` : `Half it!`;
      } else if (diffMultiplier === 3) {
        // Round 3: 5%, 15%, 20%, 30%, 40% of standard multiples
        const pArray = [5, 15, 20, 30, 40, 60];
        const pct = pArray[randomInt(0, pArray.length - 1)];
        const base = randomInt(1, 15) * 20;
        const ans = (pct / 100) * base;
        text = `${pct}% of ${base}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 8);
        wrongAnswers.push(...wrongNums.map(String));
        hint = `Find 10% first (which is ${base / 10}), then scale appropriately!`;
      } else if (diffMultiplier === 4) {
        // Round 4: Harder percents
        const pct = randomInt(1, 9) * 5; // 5, 15, 25, 35, 45, etc.
        const base = randomInt(3, 10) * 50; // 150, 200, 250...
        const ans = (pct / 100) * base;
        text = `${pct}% of ${base}`;
        correctAnswer = String(ans);
        
        const wrongNums = generateDistractors(ans, 10);
        wrongAnswers.push(...wrongNums.map(String));
        hint = `Try calculating: (${pct} × ${base}) / 100!`;
      } else {
        // Round 5+: Complex calculations, e.g. 17% of 400 or percentages of decimal amounts
        const isHardPCT = Math.random() > 0.4;
        if (isHardPCT) {
          const pct = randomInt(11, 29); // e.g. 17%
          const base = randomInt(1, 10) * 100; // e.g. 400
          const ans = (pct / 100) * base;
          text = `${pct}% of ${base}`;
          correctAnswer = String(ans);
          
          const wrongNums = generateDistractors(ans, 10);
          wrongAnswers.push(...wrongNums.map(String));
          hint = `Since it is of ${base}, just multiply ${pct} by ${base/100}!`;
        } else {
          // percentage exceeding 100
          const pct = 150;
          const base = randomInt(4, 30) * 10;
          const ans = (pct / 100) * base;
          text = `${pct}% of ${base}`;
          correctAnswer = String(ans);
          
          const wrongNums = generateDistractors(ans, 15);
          wrongAnswers.push(...wrongNums.map(String));
          hint = `Take ${base} (which is 100%) and add half of ${base} (which is 50%)!`;
        }
      }
      break;
    }

    case 'ratio': {
      if (diffMultiplier === 1) {
        // Round 1: Simplify simple ratio
        // We pick a simplified ratio, scale it up, then ask them to simplify it.
        const ratios = [[1, 2], [1, 3], [2, 3], [1, 4]];
        const [a, b] = ratios[randomInt(0, ratios.length - 1)];
        const factor = randomInt(2, 6);
        const lhs = a * factor;
        const rhs = b * factor;
        
        text = `Simplify ratio ${lhs}:${rhs}`;
        correctAnswer = `${a}:${b}`;
        
        wrongAnswers.push(
          `${a}:${b + 1}`,
          `${a + 1}:${b}`,
          `1:${factor}`,
          `${b}:${a}`, // reverse
          `${a * 2}:${b * 2}`
        );
        hint = `Find the highest common factor of ${lhs} and ${rhs} (it is ${factor}) and divide both by it!`;
      } else if (diffMultiplier === 2) {
        // Round 2: Simple sharing or evaluation
        // "If A:B = 2:3 and B = 12, what is A?"
        const ratios = [[1, 2], [1, 3], [2, 3], [3, 4], [2, 5]];
        const [a, b] = ratios[randomInt(0, ratios.length - 1)];
        const factor = randomInt(2, 6);
        const bVal = b * factor;
        const aVal = a * factor;
        
        text = `If A:B is ${a}:${b}`;
        subText = `and B = ${bVal}, what is A?`;
        correctAnswer = String(aVal);
        
        const wrongNums = generateDistractors(aVal, 4);
        wrongAnswers.push(...wrongNums.map(String));
        hint = `If ${b} units represent ${bVal}, then 1 unit is ${bVal / b}. Multiply this by ${a}!`;
      } else if (diffMultiplier === 3) {
        // Round 3: Divide money/quantities and find one share
        // "Divide $40 in ratio 1:3. What is the larger share?"
        const r1 = randomInt(1, 3);
        const r2 = r1 + randomInt(1, 2);
        const factor = randomInt(4, 12) * 5; // e.g. 25, 30...
        const sum = (r1 + r2) * factor;
        const largerShare = Math.max(r1, r2) * factor;
        
        text = `Divide ${sum} in ratio ${r1}:${r2}`;
        subText = `What is the larger share?`;
        correctAnswer = String(largerShare);
        
        const wrongNums = generateDistractors(largerShare, 15);
        wrongAnswers.push(...wrongNums.map(String), String(sum - largerShare)); // add smaller share as distractor!
        hint = `Add ratio parts: ${r1} + ${r2} = ${r1 + r2}. Divide ${sum} by ${r1 + r2} to get one share!`;
      } else if (diffMultiplier === 4) {
        // Round 4: Find total given one share
        // "The ratio of blue to red pencils is 3:5. There are 15 blue. Total pencils?"
        const r1 = 3;
        const r2 = 5;
        const factor = randomInt(3, 8);
        const redNum = r2 * factor;
        const blueNum = r1 * factor;
        const totalNum = redNum + blueNum;
        
        text = `Blue to Red ratio is ${r1}:${r2}`;
        subText = `There are ${blueNum} blue pencils. Total pencils?`;
        correctAnswer = String(totalNum);
        
        const wrongNums = generateDistractors(totalNum, 10);
        wrongAnswers.push(...wrongNums.map(String), String(blueNum), String(redNum));
        hint = `If ${r1} parts = ${blueNum}, then 1 part = ${blueNum / r1}. Total parts are ${r1 + r2} = ${r1 + r2}.`;
      } else {
        // Round 5+: Triple ratios or complex simplify
        // Simplify triple ratio e.g. 6:12:18
        const a = randomInt(1, 3);
        const b = a + randomInt(1, 2);
        const c = b + randomInt(1, 3);
        const factor = randomInt(3, 7);
        const valA = a * factor;
        const valB = b * factor;
        const valC = c * factor;
        
        text = `Simplify ratio ${valA}:${valB}:${valC}`;
        correctAnswer = `${a}:${b}:${c}`;
        
        wrongAnswers.push(
          `${a}:${b + 1}:${c}`,
          `${a}:${b}:${c + 1}`,
          `${valA}:${valB}:${valC}`,
          `${c}:${b}:${a}`,
          `${a + 1}:${b + 1}:${c + 1}`
        );
        hint = `Find a single common divisor for all three: ${valA}, ${valB}, and ${valC}. It is ${factor}!`;
      }
      break;
    }

    case 'squares_cubes_roots': {
      const type = randomInt(1, 3); // 1: Square/Cube, 2: Root, 3: Mixed
      
      if (diffMultiplier === 1) {
        if (type === 1) {
          // Standard square 2 to 10
          const n = randomInt(2, 10);
          const ans = n * n;
          text = `${n}²`;
          correctAnswer = String(ans);
          
          const wrongNums = generateDistractors(ans, 6);
          wrongAnswers.push(...wrongNums.map(String), String(n * 2)); // include double to catch multiplication confusion!
          hint = `${n}² means ${n} multiplied by itself, ${n} × ${n}!`;
        } else {
          // Root of perfect square up to 100
          const n = randomInt(2, 10);
          const base = n * n;
          text = `√${base}`;
          correctAnswer = String(n);
          
          const wrongNums = generateDistractors(n, 2);
          wrongAnswers.push(...wrongNums.map(String));
          hint = `What number multiplied by itself gives ${base}?`;
        }
      } else if (diffMultiplier === 2) {
        // Cubes up to 5 and squares up to 15
        const isCube = Math.random() > 0.5;
        if (isCube) {
          const n = randomInt(2, 5);
          const ans = n * n * n;
          text = `${n}³`;
          correctAnswer = String(ans);
          
          const wrongNums = generateDistractors(ans, 10);
          wrongAnswers.push(...wrongNums.map(String), String(n * n)); // factor error
          hint = `${n}³ is ${n} × ${n} × ${n}. Calculate ${n}² first, then multiply by ${n}!`;
        } else {
          const n = randomInt(11, 15);
          const ans = n * n;
          text = `${n}²`;
          correctAnswer = String(ans);
          
          const wrongNums = generateDistractors(ans, 15);
          wrongAnswers.push(...wrongNums.map(String));
          hint = `${n} × ${n} equals...`;
        }
      } else if (diffMultiplier === 3) {
        // Perfect square roots over 100 or Cube roots
        const isCubeRoot = Math.random() > 0.5;
        if (isCubeRoot) {
          const n = randomInt(2, 6);
          const base = n * n * n;
          text = `³√${base}`; // cube root format
          correctAnswer = String(n);
          
          const wrongNums = generateDistractors(n, 2);
          wrongAnswers.push(...wrongNums.map(String));
          hint = `What number multiplied by itself twice (x × x × x) gives ${base}?`;
        } else {
          const n = randomInt(11, 20);
          const base = n * n;
          text = `√${base}`;
          correctAnswer = String(n);
          
          const wrongNums = generateDistractors(n, 4);
          wrongAnswers.push(...wrongNums.map(String));
          hint = `Remember that 10 × 10 = 100, and 20 × 20 = 400!`;
        }
      } else if (diffMultiplier === 4) {
        // Squares up to 25 and Cubes up to 10
        const isCube = Math.random() > 0.4;
        if (isCube) {
          const n = randomInt(5, 10);
          const ans = n * n * n;
          text = `${n}³`;
          correctAnswer = String(ans);
          
          const wrongNums = generateDistractors(ans, 30);
          wrongAnswers.push(...wrongNums.map(String));
          hint = `Multiply ${n}² (which is ${n*n}) by ${n}!`;
        } else {
          const n = randomInt(16, 25);
          const ans = n * n;
          text = `${n}²`;
          correctAnswer = String(ans);
          
          const wrongNums = generateDistractors(ans, 30);
          wrongAnswers.push(...wrongNums.map(String));
          hint = `Break it down: ${n} × 10 + ${n} × ${n - 10}`;
        }
      } else {
        // Round 5+: Roots + operations, negative exponent powers, or large squares
        const complexMathType = randomInt(1, 3);
        if (complexMathType === 1) {
          // Combined calculations: e.g. √100 + 4²
          const rootVal = randomInt(4, 12);
          const sqVal = randomInt(3, 8);
          const ans = rootVal + (sqVal * sqVal);
          
          text = `√${rootVal * rootVal} + ${sqVal}²`;
          correctAnswer = String(ans);
          
          const wrongNums = generateDistractors(ans, 15);
          wrongAnswers.push(...wrongNums.map(String));
          hint = `Compute each part first: √${rootVal * rootVal} = ${rootVal} and ${sqVal}² = ${sqVal * sqVal}. Then sum them up!`;
        } else if (complexMathType === 2) {
          // Cubes/Squares root equations: e.g. ³√125 + √64
          const cVal = randomInt(3, 5);
          const sVal = randomInt(6, 10);
          const ans = cVal * sVal;
          text = `³√${cVal * cVal * cVal} × √${sVal * sVal}`;
          correctAnswer = String(ans);
          
          const wrongNums = generateDistractors(ans, 10);
          wrongAnswers.push(...wrongNums.map(String));
          hint = `Evaluate the cube root (${cVal}) and the square root (${sVal}) first, then multiply!`;
        } else {
          // Double cubes or large squares: e.g. 1.2²
          const ans = 1.44;
          text = `(1.2)²`;
          correctAnswer = "1.44";
          wrongAnswers.push("14.4", "12.4", "1.22", "1.4", "2.44");
          hint = `Think of it as 12² / 100!`;
        }
      }
      break;
    }
  }

  // Final filtering of duplicates, mapping, and random assortment of 4 options
  const uniqueWrong = Array.from(new Set(wrongAnswers.filter(w => w !== correctAnswer)));
  const finalChoices = shuffleArray([
    correctAnswer,
    ...uniqueWrong.slice(0, 3)
  ]);

  // Fallback to populate options if shuffle list fails safety lengths
  while (finalChoices.length < 4) {
    const val = String(randomInt(2, 100));
    if (!finalChoices.includes(val)) {
      finalChoices.push(val);
    }
  }

  return {
    id,
    text,
    subText,
    topic,
    correctAnswer,
    choices: shuffleArray(finalChoices),
    hint
  };
}
