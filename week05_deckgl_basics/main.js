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

function showTooltip({ x, y, object }) {
  if (!object) {
    tooltipEl.style.display = "none";
    tooltipEl.style.transform = "translate(-50%, calc(-100% - 10px))";
    return;
  }

  const { properties = {} } = object;
  tooltipEl.style.display = "block";
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
  tooltipEl.style.transform = "translate(-50%, calc(-100% - 10px))";
  tooltipEl.innerHTML = `
    <strong>${properties.name ?? "未命名节点"}</strong><br />
    负载：${properties.load != null ? (properties.load * 100).toFixed(1) + "%" : "--"}
  `;
}

function loadData() {
  return fetch("data.geojson").then((res) => res.json());
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

  return [pathLayer, pointLayer];
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
