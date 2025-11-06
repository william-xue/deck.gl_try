// diff_lis/hydrate_demo.js
// 运行方式：node hydrate_demo.js

/**
 * 教学导读：客户端水合的三步式理解
 * ------------------------------------------------------------------
 * Step 1：接受服务端直出的 HTML（已经渲染好的 DOM 树）
 * Step 2：加载客户端 bundle，生成对应的虚拟节点（Fiber 树）
 * Step 3：在不重新创建 DOM 的前提下，对齐两棵树并绑定事件
 *
 * 本脚本模拟 React Hydration 的关键流程：
 *  - 对齐：深度优先遍历服务端 DOM，同步检查客户端虚拟节点。
 *  - 修正：发现属性或文本不一致时，打补丁而不是整棵重建。
 *  - 移除/新增：当节点只在其中一端存在时，执行线性插入或删除。
 *
 * 重点提示：
 *  - 真实的 React 在内部使用 Fiber 节点，拥有 sibling/return 指针，本脚本改用普通对象模拟结构，
 *    但核心“线性匹配 + 条件修补”逻辑一致；
 *  - 把输出当成“调试日志”来看，逐条理解某个操作是因为什么触发；
 *  - 可把案例映射到业务，例如：
 *      · 案例 1 —— 监控大屏首屏渲染：客户端仅补齐事件绑定；
 *      · 案例 2 —— 服务器侧渲染的工况摘要在客户端接到实时数据后做轻量更正；
 *      · 案例 3 —— 电力拓扑图节点顺序改变，考察 key 对错位场景的影响。
 */

function simulateHydration(serverTree, clientTree, title) {
  console.log("======================================");
  console.log(title);
  const ops = [];
  hydrateNode(serverTree, clientTree, "root", ops);
  ops.forEach((msg, index) => {
    console.log(`${index + 1}. ${msg}`);
  });
  console.log("\n");
}

/**
 * 水合的核心：深度优先 + 子节点线性对齐
 */
function hydrateNode(serverNode, clientNode, path, ops) {
  if (!serverNode && !clientNode) return;

  if (!serverNode && clientNode) {
    ops.push(`路径 ${path} 缺少服务端节点，直接创建 <${clientNode.type}>`);
    linearCreate(clientNode, path, ops);
    return;
  }

  if (serverNode && !clientNode) {
    ops.push(`路径 ${path} 客户端未声明，移除服务端残留 <${serverNode.type}>`);
    linearRemove(serverNode, path, ops);
    return;
  }

  if (serverNode.type !== clientNode.type) {
    ops.push(`路径 ${path} 节点类型不一致：SSR 是 <${serverNode.type}>，客户端期望 <${clientNode.type}>，替换节点`);
    linearRemove(serverNode, path, ops);
    linearCreate(clientNode, path, ops);
    return;
  }

  if (serverNode.type === "#text") {
    if (serverNode.text !== clientNode.text) {
      ops.push(`路径 ${path} 文本不一致，修正为 "${clientNode.text}"`);
    } else {
      ops.push(`路径 ${path} 复用文本节点 "${clientNode.text}"`);
    }
    return;
  }

  ops.push(`路径 ${path} 复用已有 <${serverNode.type}> 节点`);
  diffProps(serverNode.props || {}, clientNode.props || {}, path, ops);
  hydrateChildren(serverNode.children || [], clientNode.children || [], path, ops);
}

/**
 * 属性校验：逐一比对，属于线性扫描
 */
function diffProps(serverProps, clientProps, path, ops) {
  // 设置与更新属性
  Object.keys(clientProps).forEach((key) => {
    const serverValue = serverProps[key];
    const clientValue = clientProps[key];
    if (serverValue === undefined) {
      ops.push(`  · 属性 ${key} 服务端缺失，设置为 ${describeValue(clientValue)}（路径 ${path}）`);
    } else if (serverValue !== clientValue) {
      ops.push(`  · 属性 ${key} 值不同：SSR=${describeValue(serverValue)} → 客户端=${describeValue(clientValue)}`);
    }
  });

  // 删除冗余属性
  Object.keys(serverProps).forEach((key) => {
    if (!(key in clientProps)) {
      ops.push(`  · 属性 ${key} 在客户端不存在，移除（路径 ${path}）`);
    }
  });
}

/**
 * 子节点比对：双指针线性推进
 */
