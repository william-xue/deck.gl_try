// hydration_real_algorithm.js
// 真实的双指针 Hydration 算法实现

// ============================================
// 1. 模拟 DOM 节点类
// ============================================
class DOMNode {
  constructor(type, props = {}, children = []) {
    this.type = type;
    this.props = props;
    this.children = children;
    this.eventListeners = {};  // 存储事件监听器
    this.textContent = null;
    
    // 如果是文本节点
    if (type === '#text') {
      this.textContent = props.text || '';
    }
  }
  
  // 模拟 addEventListener
  addEventListener(event, handler) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }
  
  // 模拟属性设置
  setAttribute(key, value) {
    this.props[key] = value;
  }
  
  // 模拟属性移除
  removeAttribute(key) {
    delete this.props[key];
  }
  
  // 用于调试的字符串表示
  toString(indent = 0) {
    const spaces = ' '.repeat(indent);
    if (this.type === '#text') {
      return `${spaces}TEXT: "${this.textContent}"`;
    }
    
    let str = `${spaces}<${this.type}`;
    
    // 显示属性
    const propStr = Object.entries(this.props)
      .filter(([k]) => k !== 'children' && k !== 'text')
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    if (propStr) str += ` ${propStr}`;
    
    // 显示事件监听器
    const events = Object.keys(this.eventListeners);
    if (events.length > 0) {
      str += ` [events: ${events.join(', ')}]`;
    }
    
    str += '>';
    
    // 显示子节点
    if (this.children.length > 0) {
      str += '\n';
      this.children.forEach(child => {
        str += child.toString(indent + 2) + '\n';
      });
      str += `${spaces}</${this.type}>`;
    } else {
      str += `</${this.type}>`;
    }
    
    return str;
  }
}

// ============================================
// 2. 虚拟 DOM 节点类
// ============================================
class VNode {
  constructor(type, props = {}, children = []) {
    this.type = type;
    this.props = props;
    this.children = children;
    this.key = props.key || null;
    
    // 文本节点
    if (type === '#text') {
      this.text = props.text || '';
    }
  }
}

// ============================================
// 3. 核心：双指针 Hydration 算法
// ============================================
class HydrationEngine {
  constructor() {
    this.operations = [];  // 记录所有操作
    this.mismatches = [];  // 记录不匹配的情况
  }
  
  // 主入口：执行水合
  hydrate(serverRoot, clientRoot) {
    console.log("🚀 开始 Hydration 过程\n");
    console.log("服务端 DOM 结构：");
    console.log(serverRoot.toString());
    console.log("\n客户端期望结构（虚拟DOM）：");
    console.log(this.vnodeToString(clientRoot));
    console.log("\n" + "=".repeat(50));
    
    this.hydrateNode(serverRoot, clientRoot, 'root');
    
    this.printResults();
    return serverRoot;
  }
  
  // 核心算法：递归水合节点
  hydrateNode(serverNode, clientNode, path) {
    // 情况1：都不存在
    if (!serverNode && !clientNode) {
      return;
    }
    
    // 情况2：只有客户端节点（需要创建）
    if (!serverNode && clientNode) {
      this.operations.push({
        type: 'CREATE',
        path,
        node: clientNode.type,
        reason: '服务端缺少此节点'
      });
      return this.createNode(clientNode, path);
    }
    
    // 情况3：只有服务端节点（需要删除）
    if (serverNode && !clientNode) {
      this.operations.push({
        type: 'DELETE',
        path,
        node: serverNode.type,
        reason: '客户端不需要此节点'
      });
      return null;
    }
    
    // 情况4：类型不匹配
    if (serverNode.type !== clientNode.type) {
      this.mismatches.push({
        path,
        server: serverNode.type,
        client: clientNode.type,
        action: 'REPLACE'
      });
      this.operations.push({
        type: 'REPLACE',
        path,
        oldNode: serverNode.type,
        newNode: clientNode.type
      });
      return this.createNode(clientNode, path);
    }
    
    // 情况5：文本节点
    if (serverNode.type === '#text') {
      if (serverNode.textContent !== clientNode.text) {
        this.operations.push({
          type: 'UPDATE_TEXT',
          path,
          oldText: serverNode.textContent,
          newText: clientNode.text
        });
        serverNode.textContent = clientNode.text;
      } else {
        this.operations.push({
          type: 'REUSE_TEXT',
          path,
          text: serverNode.textContent
        });
      }
      return serverNode;
    }
    
    // 情况6：元素节点 - 可以复用！
    this.operations.push({
      type: 'REUSE',
      path,
      node: serverNode.type
    });
    
    // 更新属性
    this.hydrateProps(serverNode, clientNode, path);
    
    // 绑定事件
    this.hydrateEvents(serverNode, clientNode, path);
    
    // 处理子节点 - 双指针算法核心部分
    this.hydrateChildren(serverNode, clientNode, path);
    
    return serverNode;
  }
  
