const SAMPLE_MILEPOSTS = {
  type: "FeatureCollection",
  features: [
    point("freeway", "國道1號", "south", 10.0, 25.04722, 121.58532, "示範點：國道1號南下 10K"),
    point("freeway", "國道1號", "south", 10.5, 25.04316, 121.58928, "示範點：國道1號南下 10K+500"),
    point("freeway", "國道1號", "north", 10.0, 25.04864, 121.58419, "示範點：國道1號北上 10K"),
    point("freeway", "國道3號", "south", 30.0, 24.98804, 121.46458, "示範點：國道3號南下 30K"),
    point("expressway", "台61線", "south", 72.0, 24.68759, 120.83906, "示範點：台61線南下 72K"),
    point("expressway", "台64線", "east", 12.0, 25.03077, 121.48661, "示範點：台64線東向 12K"),
    point("provincial", "台1線", "south", 26.0, 25.00693, 121.46014, "示範點：台1線南下 26K"),
    point("provincial", "台3線", "north", 42.0, 24.91849, 121.28155, "示範點：台3線北上 42K"),
    point("provincial", "台9線", "south", 118.0, 24.75486, 121.76079, "示範點：台9線南下 118K"),
    point("provincial", "台17線", "south", 158.0, 23.02846, 120.17838, "示範點：台17線南下 158K"),
    point("provincial", "台20線", "east", 48.0, 23.11646, 120.53616, "示範點：台20線東向 48K")
  ]
};

const ROUTE_GROUPS = {
  freeway: ["國道1號", "國道3號", "國道5號", "國道6號", "國道8號", "國道10號"],
  expressway: ["台61線", "台61乙線", "台62線", "台62甲線", "台63線", "台63甲線", "台64線", "台65線", "台66線", "台68線", "台68甲線", "台72線", "台74線", "台74甲線", "台76線", "台78線", "台82線", "台84線", "台86線", "台88線"],
  provincial: []
};

const DIRECTIONS = {
  south: "南下",
  north: "北上",
  east: "東向",
  west: "西向",
  順向: "順向",
  逆向: "逆向"
};

const LINE_COLORS = {
  freeway: "#cf4f2d",
  expressway: "#0d6b5d",
  provincial: "#2d7dd2"
};

const INTERPOLATION_GAP_LIMITS = {
  high: 1,
  medium: 3
};

const DEFAULT_ROUTE_DIRECTIONS = {
  "台20線": ["east", "west"],
  "台62線": ["east", "west"],
  "台62甲線": ["east", "west"],
  "台63甲線": ["east", "west"],
  "台64線": ["east", "west"],
  "台66線": ["east", "west"],
  "台68線": ["east", "west"],
  "台68甲線": ["east", "west"],
  "台72線": ["east", "west"],
  "台78線": ["east", "west"],
  "台82線": ["east", "west"],
  "台84線": ["east", "west"],
  "台86線": ["east", "west"],
  "台88線": ["east", "west"]
};

const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
const WEATHER_FORECAST_DAYS = 8;
const WEATHER_CODE_LABELS = {
  0: "晴朗",
  1: "大致晴朗",
  2: "局部多雲",
  3: "陰天",
  45: "霧",
  48: "霧凇",
  51: "毛毛雨",
  53: "毛毛雨",
  55: "毛毛雨",
  56: "凍毛毛雨",
  57: "凍毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  66: "凍雨",
  67: "凍雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "陣雨",
  81: "陣雨",
  82: "強陣雨",
  85: "陣雪",
  86: "強陣雪",
  95: "雷雨",
  96: "雷雨冰雹",
  99: "雷雨冰雹"
};

const state = {
  category: "freeway",
  data: SAMPLE_MILEPOSTS,
  cctvs: [],
  cctvMetadata: null,
  nearbyCctvs: [],
  selectedFeature: null,
  mapQueryFeature: null,
  mapCandidates: [],
  weatherForecast: null
};

const routeSelect = document.querySelector("#routeSelect");
const directionSelect = document.querySelector("#directionSelect");
const kmInput = document.querySelector("#kmInput");
const resultCard = document.querySelector("#resultCard");
const dataStatus = document.querySelector("#dataStatus");
const streetViewButton = document.querySelector("#streetViewButton");
const locateButton = document.querySelector("#locateButton");
const segments = Array.from(document.querySelectorAll(".segment"));
const cameraDialog = document.querySelector("#cameraDialog");
const cameraDialogImage = document.querySelector("#cameraDialogImage");
const cameraDialogTitle = document.querySelector("#cameraDialogTitle");
const cameraDialogMeta = document.querySelector("#cameraDialogMeta");
const cameraDialogStream = document.querySelector("#cameraDialogStream");
const cameraDialogSnapshot = document.querySelector("#cameraDialogSnapshot");
const cameraDialogCloseButtons = Array.from(document.querySelectorAll("[data-close-camera-dialog]"));

const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: feature => {
    if (feature.get("isCctvMarker")) {
      return new ol.style.Style({
        image: new ol.style.RegularShape({
          points: 4,
          radius: 8,
          angle: Math.PI / 4,
          fill: new ol.style.Fill({ color: "#2d7dd2" }),
          stroke: new ol.style.Stroke({ color: "#ffffff", width: 2 })
        }),
        text: new ol.style.Text({
          text: String(feature.get("cctvRank") || ""),
          font: "700 10px Arial, sans-serif",
          fill: new ol.style.Fill({ color: "#ffffff" }),
          offsetY: 1
        })
      });
    }
    if (feature.get("isMapQuery")) {
      return new ol.style.Style({
        image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({ color: "#ffffff" }),
          stroke: new ol.style.Stroke({ color: "#0d6b5d", width: 3 })
        })
      });
    }
    if (!feature.get("isSearchResult")) return null;
    const confidence = feature.get("confidence");
    const color = confidence === "low" ? "#b45309" : "#172026";
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({ color }),
        stroke: new ol.style.Stroke({ color: "#ffffff", width: 2 })
      })
    });
  }
});

const map = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    vectorLayer
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([121.0, 23.8]),
    zoom: 7.5
  })
});
const cctvSnapshotOverlays = [];

