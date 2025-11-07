// vue_diff_explained.js
// Vue Diff 算法详解（包含 Vue 2 和 Vue 3 的对比）

console.log("=".repeat(60));
console.log("🎯 Vue Diff 算法核心概念");
console.log("=".repeat(60));

// ============================================
// 1. Vue 2 的 Diff 算法（双端对比）
// ============================================
console.log("\n📚 Vue 2 Diff 算法：双端对比\n");

class Vue2Diff {
  constructor() {
    this.operations = [];
  }
  
  // Vue 2 的核心 diff 算法
  updateChildren(oldChildren, newChildren) {
    console.log("Vue 2 双端对比算法：");
    console.log("旧列表:", oldChildren.map(c => c.key).join(', '));
    console.log("新列表:", newChildren.map(c => c.key).join(', '));
    console.log("\n执行过程：");
    
    let oldStartIdx = 0;
    let oldEndIdx = oldChildren.length - 1;
    let newStartIdx = 0;
    let newEndIdx = newChildren.length - 1;
    
    let oldStartVnode = oldChildren[oldStartIdx];
    let oldEndVnode = oldChildren[oldEndIdx];
    let newStartVnode = newChildren[newStartIdx];
    let newEndVnode = newChildren[newEndIdx];
    
    let step = 1;
    
    // 双端对比的核心循环
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      console.log(`\nStep ${step}:`);
      this.visualizePointers(
        oldChildren, newChildren,
        oldStartIdx, oldEndIdx,
        newStartIdx, newEndIdx
      );
      
      if (!oldStartVnode) {
        oldStartVnode = oldChildren[++oldStartIdx];
      } else if (!oldEndVnode) {
        oldEndVnode = oldChildren[--oldEndIdx];
      }
      // 情况1：头头比较
      else if (this.isSameVnode(oldStartVnode, newStartVnode)) {
        console.log(`✅ 头头匹配: ${oldStartVnode.key}`);
        this.patchVnode(oldStartVnode, newStartVnode);
        oldStartVnode = oldChildren[++oldStartIdx];
        newStartVnode = newChildren[++newStartIdx];
      }
      // 情况2：尾尾比较
      else if (this.isSameVnode(oldEndVnode, newEndVnode)) {
        console.log(`✅ 尾尾匹配: ${oldEndVnode.key}`);
        this.patchVnode(oldEndVnode, newEndVnode);
        oldEndVnode = oldChildren[--oldEndIdx];
        newEndVnode = newChildren[--newEndIdx];
      }
      // 情况3：头尾比较（旧头 vs 新尾）
      else if (this.isSameVnode(oldStartVnode, newEndVnode)) {
        console.log(`🔄 头尾匹配: ${oldStartVnode.key} 移到末尾`);
        this.patchVnode(oldStartVnode, newEndVnode);
        this.operations.push({ type: 'MOVE', node: oldStartVnode.key, to: 'end' });
        oldStartVnode = oldChildren[++oldStartIdx];
        newEndVnode = newChildren[--newEndIdx];
      }
      // 情况4：尾头比较（旧尾 vs 新头）
      else if (this.isSameVnode(oldEndVnode, newStartVnode)) {
        console.log(`🔄 尾头匹配: ${oldEndVnode.key} 移到开头`);
        this.patchVnode(oldEndVnode, newStartVnode);
        this.operations.push({ type: 'MOVE', node: oldEndVnode.key, to: 'start' });
        oldEndVnode = oldChildren[--oldEndIdx];
        newStartVnode = newChildren[++newStartIdx];
      }
      // 情况5：都不匹配，使用 key 查找
      else {
        console.log(`🔍 使用 key 查找 ${newStartVnode.key}`);
        const idxInOld = this.findIdxInOld(newStartVnode, oldChildren, oldStartIdx, oldEndIdx);
        if (idxInOld === -1) {
          console.log(`➕ 创建新节点: ${newStartVnode.key}`);
          this.operations.push({ type: 'CREATE', node: newStartVnode.key });
        } else {
          console.log(`🔄 移动节点: ${newStartVnode.key}`);
          this.operations.push({ type: 'MOVE', node: newStartVnode.key });
          oldChildren[idxInOld] = undefined;
        }
        newStartVnode = newChildren[++newStartIdx];
      }
      
      step++;
    }
    
    // 处理剩余节点
    if (oldStartIdx > oldEndIdx) {
      while (newStartIdx <= newEndIdx) {
        console.log(`➕ 添加剩余新节点: ${newChildren[newStartIdx].key}`);
        this.operations.push({ type: 'CREATE', node: newChildren[newStartIdx].key });
        newStartIdx++;
      }
    } else if (newStartIdx > newEndIdx) {
      while (oldStartIdx <= oldEndIdx) {
        if (oldChildren[oldStartIdx]) {
          console.log(`➖ 删除剩余旧节点: ${oldChildren[oldStartIdx].key}`);
          this.operations.push({ type: 'DELETE', node: oldChildren[oldStartIdx].key });
        }
        oldStartIdx++;
      }
    }
    
