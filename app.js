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
  expressway: ["台61線", "台62線", "台64線", "台65線", "台66線", "台68線", "台72線", "台74線", "台76線", "台78線", "台82線", "台84線", "台86線", "台88線"],
  provincial: ["台1線", "台3線", "台9線", "台17線", "台20線"]
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

const state = {
  category: "freeway",
  data: SAMPLE_MILEPOSTS,
  selectedFeature: null
};

const routeSelect = document.querySelector("#routeSelect");
const directionSelect = document.querySelector("#directionSelect");
const kmInput = document.querySelector("#kmInput");
const resultCard = document.querySelector("#resultCard");
const dataStatus = document.querySelector("#dataStatus");
const streetViewButton = document.querySelector("#streetViewButton");
const locateButton = document.querySelector("#locateButton");
const segments = Array.from(document.querySelectorAll(".segment"));

const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: feature => {
    if (!feature.get("isSearchResult")) return null;
    const category = feature.get("category");
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({ color: "#172026" }),
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

const popupElement = document.createElement("div");
popupElement.className = "ol-popup";
const popup = new ol.Overlay({
  element: popupElement,
  offset: [0, -14],
  positioning: "bottom-center",
  stopEvent: false
});
map.addOverlay(popup);

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
  return {
    type: "Feature",
    properties: {
      category: props.category || inferCategory(props.route || props.road || props.roadName),
      route: props.route || props.road || props.roadName || "",
      direction: normalizeDirection(props.direction || props.dir || ""),
      km: Number(props.km ?? props.mileage ?? props.mile),
      label: props.label || props.name || ""
    },
    geometry: {
      type: "Point",
      coordinates: coords
    }
  };
}

function normalizeDirection(value) {
  const text = String(value).trim().toLowerCase();
  if (["south", "s", "南", "南下"].includes(text)) return "south";
  if (["north", "n", "北", "北上"].includes(text)) return "north";
  if (["east", "e", "東", "東向", "東行"].includes(text)) return "east";
  if (["west", "w", "西", "西向", "西行"].includes(text)) return "west";
  return text || "south";
}

function inferCategory(route = "") {
  if (route.startsWith("國道")) return "freeway";
  if (ROUTE_GROUPS.expressway.includes(route)) return "expressway";
  return "provincial";
}

async function loadData() {
  try {
    const geojson = await fetchOfficialMileposts();
    state.data = {
      type: "FeatureCollection",
      features: geojson.features.map(normalizeFeature).filter(isValidFeature)
    };
    dataStatus.textContent = `已載入正式資料：${state.data.features.length.toLocaleString()} 筆里程點。`;
  } catch {
    dataStatus.textContent = `目前使用內建示範資料：${SAMPLE_MILEPOSTS.features.length} 筆。正式資料載入失敗時會自動退回示範資料。`;
  }
  refreshRouteOptions();
  markPending();
}

function markPending() {
  state.selectedFeature = null;
  vectorSource.clear();
  popup.setPosition(undefined);
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
  const routes = Array.from(new Set([...officialRoutes, ...dataRoutes]));
  routeSelect.innerHTML = routes.map(route => `<option value="${route}">${route}</option>`).join("");
  refreshDirectionOptions();
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
  if (!state.selectedFeature) return;

  vectorSource.addFeature(new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat(state.selectedFeature.geometry.coordinates)),
    isSearchResult: true,
    ...state.selectedFeature.properties
  }));
}

function locate() {
  const route = routeSelect.value;
  const direction = directionSelect.value;
  const km = parseMileageInput(kmInput.value);
  const candidates = state.data.features.filter(feature => {
    return feature.properties.route === route && feature.properties.direction === direction;
  });
  const fallbackCandidates = state.data.features.filter(feature => feature.properties.route === route);
  const pool = candidates.length ? candidates : fallbackCandidates;

  if (!route || !Number.isFinite(km) || !pool.length) {
    renderNoResult(route, direction);
    return;
  }

  const match = resolveMilepost(pool, km);

  if (!match) {
    renderNoResult(route, direction);
    return;
  }

  state.selectedFeature = match.feature;
  refreshMap();

  const lonLat = match.feature.geometry.coordinates;
  const streetViewUrl = makeStreetViewUrl(lonLat);
  streetViewButton.href = streetViewUrl;
  streetViewButton.classList.remove("is-disabled");
  map.getView().animate({ center: ol.proj.fromLonLat(lonLat), zoom: 15, duration: 350 });
  renderResult(match.feature, match.diff, lonLat, streetViewUrl);
  renderPopup(match.feature, lonLat);
}

