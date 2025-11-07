// hydration_visual.js
// 可视化展示 Hydration 的双指针算法

console.log("\n🎯 Hydration 双指针算法可视化\n");

// 模拟服务端DOM和客户端VDOM
const serverDOM = ['A', 'B', 'C', 'D', 'E'];
const clientVDOM = ['A', 'B', 'C', 'D', 'E'];

function visualizeHydration() {
  console.log("初始状态：");
  console.log("Server: [A] [B] [C] [D] [E]");
  console.log("Client: [A] [B] [C] [D] [E]");
  console.log("         ↑");
  console.log("         双指针都在索引0\n");
  
  let serverIndex = 0;
  let clientIndex = 0;
  let step = 1;
  
  while (serverIndex < serverDOM.length && clientIndex < clientVDOM.length) {
    const serverNode = serverDOM[serverIndex];
    const clientNode = clientVDOM[clientIndex];
    
    console.log(`Step ${step}:`);
    
    // 可视化当前指针位置
    let serverStr = "Server: ";
    let clientStr = "Client: ";
    let pointerStr = "        ";
    
    for (let i = 0; i < serverDOM.length; i++) {
      if (i === serverIndex) {
        serverStr += `[${serverDOM[i]}] `;
        pointerStr += " ↑  ";
      } else {
        serverStr += ` ${serverDOM[i]}  `;
        pointerStr += "    ";
      }
    }
    
    for (let i = 0; i < clientVDOM.length; i++) {
      if (i === clientIndex) {
        clientStr += `[${clientVDOM[i]}] `;
      } else {
        clientStr += ` ${clientVDOM[i]}  `;
      }
    }
    
    console.log(serverStr);
    console.log(clientStr);
    console.log(pointerStr);
    
    if (serverNode === clientNode) {
      console.log(`✅ 匹配成功: ${serverNode} === ${clientNode}`);
      console.log(`   动作: 绑定事件到 ${serverNode}`);
      serverIndex++;
      clientIndex++;
    }
    
    console.log("");
    step++;
  }
  
  console.log("✨ 水合完成！所有节点都已绑定事件\n");
}

console.log("=".repeat(50));
console.log("场景1: 完全匹配（最常见情况）");
console.log("=".repeat(50));
visualizeHydration();

// 展示有差异的情况
console.log("=".repeat(50));
console.log("场景2: 有差异的情况");
console.log("=".repeat(50));

function visualizeHydrationWithDiff() {
  const serverDOM2 = ['A', 'B', 'C', 'D'];
  const clientVDOM2 = ['A', 'B', 'X', 'C', 'D'];  // 客户端多了X
  
  console.log("初始状态：");
  console.log("Server: [A] [B] [C] [D]");
  console.log("Client: [A] [B] [X] [C] [D]");
  console.log("注意：客户端多了一个 X\n");
  
  let sIdx = 0, cIdx = 0;
  let operations = [];
  
  // 简化的对比逻辑
  while (sIdx < serverDOM2.length || cIdx < clientVDOM2.length) {
    const s = serverDOM2[sIdx];
    const c = clientVDOM2[cIdx];
    
    if (s === c) {
      operations.push(`✅ 匹配 ${s} - 绑定事件`);
      sIdx++;
      cIdx++;
    } else if (!s) {
      operations.push(`➕ 创建新节点 ${c}`);
      cIdx++;
    } else if (!c) {
      operations.push(`➖ 删除多余节点 ${s}`);
      sIdx++;
    } else {
      // 尝试向前看
      if (serverDOM2[sIdx + 1] === c) {
        operations.push(`➖ 删除不匹配的 ${s}`);
        sIdx++;
      } else if (clientVDOM2[cIdx + 1] === s) {
        operations.push(`➕ 插入新节点 ${c}`);
        cIdx++;
      } else {
        operations.push(`🔄 替换 ${s} 为 ${c}`);
        sIdx++;
        cIdx++;
      }
    }
  }
  
  console.log("执行步骤：");
  operations.forEach((op, i) => {
    console.log(`  ${i + 1}. ${op}`);
  });
}

visualizeHydrationWithDiff();

// 对比 Diff 算法的复杂性
console.log("\n" + "=".repeat(50));
console.log("对比：如果这是 Diff 算法");
console.log("=".repeat(50));

function showDiffComplexity() {
  console.log("\n❌ Diff算法面临的挑战：\n");
  
  console.log("场景：用户操作后的列表变化");
  console.log("旧: [A] [B] [C] [D] [E]");
  console.log("新: [D] [B] [E] [A] [C]\n");
  
  console.log("Diff算法需要决定：");
  console.log("1. 是移动D到最前？");
  console.log("2. 还是删除A,B,C然后重新插入？");
  console.log("3. 如何判断D是同一个节点（需要key）？");
  console.log("4. 如何找到最优的DOM操作序列？\n");
  
  console.log("可能的操作序列：");
  console.log("方案1（低效）：");
  console.log("  - 删除A,B,C,D,E");
  console.log("  - 创建D,B,E,A,C");
  console.log("  总共10次DOM操作 ❌\n");
  
  console.log("方案2（优化后）：");
  console.log("  - 移动D到位置0");
  console.log("  - 移动E到位置2");
  console.log("  - 移动A到位置3");
  console.log("  总共3次DOM操作 ✅\n");
  
  console.log("这就是为什么Diff算法复杂！");
}

showDiffComplexity();

// 总结
console.log("\n" + "=".repeat(50));
console.log("🎓 核心区别总结");
console.log("=".repeat(50));

console.log(`
Hydration（简单）：
┌────────────────────────────┐
│  我知道服务端和客户端      │
│  结构基本一样              │
│  ↓                         │
│  线性遍历，绑定事件        │
│  O(n)，一遍搞定            │
└────────────────────────────┘

Diff（复杂）：
┌────────────────────────────┐
│  用户可能做了任何操作      │
│  结构可能完全不同          │
│  ↓                         │
│  需要找最优解              │
│  虽然也是O(n)但逻辑复杂    │
└────────────────────────────┘
`);

console.log("💡 形象比喻：");
console.log("• Hydration = 给画好的画上色（画已经在那了）");
console.log("• Diff = 把一幅画改成另一幅画（要决定改哪里）\n");