function clearCctvSnapshotOverlays() {
  cctvSnapshotOverlays.splice(0).forEach(overlay => map.removeOverlay(overlay));
}

function renderCctvSnapshotOverlays(items) {
  clearCctvSnapshotOverlays();
  items.forEach((item, index) => {
    const { camera, distanceKm } = item;
    const props = camera.properties;
    if (!props.imageUrl) return;
    const title = cameraTitle(props);
    const element = document.createElement("button");
    element.type = "button";
    element.className = "cctv-map-snapshot";
    element.setAttribute("aria-label", `開啟 ${title} 影像`);
    element.innerHTML = `
      <span>${index + 1}</span>
      <img src="${escapeHtml(props.imageUrl)}" alt="${escapeHtml(title)} 快照" loading="lazy" />
    `;
    element.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      openCameraDialog(camera, distanceKm);
    });
    element.querySelector("img").addEventListener("error", () => element.classList.add("is-broken"));

    const overlay = new ol.Overlay({
      element,
      positioning: cctvSnapshotPositioning(camera.geometry.coordinates, index),
      stopEvent: true,
      offset: cctvSnapshotOffset(camera.geometry.coordinates, index)
    });
    overlay.setPosition(ol.proj.fromLonLat(camera.geometry.coordinates));
    map.addOverlay(overlay);
    cctvSnapshotOverlays.push(overlay);
  });
}

function cctvSnapshotPositioning(cameraCoord, index) {
  return cctvSnapshotShouldAvoidTarget(cameraCoord, index) ? "center-center" : "bottom-center";
}

function cctvSnapshotOffset(cameraCoord, index) {
  const fallbackOffsets = [
    [0, -16],
    [18, -22],
    [-18, -22]
  ];
  const selectedCoord = state.selectedFeature?.geometry?.coordinates;
  if (!selectedCoord || typeof map.getPixelFromCoordinate !== "function") {
    return fallbackOffsets[index] || fallbackOffsets[0];
  }

  const cameraPixel = map.getPixelFromCoordinate(ol.proj.fromLonLat(cameraCoord));
  const targetPixel = map.getPixelFromCoordinate(ol.proj.fromLonLat(selectedCoord));
  if (!cameraPixel || !targetPixel) return fallbackOffsets[index] || fallbackOffsets[0];

  const dx = cameraPixel[0] - targetPixel[0];
  const dy = cameraPixel[1] - targetPixel[1];
  const distance = Math.hypot(dx, dy);
  if (distance > 170) return fallbackOffsets[index] || fallbackOffsets[0];

  const closeOffsets = [
    [104, -72],
    [-104, -72],
    [0, -132]
  ];
  if (distance < 8) return closeOffsets[index] || closeOffsets[0];

  const horizontal = dx >= 0 ? 104 : -104;
  const vertical = dy >= 0 ? 74 : -74;
  return [horizontal, vertical];
}

function cctvSnapshotShouldAvoidTarget(cameraCoord, index) {
  const offset = cctvSnapshotOffset(cameraCoord, index);
  return Math.abs(offset[0]) > 50 || Math.abs(offset[1]) > 50;
}

function cameraTitle(props) {
  const direction = DIRECTIONS[props.direction] || props.direction || "";
  return [props.route, direction, props.mile].filter(Boolean).join(" ") || "交通攝影機";
}

function openCameraDialog(camera, distanceKm) {
  const props = camera.properties;
  const title = cameraTitle(props);
  const streamUrl = props.streamUrl || props.imageUrl;
  cameraDialogImage.src = props.imageUrl || streamUrl || "";
  cameraDialogImage.alt = `${title} 快照`;
  cameraDialogTitle.textContent = title;
  cameraDialogMeta.textContent = [
    props.description || props.id || "交通部 CCTV",
    Number.isFinite(distanceKm) ? `距定位點 ${formatDistance(distanceKm)}` : "",
    props.source || ""
  ].filter(Boolean).join(" · ");
  cameraDialogStream.href = streamUrl || "#";
  cameraDialogSnapshot.href = props.imageUrl || streamUrl || "#";
  cameraDialog.hidden = false;
}

function closeCameraDialog() {
  cameraDialog.hidden = true;
  cameraDialogImage.removeAttribute("src");
}

function point(category, route, direction, km, lat, lon, label) {
  return {
    type: "Feature",
    properties: { category, route, direction, km, label },
    geometry: { type: "Point", coordinates: [lon, lat] }
  };
}

function normalizeFeature(rawFeature) {
  const props = rawFeature.properties || {};
  const coords = rawFeature.geometry?.coordinates;
  const route = props.route || props.road || props.roadName || "";
  const directions = normalizeDirections(props.direction || props.dir || "", route);
  return directions.map(direction => ({
    type: "Feature",
    properties: {
      category: props.category || inferCategory(route),
      route,
      direction,
      km: Number(props.km ?? props.mileage ?? props.mile),
      label: props.label || props.name || ""
    },
    geometry: {
      type: "Point",
      coordinates: coords
    }
  }));
}

function normalizeDirections(value, route = "") {
  const text = String(value).trim().toLowerCase();
  if (["south", "s", "南", "南下"].includes(text)) return ["south"];
  if (["north", "n", "北", "北上"].includes(text)) return ["north"];
  if (["east", "e", "東", "東向", "東行"].includes(text)) return ["east"];
  if (["west", "w", "西", "西向", "西行"].includes(text)) return ["west"];
  if (["雙向", "雙", "m", "順向", "逆向", ""].includes(text)) return defaultDirections(route);
  return defaultDirections(route);
}

function defaultDirections(route) {
  return DEFAULT_ROUTE_DIRECTIONS[route] || ["north", "south"];
}

