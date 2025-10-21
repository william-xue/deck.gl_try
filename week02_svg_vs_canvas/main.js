const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 480;
const PADDING = 48;
const SVG_NS = "http://www.w3.org/2000/svg";

const BASE_NODES = [
  { id: "HX-A", label: "北郊换流站", x: 0.08, y: 0.78, baseLoad: 0.28 },
  { id: "HX-B", label: "新区主站", x: 0.26, y: 0.58, baseLoad: 0.42 },
  { id: "HX-C", label: "中心枢纽", x: 0.46, y: 0.46, baseLoad: 0.6 },
  { id: "HX-D", label: "科技园站", x: 0.64, y: 0.28, baseLoad: 0.36 },
  { id: "HX-E", label: "东部沿海站", x: 0.84, y: 0.44, baseLoad: 0.52 },
  { id: "HX-F", label: "南部枢纽", x: 0.64, y: 0.82, baseLoad: 0.48 },
  { id: "HX-G", label: "西南风电场", x: 0.34, y: 0.9, baseLoad: 0.55 },
  { id: "HX-H", label: "西北抽蓄", x: 0.18, y: 0.34, baseLoad: 0.33 },
];

const BASE_EDGES = [
  ["HX-A", "HX-B"],
  ["HX-B", "HX-C"],
  ["HX-C", "HX-D"],
  ["HX-D", "HX-E"],
  ["HX-C", "HX-F"],
  ["HX-F", "HX-G"],
  ["HX-G", "HX-A"],
  ["HX-B", "HX-H"],
  ["HX-H", "HX-A"],
  ["HX-F", "HX-E"],
  ["HX-G", "HX-H"],
];

const COLOR_STOPS = ["#38bdf8", "#22d3ee", "#34d399", "#f97316", "#ef4444"];

const canvas = document.getElementById("canvas-board");
const ctx = canvas.getContext("2d");
const svg = document.getElementById("network-svg");
const intensityInput = document.getElementById("load-intensity");
const intensityValue = document.getElementById("intensity-value");
const canvasHoverEl = document.getElementById("canvas-hover");
const svgHoverEl = document.getElementById("svg-hover");
const fpsEl = document.getElementById("canvas-fps");

const CANVAS_HOVER_DEFAULT = "移动到节点区域进行命中测试";
const SVG_HOVER_DEFAULT = "悬停圆点即可读取节点信息";

const dpr = window.devicePixelRatio || 1;
canvas.style.width = `${CANVAS_WIDTH}px`;
canvas.style.height = `${CANVAS_HEIGHT}px`;
canvas.width = CANVAS_WIDTH * dpr;
canvas.height = CANVAS_HEIGHT * dpr;
ctx.scale(dpr, dpr);

const usableWidth = CANVAS_WIDTH - PADDING * 2;
const usableHeight = CANVAS_HEIGHT - PADDING * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (value) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixHex(a, b, t) {
  const start = hexToRgb(a);
  const end = hexToRgb(b);
  return rgbToHex({
    r: Math.round(start.r + (end.r - start.r) * t),
    g: Math.round(start.g + (end.g - start.g) * t),
    b: Math.round(start.b + (end.b - start.b) * t),
  });
}

function colorRamp(t) {
  const value = clamp(t, 0, 0.9999) * (COLOR_STOPS.length - 1);
  const index = Math.floor(value);
  const localT = value - index;
  const start = COLOR_STOPS[index];
  const end = COLOR_STOPS[index + 1] ?? COLOR_STOPS[index];
  return mixHex(start, end, localT);
}

function lighten(hex, amount) {
  return mixHex(hex, "#ffffff", clamp(amount, 0, 1));
}

function darken(hex, amount) {
  return mixHex(hex, "#020617", clamp(amount, 0, 1));
}

function project(node) {
  return {
    x: PADDING + node.x * usableWidth,
    y: PADDING + (1 - node.y) * usableHeight,
  };
}

