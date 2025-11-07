// vue3_lis_simple.js
// Vue 3 最长递增子序列算法 - 简化版理解

console.log("=".repeat(60));
console.log("🎯 Vue 3 LIS 算法简化版");
console.log("=".repeat(60));

// ============================================
// 1. 最简单的 LIS 理解
// ============================================
console.log("\n📚 第一步：理解最长递增子序列\n");

function simpleLIS(arr) {
  console.log("输入数组:", arr);
  
  // 动态规划解法（易理解但效率较低 O(n²)）
  const n = arr.length;
  const dp = new Array(n).fill(1);  // dp[i] 表示以 arr[i] 结尾的 LIS 长度
  const path = new Array(n).fill(-1);  // 记录路径
  
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        path[i] = j;
      }
    }
  }
  
  // 找到最长的长度和结束位置
  let maxLen = 0;
  let maxIdx = 0;
  for (let i = 0; i < n; i++) {
    if (dp[i] > maxLen) {
      maxLen = dp[i];
      maxIdx = i;
    }
  }
  
  // 回溯路径
  const result = [];
  let idx = maxIdx;
  while (idx !== -1) {
    result.unshift(arr[idx]);
    idx = path[idx];
  }
  
  console.log("LIS 长度:", maxLen);
  console.log("LIS 序列:", result);
  return result;
}

simpleLIS([3, 1, 4, 2, 5]);
console.log("");
simpleLIS([10, 9, 2, 5, 3, 7, 101, 18]);

// ============================================
// 2. Vue 3 的优化版 LIS（贪心 + 二分）
// ============================================
console.log("\n" + "=".repeat(60));
console.log("📚 第二步：Vue 3 的优化 LIS 算法");
console.log("=".repeat(60) + "\n");

function vue3LIS(arr) {
  console.log("输入数组:", arr);
  
  const p = arr.slice();  // 存储前驱节点
  const result = [0];     // 存储 LIS 的索引
  
  for (let i = 0; i < arr.length; i++) {
    const arrI = arr[i];
    
    // 跳过0（Vue中0表示新增节点）
    if (arrI === 0) continue;
    
    const j = result[result.length - 1];
    
    // 如果当前值大于 LIS 末尾值，直接追加
    if (arr[j] < arrI) {
      p[i] = j;  // 记录前驱
      result.push(i);
      continue;
    }
    
    // 二分查找：找到第一个大于等于 arrI 的位置
    let left = 0;
    let right = result.length - 1;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (arr[result[mid]] < arrI) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    // 替换
    if (arrI < arr[result[left]]) {
      if (left > 0) {
        p[i] = result[left - 1];
      }
      result[left] = i;
    }
  }
  
  // 回溯正确的 LIS
  let len = result.length;
  let last = result[len - 1];
  while (len-- > 0) {
    result[len] = last;
    last = p[last];
  }
  
  console.log("LIS 索引:", result);
  console.log("LIS 值:", result.map(i => arr[i]));
  return result;
}

vue3LIS([3, 1, 4, 2, 5]);
console.log("");
vue3LIS([10, 9, 2, 5, 3, 7, 101, 18]);

// ============================================
// 3. 在 Diff 中的实际应用
// ============================================
console.log("\n" + "=".repeat(60));
console.log("📚 第三步：LIS 在 Vue Diff 中的应用");
console.log("=".repeat(60) + "\n");