function dedupeFeatures(features) {
  const seen = new Set();
  return features.filter(feature => {
    const [lon, lat] = feature.geometry.coordinates;
    const props = feature.properties;
    const key = [props.route, props.direction, props.km, lon, lat].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inferCategory(route = "") {
  if (route.startsWith("國道")) return "freeway";
  if (ROUTE_GROUPS.expressway.includes(route)) return "expressway";
  return "provincial";
}

async function loadData() {
  let milepostMessage = "";
  let cctvMessage = "";
  try {
    const geojson = await fetchOfficialMileposts();
    state.data = {
      type: "FeatureCollection",
      features: dedupeFeatures(geojson.features.flatMap(normalizeFeature).filter(isValidFeature))
    };
    milepostMessage = `已載入正式資料：${state.data.features.length.toLocaleString()} 筆里程點。`;
  } catch {
    milepostMessage = `目前使用內建示範資料：${SAMPLE_MILEPOSTS.features.length} 筆。正式資料載入失敗時會自動退回示範資料。`;
  }

  try {
    const cctvGeojson = await fetchOfficialCctvs();
    state.cctvs = cctvGeojson.features.map(normalizeCctvFeature).filter(isValidCctv);
    state.cctvMetadata = cctvGeojson.metadata || null;
    cctvMessage = `已載入 ${state.cctvs.length.toLocaleString()} 支 CCTV。`;
  } catch {
    state.cctvs = [];
    cctvMessage = "CCTV 資料載入失敗，定位仍可使用。";
  }
  dataStatus.textContent = `${milepostMessage} ${cctvMessage}`;
  refreshRouteOptions();
  markPending();
}

function markPending() {
  state.selectedFeature = null;
  state.nearbyCctvs = [];
  state.mapQueryFeature = null;
  state.mapCandidates = [];
  state.weatherForecast = null;
  vectorSource.clear();
  clearCctvSnapshotOverlays();
  streetViewButton.removeAttribute("href");
  streetViewButton.classList.add("is-disabled");
  resultCard.innerHTML = `<p class="muted">請確認道路、方向與里程，按「定位」後地圖才會跳轉。</p>`;
}

async function fetchOfficialMileposts() {
  const packedResponse = await fetch("./data/mileposts.geojson.gz.b64", { cache: "no-store" });
  if (packedResponse.ok && "DecompressionStream" in window) {
    const encoded = (await packedResponse.text()).trim();
    const binary = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
    const stream = new Blob([binary]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).json();
  }

  const response = await fetch("./data/mileposts.geojson", { cache: "no-store" });
  if (!response.ok) throw new Error("No prepared data file");
  return response.json();
}

function isValidFeature(feature) {
  return Boolean(
    feature.properties.route &&
      Number.isFinite(feature.properties.km) &&
      Array.isArray(feature.geometry.coordinates) &&
      feature.geometry.coordinates.length >= 2
  );
}

function refreshRouteOptions() {
  const officialRoutes = ROUTE_GROUPS[state.category] || [];
  const dataRoutes = state.data.features
    .map(feature => feature.properties.route)
    .filter(route => inferCategory(route) === state.category);
  const routes = Array.from(new Set([...officialRoutes, ...dataRoutes]))
    .sort((left, right) => routeSortKey(left).localeCompare(routeSortKey(right), "zh-Hant", { numeric: true }));
  routeSelect.innerHTML = routes.map(route => `<option value="${route}">${route}</option>`).join("");
  refreshDirectionOptions();
}

async function fetchOfficialCctvs() {
  const packedResponse = await fetch("./data/cctv.geojson.gz.b64", { cache: "no-store" });
  if (packedResponse.ok && "DecompressionStream" in window) {
    const encoded = (await packedResponse.text()).trim();
    const binary = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
    const stream = new Blob([binary]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).json();
  }

  const response = await fetch("./data/cctv.geojson", { cache: "no-store" });
  if (!response.ok) throw new Error("No prepared CCTV data file");
  return response.json();
}

function normalizeCctvFeature(rawFeature) {
  const props = rawFeature.properties || {};
  const mile = props.mile || props.LocationMile || "";
  return {
    type: "Feature",
    properties: {
      id: props.id || props.CCTVID || "",
      source: props.source || "",
      route: props.route || props.RoadName || "",
      direction: props.direction || normalizeCameraDirection(props.RoadDirection),
      mile,
      km: parseMileageInput(mile),
      description: props.description || props.SurveillanceDescription || "",
      streamUrl: props.streamUrl || props.VideoStreamURL || "",
      imageUrl: props.imageUrl || props.VideoImageURL || ""
    },
    geometry: rawFeature.geometry || {}
  };
}

function normalizeCameraDirection(value) {
  const text = String(value || "").trim().toUpperCase();
  if (text === "S") return "south";
  if (text === "N") return "north";
  if (text === "E") return "east";
  if (text === "W") return "west";
  return text.toLowerCase();
}

function isValidCctv(feature) {
  return Boolean(
    Array.isArray(feature.geometry.coordinates) &&
      feature.geometry.coordinates.length >= 2 &&
      Number.isFinite(Number(feature.geometry.coordinates[0])) &&
      Number.isFinite(Number(feature.geometry.coordinates[1])) &&
      (feature.properties.streamUrl || feature.properties.imageUrl)
  );
}

function routeSortKey(route) {
  const match = String(route).match(/^(國道|台)(\d+)(甲|乙|丙|丁|戊|己)?/);
  if (!match) return route;
  const suffixOrder = { 甲: "1", 乙: "2", 丙: "3", 丁: "4", 戊: "5", 己: "6" };
  return `${match[1]}${String(match[2]).padStart(3, "0")}${suffixOrder[match[3]] || "0"}`;
}

function refreshDirectionOptions() {
  const route = routeSelect.value;
  const routeFeatures = state.data.features.filter(feature => feature.properties.route === route);
  const available = Array.from(new Set(routeFeatures.map(feature => feature.properties.direction))).filter(Boolean);
  const reliableExpresswayDirections = available.filter(direction => direction === "順向" || direction === "逆向");
  const reliableProvincialDirections = available.filter(direction => ["north", "south", "east", "west"].includes(direction));
  const directions = state.category === "expressway" && reliableExpresswayDirections.length
    ? reliableExpresswayDirections
    : state.category === "provincial" && reliableProvincialDirections.length
      ? reliableProvincialDirections
    : available.length ? available : ["south", "north", "east", "west"];
  directionSelect.innerHTML = directions
    .map(direction => `<option value="${direction}">${DIRECTIONS[direction] || direction}</option>`)
    .join("");
}

function refreshMap() {
  vectorSource.clear();
  renderCctvSnapshotOverlays(state.nearbyCctvs);
  if (state.selectedFeature) {
    vectorSource.addFeature(new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat(state.selectedFeature.geometry.coordinates)),
      isSearchResult: true,
      ...state.selectedFeature.properties
    }));
  }
  if (state.mapQueryFeature) {
    vectorSource.addFeature(new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat(state.mapQueryFeature.geometry.coordinates)),
      isMapQuery: true
    }));
  }

  state.nearbyCctvs.forEach((item, index) => {
    const camera = item.camera;
    const props = camera.properties;
    vectorSource.addFeature(new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat(camera.geometry.coordinates)),
      isCctvMarker: true,
      cctvRank: index + 1,
      cctvId: props.id,
      route: props.route,
      direction: props.direction,
      mile: props.mile
    }));
  });
}

