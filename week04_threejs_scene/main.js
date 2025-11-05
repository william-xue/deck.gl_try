const THREE = window.THREE;
const OrbitControls = THREE?.OrbitControls;

if (!THREE) {
  throw new Error("three.js 未正确加载，请检查网络或 CDN 可用性。");
}

if (!OrbitControls) {
  throw new Error("OrbitControls 未找到，确保 examples/js/controls/OrbitControls.js 已成功加载。");
}

const container = document.getElementById("scene-container");
const cameraStatusEl = document.getElementById("camera-status");
const focusHubBtn = document.getElementById("focus-hub");
const resetCameraBtn = document.getElementById("reset-camera");
const captureBtn = document.getElementById("capture-frame");

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020817);

const camera = new THREE.PerspectiveCamera(
  55,
  container.clientWidth / container.clientHeight,
  0.1,
  200
);
camera.position.set(6.5, 4.2, 7.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.set(0, 0.9, 0);
controls.update();

const initialCameraPosition = camera.position.clone();
const initialTarget = controls.target.clone();

const ambient = new THREE.AmbientLight(0x7dd3fc, 0.35);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
keyLight.position.set(6, 9, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.45);
fillLight.position.set(-4, 5, -6);
scene.add(fillLight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 14),
  new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.92,
    metalness: 0.05,
    transparent: true,
    opacity: 0.98,
    side: THREE.DoubleSide,
  })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
scene.add(ground);

const platform = new THREE.Mesh(
  new THREE.CircleGeometry(5.6, 48),
  new THREE.MeshStandardMaterial({
    color: 0x172554,
    transparent: true,
    opacity: 0.68,
    roughness: 0.9,
    metalness: 0.1,
    side: THREE.DoubleSide,
  })
);
platform.rotation.x = -Math.PI / 2;
platform.position.y = 0.001;
scene.add(platform);

const grid = new THREE.GridHelper(16, 16, 0x334155, 0x1e293b);
grid.position.y = 0.0005;
if (Array.isArray(grid.material)) {
  grid.material.forEach((material) => {
    material.transparent = true;
    material.opacity = 0.28;
  });
} else {
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
}
scene.add(grid);

const COLOR_STOPS = ["#38bdf8", "#22d3ee", "#34d399", "#f97316", "#ef4444"].map(
  (hex) => new THREE.Color(hex)
);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function rampColor(t, target) {
  const scaled = clamp(t, 0, 0.9999) * (COLOR_STOPS.length - 1);
  const index = Math.floor(scaled);
  const localT = scaled - index;
  const start = COLOR_STOPS[index];
  const end = COLOR_STOPS[index + 1] ?? COLOR_STOPS[index];
  return target.copy(start).lerp(end, localT);
}

const STATION_DATA = [
  { id: "HX-A", name: "北郊换流站", position: new THREE.Vector3(-5.2, 0.9, 2.6), baseLoad: 0.32 },
  { id: "HX-B", name: "新区主站", position: new THREE.Vector3(-2.8, 1.0, 1.4), baseLoad: 0.45 },
  { id: "HX-C", name: "中心枢纽", position: new THREE.Vector3(-0.2, 1.4, 0.4), baseLoad: 0.62 },
  { id: "HX-D", name: "科技园站", position: new THREE.Vector3(1.9, 1.1, -1.8), baseLoad: 0.38 },
  { id: "HX-E", name: "东部沿海站", position: new THREE.Vector3(4.3, 1.25, -0.4), baseLoad: 0.52 },
  { id: "HX-F", name: "南部枢纽", position: new THREE.Vector3(2.4, 1.0, 3.4), baseLoad: 0.5 },
  { id: "HX-G", name: "西南风电场", position: new THREE.Vector3(-1.0, 1.6, 4.6), baseLoad: 0.58 },
  { id: "HX-H", name: "西北抽蓄", position: new THREE.Vector3(-3.6, 1.3, -1.7), baseLoad: 0.36 },
];

const CONNECTIONS = [
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

const stationGroup = new THREE.Group();
scene.add(stationGroup);

const stationMap = new Map();
const ringGeometry = new THREE.RingGeometry(0.42, 0.58, 48);
const stationSphereGeometry = new THREE.SphereGeometry(0.32, 36, 36);

STATION_DATA.forEach((station, index) => {
  const group = new THREE.Group();
  group.position.set(station.position.x, 0, station.position.z);

  const pillarHeight = station.position.y;
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, pillarHeight, 24),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85, metalness: 0.18 })
  );
  pillar.position.y = pillarHeight / 2;
  group.add(pillar);

  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0f3f6d,
    emissiveIntensity: 0.4,
    metalness: 0.68,
    roughness: 0.35,
  });
  const sphere = new THREE.Mesh(stationSphereGeometry, sphereMaterial);
  sphere.position.y = pillarHeight + 0.32;
  group.add(sphere);

  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(ringGeometry, haloMaterial);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.02;
  group.add(halo);

  stationGroup.add(group);

  const stationState = {
    ...station,
    group,
    mesh: sphere,
    halo,
    pillarHeight,
    load: station.baseLoad,
    phase: index * 0.75,
  };

  stationMap.set(station.id, stationState);
});