  // 双指针算法处理子节点
  hydrateChildren(serverNode, clientNode, parentPath) {
    const serverChildren = serverNode.children || [];
    const clientChildren = clientNode.children || [];
    
    let serverIndex = 0;
    let clientIndex = 0;
    
    console.log(`\n📍 处理子节点 (${parentPath}):`);
    console.log(`  服务端子节点数: ${serverChildren.length}`);
    console.log(`  客户端子节点数: ${clientChildren.length}`);
    
    // 双指针遍历
    while (serverIndex < serverChildren.length || clientIndex < clientChildren.length) {
      const serverChild = serverChildren[serverIndex];
      const clientChild = clientChildren[clientIndex];
      const childPath = `${parentPath}.children[${Math.max(serverIndex, clientIndex)}]`;
      
      // 可视化当前指针位置
      this.visualizePointers(serverChildren, clientChildren, serverIndex, clientIndex);
      
      // 情况1：都存在且能匹配
      if (serverChild && clientChild && this.canMatch(serverChild, clientChild)) {
        console.log(`  ✅ 匹配: 位置 ${serverIndex}`);
        this.hydrateNode(serverChild, clientChild, childPath);
        serverIndex++;
        clientIndex++;
      }
      // 情况2：只有客户端子节点
      else if (!serverChild && clientChild) {
        console.log(`  ➕ 插入: 客户端节点 ${clientChild.type} at ${clientIndex}`);
        const newNode = this.createNode(clientChild, childPath);
        serverNode.children.push(newNode);
        clientIndex++;
      }
      // 情况3：只有服务端子节点
      else if (serverChild && !clientChild) {
        console.log(`  ➖ 删除: 服务端节点 ${serverChild.type} at ${serverIndex}`);
        this.operations.push({
          type: 'DELETE_CHILD',
          path: childPath,
          node: serverChild.type
        });
        serverNode.children.splice(serverIndex, 1);
        // 注意：删除后不增加 serverIndex，因为数组已经变短了
      }
      // 情况4：都存在但不匹配
      else {
        console.log(`  🔄 不匹配: ${serverChild.type} vs ${clientChild.type}`);
        this.hydrateNode(serverChild, clientChild, childPath);
        serverIndex++;
        clientIndex++;
      }
    }
  }
  
  // 可视化双指针位置
  visualizePointers(serverChildren, clientChildren, sIdx, cIdx) {
    let serverStr = "    Server: [";
    let clientStr = "    Client: [";
    
    serverChildren.forEach((child, i) => {
      if (i === sIdx) {
        serverStr += `→${child.type}←`;
      } else {
        serverStr += child.type;
      }
      if (i < serverChildren.length - 1) serverStr += ", ";
    });
    serverStr += "]";
    
    clientChildren.forEach((child, i) => {
      if (i === cIdx) {
        clientStr += `→${child.type}←`;
      } else {
        clientStr += child.type;
      }
      if (i < clientChildren.length - 1) clientStr += ", ";
    });
    clientStr += "]";
    
    console.log(serverStr);
    console.log(clientStr);
  }
  