function hydrateChildren(serverChildren, clientChildren, parentPath, ops) {
  let serverIndex = 0;
  let clientIndex = 0;

  while (serverIndex < serverChildren.length || clientIndex < clientChildren.length) {
    const serverChild = serverChildren[serverIndex];
    const clientChild = clientChildren[clientIndex];

    if (serverChild && clientChild && canMatch(serverChild, clientChild)) {
      const childPath = `${parentPath}.${resolveKey(clientChild, clientIndex)}`;
      hydrateNode(serverChild, clientChild, childPath, ops);
      serverIndex++;
      clientIndex++;
      continue;
    }

    if (clientChild && (!serverChild || !findMatchingAhead(serverChildren, serverIndex, clientChild))) {
      const childPath = `${parentPath}.${resolveKey(clientChild, clientIndex)}`;
      ops.push(`路径 ${childPath} 仅在客户端存在，创建 <${clientChild.type}>`);
      linearCreate(clientChild, childPath, ops);
      clientIndex++;
      continue;
    }

    if (serverChild && (!clientChild || !findMatchingAhead(clientChildren, clientIndex, serverChild))) {
      const childPath = `${parentPath}.${resolveKey(serverChild, serverIndex)}`;
      ops.push(`路径 ${childPath} 仅在服务端存在，移除 <${serverChild.type}>`);
      linearRemove(serverChild, childPath, ops);
      serverIndex++;
      continue;
    }

    // fallback：双方都能找到潜在匹配，但短期内无法线性对齐。
    // 类似“先后顺序错位”的场景，React 通常会触发一次重渲染或强制替换。
    const targetPath = `${parentPath}.${resolveKey(clientChild, clientIndex)}`;
    ops.push(`路径 ${targetPath} 出现顺序错位，触发重新渲染 <${clientChild.type}>`);
    linearRemove(serverChild, `${parentPath}.${resolveKey(serverChild, serverIndex)}`, ops);
    linearCreate(clientChild, targetPath, ops);
    serverIndex++;
    clientIndex++;
  }
}

function canMatch(serverNode, clientNode) {
  const serverKey = serverNode.key ?? null;
  const clientKey = clientNode.key ?? null;
  if (serverKey !== null || clientKey !== null) {
    return serverKey === clientKey;
  }
  return serverNode.type === clientNode.type;
}

function resolveKey(node, index) {
  if (node.key !== undefined && node.key !== null) return `key(${node.key})`;
  return `index(${index})`;
}

function findMatchingAhead(list, startIndex, targetNode) {
  for (let i = startIndex; i < list.length; i++) {
    if (canMatch(list[i], targetNode)) {
      return true;
    }
  }
  return false;
}

function linearCreate(node, path, ops) {
  if (node.type === "#text") {
    ops.push(`    ↳ 创建文本 "${node.text}"（路径 ${path}）`);
    return;
  }
  ops.push(`    ↳ 创建元素 <${node.type}>（路径 ${path}）`);
  (node.children || []).forEach((child, index) => {
    linearCreate(child, `${path}.${resolveKey(child, index)}`, ops);
  });
}

function linearRemove(node, path, ops) {
  if (node.type === "#text") {
    ops.push(`    ↳ 删除文本 "${node.text}"（路径 ${path}）`);
    return;
  }
  ops.push(`    ↳ 删除元素 <${node.type}>（路径 ${path}）`);
  (node.children || []).forEach((child, index) => {
    linearRemove(child, `${path}.${resolveKey(child, index)}`, ops);
  });
}

function describeValue(value) {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (value === null) return "null";
  return JSON.stringify(value);
}

// 一组用于教学的案例：
const demoCases = [
  {
    title: "案例 1：完全同构，线性复用",
    serverTree: h("div", { id: "app" }, [
      h("h1", { class: "title" }, [text("欢迎来到水合演示")]),
      h("ul", {}, [
        h("li", { key: "A" }, [text("节点 A")]),
        h("li", { key: "B" }, [text("节点 B")]),
      ]),
    ]),
    clientTree: h("div", { id: "app" }, [
      h("h1", { class: "title" }, [text("欢迎来到水合演示")]),
      h("ul", {}, [
        h("li", { key: "A" }, [text("节点 A")]),
        h("li", { key: "B" }, [text("节点 B")]),
      ]),
    ]),
  },
  {
    title: "案例 2：属性与文本不一致，触发修正",
    serverTree: h("section", { "data-theme": "light" }, [
      h("p", {}, [text("SSR 首屏"), text("：旧文案")]),
      h("button", { class: "btn" }, [text("点我")]),
    ]),
    clientTree: h("section", { "data-theme": "dark" }, [
      h("p", {}, [text("SSR 首屏"), text("：客户端更新文案")]),
      h("button", { class: "btn primary" }, [text("点我")]),
    ]),
  },
  {
    title: "案例 3：子节点数量变化与顺序错位",
    serverTree: h("ul", {}, [
      h("li", { key: "A" }, [text("A-老数据")]),
      h("li", { key: "B" }, [text("B-老数据")]),
      h("li", { key: "C" }, [text("C-老数据")]),
    ]),
    clientTree: h("ul", {}, [
      h("li", { key: "B" }, [text("B-新数据")]),
      h("li", { key: "A" }, [text("A-保留")]),
      h("li", { key: "D" }, [text("D-新增")]),
    ]),
  },
];

demoCases.forEach(({ title, serverTree, clientTree }) => {
  simulateHydration(serverTree, clientTree, title);
});

// 工具函数：便捷构造节点
function h(type, props, children = [], key) {
  return { type, props, children, key: key ?? props?.key ?? undefined };
}

function text(content) {
  return { type: "#text", text: content };
}

module.exports = { simulateHydration, hydrateNode };
