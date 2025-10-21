const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const toggleBtn = document.getElementById("toggle");
const statusEl = document.getElementById("status");

// Retina 适配
const dpr = window.devicePixelRatio || 1;
canvas.width = Math.floor(canvas.width * dpr);
canvas.height = Math.floor(canvas.height * dpr);
ctx.scale(dpr, dpr);

const SOLAR_CENTER = { x: 320, y: 260 };
const PLANETS = [
  { radius: 40, orbit: 80, speed: 0.6, color: "#38bdf8" },
  { radius: 28, orbit: 140, speed: 0.35, color: "#c084fc" },
  { radius: 20, orbit: 190, speed: 0.2, color: "#f472b6" },
];

const GRID = {
  origin: { x: 620, y: 220 },
  scale: 180,
};

const POWER_NODES = [
  { id: "A", x: -1, y: 1.2, load: 0.2 },
  { id: "B", x: 0.2, y: 1, load: 0.45 },
  { id: "C", x: 1.2, y: 0.6, load: 0.7 },
  { id: "D", x: 0.6, y: -0.4, load: 0.9 },
  { id: "E", x: -0.4, y: -0.6, load: 0.55 },
  { id: "F", x: -1.2, y: 0.2, load: 0.3 },
];

const POWER_EDGES = [
  ["A", "B"],
  ["B", "C"],
  ["C", "D"],
  ["D", "E"],
  ["E", "F"],
  ["F", "A"],
  ["B", "E"],
  ["C", "F"],
];

let running = true;
let lastTime = performance.now();
let elapsed = 0;

function drawBackground() {
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawSolarSystem(delta) {
  ctx.save();
  ctx.translate(SOLAR_CENTER.x, SOLAR_CENTER.y);
  ctx.fillStyle = "#facc15";
  ctx.shadowColor = "rgba(250, 204, 21, 0.75)";
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  PLANETS.forEach((planet, index) => {
    const angle = (elapsed * planet.speed + index) % (Math.PI * 2);

    // 轨道
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, planet.orbit, 0, Math.PI * 2);
    ctx.stroke();

    // 行星
    ctx.fillStyle = planet.color;
    const x = Math.cos(angle) * planet.orbit;
    const y = Math.sin(angle) * planet.orbit;
    ctx.beginPath();
    ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
    ctx.fill();

    // 轨迹尾巴
    ctx.strokeStyle = planet.color;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  ctx.restore();
}

function lerpColor(start, end, t) {
  const parse = (hex) => hex.match(/.{2}/g).map((v) => parseInt(v, 16));
  const [sr, sg, sb] = parse(start.replace("#", ""));
  const [er, eg, eb] = parse(end.replace("#", ""));
  const r = Math.round(sr + (er - sr) * t);
  const g = Math.round(sg + (eg - sg) * t);
  const b = Math.round(sb + (eb - sb) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function projectNode({ x, y }) {
  return {
    x: GRID.origin.x + x * GRID.scale,
    y: GRID.origin.y - y * GRID.scale,
  };
}

function drawPowerNetwork() {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  POWER_EDGES.forEach(([fromId, toId]) => {
    const from = POWER_NODES.find((node) => node.id === fromId);
    const to = POWER_NODES.find((node) => node.id === toId);
    if (!from || !to) return;

    const fromPos = projectNode(from);
    const toPos = projectNode(to);
    const t = Math.max(from.load, to.load);
    const color = lerpColor("#38bdf8", "#ef4444", t);

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.lineTo(toPos.x, toPos.y);
    ctx.stroke();
  });

  POWER_NODES.forEach((node) => {
    const { x, y } = projectNode(node);
    const radius = 10 + node.load * 6;

    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = lerpColor("#bae6fd", "#ef4444", node.load);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.id, x, y);
  });

  ctx.restore();
}

function render(now) {
  const delta = (now - lastTime) / 1000;
  lastTime = now;
  if (running) {
    elapsed += delta;
  }

  drawBackground();
  drawSolarSystem(delta);
  drawPowerNetwork();

  requestAnimationFrame(render);
}

function updateStatus() {
  statusEl.textContent = running ? "动画进行中" : "动画已暂停";
  toggleBtn.textContent = running ? "暂停动画" : "恢复动画";
}

toggleBtn.addEventListener("click", () => {
  running = !running;
  updateStatus();
});

updateStatus();
requestAnimationFrame((time) => {
  lastTime = time;
  render(time);
});