const nodes = BASE_NODES.map((node, index) => ({
  ...node,
  phase: index * 0.9,
  screen: project(node),
  load: node.baseLoad,
}));

const nodeMap = new Map(nodes.map((node) => [node.id, node]));

const edges = BASE_EDGES.map(([fromId, toId], index) => {
  const from = nodeMap.get(fromId);
  const to = nodeMap.get(toId);
  return {
    id: `${fromId}-${toId}`,
    from,
    to,
    load: (from.baseLoad + to.baseLoad) / 2,
    phase: index * 0.6,
  };
});

svg.innerHTML = "";

const svgEdges = edges.map((edge) => {
  const line = document.createElementNS(SVG_NS, "line");
  line.classList.add("svg-edge");
  svg.appendChild(line);
  return { edge, element: line };
});

let activeSvgNode = null;

const svgNodes = nodes.map((node) => {
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.classList.add("svg-node");
  circle.dataset.id = node.id;
  circle.addEventListener("mouseenter", () => {
    activeSvgNode = node;
  });
  circle.addEventListener("mouseleave", () => {
    if (activeSvgNode === node) {
      activeSvgNode = null;
    }
  });
  svg.appendChild(circle);
  return { node, element: circle };
});

let intensity = Number(intensityInput.value) / 100;
intensityValue.textContent = intensityInput.value;

intensityInput.addEventListener("input", () => {
  intensity = Number(intensityInput.value) / 100;
  intensityValue.textContent = intensityInput.value;
});

let canvasHoverNode = null;

canvas.addEventListener("mousemove", (event) => {
  const x = event.offsetX;
  const y = event.offsetY;
  let minDistance = Infinity;
  let hitNode = null;
  for (const node of nodes) {
    const dx = x - node.screen.x;
    const dy = y - node.screen.y;
    const dist = Math.hypot(dx, dy);
    const threshold = 14 + node.load * 18;
    if (dist <= threshold && dist < minDistance) {
      minDistance = dist;
      hitNode = node;
    }
  }
  canvasHoverNode = hitNode;
});

canvas.addEventListener("mouseleave", () => {
  canvasHoverNode = null;
});

function drawCanvasBackground() {
  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, "rgba(15, 23, 42, 0.95)");
  gradient.addColorStop(1, "rgba(2, 6, 23, 0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
  ctx.lineWidth = 1;
  const gridSize = 48;
  for (let x = PADDING; x <= CANVAS_WIDTH - PADDING; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, PADDING);
    ctx.lineTo(x, CANVAS_HEIGHT - PADDING);
    ctx.stroke();
  }
  for (let y = PADDING; y <= CANVAS_HEIGHT - PADDING; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(CANVAS_WIDTH - PADDING, y);
    ctx.stroke();
  }
  ctx.restore();
}