function cctvControlPoints(route, direction) {
  const byDirection = state.cctvs.filter(camera => {
    const props = camera.properties;
    return props.route === route &&
      props.direction === direction &&
      Number.isFinite(props.km) &&
      Array.isArray(camera.geometry.coordinates);
  });
  const source = byDirection.length
    ? byDirection
    : state.cctvs.filter(camera => {
      const props = camera.properties;
      return props.route === route &&
        Number.isFinite(props.km) &&
        Array.isArray(camera.geometry.coordinates);
    });

  return source.map(camera => {
    const props = camera.properties;
    return {
      type: "Feature",
      properties: {
        category: inferCategory(props.route),
        route: props.route,
        direction: props.direction || direction,
        km: props.km,
        label: `${props.route} ${DIRECTIONS[props.direction] || props.direction || ""} ${props.mile} CCTV`,
        sourceType: "cctv",
        cctvId: props.id,
        cctvDescription: props.description,
        streamUrl: props.streamUrl,
        imageUrl: props.imageUrl
      },
      geometry: {
        type: "Point",
        coordinates: camera.geometry.coordinates
      }
    };
  });
}

function mergeControlPoints(primary, auxiliary) {
  const seen = new Set();
  return [...primary, ...auxiliary].filter(feature => {
    const props = feature.properties;
    const [lon, lat] = feature.geometry.coordinates;
    const key = [props.route, props.direction, props.km, lon, lat, props.sourceType || "milepost"].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isCctvControlPoint(feature) {
  return feature?.properties?.sourceType === "cctv";
}

function controlPointSource(feature) {
  return isCctvControlPoint(feature) ? "CCTV" : "里程點";
}

function controlPointLabel(feature) {
  const props = feature.properties;
  const direction = DIRECTIONS[props.direction] || props.direction || "";
  const source = controlPointSource(feature);
  return [props.route, direction, formatKm(props.km), source].filter(Boolean).join(" ");
}

async function locate() {
  const route = routeSelect.value;
  const direction = directionSelect.value;
  const km = parseMileageInput(kmInput.value);
  const candidates = state.data.features.filter(feature => {
    return feature.properties.route === route && feature.properties.direction === direction;
  });
  const fallbackCandidates = state.data.features.filter(feature => feature.properties.route === route);
  const milepostPool = candidates.length ? candidates : fallbackCandidates;
  const auxiliaryPool = cctvControlPoints(route, direction);
  const pool = mergeControlPoints(milepostPool, auxiliaryPool);

  if (!route || !Number.isFinite(km) || !pool.length) {
    renderNoResult(route, direction);
    return;
  }

  locateButton.disabled = true;
  const originalLabel = locateButton.textContent;
  locateButton.textContent = "定位中";
  const match = await resolveMilepost(pool, km).finally(() => {
    locateButton.disabled = false;
    locateButton.textContent = originalLabel;
  });

  if (!match) {
    renderNoResult(route, direction);
    return;
  }

  const lonLat = match.feature.geometry.coordinates;
  const streetViewUrl = makeStreetViewUrl(lonLat);
  const nearbyCctvs = nearestCctvs(lonLat, 3);

  state.selectedFeature = match.feature;
  state.nearbyCctvs = nearbyCctvs;
  state.mapQueryFeature = null;
  state.mapCandidates = [];
  state.weatherForecast = {
    status: "loading",
    updatedAt: new Date()
  };
  refreshMap();

  streetViewButton.href = streetViewUrl;
  streetViewButton.classList.remove("is-disabled");
  map.getView().animate({ center: ol.proj.fromLonLat(lonLat), zoom: 15, duration: 350 });
  renderResult(match.feature, match.diff, lonLat, streetViewUrl, nearbyCctvs);
  loadWeatherForSelection(match.feature, lonLat, match.diff, streetViewUrl, nearbyCctvs);
}

async function resolveMilepost(pool, km) {
  const sorted = pool
    .filter(feature => Number.isFinite(feature.properties.km) && Array.isArray(feature.geometry.coordinates))
    .slice()
    .sort((a, b) => Number(a.properties.km) - Number(b.properties.km));

  if (!sorted.length) return null;

  const exact = sorted.find(feature => Math.abs(Number(feature.properties.km) - km) < 0.0005);
  if (exact) {
    const snapped = await snapToRoad(exact.geometry.coordinates);
    const usedCctvAux = isCctvControlPoint(exact);
    const feature = cloneFeature(exact, {
      matchType: "direct",
      requestedKm: km,
      confidence: "high",
      interpolationMethod: snapped ? "road" : "milepost",
      roadGeometryStatus: snapped ? "已貼合道路" : "",
      usedCctvAux,
      controlPointSource: controlPointSource(exact),
      controlPointLabel: controlPointLabel(exact)
    });
    if (snapped) feature.geometry.coordinates = snapped.coordinate;
    return {
      feature,
      diff: 0
    };
  }

  let lower = null;
  let upper = null;
  for (const feature of sorted) {
    const featureKm = Number(feature.properties.km);
    if (featureKm < km) lower = feature;
    if (featureKm > km) {
      upper = feature;
      break;
    }
  }

  if (lower && upper && Number(upper.properties.km) !== Number(lower.properties.km)) {
    const lowerKm = Number(lower.properties.km);
    const upperKm = Number(upper.properties.km);
    const gapKm = upperKm - lowerKm;
    const ratio = (km - lowerKm) / (upperKm - lowerKm);
    const lowerCoord = lower.geometry.coordinates;
    const upperCoord = upper.geometry.coordinates;
    const usedCctvAux = isCctvControlPoint(lower) || isCctvControlPoint(upper);
    let interpolatedCoord = [
      lowerCoord[0] + (upperCoord[0] - lowerCoord[0]) * ratio,
      lowerCoord[1] + (upperCoord[1] - lowerCoord[1]) * ratio
    ];
    const confidence = interpolationConfidence(gapKm);
    let interpolationMethod = "linear";
    let roadDistanceKm = null;
    let roadGeometryStatus = "";

    const roadMatch = await interpolateAlongRoad(lowerCoord, upperCoord, ratio, gapKm);
    if (roadMatch) {
      interpolatedCoord = roadMatch.coordinate;
      interpolationMethod = "road";
      roadDistanceKm = roadMatch.distanceKm;
    } else {
      const snapped = await snapToRoad(interpolatedCoord);
      if (snapped) {
        interpolatedCoord = snapped.coordinate;
        interpolationMethod = "road";
        roadGeometryStatus = "無法取得完整道路線形，已將估算點貼合最近道路";
      } else {
        roadGeometryStatus = "無法取得道路線形，已退回兩點直線估算";
      }
    }

    return {
      feature: {
        type: "Feature",
        properties: {
          ...lower.properties,
          km,
          label: `${formatKm(km)} 內插估算`,
          matchType: "interpolated",
          requestedKm: km,
          lowerKm,
          upperKm,
          gapKm,
          confidence,
          interpolationMethod,
          roadDistanceKm,
          roadGeometryStatus,
          usedCctvAux,
          lowerSource: controlPointSource(lower),
          upperSource: controlPointSource(upper),
          lowerLabel: controlPointLabel(lower),
          upperLabel: controlPointLabel(upper)
        },
        geometry: {
          type: "Point",
          coordinates: interpolatedCoord
        }
      },
      diff: 0
    };
  }

  const nearest = sorted.reduce((best, feature) => {
    const diff = Math.abs(Number(feature.properties.km) - km);
    return !best || diff < best.diff ? { feature, diff } : best;
  }, null);

  const snapped = await snapToRoad(nearest.feature.geometry.coordinates);
  const usedCctvAux = isCctvControlPoint(nearest.feature);
  const nearestFeature = cloneFeature(nearest.feature, {
    matchType: "nearest",
    requestedKm: km,
    confidence: "low",
    interpolationMethod: snapped ? "road" : "nearest",
    roadGeometryStatus: snapped ? "已將最近里程點貼合道路" : "",
    usedCctvAux,
    controlPointSource: controlPointSource(nearest.feature),
    controlPointLabel: controlPointLabel(nearest.feature)
  });
  if (snapped) nearestFeature.geometry.coordinates = snapped.coordinate;

  return {
    feature: nearestFeature,
    diff: nearest.diff
  };
}

function interpolationConfidence(gapKm) {
  if (gapKm <= INTERPOLATION_GAP_LIMITS.high) return "high";
  if (gapKm <= INTERPOLATION_GAP_LIMITS.medium) return "medium";
  return "low";
}

async function interpolateAlongRoad(startCoord, endCoord, ratio, expectedGapKm) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4500);
  try {
    const query = `${startCoord[0]},${startCoord[1]};${endCoord[0]},${endCoord[1]}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${query}?overview=full&geometries=geojson&alternatives=false&steps=false`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const payload = await response.json();
    const route = payload.routes?.[0];
    const coordinates = route?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
    const distanceKm = Number(route.distance) / 1000;
    if (!Number.isFinite(distanceKm) || distanceKm > expectedGapKm * 4 + 5) return null;
    return {
      coordinate: interpolateAlongCoordinates(coordinates, ratio),
      distanceKm
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function snapToRoad(coord) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3500);
  try {
    const url = `https://router.project-osrm.org/nearest/v1/driving/${coord[0]},${coord[1]}?number=1`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const payload = await response.json();
    const waypoint = payload.waypoints?.[0];
    if (!Array.isArray(waypoint?.location)) return null;
    const distanceMeters = Number(waypoint.distance);
    if (Number.isFinite(distanceMeters) && distanceMeters > 1000) return null;
    return {
      coordinate: waypoint.location,
      distanceMeters
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

function interpolateAlongCoordinates(coordinates, ratio) {
  const segments = [];
  let total = 0;
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const start = coordinates[index];
    const end = coordinates[index + 1];
    const length = haversineKm(start, end);
    segments.push({ start, end, length });
    total += length;
  }

  if (!total) return coordinates[0];

  let remaining = total * ratio;
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const segmentRatio = segment.length ? remaining / segment.length : 0;
      return [
        segment.start[0] + (segment.end[0] - segment.start[0]) * segmentRatio,
        segment.start[1] + (segment.end[1] - segment.start[1]) * segmentRatio
      ];
    }
    remaining -= segment.length;
  }

  return coordinates[coordinates.length - 1];
}

function haversineKm(start, end) {
  const radiusKm = 6371;
  const toRad = value => value * Math.PI / 180;
  const dLat = toRad(end[1] - start[1]);
  const dLon = toRad(end[0] - start[0]);
  const lat1 = toRad(start[1]);
  const lat2 = toRad(end[1]);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestCctvs(coord, limit = 3) {
  if (!state.cctvs.length) return [];
  return state.cctvs
    .map(camera => ({
      camera,
      distanceKm: haversineKm(coord, camera.geometry.coordinates)
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, limit);
}

async function loadWeatherForSelection(feature, lonLat, diff, streetViewUrl, nearbyCctvs) {
  try {
    const forecast = await fetchWeatherForecast(lonLat);
    if (state.selectedFeature !== feature) return;
    state.weatherForecast = {
      status: "ready",
      updatedAt: new Date(),
      days: forecast
    };
  } catch (error) {
    if (state.selectedFeature !== feature) return;
    state.weatherForecast = {
      status: "error",
      updatedAt: new Date(),
      message: error?.message || "天氣預報暫時無法載入。"
    };
  }
  renderResult(feature, diff, lonLat, streetViewUrl, nearbyCctvs);
}

async function fetchWeatherForecast([lon, lat]) {
  const params = new URLSearchParams({
    latitude: lat.toFixed(5),
    longitude: lon.toFixed(5),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "wind_speed_10m_max"
    ].join(","),
    timezone: "Asia/Taipei",
    forecast_days: String(WEATHER_FORECAST_DAYS)
  });
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5500);
  try {
    const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`, { signal: controller.signal });
    if (!response.ok) throw new Error("天氣服務回應異常。");
    const payload = await response.json();
    const daily = payload.daily || {};
    if (!Array.isArray(daily.time) || !daily.time.length) throw new Error("天氣資料格式異常。");
    return daily.time.map((date, index) => ({
      date,
      code: daily.weather_code?.[index],
      high: daily.temperature_2m_max?.[index],
      low: daily.temperature_2m_min?.[index],
      rainChance: daily.precipitation_probability_max?.[index],
      windKmh: daily.wind_speed_10m_max?.[index]
    })).filter(day => day.date);
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("天氣預報載入逾時。");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function allControlPoints() {
  const cctvPoints = state.cctvs
    .filter(camera => Number.isFinite(camera.properties.km) && Array.isArray(camera.geometry.coordinates))
    .map(camera => {
      const props = camera.properties;
      return {
        type: "Feature",
        properties: {
          category: inferCategory(props.route),
          route: props.route,
          direction: props.direction,
          km: props.km,
          label: `${cameraTitle(props)} CCTV`,
          sourceType: "cctv"
        },
        geometry: {
          type: "Point",
          coordinates: camera.geometry.coordinates
        }
      };
    });
  return mergeControlPoints(state.data.features, cctvPoints);
}

function mapClickCandidates(coord, limit = 5) {
  const clickPoint = ol.proj.fromLonLat(coord);
  const groups = new Map();

  allControlPoints()
    .filter(feature => {
      const props = feature.properties;
      return props.route && props.direction && Number.isFinite(props.km) && Array.isArray(feature.geometry.coordinates);
    })
    .forEach(feature => {
      const props = feature.properties;
      const key = `${props.route}|${props.direction}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(feature);
    });

  const candidates = Array.from(groups.values())
    .map(features => nearestRouteCandidate(features, clickPoint))
    .filter(Boolean)
    .sort((left, right) => left.distanceMeters - right.distanceMeters)
    .slice(0, limit);

  return candidates.map(candidate => {
    const { route, direction } = candidate.properties;
    return {
      ...candidate,
      properties: {
        ...candidate.properties,
        category: inferCategory(route),
        label: `${route} ${DIRECTIONS[direction] || direction} ${formatKm(candidate.properties.km)} 地圖點選候選`,
        matchType: "mapCandidate",
        confidence: candidate.distanceMeters <= 100 ? "high" : candidate.distanceMeters <= 500 ? "medium" : "low",
        interpolationMethod: "map-click",
        mapDistanceMeters: candidate.distanceMeters
      }
    };
  });
}

function nearestRouteCandidate(features, clickPoint) {
  const sorted = features
    .slice()
    .sort((left, right) => Number(left.properties.km) - Number(right.properties.km));
  let best = null;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const start = sorted[index];
    const end = sorted[index + 1];
    if (Number(start.properties.km) === Number(end.properties.km)) continue;
    const startPoint = ol.proj.fromLonLat(start.geometry.coordinates);
    const endPoint = ol.proj.fromLonLat(end.geometry.coordinates);
    const projection = projectToSegment(clickPoint, startPoint, endPoint);
    const km = Number(start.properties.km) + (Number(end.properties.km) - Number(start.properties.km)) * projection.ratio;
    const candidate = {
      type: "Feature",
      properties: {
        route: start.properties.route,
        direction: start.properties.direction,
        km,
        lowerKm: Number(start.properties.km),
        upperKm: Number(end.properties.km)
      },
      geometry: {
        type: "Point",
        coordinates: ol.proj.toLonLat(projection.point)
      },
      distanceMeters: projection.distanceMeters
    };
    if (!best || candidate.distanceMeters < best.distanceMeters) best = candidate;
  }

  if (best) return best;

  const nearest = sorted.reduce((current, feature) => {
    const point = ol.proj.fromLonLat(feature.geometry.coordinates);
    const distanceMeters = distance2d(clickPoint, point);
    return !current || distanceMeters < current.distanceMeters
      ? { feature, distanceMeters }
      : current;
  }, null);
  if (!nearest) return null;

  return {
    type: "Feature",
    properties: {
      route: nearest.feature.properties.route,
      direction: nearest.feature.properties.direction,
      km: Number(nearest.feature.properties.km)
    },
    geometry: {
      type: "Point",
      coordinates: [...nearest.feature.geometry.coordinates]
    },
    distanceMeters: nearest.distanceMeters
  };
}

function projectToSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  const rawRatio = lengthSquared ? ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared : 0;
  const ratio = Math.min(1, Math.max(0, rawRatio));
  const projectedPoint = [start[0] + dx * ratio, start[1] + dy * ratio];
  return {
    point: projectedPoint,
    ratio,
    distanceMeters: distance2d(point, projectedPoint)
  };
}

