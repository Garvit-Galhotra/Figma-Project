const themeButtons = document.querySelectorAll("[data-theme]");
const addRect = document.querySelector(".rect");
const addText = document.querySelector(".text");
const canvas = document.querySelector(".canvas-workspace");
const presetCard = document.querySelector(".preset-card");
const presetButton = document.querySelector(".preset-button");
const propertiesPanel = document.querySelector(".element-property");
const layersPanel = document.querySelector(".layers");
const exportJSONBtn = document.querySelector(".btn-json");
const exportHTMLBtn = document.querySelector(".btn-html");
const clearBtn = document.querySelector(".btn-clear");

const state = {
  elements: [],
  selectedId: null,
  canvasColor: null,
};

let layerId = null;
let isEditingProperty = false;

function uniqueid() {
  return crypto.randomUUID();
}

function getSelectedDOM() {
  if (!state.selectedId) return null;
  return document.querySelector(`[data-id="${state.selectedId}"]`);
}

function saveState() {
  localStorage.setItem(
    "figma-state",
    JSON.stringify({
      elements: state.elements,
      canvasColor: state.canvasColor,
    }),
  );
}

function applyCanvasColor() {
  if (state.canvasColor) {
    canvas.style.background = state.canvasColor;
  } else {
    canvas.style.background = "";
  }
}

