// complexity_explained.js
// 时间复杂度直观理解：O(n) vs O(n log n)

console.log("=".repeat(60));
console.log("📊 时间复杂度直观对比：O(n) vs O(n log n)");
console.log("=".repeat(60));

// ============================================
// 1. O(n) - 线性时间
// ============================================
console.log("\n1️⃣ O(n) - 线性时间（一次遍历）\n");

/**
 * Linear example: find the maximum value in an array
 * @param {array} arr The input array
 * @example
 * linearExample([1, 2, 3, 4, 5]);
 * @returns {undefined}
 */
function linearExample(arr) {
  console.log("任务：找出数组中的最大值");
  console.log("输入:", arr);
  
  let max = arr[0];
  let steps = 0;
  
  for (let i = 0; i < arr.length; i++) {
    steps++;
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  
  console.log("最大值:", max);
  console.log("遍历次数:", steps);
  console.log("复杂度: O(n) - 遍历一次，执行 n 步\n");
}

linearExample([3, 7, 2, 9, 1, 5]);

// ============================================
// 2. O(log n) - 对数时间
// ============================================
console.log("=".repeat(60));
console.log("2️⃣ O(log n) - 对数时间（二分查找）\n");

function binarySearchExample(arr, target) {
  console.log("任务：在有序数组中查找目标值");
  console.log("输入:", arr);
  console.log("目标:", target);
  
  let left = 0;
  let right = arr.length - 1;
  let steps = 0;
  
  while (left <= right) {
    steps++;
    const mid = Math.floor((left + right) / 2);
    console.log(`  步骤${steps}: 检查位置 ${mid}，值 ${arr[mid]}`);
    
    if (arr[mid] === target) {
      console.log(`找到了！位置: ${mid}`);
      console.log(`遍历次数: ${steps}`);
      console.log(`复杂度: O(log n) - 每次减半，只需 log₂(${arr.length}) ≈ ${Math.ceil(Math.log2(arr.length))} 步\n`);
      return mid;
    }
    
    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  console.log("未找到");
  return -1;
}

binarySearchExample([1, 2, 3, 5, 7, 9, 11, 15, 20, 25, 30, 35, 40, 45, 50], 35);

// ============================================
// 3. O(n log n) - 线性对数时间
// ============================================
console.log("=".repeat(60));
console.log("3️⃣ O(n log n) - 线性对数时间（归并排序）\n");

function mergeSortExample(arr) {
  console.log("任务：对数组进行排序");
  console.log("输入:", arr);
  
  let steps = 0;
  
  function mergeSort(array) {
    if (array.length <= 1) return array;
    
    const mid = Math.floor(array.length / 2);
    const left = mergeSort(array.slice(0, mid));
    const right = mergeSort(array.slice(mid));
    
    return merge(left, right);
  }
  
  function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    
    // 每次合并都要遍历所有元素 - 这是 O(n)
    while (i < left.length && j < right.length) {
      steps++;
      if (left[i] < right[j]) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
    }
    
    while (i < left.length) {
      steps++;
      result.push(left[i++]);
    }
    while (j < right.length) {
      steps++;
      result.push(right[j++]);
    }
    
    return result;
  }
  
  const sorted = mergeSort(arr);
  const n = arr.length;
  const logN = Math.ceil(Math.log2(n));
  
  console.log("排序后:", sorted);
  console.log(`操作次数: ${steps}`);
  console.log(`数组长度 n = ${n}`);
  console.log(`分治层数 log₂(n) ≈ ${logN}`);
  console.log(`理论操作: n × log n ≈ ${n} × ${logN} = ${n * logN}`);
  console.log(`实际操作: ${steps} (接近理论值)\n`);
}

mergeSortExample([5, 2, 8, 1, 9, 3, 7, 4]);

// ============================================
// 4. 可视化对比
// ============================================
console.log("=".repeat(60));
console.log("4️⃣ 直观对比：不同输入规模下的操作次数");
console.log("=".repeat(60) + "\n");

function compareComplexity() {
  const sizes = [10, 100, 1000, 10000];
  
  console.log("┌────────┬──────────┬──────────┬──────────┬──────────┐");
  console.log("│  n     │  O(1)    │  O(log n)│  O(n)    │ O(n logn)│");
  console.log("├────────┼──────────┼──────────┼──────────┼──────────┤");
  
  sizes.forEach(n => {
    const o1 = 1;
    const oLogN = Math.ceil(Math.log2(n));
    const oN = n;
    const oNLogN = n * Math.ceil(Math.log2(n));
    
    console.log(`│ ${n.toString().padEnd(6)} │ ${o1.toString().padEnd(8)} │ ${oLogN.toString().padEnd(8)} │ ${oN.toString().padEnd(8)} │ ${oNLogN.toString().padEnd(8)} │`);
  });
  
  console.log("└────────┴──────────┴──────────┴──────────┴──────────┘");
  
  console.log("\n观察：");
  console.log("• O(1): 常数时间，不随输入变化");
  console.log("• O(log n): 增长很慢（10→100，只从 4 变到 7）");
  console.log("• O(n): 线性增长（输入翻10倍，操作翻10倍）");
  console.log("• O(n log n): 比线性慢，但不算慢");
  console.log("  （1000 vs 10000: 10倍输入，只需约13倍操作）");
}

compareComplexity();

// ============================================
// 5. log n 的直观理解
// ============================================
console.log("\n" + "=".repeat(60));
console.log("5️⃣ log n 的直观理解：对半分需要多少次？");
console.log("=".repeat(60) + "\n");

function visualizeLogN() {
  const examples = [
    { n: 8, divisions: [] },
    { n: 16, divisions: [] },
    { n: 1000, divisions: [] },
    { n: 1000000, divisions: [] }
  ];
  
  examples.forEach(example => {
    let current = example.n;
    let steps = 0;
    
    console.log(`n = ${example.n}:`);
    while (current > 1) {
      steps++;
      example.divisions.push(current);
      console.log(`  第${steps}次对半: ${current} → ${Math.floor(current / 2)}`);
      current = Math.floor(current / 2);
    }
    
    const actualLogN = Math.log2(example.n);
    console.log(`  需要 ${steps} 次对半`);
    console.log(`  log₂(${example.n}) = ${actualLogN.toFixed(2)}\n`);
  });
  
  console.log("结论：log n 表示\"需要对半多少次才能变成1\"");
}

visualizeLogN();

// ============================================
// 6. Vue 3 LIS 算法中的 O(n log n)
// ============================================
console.log("=".repeat(60));
console.log("6️⃣ Vue 3 LIS 算法：为什么是 O(n log n)？");
console.log("=".repeat(60) + "\n");

function explainVueLIS() {
  console.log("Vue 3 的 LIS 算法结构：\n");
  
  console.log("for (let i = 0; i < n; i++) {           // ← 外层循环 O(n)");
  console.log("  // 二分查找插入位置");
  console.log("  let left = 0;");
  console.log("  let right = result.length - 1;");
  console.log("  while (left < right) {                // ← 内层循环 O(log n)");
  console.log("    const mid = (left + right) >> 1;");
  console.log("    if (arr[result[mid]] < arr[i]) {");
  console.log("      left = mid + 1;");
  console.log("    } else {");
  console.log("      right = mid;");
  console.log("    }");
  console.log("  }");
  console.log("}\n");
  
  console.log("分析：");
  console.log("• 外层循环：遍历所有元素 = n 次");
  console.log("• 内层循环：二分查找位置 = log n 次");
  console.log("• 总复杂度：n × log n = O(n log n)\n");
  
  console.log("为什么用二分查找？");
  console.log("• 需要在有序数组中找插入位置");
  console.log("• 线性查找是 O(n)，总复杂度会变成 O(n²)");
  console.log("• 二分查找是 O(log n)，总复杂度是 O(n log n)");
  console.log("• 这是最优解！\n");
}

explainVueLIS();

// ============================================
// 7. 实际性能对比
// ============================================
console.log("=".repeat(60));
console.log("7️⃣ 实际测试：不同复杂度的运行时间");
console.log("=".repeat(60) + "\n");

function performanceTest() {
  const sizes = [100, 1000, 10000];
  
  console.log("测试环境：处理数组元素\n");
  
  sizes.forEach(n => {
    const arr = Array.from({ length: n }, (_, i) => i);
    
    // O(n) 操作
    const start1 = Date.now();
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    const time1 = Date.now() - start1;
    
    // O(n log n) 操作（排序）
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    const start2 = Date.now();
    shuffled.sort((a, b) => a - b);
    const time2 = Date.now() - start2;
    
    console.log(`n = ${n}:`);
    console.log(`  O(n) 遍历求和:     ${time1}ms`);
    console.log(`  O(n log n) 排序:   ${time2}ms`);
    console.log(`  速度比: ${time2 === 0 ? '太快了' : `${(time2 / Math.max(time1, 0.01)).toFixed(1)}x 慢`}\n`);
  });
  
  console.log("结论：");
  console.log("• O(n log n) 确实比 O(n) 慢");
  console.log("• 但比 O(n²) 快得多");
  console.log("• 对于排序、LIS 等问题，O(n log n) 是实用的最优解");
}

performanceTest();

// ============================================
// 8. 常见算法的时间复杂度
// ============================================
console.log("\n" + "=".repeat(60));
console.log("8️⃣ 常见算法复杂度速查表");
console.log("=".repeat(60) + "\n");

const algorithms = [
  { name: "访问数组元素", complexity: "O(1)", example: "arr[5]" },
  { name: "二分查找", complexity: "O(log n)", example: "在有序数组中查找" },
  { name: "线性查找", complexity: "O(n)", example: "遍历数组找最大值" },
  { name: "归并排序", complexity: "O(n log n)", example: "Vue 3 LIS 算法" },
  { name: "快速排序（平均）", complexity: "O(n log n)", example: "JavaScript sort()" },
  { name: "冒泡排序", complexity: "O(n²)", example: "双重循环比较" },
  { name: "LCS 动态规划", complexity: "O(n×m)", example: "字符串编辑距离" },
  { name: "递归斐波那契", complexity: "O(2ⁿ)", example: "指数级，非常慢！" }
];

console.log("算法名称                时间复杂度      示例");
console.log("─".repeat(60));
algorithms.forEach(algo => {
  console.log(`${algo.name.padEnd(20)} ${algo.complexity.padEnd(15)} ${algo.example}`);
});

console.log("\n性能排序（从快到慢）：");
console.log("O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)");

// ============================================
// 总结
// ============================================
console.log("\n" + "=".repeat(60));
console.log("🎓 核心总结");
console.log("=".repeat(60));

console.log(`
一句话记忆：

• O(n)：遍历一次数组
  例：找最大值、累加求和

• O(log n)：每次减半搜索范围
  例：二分查找

• O(n log n)：遍历数组 × 每次做二分操作
  例：归并排序、Vue 3 LIS

形象比喻：

• O(n)：点名，每个人点一次 (n个人)
• O(log n)：猜数字游戏，每次缩小一半范围 (log n 次)
• O(n log n)：给每个人分配座位，每次用二分法找位置
  (n个人 × 每人 log n 次)

在前端框架中：

• Hydration：O(n) - 线性遍历绑定事件
• Vue 2 Diff：O(n) - 双端对比
• Vue 3 LIS：O(n log n) - 贪心 + 二分查找

O(n log n) 虽然比 O(n) 慢，但：
✅ 对于需要排序的问题，这已经是理论最优解
✅ 增长速度可控，不会突然爆炸
✅ Vue 3 用它换来了更少的 DOM 移动操作
`);