const connectionGroup = new THREE.Group();
scene.add(connectionGroup);

const connections = CONNECTIONS.map(([fromId, toId], index) => {
  const from = stationMap.get(fromId);
  const to = stationMap.get(toId);
  if (!from || !to) return null;

  const start = from.position.clone();
  start.y += 0.35;
  const end = to.position.clone();
  end.y += 0.35;
  const control = start
    .clone()
    .add(end)
    .multiplyScalar(0.5);
  control.y += 1.6 + Math.sin(index * 0.8) * 0.5;

  const curve = new THREE.QuadraticBezierCurve3(start, control, end);
  const geometry = new THREE.TubeGeometry(curve, 48, 0.08, 12, false);
  const material = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.45,
    roughness: 0.22,
    metalness: 0.75,
    transparent: true,
    opacity: 0.82,
  });

  const mesh = new THREE.Mesh(geometry, material);
  connectionGroup.add(mesh);

  return {
    from,
    to,
    mesh,
    material,
    phase: index * 0.65,
  };
}).filter(Boolean);

const orbitPathPoints = [
  new THREE.Vector3(-6.5, 3.6, 7.2),
  new THREE.Vector3(-2.8, 4.8, 2.4),
  new THREE.Vector3(1.6, 5.2, -1.2),
  new THREE.Vector3(5.4, 3.8, 4.2),
  new THREE.Vector3(2.8, 3.4, 8.0),
];

const orbitCurve = new THREE.CatmullRomCurve3(orbitPathPoints, true, "centripetal");
const orbitGeometry = new THREE.TubeGeometry(orbitCurve, 160, 0.03, 12, true);
const orbitMaterial = new THREE.MeshBasicMaterial({
  color: 0x64748b,
  transparent: true,
  opacity: 0.35,
});
const orbitTube = new THREE.Mesh(orbitGeometry, orbitMaterial);
scene.add(orbitTube);

function updateCameraStatus() {
  cameraStatusEl.textContent = `Camera ${camera.position
    .toArray()
    .map((value) => value.toFixed(1))
    .join(", ")} · Target ${controls.target
    .toArray()
    .map((value) => value.toFixed(1))
    .join(", ")}`;
}

function updateStations(elapsed) {
  stationMap.forEach((station) => {
    const waveA = Math.sin(elapsed * 0.4 + station.phase) * 0.5 + 0.5;
    const waveB = Math.cos(elapsed * 0.95 + station.phase * 1.3) * 0.5 + 0.5;
    const load = clamp(
      station.baseLoad + (waveA * 0.6 + waveB * 0.4 - 0.5) * 0.55,
      0.12,
      0.98
    );
    station.load = load;

    const scale = 0.9 + load * 0.55;
    station.mesh.scale.set(scale, scale, scale);

    rampColor(load, station.mesh.material.color);
    station.mesh.material.emissive
      .copy(station.mesh.material.color)
      .multiplyScalar(0.45 + load * 0.4);

    station.halo.rotation.z = elapsed * 0.3 + station.phase * 0.2;
    station.halo.material.opacity = 0.3 + load * 0.45;
    rampColor(load, station.halo.material.color);
  });
}

function updateConnections(elapsed) {
  connections.forEach((connection) => {
    const load = (connection.from.load + connection.to.load) / 2;
    rampColor(load, connection.material.color);
    connection.material.emissive
      .copy(connection.material.color)
      .multiplyScalar(0.35 + load * 0.45);
    connection.material.opacity = 0.45 + load * 0.4;

    const pulse = Math.sin(elapsed * 1.4 + connection.phase) * 0.5 + 0.5;
    connection.mesh.scale.setScalar(0.95 + pulse * 0.06);
  });
}

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();
  controls.update();
  updateStations(elapsed);
  updateConnections(elapsed);
  updateCameraStatus();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

function resizeRenderer() {
  const { clientWidth, clientHeight } = container;
  renderer.setSize(clientWidth, clientHeight);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resizeRenderer);

focusHubBtn.addEventListener("click", () => {
  const hub = stationMap.get("HX-C");
  if (!hub) return;
  controls.target.copy(hub.position);
  const offset = new THREE.Vector3(2.4, 1.6, 3.4);
  camera.position.copy(hub.position).add(offset);
  controls.update();
});

resetCameraBtn.addEventListener("click", () => {
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialTarget);
  controls.update();
});

captureBtn.addEventListener("click", () => {
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "week04-scene.png";
  link.click();
});

resizeRenderer();
updateCameraStatus();
