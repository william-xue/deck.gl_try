// vue_diff_visual.js
// Vue Diff 算法可视化演示

console.log("=".repeat(60));
console.log("🎯 Vue Diff 算法直观理解");
console.log("=".repeat(60));

// ============================================
// 场景1：理解为什么需要 Diff
// ============================================
console.log("\n📚 场景1：为什么需要 Diff？\n");

function whyNeedDiff() {
  console.log("假设你有一个待办事项列表：\n");
  
  const oldTodos = ['买菜', '做饭', '洗碗', '看书'];
  const newTodos = ['买菜', '健身', '做饭', '洗碗', '写代码'];
  
  console.log("更新前:", oldTodos);
  console.log("更新后:", newTodos);
  
  console.log("\n❌ 方法1：全部删除重建");
  console.log("  1. 删除：买菜");
  console.log("  2. 删除：做饭");
  console.log("  3. 删除：洗碗");
  console.log("  4. 删除：看书");
  console.log("  5. 创建：买菜");
  console.log("  6. 创建：健身");
  console.log("  7. 创建：做饭");
  console.log("  8. 创建：洗碗");
  console.log("  9. 创建：写代码");
  console.log("  总共：9次DOM操作 💔");
  
  console.log("\n✅ 方法2：使用 Diff");
  console.log("  1. 复用：买菜（位置不变）");
  console.log("  2. 插入：健身（新增）");
  console.log("  3. 复用：做饭（位置调整）");
  console.log("  4. 复用：洗碗（位置调整）");
  console.log("  5. 删除：看书");
  console.log("  6. 创建：写代码");
  console.log("  总共：3-4次DOM操作 ✨");
}

whyNeedDiff();

// ============================================
// 场景2：Vue 的 key 作用
// ============================================
console.log("\n" + "=".repeat(60));
console.log("📚 场景2：key 的重要性");
console.log("=".repeat(60) + "\n");

function keyImportance() {
  console.log("没有 key 的情况：\n");
  
  // 模拟没有 key 的列表
  const oldItems = [
    { type: 'input', value: '任务1' },
    { type: 'input', value: '任务2' },
    { type: 'input', value: '任务3' }
  ];
  
  const newItems = [
    { type: 'input', value: '任务2' },
    { type: 'input', value: '任务3' }
  ];
  
  console.log("删除第一项后（没有key）：");
  console.log("旧: [input:任务1] [input:任务2] [input:任务3]");
  console.log("新: [input:任务2] [input:任务3]");
  console.log("\n❌ Vue 的错误匹配（按位置）：");
  console.log("  位置0: input:任务1 → input:任务2 (更新文本)");
  console.log("  位置1: input:任务2 → input:任务3 (更新文本)");
  console.log("  位置2: input:任务3 → 删除");
  console.log("  问题：如果用户在输入框中有未保存的输入，会丢失！\n");
  
  console.log("有 key 的情况：\n");
  console.log("旧: [key:1,任务1] [key:2,任务2] [key:3,任务3]");
  console.log("新: [key:2,任务2] [key:3,任务3]");
  console.log("\n✅ Vue 的正确匹配（按key）：");
  console.log("  key:1 → 删除");
  console.log("  key:2 → 复用（保持输入状态）");
  console.log("  key:3 → 复用（保持输入状态）");
  console.log("  好处：输入框的状态被正确保留！");
}

keyImportance();

// ============================================
// 场景3：Vue 2 双端对比的巧妙
// ============================================
console.log("\n" + "=".repeat(60));
console.log("📚 场景3：Vue 2 双端对比的四种快捷方式");
console.log("=".repeat(60) + "\n");

function vue2FourWays() {
  console.log("Vue 2 的四种对比策略：\n");
  
  // 情况1：头头匹配
  console.log("1️⃣ 头头匹配（最常见）");
  console.log("   旧: [→A, B, C]");
  console.log("   新: [→A, D, E]");
  console.log("   匹配 A，两个头指针都前进\n");
  
  // 情况2：尾尾匹配
  console.log("2️⃣ 尾尾匹配（列表末尾添加）");
  console.log("   旧: [A, B, C←]");
  console.log("   新: [D, E, C←]");
  console.log("   匹配 C，两个尾指针都后退\n");
  
  // 情况3：头尾匹配
  console.log("3️⃣ 头尾匹配（元素移到末尾）");
  console.log("   旧: [→A, B, C]");
  console.log("   新: [B, C, A←]");
  console.log("   A 移到末尾，旧头进，新尾退\n");
  
  // 情况4：尾头匹配
  console.log("4️⃣ 尾头匹配（元素移到开头）");
  console.log("   旧: [A, B, C←]");
  console.log("   新: [→C, A, B]");
  console.log("   C 移到开头，旧尾退，新头进\n");
  
  console.log("💡 为什么这样设计？");
  console.log("   - 覆盖了大部分常见操作");
  console.log("   - 头尾操作在实际应用中最频繁");
  console.log("   - O(1) 快速判断，避免遍历查找");
}

