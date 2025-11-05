// diff_lis/index.js
// 运行方式：node index.js

/**
 * 这个脚本演示 Vue/React 在列表更新时常用的 "双指针 + key + 最长递增子序列" 思路。
 * 我们对两组 key 列表做对比，输出每一步操作，帮助你体会算法流程。
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
  while (
    oldStart <= oldEnd &&
    newStart <= newEnd &&
    oldList[oldEnd] === newList[newEnd]
  ) {
    tailOps.push(`保留尾部节点 ${oldList[oldEnd]}`);
    oldEnd--;
    newEnd--;
  }

  // 截取剩余区段，后续只处理中间需要重排的部分
  const oldMiddle = oldList.slice(oldStart, oldEnd + 1);
  const newMiddle = newList.slice(newStart, newEnd + 1);

  console.log("需要处理的旧区段:", oldMiddle);
  console.log("需要处理的新区段:", newMiddle, "\n");

  // 3. 构建旧节点索引表（便于按 key 查找）
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
  const newKeySet = new Set(newMiddle);
  oldMiddle.forEach((key, index) => {
    if (!newKeySet.has(key)) {
      middleOps.push(`删除旧节点 ${key}（旧索引 ${oldStart + index}）`);
    }
  });

  // 5. 对可复用节点的旧索引序列求 LIS，确定哪些节点可以保持相对顺序
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

// 实际运行并输出多个案例，便于对比体会
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