function renderCanvas() {
  drawCanvasBackground();

  ctx.save();
  edges.forEach((edge) => {
    const color = colorRamp(edge.load);
    const related = canvasHoverNode && (edge.from === canvasHoverNode || edge.to === canvasHoverNode);
    ctx.globalAlpha = related ? 0.95 : 0.55 + edge.load * 0.35;
    ctx.strokeStyle = related ? lighten(color, 0.2) : color;
    ctx.lineWidth = (related ? 2.4 : 1.6) + edge.load * (related ? 7 : 5);
    ctx.beginPath();
    ctx.moveTo(edge.from.screen.x, edge.from.screen.y);
    ctx.lineTo(edge.to.screen.x, edge.to.screen.y);
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  nodes.forEach((node) => {
    const color = colorRamp(node.load);
    const glow = lighten(color, 0.5);
    const darker = darken(color, 0.35);
    const radius = 8 + node.load * 14;
    const highlight = canvasHoverNode === node;

    const gradient = ctx.createRadialGradient(
      node.screen.x,
      node.screen.y,
      radius * 0.1,
      node.screen.x,
      node.screen.y,
      radius
    );
    gradient.addColorStop(0, lighten(color, 0.45));
    gradient.addColorStop(1, darker);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(node.screen.x, node.screen.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = glow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(node.screen.x, node.screen.y, radius + 1.5, 0, Math.PI * 2);
    ctx.stroke();

    if (highlight) {
      ctx.strokeStyle = "rgba(250, 204, 21, 0.8)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(node.screen.x, node.screen.y, radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.id, node.screen.x, node.screen.y);
  });
  ctx.restore();
}

function renderSvg() {
  svgEdges.forEach(({ edge, element }) => {
    const { from, to, load } = edge;
    element.setAttribute("x1", from.screen.x.toFixed(2));
    element.setAttribute("y1", from.screen.y.toFixed(2));
    element.setAttribute("x2", to.screen.x.toFixed(2));
    element.setAttribute("y2", to.screen.y.toFixed(2));
    element.setAttribute("stroke", colorRamp(load));
    const related = activeSvgNode && (from === activeSvgNode || to === activeSvgNode);
    const opacity = related ? 0.95 : 0.5 + load * 0.3;
    element.setAttribute("stroke-width", ((related ? 2.2 : 1.4) + load * 6).toFixed(2));
    element.setAttribute("opacity", opacity.toFixed(2));
  });

  svgNodes.forEach(({ node, element }) => {
    const color = colorRamp(node.load);
    const radius = (6 + node.load * 11).toFixed(2);
    element.setAttribute("cx", node.screen.x.toFixed(2));
    element.setAttribute("cy", node.screen.y.toFixed(2));
    element.setAttribute("r", radius);
    element.setAttribute("fill", lighten(color, 0.35));
    element.setAttribute("stroke", color);
    element.setAttribute("stroke-width", (2.2 + node.load * 2).toFixed(2));
    element.classList.toggle("is-active", activeSvgNode === node);
    element.style.transform = activeSvgNode === node ? "scale(1.08)" : "scale(1)";
  });
}

function refreshHoverText() {
  if (canvasHoverNode) {
    canvasHoverEl.textContent = `命中 ${canvasHoverNode.label} · 实时负载 ${(canvasHoverNode.load * 100).toFixed(0)}%`;
  } else {
    canvasHoverEl.textContent = CANVAS_HOVER_DEFAULT;
  }

  if (activeSvgNode) {
    svgHoverEl.textContent = `命中 ${activeSvgNode.label} · 实时负载 ${(activeSvgNode.load * 100).toFixed(0)}%`;
  } else {
    svgHoverEl.textContent = SVG_HOVER_DEFAULT;
  }
}

function updateLoads(elapsed) {
  nodes.forEach((node) => {
    const waveA = Math.sin(elapsed * 0.7 + node.phase) * 0.5 + 0.5;
    const waveB = Math.cos(elapsed * 1.3 + node.phase * 1.2) * 0.5 + 0.5;
    const variation = (waveA * 0.6 + waveB * 0.4 - 0.5) * intensity * 0.9;
    node.load = clamp(node.baseLoad + variation, 0.08, 0.98);
  });

  edges.forEach((edge) => {
    const base = (edge.from.load + edge.to.load) / 2;
    const modulation = Math.sin(elapsed * 1.1 + edge.phase) * 0.15 + 0.15;
    edge.load = clamp(base + modulation * intensity * 0.6, 0.08, 0.98);
  });
}

let lastFrameTime = performance.now();
let lastFpsUpdate = lastFrameTime;
let elapsed = 0;
let frames = 0;

function loop(now) {
  const delta = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  elapsed += delta;

  updateLoads(elapsed);
  renderCanvas();
  renderSvg();
  refreshHoverText();

  frames += 1;
  if (now - lastFpsUpdate > 400) {
    const fps = Math.round((frames * 1000) / (now - lastFpsUpdate));
    fpsEl.textContent = Number.isFinite(fps) ? String(fps) : "--";
    lastFpsUpdate = now;
    frames = 0;
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame((time) => {
  lastFrameTime = time;
  lastFpsUpdate = time;
  loop(time);
});