  // 判断节点是否匹配
  canMatch(serverNode, clientNode) {
    // 优先使用 key 匹配
    if (clientNode.key !== null && serverNode.props.key !== undefined) {
      return serverNode.props.key === clientNode.key;
    }
    // 否则按类型匹配
    return serverNode.type === clientNode.type;
  }
  
  // 处理属性
  hydrateProps(serverNode, clientNode, path) {
    const serverProps = serverNode.props || {};
    const clientProps = clientNode.props || {};
    
    // 添加或更新属性
    Object.entries(clientProps).forEach(([key, value]) => {
      if (key === 'children' || key === 'onClick' || key === 'onChange') return;
      
      if (serverProps[key] !== value) {
        this.operations.push({
          type: 'UPDATE_PROP',
          path,
          prop: key,
          oldValue: serverProps[key],
          newValue: value
        });
        serverNode.setAttribute(key, value);
      }
    });
    
    // 删除多余属性
    Object.keys(serverProps).forEach(key => {
      if (key === 'children') return;
      if (!(key in clientProps)) {
        this.operations.push({
          type: 'REMOVE_PROP',
          path,
          prop: key
        });
        serverNode.removeAttribute(key);
      }
    });
  }
  
  // 绑定事件（Hydration 的核心价值）
  hydrateEvents(serverNode, clientNode, path) {
    // 绑定 onClick
    if (clientNode.props.onClick) {
      this.operations.push({
        type: 'BIND_EVENT',
        path,
        event: 'click',
        handler: 'function'
      });
      serverNode.addEventListener('click', clientNode.props.onClick);
    }
    
    // 绑定 onChange
    if (clientNode.props.onChange) {
      this.operations.push({
        type: 'BIND_EVENT',
        path,
        event: 'change',
        handler: 'function'
      });
      serverNode.addEventListener('change', clientNode.props.onChange);
    }
  }
  
  // 创建新节点
  createNode(vnode, path) {
    const node = new DOMNode(vnode.type, vnode.props);
    
    if (vnode.type === '#text') {
      node.textContent = vnode.text;
    } else if (vnode.children) {
      vnode.children.forEach((child, i) => {
        const childNode = this.createNode(child, `${path}.children[${i}]`);
        node.children.push(childNode);
      });
    }
    
    // 绑定事件
    if (vnode.props.onClick) {
      node.addEventListener('click', vnode.props.onClick);
    }
    if (vnode.props.onChange) {
      node.addEventListener('change', vnode.props.onChange);
    }
    
    return node;
  }
  
  // 辅助函数：虚拟节点转字符串
  vnodeToString(vnode, indent = 0) {
    const spaces = ' '.repeat(indent);
    if (vnode.type === '#text') {
      return `${spaces}TEXT: "${vnode.text}"`;
    }
    
    let str = `${spaces}<${vnode.type}`;
    
    const propStr = Object.entries(vnode.props)
      .filter(([k]) => k !== 'children' && k !== 'onClick' && k !== 'onChange')
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    if (propStr) str += ` ${propStr}`;
    
    if (vnode.props.onClick) str += ' [onClick]';
    if (vnode.props.onChange) str += ' [onChange]';
    
    str += '>';
    
    if (vnode.children && vnode.children.length > 0) {
      str += '\n';
      vnode.children.forEach(child => {
        str += this.vnodeToString(child, indent + 2) + '\n';
      });
      str += `${spaces}</${vnode.type}>`;
    } else {
      str += `</${vnode.type}>`;
    }
    
    return str;
  }
  
  // 打印结果
  printResults() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 Hydration 操作统计：\n");
    
    const stats = {};
    this.operations.forEach(op => {
      stats[op.type] = (stats[op.type] || 0) + 1;
    });
    
    Object.entries(stats).forEach(([type, count]) => {
      const icon = {
        'REUSE': '♻️ ',
        'REUSE_TEXT': '📝',
        'UPDATE_TEXT': '✏️ ',
        'UPDATE_PROP': '🔧',
        'BIND_EVENT': '⚡',
        'CREATE': '➕',
        'DELETE': '➖',
        'REPLACE': '🔄'
      }[type] || '•';
      
      console.log(`  ${icon} ${type}: ${count}次`);
    });
    
