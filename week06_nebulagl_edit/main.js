const MODES = {
  modify: nebula.ModifyMode,
  translate: nebula.TranslateMode,
  drawLineString: nebula.DrawLineStringMode,
  measureDistance: nebula.MeasureDistanceMode,
};

const buttons = Array.from(document.querySelectorAll("button[data-mode]"));
const output = document.getElementById("geojson-output");

const initialData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "浦东转换站", load: 0.78 },
      geometry: { type: "Point", coordinates: [121.79, 31.25] },
    },
    {
      type: "Feature",
      properties: { name: "嘉兴枢纽", load: 0.54 },
      geometry: { type: "Point", coordinates: [120.76, 30.76] },
    },
    {
      type: "Feature",
      properties: { name: "示例线路", load: 0.65 },
      geometry: {
        type: "LineString",
        coordinates: [
          [121.79, 31.25],
          [121.25, 31.08],
          [120.76, 30.76],
        ],
      },
    },
  ],
};

let currentMode = "modify";
let geojson = initialData;

const deckgl = new deck.DeckGL({
  container: "deck",
  views: new deck.MapView({ repeat: true }),
  initialViewState: {
    longitude: 121.2,
    latitude: 31.0,
    zoom: 7.8,
    pitch: 45,
    bearing: -30,
  },
  controller: true,
  mapStyle: null,
  parameters: {
    clearColor: [0.03, 0.06, 0.12, 1],
  },
});

function formatGeoJSON(data) {
  return JSON.stringify(data, null, 2);
}

function updateOutput(data) {
  output.value = formatGeoJSON(data);
}

function createEditableLayer() {
  return new nebula.EditableGeoJsonLayer({
    id: "editable-network",
    data: geojson,
    mode: MODES[currentMode],
    selectedFeatureIndexes: [],
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 200],
    pointRadiusMinPixels: 6,
    getPointRadius: (f) => 6000 + (f.properties.load ?? 0.4) * 4000,
    getPointFillColor: (f) => {
      const load = f.properties.load ?? 0.4;
      return [59 + load * 180, 130 - load * 40, 246 - load * 140, 230];
    },
    getLineColor: (f) => {
      const load = f.properties.load ?? 0.5;
      return [96 + load * 80, 165 - load * 70, 250 - load * 160, 255];
    },
    getLineWidth: (f) => 1500 + (f.properties.load ?? 0.5) * 2500,
    lineWidthUnits: "meters",
    modeConfig: {
      turfOptions: {
        units: "kilometers",
      },
    },
    onEdit: ({ updatedData, editType }) => {
      geojson = updatedData;
      updateOutput(updatedData);
      if (editType !== "setTentativeFeature") {
        console.info("Edit event", editType);
      }
      refreshLayers();
    },
  });
}

function refreshLayers() {
  deckgl.setProps({ layers: [createEditableLayer()] });
}

function setMode(mode) {
  currentMode = mode;
  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  refreshLayers();
}

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setMode(btn.dataset.mode);
  });
});

setMode(currentMode);
updateOutput(geojson);
