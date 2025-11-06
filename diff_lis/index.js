// diff_lis/index.js
// 运行方式：node index.js

/**
 * 教学导读：
 * 1. 列表 Diff 问题背景
 *    - 在前端框架（Vue/React/RSC 等）里，虚拟 DOM 列表的增删改几乎每天都会发生。
 *    - “key + Diff + 最长递增子序列(LIS)” 是主流框架用来避免全量重排的核心套路：
 *      · key 用来识别节点身份；
 *      · 双指针负责快速跳过头尾不变的部分；
 *      · 中间段通过索引映射 + LIS 计算找出“能够保持相对顺序”的节点，其余节点则移动或插入删除。
 * 2. 学习目标
 *    - 跟着 console 输出一路看下来，弄懂每一步为什么发生；
 *    - 搞清楚“保持”“删除”“插入”“移动”的判断依据；
 *    - 把这些步骤映射到真实项目中（例如 RSC 客户端补水、表格增删行、电力系统拓扑的节点同步）。
 * 3. 使用方法
 *    - `node index.js` 即可运行 3 组预置案例，建议逐个分析打印的信息；
 *    - 想用自己的数据做实验，可以在 demoCases 里追加新的 oldList/newList。
 */

// 主流程入口
function diffWithLIS(oldList, newList) {
  console.log("旧列表:", oldList);
  console.log("新列表:", newList, "\n");

  const headOps = [];
  const tailOps = [];
  const middleOps = [];

  let oldStart = 0;
  let newStart = 0;
  let oldEnd = oldList.length - 1;
  let newEnd = newList.length - 1;

  // 1. 双指针：跳过相同头部
  //   场景：例如页面顶部有固定导航栏，数据更新时往往保持不变；
  //   做法：使用两个指针从头往后走，只要 key 一致就直接标记为“保留”，复杂度 O(k)。
  while (
    oldStart <= oldEnd &&
    newStart <= newEnd &&
    oldList[oldStart] === newList[newStart]
  ) {
    headOps.push(`保留头部节点 ${oldList[oldStart]}`);
    oldStart++;
    newStart++;
  }

  // 2. 双指针：跳过相同尾部
  //   场景：尾部常见的是页脚、底部工具栏等，也可以快速跳过；
  //   注意：只有在双指针未交叉时才能继续，否则说明头尾全部对齐、无需后续步骤。
  while (
    oldStart <= oldEnd &&
    newStart <= newEnd &&
    oldList[oldEnd] === newList[newEnd]
  ) {
    tailOps.push(`保留尾部节点 ${oldList[oldEnd]}`);
    oldEnd--;
    newEnd--;
  }

  // 截取剩余区段，后续只处理中间需要重排的部分。
  // 这一步直观地把问题规模由 n 缩小到 m（中间段长度），后续复杂度都围绕这个 m 展开。
  const oldMiddle = oldList.slice(oldStart, oldEnd + 1);
  const newMiddle = newList.slice(newStart, newEnd + 1);

  console.log("需要处理的旧区段:", oldMiddle);
  console.log("需要处理的新区段:", newMiddle, "\n");

  // 3. 构建旧节点索引表（便于按 key 查找）
  //    作用：O(1) 查找旧节点在 oldMiddle 中的索引，为 LIS 做准备。
  const oldIndexMap = new Map();
  oldMiddle.forEach((key, index) => oldIndexMap.set(key, index));

  // 记录新节点对应的旧位置，用于后面的 LIS
  const positionSequence = [];
  const sequenceToNewIndex = [];

  newMiddle.forEach((key, index) => {
    if (oldIndexMap.has(key)) {
      const oldIndex = oldIndexMap.get(key);
      positionSequence.push(oldIndex);
      sequenceToNewIndex.push(index);
    } else {
      middleOps.push(`插入新节点 ${key}（新索引 ${newStart + index}）`);
    }
  });

  // 4. 找出旧区段里需要删除的节点
  //    实际含义：新列表里不存在的 key 直接删掉，避免无意义的移动。
  const newKeySet = new Set(newMiddle);
  oldMiddle.forEach((key, index) => {
    if (!newKeySet.has(key)) {
      middleOps.push(`删除旧节点 ${key}（旧索引 ${oldStart + index}）`);
    }
  });

  // 5. 对可复用节点的旧索引序列求 LIS，确定哪些节点可以保持相对顺序。
  //    直觉：LIS 找到的是“已经按相对顺序排列”的最长子序列，我们无需移动它们；
  //    非 LIS 的节点则需要通过“移动”指令调整到新位置。
  const lisEntryIndices = calcLISEntryIndices(positionSequence);
  const stableNewIndices = new Set(lisEntryIndices.map((seqIndex) => sequenceToNewIndex[seqIndex]));

  newMiddle.forEach((key, newIndex) => {
    if (oldIndexMap.has(key)) {
      if (stableNewIndices.has(newIndex)) {
        middleOps.push(`保持节点 ${key} 的相对位置`);
      } else {
        middleOps.push(`移动节点 ${key} 到新位置 ${newStart + newIndex}`);
      }
    }
  });

  let counter = 1;
  if (headOps.length) {
    console.log("第一阶段：头部快速对齐");
    headOps.forEach((item) => console.log(`${counter++}. ${item}`));
  }

  if (middleOps.length) {
    console.log(headOps.length ? "\n第二阶段：处理中间差异" : "第一阶段：处理中间差异");
    middleOps.forEach((item) => console.log(`${counter++}. ${item}`));
  }

  if (tailOps.length) {
    console.log("\n最终阶段：尾部快速对齐");
    tailOps.forEach((item) => console.log(`${counter++}. ${item}`));
  }
}