vue2FourWays();

// ============================================
// 场景4：Vue 3 的 LIS 优化
// ============================================
console.log("\n" + "=".repeat(60));
console.log("📚 场景4：Vue 3 最长递增子序列的妙用");
console.log("=".repeat(60) + "\n");

function vue3LISMagic() {
  console.log("什么是最长递增子序列（LIS）？\n");
  
  const sequence = [3, 1, 4, 2, 5];
  console.log("序列:", sequence);
  console.log("最长递增子序列: [1, 2, 5] 或 [3, 4, 5]");
  console.log("长度: 3\n");
  
  console.log("在 Diff 中的应用：\n");
  
  const oldList = ['A', 'B', 'C', 'D', 'E'];
  const newList = ['A', 'C', 'B', 'E', 'D'];
  
  console.log("旧顺序:", oldList.join(' → '));
  console.log("新顺序:", newList.join(' → '));
  
  console.log("\n分析：");
  console.log("1. A 位置不变（索引 0 → 0）");
  console.log("2. B 位置变了（索引 1 → 2）需要移动");
  console.log("3. C 位置变了（索引 2 → 1）需要移动");
  console.log("4. D 位置变了（索引 3 → 4）需要移动");
  console.log("5. E 位置变了（索引 4 → 3）需要移动");
  
  console.log("\n使用 LIS 优化：");
  console.log("新位置序列: [0, 1, 2, 3, 4]");
  console.log("对应旧索引: [0, 2, 1, 4, 3]");
  console.log("找LIS: [0, 1, 3] → 对应节点 [A, C, D]");
  console.log("\n结果：");
  console.log("✅ A, C, D 不需要移动（它们相对顺序正确）");
  console.log("🔄 只需移动 B 和 E");
  console.log("优化效果：5个节点只需移动2个！");
}

vue3LISMagic();

// ============================================
// 场景5：实际案例对比
// ============================================
console.log("\n" + "=".repeat(60));
console.log("📚 场景5：真实案例 - 表格排序");
console.log("=".repeat(60) + "\n");

function realWorldCase() {
  console.log("场景：用户点击表头进行排序\n");
  
  const data = [
    { id: 1, name: '张三', score: 85 },
    { id: 2, name: '李四', score: 92 },
    { id: 3, name: '王五', score: 78 },
    { id: 4, name: '赵六', score: 95 },
    { id: 5, name: '钱七', score: 88 }
  ];
  
  console.log("原始顺序（按ID）：");
  data.forEach(d => console.log(`  ${d.id}. ${d.name} - ${d.score}分`));
  
  const sorted = [...data].sort((a, b) => b.score - a.score);
  console.log("\n按分数排序后：");
  sorted.forEach(d => console.log(`  ${d.id}. ${d.name} - ${d.score}分`));
  
  console.log("\n没有 key 的问题：");
  console.log("❌ Vue 会认为第一行还是第一行，只是内容变了");
  console.log("   导致：过渡动画错误、选中状态丢失");
  
  console.log("\n有 key 的优势：");
  console.log("✅ Vue 知道 id:4（赵六）从第4位移到了第1位");
  console.log("   结果：正确的移动动画、保持选中状态");
  
  console.log("\nVue 2 处理方式：");
  console.log("  双端对比，可能需要多次移动");
  
  console.log("\nVue 3 处理方式：");
  console.log("  1. 找出不需要移动的行（LIS）");
  console.log("  2. 只移动必要的行");
  console.log("  3. 批量更新，性能更好");
}

realWorldCase();

// ============================================
// 总结
// ============================================
console.log("\n" + "=".repeat(60));
console.log("🎓 Vue Diff 核心要点总结");
console.log("=".repeat(60));

console.log(`
1. 为什么需要 Diff？
   - 找出最小的更新集合
   - 避免不必要的 DOM 操作
   - 保持组件状态

2. key 的作用
   - 帮助 Vue 识别节点身份
   - 确保正确的复用
   - 保持组件状态和动画

3. Vue 2 的策略
   - 双端对比（头头、尾尾、头尾、尾头）
   - 简单高效，覆盖常见场景
   - 适合大部分应用

4. Vue 3 的优化
   - 静态标记（编译时优化）
   - 最长递增子序列（运行时优化）
   - 更少的移动操作

5. 实践建议
   - 列表渲染务必使用 key
   - key 要稳定且唯一（不要用 index）
   - 理解原理，但不要过度优化
`);

console.log("💡 记住：Diff 算法是为了性能，key 是为了正确性！");
