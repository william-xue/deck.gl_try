// hydration_pointer_core.js
// 双指针 Hydration 算法的精简核心实现

// ============================================
// 核心双指针算法
// ============================================
function hydrateTwoPointer(serverNodes, clientNodes) {
  let serverPtr = 0;  // 服务端指针
  let clientPtr = 0;  // 客户端指针
  const operations = [];
  
  console.log("\n🎯 双指针 Hydration 算法执行过程：\n");
  console.log("初始状态：");
  console.log(`Server: ${JSON.stringify(serverNodes)}`);
  console.log(`Client: ${JSON.stringify(clientNodes)}\n`);
  
  // 双指针主循环
  while (serverPtr < serverNodes.length || clientPtr < clientNodes.length) {
    const serverNode = serverNodes[serverPtr];
    const clientNode = clientNodes[clientPtr];
    
    // 可视化当前状态
    visualizeState(serverNodes, clientNodes, serverPtr, clientPtr);
    
    // 核心判断逻辑
    if (!serverNode && clientNode) {
      // 情况1：服务端已遍历完，客户端还有节点
      console.log(`➕ 操作：创建节点 '${clientNode}'`);
      operations.push({ type: 'CREATE', node: clientNode });
      clientPtr++;
      
    } else if (serverNode && !clientNode) {
      // 情况2：客户端已遍历完，服务端还有节点
      console.log(`➖ 操作：删除节点 '${serverNode}'`);
      operations.push({ type: 'DELETE', node: serverNode });
      serverPtr++;
      
    } else if (serverNode === clientNode) {
      // 情况3：节点匹配，复用并绑定事件
      console.log(`✅ 操作：复用节点 '${serverNode}' + 绑定事件`);
      operations.push({ type: 'HYDRATE', node: serverNode });
      serverPtr++;
      clientPtr++;
      
    } else {
      // 情况4：节点不匹配
      // 这里简化处理：向前查看是否能找到匹配
      const serverHasMatch = clientNodes.slice(clientPtr + 1).includes(serverNode);
      const clientHasMatch = serverNodes.slice(serverPtr + 1).includes(clientNode);
      
      if (clientHasMatch && !serverHasMatch) {
        // 客户端节点在服务端后面能找到，说明当前服务端节点是多余的
        console.log(`➖ 操作：删除不匹配节点 '${serverNode}'`);
        operations.push({ type: 'DELETE', node: serverNode });
        serverPtr++;
      } else if (serverHasMatch && !clientHasMatch) {
        // 服务端节点在客户端后面能找到，说明需要先插入客户端节点
        console.log(`➕ 操作：插入新节点 '${clientNode}'`);
        operations.push({ type: 'CREATE', node: clientNode });
        clientPtr++;
      } else {
        // 都找不到或都能找到，替换处理
        console.log(`🔄 操作：替换 '${serverNode}' → '${clientNode}'`);
        operations.push({ type: 'REPLACE', oldNode: serverNode, newNode: clientNode });
        serverPtr++;
        clientPtr++;
      }
    }
    
    console.log("");  // 空行分隔每步
  }
  
  // 打印统计
  printStatistics(operations);
  return operations;
}

// 可视化当前指针位置
function visualizeState(serverNodes, clientNodes, sPtr, cPtr) {
  let serverStr = "Server: [";
  let clientStr = "Client: [";
  let pointerStr = "        ";
  
  // 构建服务端可视化
  serverNodes.forEach((node, i) => {
    if (i === sPtr) {
      serverStr += `→${node}←`;
      pointerStr += " ".repeat(node.length + 2) + "↑";
    } else {
      serverStr += node;
      pointerStr += " ".repeat(node.length);
    }
    if (i < serverNodes.length - 1) {
      serverStr += ", ";
      pointerStr += "  ";
    }
  });
  serverStr += "]";
  
  // 构建客户端可视化
  clientNodes.forEach((node, i) => {
    if (i === cPtr) {
      clientStr += `→${node}←`;
    } else {
      clientStr += node;
    }
    if (i < clientNodes.length - 1) clientStr += ", ";
  });
  clientStr += "]";
  
  console.log(serverStr);
  console.log(clientStr);
  console.log(pointerStr);
}

// 打印操作统计
function printStatistics(operations) {
  console.log("=".repeat(50));
  console.log("📊 操作统计：\n");
  
  const stats = {};
  operations.forEach(op => {
    stats[op.type] = (stats[op.type] || 0) + 1;
  });
  
  const icons = {
    'HYDRATE': '✅ 复用+绑定',
    'CREATE': '➕ 创建',
    'DELETE': '➖ 删除',
    'REPLACE': '🔄 替换'
  };
  
  Object.entries(stats).forEach(([type, count]) => {
    console.log(`  ${icons[type]}: ${count} 次`);
  });
  
  console.log(`\n  总操作数: ${operations.length}`);
  console.log(`  DOM 修改数: ${operations.filter(op => op.type !== 'HYDRATE').length}`);
  console.log(`  复用率: ${Math.round((stats.HYDRATE || 0) / operations.length * 100)}%`);
}