function rgbToHex(rgb) {
  if (!rgb.startsWith("rgb")) return rgb;
  const [r, g, b] = rgb
    .replace(/[^\d,]/g, "")
    .split(",")
    .map(Number);
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function setTheme(theme) {
  document.body.className = "";
  if (theme !== "dark") document.body.classList.add(theme);
  localStorage.setItem("editor-theme", theme);
  themeButtons.forEach((b) => b.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-theme="${theme}"]`);
  if (activeBtn) activeBtn.classList.add("active");
  state.canvasColor = null;
  applyCanvasColor();
  saveState();
}

const savedTheme = localStorage.getItem("editor-theme") || "dark";
setTheme(savedTheme);

themeButtons.forEach((btn) => {
  btn.addEventListener("click", () => setTheme(btn.dataset.theme));
});

addRect.addEventListener("click", () => createElement("rectangle"));
addText.addEventListener("click", () => createElement("text"));
presetCard.addEventListener("click", () => createPreset("card"));
presetButton.addEventListener("click", () => createPreset("button"));
exportJSONBtn.addEventListener("click", exportJSON);
exportHTMLBtn.addEventListener("click", exportHTML);
clearBtn.addEventListener("click", clearCanvas);

function createElement(type) {
  const defaultData = {
    id: uniqueid(),
    type,
    x: 100,
    y: 100,
    width: type === "rectangle" ? 300 : 250,
    height: type === "rectangle" ? 200 : 120,
    color: type === "rectangle" ? "#ec6565" : "#333333",
    text: type === "text" ? "Text" : "",
    zIndex: state.elements.length + 1,
    rotation: 0,
  };
  state.elements.push(defaultData);
  const elem = makeElement(defaultData);
  canvas.appendChild(elem);
  selectElement(defaultData.id);
  updateZIndex();
  layerSetup();
  saveState();
}

const componentPresets = {
  card: {
    width: 260,
    height: 160,
    styles: {
      background: "#ffffff",
      borderRadius: "14px",
      boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      justifyContent: "center",
      fontFamily: "system-ui",
    },
    html: `<h3>Card Title</h3><p>Preset card component</p><button style="height:36px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-weight:600;cursor:pointer">Action</button>`,
  },
  button: {
    width: 150,
    height: 46,
    styles: {
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      color: "#fff",
      borderRadius: "12px",
      fontWeight: "600",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
    },
    html: `Button`,
  },
};

function createPreset(type) {
  const preset = componentPresets[type];
  if (!preset) return;
  const id = uniqueid();
  const data = {
    id,
    type,
    x: 120,
    y: 120,
    width: preset.width,
    height: preset.height,
    color: "transparent",
    text: "",
    zIndex: state.elements.length + 1,
    rotation: 0,
  };
  state.elements.push(data);
  const el = document.createElement("div");
  el.className = "new-element";
  el.dataset.id = id;
  Object.assign(el.style, preset.styles);
  el.innerHTML = preset.html;
  applyProperties(el, data);
  setupElementControls(el, data);
  canvas.appendChild(el);
  selectElement(id);
  updateZIndex();
  layerSetup();
  saveState();
}

function makeElement(data) {
  const elem = document.createElement("div");
  elem.className = "new-element";
  elem.dataset.id = data.id;
  applyProperties(elem, data);
  if (data.type === "text") {
    elem.textContent = data.text;
    elem.contentEditable = true;
  }
  setupElementControls(elem, data);
  return elem;
}

function setupElementControls(elem, data) {
  ["br"].forEach((pos) => {
    const h = document.createElement("div");
    h.classList.add("corner", pos);
    h.addEventListener("mousedown", (e) => startResize(e, elem, pos));
    elem.appendChild(h);
  });
  const rotateHandle = document.createElement("div");
  rotateHandle.className = "rotate-handle";
  rotateHandle.addEventListener("mousedown", (e) => startRotate(e, elem));
  elem.appendChild(rotateHandle);
  elem.addEventListener("click", (e) => {
    e.stopPropagation();
    selectElement(data.id);
  });
  elem.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("corner")) return;
    if (e.target.classList.contains("rotate-handle")) return;
    startDrag(e, elem);
  });
}

function selectElement(id) {
  document
    .querySelectorAll(".new-element.selected")
    .forEach((el) => el.classList.remove("selected"));
  state.selectedId = id;
  const el = getSelectedDOM();
  if (!el) return;
  el.classList.add("selected");
  displayProperties();
}

canvas.addEventListener("click", () => {
  document
    .querySelectorAll(".new-element.selected")
    .forEach((el) => el.classList.remove("selected"));
  state.selectedId = null;
  propertiesPanel.innerHTML = `
    <h3>Properties</h3>
    <div class="properties">
      <label>
        Canvas Color
        <input type="color" value="${rgbToHex(state.canvasColor || getComputedStyle(canvas).backgroundColor)}">
      </label>
    </div>
  `;
  const colorInput = propertiesPanel.querySelector("input");
  colorInput.addEventListener("input", () => {
    state.canvasColor = colorInput.value;
    applyCanvasColor();
    saveState();
  });
});

function startDrag(e, el) {
  const rect = el.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  function move(ev) {
    el.style.left = ev.clientX - canvasRect.left - offsetX + "px";
    el.style.top = ev.clientY - canvasRect.top - offsetY + "px";
    syncState(el);
  }
  document.addEventListener("mousemove", move);
  document.addEventListener(
    "mouseup",
    () => {
      document.removeEventListener("mousemove", move);
      saveState();
    },
    { once: true },
  );
}

function startResize(e, el, pos) {
  e.stopPropagation();
  const startX = e.clientX;
  const startY = e.clientY;
  const startW = el.offsetWidth;
  const startH = el.offsetHeight;
  function resize(ev) {
    let w = startW;
    let h = startH;
    if (pos.includes("r")) w += ev.clientX - startX;
    if (pos.includes("l")) w -= ev.clientX - startX;
    if (pos.includes("b")) h += ev.clientY - startY;
    if (pos.includes("t")) h -= ev.clientY - startY;
    el.style.width = Math.max(40, w) + "px";
    el.style.height = Math.max(40, h) + "px";
    syncState(el);
  }
  document.addEventListener("mousemove", resize);
  document.addEventListener(
    "mouseup",
    () => {
      document.removeEventListener("mousemove", resize);
      saveState();
    },
    { once: true },
  );
}

function startRotate(e, el) {
  e.stopPropagation();
  const data = state.elements.find((x) => x.id === el.dataset.id);
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  function rotate(ev) {
    const angle =
      Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI);
    data.rotation = angle + 90;
    el.style.transform = `rotate(${data.rotation}deg)`;
    saveState();
    refreshPropertiesPanel();
  }
  document.addEventListener("mousemove", rotate);
  document.addEventListener(
    "mouseup",
    () => document.removeEventListener("mousemove", rotate),
    { once: true },
  );
}

function displayProperties() {
  const elem = getSelectedDOM();
  if (!elem) return;
  const data = state.elements.find((e) => e.id === state.selectedId);
  propertiesPanel.innerHTML = `
    <h3>Properties</h3>
    <div class="properties">
      <label>Width <input type="number" data-prop="width" value="${data.width}"></label>
      <label>Height <input type="number" data-prop="height" value="${data.height}"></label>
      <label>X <input type="number" data-prop="x" value="${data.x}"></label>
      <label>Y <input type="number" data-prop="y" value="${data.y}"></label>
      <label>Color <input type="color" data-prop="color" value="${data.color}"></label>
      <label>Rotation <input type="number" data-prop="rotation" value="${data.rotation}"></label>
    </div>
  `;
  propertiesPanel.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const prop = input.dataset.prop;
      data[prop] = input.type === "color" ? input.value : Number(input.value);
      applyProperties(elem, data);
      saveState();
    });
  });
}

function refreshPropertiesPanel() {
  if (!state.selectedId) return;
  if (isEditingProperty) return;
  displayProperties();
}

function syncState(elem) {
  const data = state.elements.find((e) => e.id === elem.dataset.id);
  data.x = elem.offsetLeft;
  data.y = elem.offsetTop;
  data.width = elem.offsetWidth;
  data.height = elem.offsetHeight;
}

function applyProperties(elem, data) {
  elem.style.left = data.x + "px";
  elem.style.top = data.y + "px";
  elem.style.width = data.width + "px";
  elem.style.height = data.height + "px";
  elem.style.backgroundColor = data.color;
  elem.style.zIndex = data.zIndex;
  elem.style.transform = `rotate(${data.rotation}deg)`;
}

function layerSetup() {
  layersPanel.innerHTML = "<h3>Layers</h3>";
  [...state.elements]
    .sort((a, b) => b.zIndex - a.zIndex)
    .forEach((el) => {
      const item = document.createElement("div");
      item.className = "layer-item";
      item.textContent = el.type;
      item.dataset.id = el.id;
      item.draggable = true;
      item.onclick = () => selectElement(el.id);
      item.ondragstart = () => {
        layerId = el.id;
        item.classList.add("dragging");
      };
      item.ondragend = () => {
        layerId = null;
        item.classList.remove("dragging");
      };
      item.ondragover = (e) => e.preventDefault();
      item.ondrop = () => reorderLayers(layerId, el.id);
      layersPanel.appendChild(item);
    });
}

function reorderLayers(draggedId, targetId) {
  if (!draggedId || draggedId === targetId) return;
  const from = state.elements.findIndex((e) => e.id === draggedId);
  const to = state.elements.findIndex((e) => e.id === targetId);
  if (from === -1 || to === -1) return;
  [state.elements[from], state.elements[to]] = [
    state.elements[to],
    state.elements[from],
  ];
  updateZIndex();
  layerSetup();
  saveState();
}

function updateZIndex() {
  state.elements.forEach((el, i) => {
    el.zIndex = i + 1;
    const dom = document.querySelector(`[data-id="${el.id}"]`);
    if (dom) dom.style.zIndex = el.zIndex;
  });
}

function exportJSON() {
  const data = localStorage.getItem("figma-state");
  if (!data) return alert("Nothing to export");
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "design.json";
  a.click();
  URL.revokeObjectURL(url);
}

function exportHTML() {
  if (!state.elements.length) return alert("Nothing to export");
  const elementsHTML = state.elements
    .map(
      (el) => `
      <div style="
        position:absolute;
        left:${el.x}px;
        top:${el.y}px;
        width:${el.width}px;
        height:${el.height}px;
        background:${el.color};
        z-index:${el.zIndex};
        transform:rotate(${el.rotation}deg); 
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:system-ui;
      ">
        ${el.type === "text" ? el.text : ""}
      </div>`,
    )
    .join("");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Exported Design</title>
<style>
  body{
    margin:0;
    background:${state.canvasColor};
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
  }
  .canvas{
    width:1000px;
    height:600px;
    background:white;
    position:relative;
  }
</style>
</head>
<body>
  <div class="canvas">
    ${elementsHTML}
  </div>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "design.html";
  a.click();
  URL.revokeObjectURL(url);
}

function clearCanvas() {
  if (!confirm("Clear entire canvas?")) return;
  state.elements = [];
  state.selectedId = null;
  canvas.innerHTML = "";
  layersPanel.innerHTML = "<h3>Layers</h3>";
  propertiesPanel.innerHTML = "<h3>Properties</h3>";
  saveState();
}

document.addEventListener("keydown", (e) => {
  const elem = getSelectedDOM();
  if (!elem) return;
  let x = elem.offsetLeft;
  let y = elem.offsetTop;
  const step = 5;
  if (e.key === "Delete") {
    elem.remove();
    state.elements = state.elements.filter((e) => e.id !== state.selectedId);
    state.selectedId = null;
    layerSetup();
    saveState();
    return;
  }
  if (e.key === "ArrowLeft") x -= step;
  if (e.key === "ArrowRight") x += step;
  if (e.key === "ArrowUp") y -= step;
  if (e.key === "ArrowDown") y += step;
  elem.style.left = x + "px";
  elem.style.top = y + "px";
  syncState(elem);
  refreshPropertiesPanel();
});

document.addEventListener("focusin", (e) => {
  if (e.target.closest(".element-property")) isEditingProperty = true;
});

document.addEventListener("focusout", (e) => {
  if (e.target.closest(".element-property")) isEditingProperty = false;
});

document.addEventListener("input", (e) => {
  if (!e.target.classList.contains("new-element")) return;
  const id = e.target.dataset.id;
  if (!id) return;
  const data = state.elements.find((el) => el.id === id);
  if (!data || data.type !== "text") return;
  data.text = e.target.textContent;
  saveState();
});

window.addEventListener("load", () => {
  const saved = JSON.parse(localStorage.getItem("figma-state"));
  if (!saved) return;
  state.elements = saved.elements || saved;
  state.canvasColor = saved.canvasColor || state.canvasColor;
  state.elements.forEach((el) => canvas.appendChild(makeElement(el)));
  applyCanvasColor();
  updateZIndex();
  layerSetup();
});
const infoBtn = document.querySelector(".info-btn");
const infoText = document.querySelector(".info-text");

const savedInfo = localStorage.getItem("layer-info");
if (savedInfo) infoText.value = savedInfo;

infoBtn.addEventListener("click", () => {
  infoText.style.display =
    infoText.style.display === "block" ? "none" : "block";
});

infoText.addEventListener("input", () => {
  localStorage.setItem("layer-info", infoText.value);
});
  