function distance2d(start, end) {
  return Math.hypot(end[0] - start[0], end[1] - start[1]);
}

function formatDistance(km) {
  if (!Number.isFinite(km)) return "";
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(2)} km`;
}

function formatMeters(meters) {
  if (!Number.isFinite(meters)) return "";
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function cloneFeature(feature, extraProperties = {}) {
  return {
    type: feature.type,
    properties: {
      ...feature.properties,
      ...extraProperties
    },
    geometry: {
      type: feature.geometry.type,
      coordinates: [...feature.geometry.coordinates]
    }
  };
}

function parseMileageInput(value) {
  const text = String(value || "").trim().replace(/\s+/g, "").toUpperCase();
  if (!text) return NaN;

  const withPlus = text.match(/^(\d+(?:\.\d+)?)K\+?(\d{1,3})$/);
  if (withPlus) {
    return Number(withPlus[1]) + Number(withPlus[2]) / 1000;
  }

  const compact = text.match(/^(\d+)K(\d{3})$/);
  if (compact) {
    return Number(compact[1]) + Number(compact[2]) / 1000;
  }

  const wholeKm = text.match(/^(\d+(?:\.\d+)?)K$/);
  if (wholeKm) {
    return Number(wholeKm[1]);
  }

  return Number(text);
}

function makeStreetViewUrl([lon, lat]) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat.toFixed(7)},${lon.toFixed(7)}`;
}