    return this.operations;
  }
  
  visualizePointers(oldChildren, newChildren, oldStart, oldEnd, newStart, newEnd) {
    // 可视化旧列表
    let oldStr = "旧: [";
    oldChildren.forEach((child, i) => {
      if (!child) {
        oldStr += "×";
      } else if (i === oldStart && i === oldEnd) {
        oldStr += `→${child.key}←`;
      } else if (i === oldStart) {
        oldStr += `→${child.key}`;
      } else if (i === oldEnd) {
        oldStr += `${child.key}←`;
      } else {
        oldStr += child.key;
      }
      if (i < oldChildren.length - 1) oldStr += ", ";
    });
    oldStr += "]";
    
    // 可视化新列表
    let newStr = "新: [";
    newChildren.forEach((child, i) => {
      if (i === newStart && i === newEnd) {
        newStr += `→${child.key}←`;
      } else if (i === newStart) {
        newStr += `→${child.key}`;
      } else if (i === newEnd) {
        newStr += `${child.key}←`;
      } else {
        newStr += child.key;
      }
      if (i < newChildren.length - 1) newStr += ", ";
    });
    newStr += "]";
    
    console.log(oldStr);
    console.log(newStr);
  }
  
  isSameVnode(a, b) {
    return a.key === b.key;
  }
  
  patchVnode(oldVnode, newVnode) {
    this.operations.push({ type: 'UPDATE', node: oldVnode.key });
  }
  
  findIdxInOld(vnode, oldChildren, start, end) {
    for (let i = start; i <= end; i++) {
      if (oldChildren[i] && this.isSameVnode(oldChildren[i], vnode)) {
        return i;
      }
    }
    return -1;
  }
}

// 测试 Vue 2 Diff
const vue2Diff = new Vue2Diff();
vue2Diff.updateChildren(
  [{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }],
  [{ key: 'D' }, { key: 'A' }, { key: 'B' }, { key: 'C' }]
);

console.log("\n操作统计：", vue2Diff.operations.length, "次操作");

// ============================================
// 2. Vue 3 的 Diff 算法（最长递增子序列）
// ============================================
console.log("\n" + "=".repeat(60));
console.log("📚 Vue 3 Diff 算法：最长递增子序列优化");
console.log("=".repeat(60) + "\n");

class Vue3Diff {
  constructor() {
    this.operations = [];
  }
  
  // Vue 3 的核心 diff 算法
  patchKeyedChildren(oldChildren, newChildren) {
    console.log("Vue 3 优化的 Diff 算法：");
    console.log("旧列表:", oldChildren.map(c => c.key).join(', '));
    console.log("新列表:", newChildren.map(c => c.key).join(', '));
    console.log("\n执行过程：");
    
    let i = 0;
    const l2 = newChildren.length;
    let e1 = oldChildren.length - 1;
    let e2 = l2 - 1;
    
    // 1. 处理相同的前缀
    console.log("\n1️⃣ 第一步：处理相同的前缀");
    while (i <= e1 && i <= e2) {
      const n1 = oldChildren[i];
      const n2 = newChildren[i];
      if (this.isSameVnode(n1, n2)) {
        console.log(`  ✅ 前缀匹配: ${n1.key}`);
        this.patch(n1, n2);
        i++;
      } else {
        break;
      }
    }
    
    // 2. 处理相同的后缀
    console.log("\n2️⃣ 第二步：处理相同的后缀");
    while (i <= e1 && i <= e2) {
      const n1 = oldChildren[e1];
      const n2 = newChildren[e2];
      if (this.isSameVnode(n1, n2)) {
        console.log(`  ✅ 后缀匹配: ${n1.key}`);
        this.patch(n1, n2);
        e1--;
        e2--;
      } else {
        break;
      }
    }
    
    // 3. 处理新增节点
    if (i > e1) {
      if (i <= e2) {
        console.log("\n3️⃣ 第三步：处理新增节点");
        while (i <= e2) {
          console.log(`  ➕ 新增: ${newChildren[i].key}`);
          this.operations.push({ type: 'CREATE', node: newChildren[i].key });
          i++;
        }
      }
    }
    // 4. 处理删除节点
    else if (i > e2) {
      console.log("\n4️⃣ 第四步：处理删除节点");
      while (i <= e1) {
        console.log(`  ➖ 删除: ${oldChildren[i].key}`);
        this.operations.push({ type: 'DELETE', node: oldChildren[i].key });
        i++;
      }
    }
    // 5. 处理中间部分（核心：使用最长递增子序列）
    else {
      console.log("\n5️⃣ 第五步：处理中间乱序部分（LIS优化）");
      const s1 = i;
      const s2 = i;
      
      // 5.1 创建新节点的 key -> index 映射
      const keyToNewIndexMap = new Map();
      for (i = s2; i <= e2; i++) {
        keyToNewIndexMap.set(newChildren[i].key, i);
      }
      console.log(`  创建 key 映射:`, [...keyToNewIndexMap.entries()]);
      
      // 5.2 遍历旧节点，填充 newIndexToOldIndexMap
      const toBePatched = e2 - s2 + 1;
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
      
      let moved = false;
      let maxNewIndexSoFar = 0;
      
      for (i = s1; i <= e1; i++) {
        const prevChild = oldChildren[i];
        const newIndex = keyToNewIndexMap.get(prevChild.key);
        
        if (newIndex === undefined) {
          console.log(`  ➖ 删除不存在的: ${prevChild.key}`);
          this.operations.push({ type: 'DELETE', node: prevChild.key });
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          
          this.patch(prevChild, newChildren[newIndex]);
        }
      }
      
      console.log(`  新旧索引映射:`, newIndexToOldIndexMap);
      console.log(`  是否需要移动:`, moved);
      
      // 5.3 移动和挂载新节点
      if (moved) {
        // 计算最长递增子序列
        const increasingNewIndexSequence = this.getSequence(newIndexToOldIndexMap);
        console.log(`  📈 最长递增子序列索引:`, increasingNewIndexSequence);
        
        // 反向遍历以便我们可以使用最后的节点作为锚点
        let j = increasingNewIndexSequence.length - 1;
        for (i = toBePatched - 1; i >= 0; i--) {
          const nextIndex = s2 + i;
          const nextChild = newChildren[nextIndex];
          
          if (newIndexToOldIndexMap[i] === 0) {
            // 新增的节点
            console.log(`  ➕ 挂载新节点: ${nextChild.key}`);
            this.operations.push({ type: 'CREATE', node: nextChild.key });
          } else if (j < 0 || i !== increasingNewIndexSequence[j]) {
            // 不在最长递增子序列中，需要移动
            console.log(`  🔄 移动节点: ${nextChild.key}`);
            this.operations.push({ type: 'MOVE', node: nextChild.key });
          } else {
            // 在最长递增子序列中，不需要移动
            console.log(`  ✅ 保持不动: ${nextChild.key}（在LIS中）`);
            j--;
          }
        }
      }
    }
    
    return this.operations;
  }
  