// ============================================
// 测试用例
// ============================================

console.log("=".repeat(50));
console.log("测试 1：完全匹配（最理想情况）");
console.log("=".repeat(50));
hydrateTwoPointer(
  ['div', 'h1', 'p', 'button'],
  ['div', 'h1', 'p', 'button']
);

console.log("\n" + "=".repeat(50));
console.log("测试 2：客户端多了节点");
console.log("=".repeat(50));
hydrateTwoPointer(
  ['div', 'h1', 'p'],
  ['div', 'h1', 'span', 'p', 'button']
);

console.log("\n" + "=".repeat(50));
console.log("测试 3：服务端多了节点");
console.log("=".repeat(50));
hydrateTwoPointer(
  ['div', 'h1', 'span', 'p', 'footer'],
  ['div', 'h1', 'p']
);

console.log("\n" + "=".repeat(50));
console.log("测试 4：顺序不同（模拟小的不一致）");
console.log("=".repeat(50));
hydrateTwoPointer(
  ['h1', 'div', 'p', 'span'],
  ['h1', 'p', 'div', 'span']
);

// ============================================
// 复杂度分析
// ============================================
console.log("\n" + "=".repeat(50));
console.log("🔬 算法复杂度分析");
console.log("=".repeat(50));

console.log(`
时间复杂度：O(n + m)
  - n = 服务端节点数
  - m = 客户端节点数
  - 每个节点最多访问一次

空间复杂度：O(1)
  - 只需要两个指针变量
  - 不需要额外的数据结构

为什么高效？
  1. 线性扫描：每个节点只访问一次
  2. 原地操作：直接在已有 DOM 上操作
  3. 局部性好：按顺序处理，缓存友好
  4. 简单判断：大部分情况只需要相等性判断
`);

// ============================================
// 对比 Diff 算法
// ============================================
console.log("=".repeat(50));
console.log("⚔️  对比：如果用 Diff 算法处理同样的问题");
console.log("=".repeat(50));

function diffAlgorithmComparison() {
  const oldNodes = ['A', 'B', 'C', 'D'];
  const newNodes = ['A', 'C', 'E', 'B', 'D'];
  
  console.log("场景：用户操作导致的列表变化");
  console.log(`旧列表: ${JSON.stringify(oldNodes)}`);
  console.log(`新列表: ${JSON.stringify(newNodes)}\n`);
  
  console.log("Diff 算法需要：");
  console.log("1. 构建 key→index 映射表");
  console.log("   Map { A:0, B:1, C:2, D:3 }");
  console.log("2. 识别移动的节点");
  console.log("   - B: 位置 1 → 3");
  console.log("   - D: 位置 3 → 4");
  console.log("3. 识别新增的节点");
  console.log("   - E: 插入到位置 2");
  console.log("4. 计算最小操作序列（可能用 LIS 优化）");
  console.log("5. 执行 DOM 操作\n");
  
  console.log("复杂度：O(n) 但常数因子大，需要额外空间\n");
  
  console.log("而 Hydration：");
  console.log("- 不存在这个问题！因为用户还没机会操作");
  console.log("- 服务端和客户端顺序基本一致");
  console.log("- 简单的双指针就够了");
}

diffAlgorithmComparison();

// ============================================
// 真实场景模拟
// ============================================
console.log("\n" + "=".repeat(50));
console.log("🌟 真实场景：电商网站商品列表");
console.log("=".repeat(50));

function realWorldExample() {
  // 模拟服务端渲染的商品列表
  const serverProducts = [
    'product-header',
    'product-1',
    'product-2',
    'product-3',
    'loading-spinner'  // 服务端可能有加载提示
  ];
  
  // 客户端代码执行时的期望
  const clientProducts = [
    'product-header',
    'product-1',
    'product-2',
    'product-3',
    'product-4',  // 客户端可能获取到了新商品
    'product-5'
    // 没有 loading-spinner，因为数据已加载
  ];
  
  console.log("场景说明：");
  console.log("- 服务端渲染了3个商品和一个加载提示");
  console.log("- 客户端获取到了5个商品，不需要加载提示\n");
  
  hydrateTwoPointer(serverProducts, clientProducts);
  
  console.log("\n结论：");
  console.log("✅ 前3个商品直接复用（只需绑定点击事件）");
  console.log("✅ 新商品通过简单的追加操作添加");
  console.log("✅ 加载提示被移除");
  console.log("✅ 整个过程线性完成，没有复杂的计算");
}

realWorldExample();

console.log("\n" + "=".repeat(50));
console.log("🎓 总结");
console.log("=".repeat(50));

console.log(`
双指针 Hydration 算法的优雅之处：

1. 简单直观
   - 两个指针，一次遍历
   - 代码量少，易于理解

2. 高效执行
   - O(n) 时间，O(1) 空间
   - 没有额外的数据结构开销

3. 符合实际场景
   - SSR 场景下结构高度一致
   - 差异通常很小或没有

4. 易于优化
   - 可以批量处理相同节点
   - 可以预测常见模式

这就是为什么 React/Vue 在 Hydration 时
不需要复杂的 Diff 算法！
`);