function formatWeatherDate(dateText, index) {
  const date = new Date(`${dateText}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return dateText;
  const label = index === 0 ? "今天" : date.toLocaleDateString("zh-TW", { weekday: "short" });
  return `${label} ${date.getMonth() + 1}/${date.getDate()}`;
}

function formatWeatherValue(value, suffix) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}${suffix}` : "--";
}

function renderWeatherPanel(forecast) {
  if (!forecast || forecast.status === "loading") {
    return `
      <div class="weather-panel">
        <h3>定位點天氣預報</h3>
        <p class="muted">正在載入今天到未來一周的天氣預報...</p>
      </div>
    `;
  }
  if (forecast.status === "error") {
    return `
      <div class="weather-panel">
        <h3>定位點天氣預報</h3>
        <p class="muted">${escapeHtml(forecast.message || "天氣預報暫時無法載入。")}</p>
      </div>
    `;
  }
  const cards = forecast.days.map((day, index) => `
    <li class="weather-day">
      <strong>${escapeHtml(formatWeatherDate(day.date, index))}</strong>
      <span>${escapeHtml(WEATHER_CODE_LABELS[day.code] || "天氣變化")}</span>
      <small>高低溫 ${formatWeatherValue(day.high, "°")} / ${formatWeatherValue(day.low, "°")}</small>
      <small>降雨 ${formatWeatherValue(day.rainChance, "%")} · 風速 ${formatWeatherValue(day.windKmh, " km/h")}</small>
    </li>
  `).join("");

  return `
    <div class="weather-panel">
      <h3>定位點天氣預報</h3>
      <p class="muted">資料來源：Open-Meteo，依定位座標估算今天到未來一周。</p>
      <ol class="weather-list">${cards}</ol>
    </div>
  `;
}

function renderResult(feature, diff, [lon, lat], streetViewUrl, nearbyCctvs = []) {
  const properties = feature.properties;
  const modeLabels = {
    direct: "原始里程點",
    interpolated: "內插估算",
    nearest: "最近里程點"
  };
  const confidenceLabels = {
    high: "高",
    medium: "中",
    low: "低"
  };
  const methodLabels = {
    milepost: "原始里程點",
    linear: "兩點直線估算",
    road: "沿道路線形估算",
    nearest: "最近里程點"
  };
  const intervalRow = properties.matchType === "interpolated"
    ? `<span>估算區間</span><strong>${formatKm(properties.lowerKm)} - ${formatKm(properties.upperKm)}</strong>`
    : "";
  const gapRow = properties.matchType === "interpolated"
    ? `<span>相鄰樁距</span><strong>${properties.gapKm.toFixed(1)} km</strong>`
    : "";
  const confidenceRow = properties.confidence
    ? `<span>可信度</span><strong>${confidenceLabels[properties.confidence] || properties.confidence}</strong>`
    : "";
  const methodRow = properties.interpolationMethod
    ? `<span>估算方式</span><strong>${methodLabels[properties.interpolationMethod] || properties.interpolationMethod}</strong>`
    : "";
  const roadDistanceRow = properties.interpolationMethod === "road" && Number.isFinite(properties.roadDistanceKm)
    ? `<span>路網距離</span><strong>${properties.roadDistanceKm.toFixed(1)} km</strong>`
    : "";
  const auxiliaryRow = properties.usedCctvAux
    ? `<span>輔助資料</span><strong>使用 CCTV 里程點</strong>`
    : "";
  const controlPointRow = properties.usedCctvAux && properties.matchType === "interpolated" && properties.lowerLabel && properties.upperLabel
    ? `<span>估算端點</span><strong>${escapeHtml(properties.lowerLabel)} / ${escapeHtml(properties.upperLabel)}</strong>`
    : properties.usedCctvAux && properties.controlPointLabel
      ? `<span>控制點</span><strong>${escapeHtml(properties.controlPointLabel)}</strong>`
      : "";
  const diffRow = properties.matchType === "nearest"
    ? `<span>差距</span><strong>${diff.toFixed(2)} km</strong>`
    : "";
  const warning = properties.confidence === "low"
    ? `<p class="warning-text">此區間里程點過少，位置僅供初步判讀；請搭配 Street View 或現場道路特徵確認。</p>`
    : "";
  const roadFallback = properties.roadGeometryStatus
    ? `<p class="warning-text">${properties.roadGeometryStatus}。</p>`
    : "";
  const cctvList = renderCctvList(nearbyCctvs);
  const weatherPanel = renderWeatherPanel(state.weatherForecast);

  resultCard.innerHTML = `
    <div class="result-title">${properties.route} ${DIRECTIONS[properties.direction] || properties.direction} ${formatKm(properties.km)}</div>
    <div class="result-grid">
      <span>座標</span><strong>${lat.toFixed(6)}, ${lon.toFixed(6)}</strong>
      <span>定位方式</span><strong>${modeLabels[properties.matchType] || "里程點資料"}</strong>
      ${intervalRow}
      ${gapRow}
      ${confidenceRow}
      ${methodRow}
      ${roadDistanceRow}
      ${auxiliaryRow}
      ${controlPointRow}
      ${diffRow}
      <span>來源</span><strong>${properties.label || "里程點資料"}</strong>
    </div>
    ${warning}
    ${roadFallback}
    <p class="muted">Street View 會開啟 Google Maps 全景檢視 URL。</p>
    ${weatherPanel}
    ${cctvList}
  `;
}

function renderCctvList(items) {
  if (!state.cctvs.length) {
    return `<div class="cctv-panel"><h3>鄰近攝影機</h3><p class="muted">CCTV 資料尚未載入。</p></div>`;
  }
  if (!items.length) {
    return `<div class="cctv-panel"><h3>鄰近攝影機</h3><p class="muted">附近找不到可用攝影機。</p></div>`;
  }

  const cards = items.map(({ camera, distanceKm }, index) => {
    const props = camera.properties;
    const title = cameraTitle(props);
    const description = props.description || props.id || "交通部 CCTV";
    const streamUrl = props.streamUrl || props.imageUrl;
    const imagePreview = props.imageUrl
      ? `<button class="cctv-thumb" type="button" data-camera-index="${index}" aria-label="預覽 ${escapeHtml(title)} 快照"><img src="${escapeHtml(props.imageUrl)}" alt="${escapeHtml(title)} 快照" loading="lazy" /></button>`
      : "";
    const imageLink = props.imageUrl && props.imageUrl !== streamUrl
      ? `<a class="text-link" href="${escapeHtml(props.imageUrl)}" target="_blank" rel="noreferrer">快照</a>`
      : "";
    return `
      <li class="cctv-item">
        ${imagePreview}
        <div>
          <strong>${escapeHtml(title || "交通攝影機")}</strong>
          <span>${escapeHtml(description)}</span>
          <small>${formatDistance(distanceKm)}${props.source ? ` · ${escapeHtml(props.source)}` : ""}</small>
        </div>
        <div class="cctv-actions">
          <a class="camera-link" href="${escapeHtml(streamUrl)}" target="_blank" rel="noreferrer">影像</a>
          ${imageLink}
        </div>
      </li>
    `;
  }).join("");

  return `
    <div class="cctv-panel">
      <h3>最近 3 支攝影機</h3>
      <p class="muted">藍色方形標記已同步顯示在地圖上。</p>
      <ol class="cctv-list">${cards}</ol>
    </div>
  `;
}

function renderMapCandidates(candidates, clickCoord) {
  state.selectedFeature = null;
  state.nearbyCctvs = [];
  state.mapCandidates = candidates;
  state.weatherForecast = null;
  state.mapQueryFeature = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Point",
      coordinates: clickCoord
    }
  };
  refreshMap();

  if (!candidates.length) {
    resultCard.innerHTML = `<p class="muted">此處附近找不到可用的里程候選。請放大後靠近主要道路再點一次。</p>`;
    return;
  }

  const items = candidates.map((candidate, index) => {
    const props = candidate.properties;
    const direction = DIRECTIONS[props.direction] || props.direction || "";
    const interval = Number.isFinite(props.lowerKm) && Number.isFinite(props.upperKm)
      ? `<small>估算區間 ${formatKm(props.lowerKm)} - ${formatKm(props.upperKm)}</small>`
      : "";
    return `
      <li class="map-candidate-item">
        <button type="button" data-map-candidate-index="${index}">
          <strong>${escapeHtml(props.route)} ${escapeHtml(direction)} ${formatKm(props.km)}</strong>
          <span>距點選位置約 ${formatMeters(props.mapDistanceMeters)}</span>
          ${interval}
        </button>
      </li>
    `;
  }).join("");

  resultCard.innerHTML = `
    <div class="result-title">地圖點選候選</div>
    <p class="muted">候選值是依附近里程點與 CCTV 控制點估算；請選擇最符合實際道路的一筆再定位。</p>
    <ol class="map-candidate-list">${items}</ol>
  `;
}