  isSameVnode(n1, n2) {
    return n1.key === n2.key;
  }
  
  patch(n1, n2) {
    // 更新节点
    this.operations.push({ type: 'PATCH', node: n1.key });
  }
  
  // 最长递增子序列算法（贪心 + 二分查找）
  getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    
    for (i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        j = result[result.length - 1];
        if (arr[j] < arrI) {
          p[i] = j;
          result.push(i);
          continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
          c = (u + v) >> 1;
          if (arr[result[c]] < arrI) {
            u = c + 1;
          } else {
            v = c;
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1];
          }
          result[u] = i;
        }
      }
    }
    
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p[v];
    }
    
    return result;
  }
}

// 测试 Vue 3 Diff
console.log("\n测试案例1：需要移动的情况");
const vue3Diff = new Vue3Diff();
vue3Diff.patchKeyedChildren(
  [{ key: 'A' }, { key: 'B' }, { key: 'C' }, { key: 'D' }, { key: 'E' }, { key: 'F' }],
  [{ key: 'A' }, { key: 'D' }, { key: 'B' }, { key: 'C' }, { key: 'F' }, { key: 'E' }]
);

console.log("\n操作统计：");
const stats = {};
vue3Diff.operations.forEach(op => {
  stats[op.type] = (stats[op.type] || 0) + 1;
});
Object.entries(stats).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}次`);
});

// ============================================
// 3. 对比总结
// ============================================
console.log("\n" + "=".repeat(60));
console.log("📊 Vue 2 vs Vue 3 Diff 算法对比");
console.log("=".repeat(60));

console.log(`
┌──────────────┬─────────────────────┬─────────────────────┐
│    特性      │      Vue 2          │      Vue 3          │
├──────────────┼─────────────────────┼─────────────────────┤
│ 核心算法     │ 双端对比            │ 快速路径 + LIS      │
│ 时间复杂度   │ O(n)                │ O(n log n)最坏情况  │
│ 优化策略     │ 4种快速路径         │ 5步优化流程         │
│ 移动优化     │ 无                  │ 最长递增子序列      │
│ 代码复杂度   │ 中等                │ 较高                │
│ 性能表现     │ 良好                │ 优秀                │
└──────────────┴─────────────────────┴─────────────────────┘
`);

console.log("关键优势对比：");
console.log("\nVue 2 双端对比：");
console.log("  ✅ 简单直观，容易理解");
console.log("  ✅ 对大部分场景都有效");
console.log("  ❌ 无法识别最优移动方案");

console.log("\nVue 3 LIS优化：");
console.log("  ✅ 最小化移动操作");
console.log("  ✅ 对复杂列表更高效");
console.log("  ✅ 渐进式优化（简单情况快速处理）");
console.log("  ❌ 算法复杂度较高");
