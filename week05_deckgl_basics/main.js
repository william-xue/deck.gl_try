const tooltipEl = document.getElementById("tooltip");

const deckgl = new deck.DeckGL({
  container: "deck-container",
  views: new deck.MapView({ repeat: true }),
  initialViewState: {
    longitude: 121.4737,
    latitude: 31.2304,
    zoom: 8.5,
    pitch: 35,
    bearing: -20,
  },
  controller: true,
  mapStyle: null,
  parameters: {
    clearColor: [0.05, 0.08, 0.15, 1],
  },
});

function resolveProperties(object) {
  if (!object) return null;
  if (object.properties) return object.properties;
  return object;
}

function showTooltip({ x, y, object }) {
  const properties = resolveProperties(object);

  if (!properties) {
    tooltipEl.style.display = "none";
    tooltipEl.style.transform = "translate(-50%, calc(-100% - 10px))";
    return;
  }

  tooltipEl.style.display = "block";
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
  tooltipEl.style.transform = "translate(-50%, calc(-100% - 10px))";
  tooltipEl.innerHTML = `
    <strong>${properties.name ?? properties.id ?? "未命名节点"}</strong><br />
    负载：${properties.load != null ? (properties.load * 100).toFixed(1) + "%" : "--"}
  `;
}

function loadData() {
  return fetch("data.geojson").then((res) => res.json());
}

function generateSyntheticNetwork({
  pointCount = 12000,
  clusterCenters = [
    [121.2, 31.0],
    [121.6, 31.4],
    [121.0, 30.8],
    [121.8, 30.9],
    [120.9, 31.3],
    [121.45, 31.15],
  ],
  clusterSpread = 0.18,
}) {
  const nodes = [];
  const edges = [];
  const clusterBuckets = new Map();

  const randomWithin = () => (Math.random() - 0.5) * clusterSpread;

  for (let i = 0; i < pointCount; i++) {
    const clusterIndex = i % clusterCenters.length;
    const [baseLng, baseLat] = clusterCenters[clusterIndex];
    const position = [baseLng + randomWithin(), baseLat + randomWithin()];
    const load = Math.random() * 0.85 + 0.1;

    const node = {
      id: `SYN-${clusterIndex}-${i}`,
      name: `合成节点 ${clusterIndex + 1}-${i}`,
      cluster: clusterIndex,
      position,
      load,
    };

    nodes.push(node);
    if (!clusterBuckets.has(clusterIndex)) {
      clusterBuckets.set(clusterIndex, []);
    }
    clusterBuckets.get(clusterIndex).push(node);
  }

  clusterBuckets.forEach((bucket) => {
    bucket.sort((a, b) => a.position[0] - b.position[0]);
    for (let i = 0; i < bucket.length - 1; i++) {
      const current = bucket[i];
      const next = bucket[i + 1];
      edges.push({
        id: `${current.id}->${next.id}`,
        name: `${current.name} → ${next.name}`,
        sourcePosition: current.position,
        targetPosition: next.position,
        load: (current.load + next.load) / 2,
      });
    }
  });

  const clusterKeys = Array.from(clusterBuckets.keys());
  for (let i = 0; i < clusterKeys.length; i++) {
    const currentBucket = clusterBuckets.get(clusterKeys[i]);
    const nextBucket = clusterBuckets.get(clusterKeys[(i + 1) % clusterKeys.length]);
    if (currentBucket && nextBucket) {
      const source = currentBucket[Math.floor(Math.random() * currentBucket.length)];
      const target = nextBucket[Math.floor(Math.random() * nextBucket.length)];
      edges.push({
        id: `${source.id}::${target.id}`,
        name: `${source.name} ↔ ${target.name}`,
        sourcePosition: source.position,
        targetPosition: target.position,
        load: (source.load + target.load) / 2,
      });
    }
  }

  return { nodes, edges };
}

function createLayers(data) {
  const pointCollection = {
    type: "FeatureCollection",
    features: data.features.filter((f) => f.geometry.type === "Point"),
  };

  const lineCollection = {
    type: "FeatureCollection",
    features: data.features.filter((f) => f.geometry.type === "LineString"),
  };

  const synthetic = generateSyntheticNetwork({ pointCount: 12000 });

  const pointLayer = new deck.GeoJsonLayer({
    id: "power-nodes",
    data: pointCollection,
    pickable: true,
    stroked: false,
    filled: true,
    pointType: "circle",
    getPointRadius: (f) => 4000 + (f.properties.load ?? 0.5) * 6000,
    pointRadiusMinPixels: 6,
    pointRadiusMaxPixels: 32,
    getFillColor: (f) => {
      const load = f.properties.load ?? 0.5;
      const start = [59, 130, 246];
      const end = [239, 68, 68];
      const mix = start.map((v, i) => Math.round(v + (end[i] - v) * load));
      return [...mix, 220];
    },
    autoHighlight: true,
    highlightColor: [255, 255, 255, 180],
    onHover: showTooltip,
  });

  const pathLayer = new deck.GeoJsonLayer({
    id: "power-lines",
    data: lineCollection,
    pickable: true,
    stroked: false,
    filled: false,
    lineWidthUnits: "meters",
    getLineWidth: (f) => 1500 + (f.properties.load ?? 0.5) * 2000,
    getLineColor: (f) => {
      const load = f.properties.load ?? 0.4;
      const start = [96, 165, 250];
      const end = [251, 191, 36];
      return start.map((v, i) => Math.round(v + (end[i] - v) * load));
    },
    parameters: {
      depthTest: false,
    },
    onHover: showTooltip,
  });

  const syntheticLineLayer = new deck.LineLayer({
    id: "synthetic-links",
    data: synthetic.edges,
    pickable: true,
    getSourcePosition: (d) => d.sourcePosition,
    getTargetPosition: (d) => d.targetPosition,
    getColor: (d) => {
      const load = d.load ?? 0.5;
      const start = [96, 165, 250];
      const end = [251, 191, 36];
      return start.map((v, i) => Math.round(v + (end[i] - v) * load));
    },
    getWidth: (d) => 500 + (d.load ?? 0.5) * 1200,
    widthUnits: "meters",
    parameters: {
      depthTest: false,
    },
    onHover: showTooltip,
  });

  const syntheticPointLayer = new deck.ScatterplotLayer({
    id: "synthetic-nodes",
    data: synthetic.nodes,
    pickable: true,
    radiusUnits: "pixels",
    radiusMinPixels: 2,
    radiusMaxPixels: 12,
    getPosition: (d) => d.position,
    getRadius: (d) => 5 + (d.load ?? 0.5) * 8,
    getFillColor: (d) => {
      const load = d.load ?? 0.5;
      const start = [59, 130, 246];
      const end = [239, 68, 68];
      return start.map((v, i) => Math.round(v + (end[i] - v) * load));
    },
    opacity: 0.9,
    onHover: showTooltip,
  });

  return [syntheticLineLayer, pathLayer, pointLayer, syntheticPointLayer];
}

loadData()
  .then((data) => {
    const layers = createLayers(data);
    deckgl.setProps({ layers });
  })
  .catch((error) => {
    tooltipEl.style.display = "block";
    tooltipEl.style.left = "50%";
    tooltipEl.style.top = "50%";
    tooltipEl.style.transform = "translate(-50%, -50%)";
    tooltipEl.innerHTML = `加载数据失败：${error.message}`;
  });

// 可选：若有 Mapbox Token，可取消注释以下代码启用底图
// deckgl.setProps({
//   mapStyle: "mapbox://styles/mapbox/dark-v11",
//   mapboxApiAccessToken: window.MAPBOX_TOKEN,
// });