function applyMapCandidate(index) {
  const candidate = state.mapCandidates[index];
  if (!candidate) return;
  const props = candidate.properties;
  const category = props.category || inferCategory(props.route);
  state.category = category;
  segments.forEach(item => item.classList.toggle("is-active", item.dataset.category === category));
  refreshRouteOptions();
  routeSelect.value = props.route;
  refreshDirectionOptions();
  directionSelect.value = props.direction;
  kmInput.value = formatKm(props.km);
  locate();
}

function renderNoResult(route, direction) {
  state.selectedFeature = null;
  state.nearbyCctvs = [];
  state.mapQueryFeature = null;
  state.mapCandidates = [];
  state.weatherForecast = null;
  vectorSource.clear();
  clearCctvSnapshotOverlays();
  streetViewButton.removeAttribute("href");
  streetViewButton.classList.add("is-disabled");
  resultCard.innerHTML = `<p class="muted">找不到 ${route || "此路線"} ${DIRECTIONS[direction] || direction || ""} 的里程資料。請先匯入官方里程點。</p>`;
}

function formatKm(km) {
  const whole = Math.floor(Number(km));
  const meters = Math.round((Number(km) - whole) * 1000);
  return meters ? `${whole}K+${String(meters).padStart(3, "0")}` : `${whole}K`;
}