    if (this.mismatches.length > 0) {
      console.log("\n⚠️  发现不匹配：");
      this.mismatches.forEach(m => {
        console.log(`  路径 ${m.path}: ${m.server} → ${m.client}`);
      });
    }
    
    console.log("\n" + "=".repeat(50));
  }
}

// ============================================
// 4. 测试用例
// ============================================

// 辅助函数：快速创建节点
const h = (type, props, ...children) => {
  const processedChildren = children.map(child => {
    if (typeof child === 'string') {
      return new VNode('#text', { text: child });
    }
    return child;
  });
  return new VNode(type, props, processedChildren);
};

const dom = (type, props, ...children) => {
  const processedChildren = children.map(child => {
    if (typeof child === 'string') {
      return new DOMNode('#text', { text: child });
    }
    return child;
  });
  return new DOMNode(type, props, processedChildren);
};

// 测试1：完美匹配的情况
console.log("🧪 测试1：完美匹配的情况");
console.log("=".repeat(50));

const serverDOM1 = dom('div', { id: 'app', class: 'container' },
  dom('h1', {}, 'Hello World'),
  dom('button', { class: 'btn' }, 'Click Me'),
  dom('ul', {},
    dom('li', { key: 'item-1' }, 'Item 1'),
    dom('li', { key: 'item-2' }, 'Item 2')
  )
);

const clientVDOM1 = h('div', { id: 'app', class: 'container' },
  h('h1', {}, 'Hello World'),
  h('button', { class: 'btn', onClick: () => console.log('Clicked!') }, 'Click Me'),
  h('ul', {},
    h('li', { key: 'item-1' }, 'Item 1'),
    h('li', { key: 'item-2' }, 'Item 2')
  )
);

const engine1 = new HydrationEngine();
const result1 = engine1.hydrate(serverDOM1, clientVDOM1);
console.log("\n最终 DOM（已激活）：");
console.log(result1.toString());

// 测试2：有差异的情况
console.log("\n\n🧪 测试2：有差异的情况");
console.log("=".repeat(50));

const serverDOM2 = dom('div', { id: 'root' },
  dom('h1', {}, 'Server Title'),
  dom('p', { class: 'old-class' }, 'Old text'),
  dom('ul', {},
    dom('li', {}, 'A'),
    dom('li', {}, 'B')
  )
);

const clientVDOM2 = h('div', { id: 'root' },
  h('h1', {}, 'Client Title'),  // 文本不同
  h('p', { class: 'new-class' }, 'New text'),  // 属性和文本都不同
  h('ul', {},
    h('li', {}, 'A'),
    h('li', {}, 'B'),
    h('li', {}, 'C')  // 客户端多了一个
  ),
  h('button', { onClick: () => {} }, 'New Button')  // 客户端新增
);

const engine2 = new HydrationEngine();
const result2 = engine2.hydrate(serverDOM2, clientVDOM2);
console.log("\n最终 DOM（已激活）：");
console.log(result2.toString());

// 测试3：使用 key 的列表
console.log("\n\n🧪 测试3：使用 key 的列表");
console.log("=".repeat(50));

const serverDOM3 = dom('ul', {},
  dom('li', { key: 'a' }, 'Apple'),
  dom('li', { key: 'b' }, 'Banana'),
  dom('li', { key: 'c' }, 'Cherry')
);

const clientVDOM3 = h('ul', {},
  h('li', { key: 'a', onClick: () => {} }, 'Apple'),
  h('li', { key: 'b', onClick: () => {} }, 'Banana'),
  h('li', { key: 'd', onClick: () => {} }, 'Date'),  // 新的
  h('li', { key: 'c', onClick: () => {} }, 'Cherry')
);

const engine3 = new HydrationEngine();
const result3 = engine3.hydrate(serverDOM3, clientVDOM3);
console.log("\n最终 DOM（已激活）：");
console.log(result3.toString());

console.log("\n" + "=".repeat(50));
console.log("✅ 所有测试完成！");
console.log("=".repeat(50));