function resolveMilepost(pool, km) {
  const sorted = pool
    .filter(feature => Number.isFinite(feature.properties.km) && Array.isArray(feature.geometry.coordinates))
    .slice()
    .sort((a, b) => Number(a.properties.km) - Number(b.properties.km));

  if (!sorted.length) return null;

  const exact = sorted.find(feature => Math.abs(Number(feature.properties.km) - km) < 0.0005);
  if (exact) {
    return {
      feature: cloneFeature(exact, {
        matchType: "direct",
        requestedKm: km
      }),
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
    const ratio = (km - lowerKm) / (upperKm - lowerKm);
    const lowerCoord = lower.geometry.coordinates;
    const upperCoord = upper.geometry.coordinates;
    const interpolatedCoord = [
      lowerCoord[0] + (upperCoord[0] - lowerCoord[0]) * ratio,
      lowerCoord[1] + (upperCoord[1] - lowerCoord[1]) * ratio
    ];

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
          upperKm
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

  return {
    feature: cloneFeature(nearest.feature, {
      matchType: "nearest",
      requestedKm: km
    }),
    diff: nearest.diff
  };
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

function renderResult(feature, diff, [lon, lat], streetViewUrl) {
  const properties = feature.properties;
  const modeLabels = {
    direct: "原始里程點",
    interpolated: "內插估算",
    nearest: "最近里程點"
  };
  const intervalRow = properties.matchType === "interpolated"
    ? `<span>估算區間</span><strong>${formatKm(properties.lowerKm)} - ${formatKm(properties.upperKm)}</strong>`
    : "";
  const diffRow = properties.matchType === "nearest"
    ? `<span>差距</span><strong>${diff.toFixed(2)} km</strong>`
    : "";

  resultCard.innerHTML = `
    <div class="result-title">${properties.route} ${DIRECTIONS[properties.direction] || properties.direction} ${formatKm(properties.km)}</div>
    <div class="result-grid">
      <span>座標</span><strong>${lat.toFixed(6)}, ${lon.toFixed(6)}</strong>
      <span>定位方式</span><strong>${modeLabels[properties.matchType] || "里程點資料"}</strong>
      ${intervalRow}
      ${diffRow}
      <span>來源</span><strong>${properties.label || "里程點資料"}</strong>
    </div>
    <p class="muted">Street View 會開啟 Google Maps 全景檢視；正式嵌入頁面需要 Google Maps API key。</p>
  `;
}

function renderNoResult(route, direction) {
  state.selectedFeature = null;
  vectorSource.clear();
  popup.setPosition(undefined);
  streetViewButton.removeAttribute("href");
  streetViewButton.classList.add("is-disabled");
  resultCard.innerHTML = `<p class="muted">找不到 ${route || "此路線"} ${DIRECTIONS[direction] || direction || ""} 的里程資料。請先匯入官方里程點。</p>`;
}

function renderPopup(feature, [lon, lat]) {
  const suffix = feature.properties.matchType === "interpolated" ? "（內插估算）" : "";
  popupElement.innerHTML = `
    <h3>${feature.properties.route} ${formatKm(feature.properties.km)}${suffix}</h3>
    <p>${DIRECTIONS[feature.properties.direction] || feature.properties.direction}<br>${lat.toFixed(6)}, ${lon.toFixed(6)}</p>
  `;
  popup.setPosition(ol.proj.fromLonLat([lon, lat]));
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
locateButton.addEventListener("click", locate);

map.on("click", event => {
  const feature = map.forEachFeatureAtPixel(event.pixel, item => item);
  if (!feature) return;
  routeSelect.value = feature.get("route");
  refreshDirectionOptions();
  directionSelect.value = feature.get("direction");
  kmInput.value = formatKm(feature.get("km"));
});

loadData();