/**
 * 计算最长递增子序列对应的新数组下标。
 * @param {number[]} sequence - 旧索引序列（只包含可复用节点）。
 * @returns {number[]} 返回值是 sequence 中元素的下标集合。
 */
function calcLISEntryIndices(sequence) {
  const n = sequence.length;
  if (n === 0) return [];

  // predecessors 用于回溯路径；tails 记录当前长度的最优结尾索引
  const predecessors = new Array(n).fill(-1);
  const tails = [];
  const tailsIndex = [];

  for (let i = 0; i < n; i++) {
    const value = sequence[i];
    let left = 0;
    let right = tails.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (sequence[tails[mid]] < value) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    if (left === tails.length) {
      tails.push(i);
    } else {
      tails[left] = i;
    }

    tailsIndex[left] = i;
    if (left > 0) {
      predecessors[i] = tails[left - 1];
    }
  }

  // 回溯得到 LIS 对应的下标
  const lisIndices = [];
  let k = tails[tails.length - 1];
  while (k >= 0) {
    lisIndices.push(k);
    k = predecessors[k];
  }

  lisIndices.reverse();
  return lisIndices;
}

// 实际运行并输出多个案例，便于对比体会。
// 解析建议：
//  · 案例 1 —— 用于熟悉“只有头尾改变”的最小差异情形，观察双指针如何直接跳过。
//  · 案例 2 —— 同时包含新增/删除/移动，类似实时数据面板中更新图表条目的场景。
//  · 案例 3 —— 强化对 LIS 的理解，看看哪些节点被判定为稳定顺序，哪些需要移动。
if (require.main === module) {
  const demoCases = [
    {
      title: "案例 1：只有头尾一致，中间简单换位",
      oldList: ["A", "B", "C", "D"],
      newList: ["A", "C", "B", "D"],
    },
    {
      title: "案例 2：新增元素与位置调整并存",
      oldList: ["A", "B", "C", "D", "E"],
      newList: ["B", "E", "A", "D", "F", "C"],
    },
    {
      title: "案例 3：删除旧节点，保留部分顺序",
      oldList: ["A", "B", "C", "D"],
      newList: ["D", "A", "B"],
    },
  ];

  demoCases.forEach((demo, index) => {
    console.log("======================================");
    console.log(`${index + 1}. ${demo.title}`);
    diffWithLIS(demo.oldList, demo.newList);
    console.log("\n");
  });
}

module.exports = { diffWithLIS, calcLISEntryIndices };