segments.forEach(segment => {
  segment.addEventListener("click", () => {
    state.category = segment.dataset.category;
    segments.forEach(item => item.classList.toggle("is-active", item === segment));
    refreshRouteOptions();
    markPending();
  });
});

routeSelect.addEventListener("change", () => {
  refreshDirectionOptions();
  markPending();
});
directionSelect.addEventListener("change", markPending);
kmInput.addEventListener("input", markPending);
kmInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    locate();
  }
});
locateButton.addEventListener("click", locate);

resultCard.addEventListener("click", event => {
  const cameraButton = event.target.closest("[data-camera-index]");
  if (cameraButton) {
    const item = state.nearbyCctvs[Number(cameraButton.dataset.cameraIndex)];
    if (item) openCameraDialog(item.camera, item.distanceKm);
    return;
  }

  const candidateButton = event.target.closest("[data-map-candidate-index]");
  if (candidateButton) {
    applyMapCandidate(Number(candidateButton.dataset.mapCandidateIndex));
  }
});

cameraDialogCloseButtons.forEach(button => button.addEventListener("click", closeCameraDialog));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !cameraDialog.hidden) closeCameraDialog();
});

map.on("click", event => {
  const feature = map.forEachFeatureAtPixel(event.pixel, item => item);
  if (feature?.get("isCctvMarker")) {
    const item = state.nearbyCctvs.find(({ camera }) => camera.properties.id === feature.get("cctvId"));
    if (item) openCameraDialog(item.camera, item.distanceKm);
    return;
  }
  if (!feature) {
    const clickCoord = ol.proj.toLonLat(event.coordinate);
    renderMapCandidates(mapClickCandidates(clickCoord, 5), clickCoord);
    return;
  }
  if (!feature.get("route")) return;
  routeSelect.value = feature.get("route");
  refreshDirectionOptions();
  directionSelect.value = feature.get("direction");
  kmInput.value = formatKm(feature.get("km"));
});

loadData();