function diffWithLIS(oldChildren, newChildren) {
  console.log("场景：列表重新排序");
  console.log("旧列表:", oldChildren.map(c => c.key));
  console.log("新列表:", newChildren.map(c => c.key));
  
  // 构建 key -> 新索引 的映射
  const keyToNewIndexMap = new Map();
  newChildren.forEach((child, index) => {
    keyToNewIndexMap.set(child.key, index);
  });
  
  // 构建 新索引 -> 旧索引 的映射
  const newIndexToOldIndexMap = [];
  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    const oldIndex = oldChildren.findIndex(c => c.key === newChild.key);
    newIndexToOldIndexMap.push(oldIndex === -1 ? 0 : oldIndex + 1);
  }
  
  console.log("\n映射关系（新索引 -> 旧索引+1）:", newIndexToOldIndexMap);
  console.log("注：0 表示新增节点，非0表示在旧列表中的位置+1\n");
  
  // 计算 LIS
  const lis = vue3LIS(newIndexToOldIndexMap);
  console.log("\nLIS 分析：");
  console.log("LIS 索引:", lis);
  console.log("对应的节点:", lis.map(i => newChildren[i].key));
  
  // 应用 LIS 优化移动
  console.log("\n移动策略：");
  const lisSet = new Set(lis);
  const moves = [];
  
  for (let i = newChildren.length - 1; i >= 0; i--) {
    if (newIndexToOldIndexMap[i] === 0) {
      moves.push(`➕ 插入 ${newChildren[i].key}`);
    } else if (!lisSet.has(i)) {
      moves.push(`🔄 移动 ${newChildren[i].key}`);
    } else {
      moves.push(`✅ 保持 ${newChildren[i].key}（在 LIS 中）`);
    }
  }
  
  console.log(moves.reverse().join('\n'));
  
  // 统计
  const moveCount = moves.filter(m => m.includes('🔄')).length;
  const keepCount = moves.filter(m => m.includes('✅')).length;
  console.log(`\n优化效果：${oldChildren.length}个节点，只需移动${moveCount}个，${keepCount}个不动`);
}

// 测试案例1：简单重排
console.log("测试1：简单重排");
diffWithLIS(
  [{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }],
  [{ key: 'D' }, { key: 'A' }, { key: 'B' }, { key: 'C' }]
);

console.log("\n" + "=".repeat(60));
console.log("测试2：复杂场景");
diffWithLIS(
  [{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }, { key: 'E' }],
  [{ key: 'E' }, { key: 'C' }, { key: 'F' }, { key: 'A' }, { key: 'D' }]
);

// ============================================
// 4. 性能对比
// ============================================
console.log("\n" + "=".repeat(60));
console.log("📊 性能对比：有无 LIS 优化");
console.log("=".repeat(60) + "\n");

function comparePerformance() {
  const oldList = Array.from({ length: 10 }, (_, i) => ({ key: String(i) }));
  const newList = [...oldList].reverse();  // 完全反转
  
  console.log("场景：10个元素完全反转");
  console.log("旧: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]");
  console.log("新: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]\n");
  
  console.log("❌ 没有优化：");
  console.log("   需要移动所有10个元素");
  console.log("   DOM操作：10次移动\n");
  
  console.log("✅ 使用 LIS 优化：");
  console.log("   LIS = [] (空，因为完全反转没有递增序列)");
  console.log("   还是需要移动所有元素");
  console.log("   但是：移动顺序被优化，减少了临时变量\n");
  
  console.log("更实际的场景：部分乱序");
  const partialShuffle = [
    { key: '0' }, { key: '3' }, { key: '1' }, 
    { key: '2' }, { key: '5' }, { key: '4' },
    { key: '6' }, { key: '8' }, { key: '7' }, { key: '9' }
  ];
  
  console.log("新: [0, 3, 1, 2, 5, 4, 6, 8, 7, 9]");
  console.log("LIS: [0, 1, 2, 4, 6, 7, 9]");
  console.log("只需移动: 3, 5, 8 (3个元素)");
  console.log("优化率: 70% 的元素不需要移动！");
}

comparePerformance();

// ============================================
// 总结
// ============================================
console.log("\n" + "=".repeat(60));
console.log("🎓 总结：Vue 3 LIS 优化的精髓");
console.log("=".repeat(60));

console.log(`
1. LIS 的作用
   - 找出不需要移动的最长序列
   - 最小化 DOM 移动操作
   - 保持相对顺序的节点不动

2. 算法复杂度
   - 朴素 DP：O(n²)
   - 贪心+二分：O(n log n)
   - 空间：O(n)

3. 实际效果
   - 顺序不变：0次移动
   - 部分乱序：大幅减少移动
   - 完全反转：优化移动顺序

4. 什么时候最有效
   - 列表排序
   - 过滤后恢复
   - 拖拽排序
   - 分页切换

5. Vue 3 的完整优化策略
   Step 1: 处理相同前缀（跳过）
   Step 2: 处理相同后缀（跳过）
   Step 3: 处理纯新增
   Step 4: 处理纯删除
   Step 5: 处理乱序（LIS优化）

记住：LIS 让 Vue 3 的 Diff 不仅正确，而且高效！
`);
