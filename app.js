const addRect = document.querySelector(".rect");
const addText = document.querySelector(".text");
const canvas = document.querySelector(".canvas-workspace");
const propertiesPanel = document.querySelector(".element-property");
const layersPanel = document.querySelector(".layers");
const exportJSONBtn = document.querySelector(".btn-json");
const exportHTMLBtn = document.querySelector(".btn-html");
const clearBtn = document.querySelector(".btn-clear");

const state = {
  elements: [],
  selectedId: null,
};

let draggedLayerId = null;

function uniqueid() {
  return crypto.randomUUID();
}

function getSelectedDOM() {
  if (!state.selectedId) return null;
  return document.querySelector(`[data-id="${state.selectedId}"]`);
}

function saveState() {
  localStorage.setItem("figma-state", JSON.stringify(state.elements));
}

addRect.addEventListener("click", () => createElement("rectangle"));
addText.addEventListener("click", () => createElement("text"));

function createElement(type) {
  const data = {
    id: uniqueid(),
    type,
    x: 100,
    y: 100,
    width: type === "rectangle" ? 300 : 220,
    height: type === "rectangle" ? 200 : 100,
    color: type === "rectangle" ? "#ff5555" : "#333",
    text: type === "text" ? "Text" : "",
    zIndex: state.elements.length + 1,
  };

  state.elements.push(data);
  const elem = makeElement(data);
  canvas.appendChild(elem);

  selectElement(data.id);
  updateZIndex();
  layerSetup();
  saveState();
}

function makeElement(data) {
  const el = document.createElement("div");
  el.className = "new-element";
  el.dataset.id = data.id;

  applyProperties(el, data);

  if (data.type === "text") {
    el.textContent = data.text;
    el.contentEditable = true;

    el.addEventListener("input", () => {
      data.text = el.textContent;
      saveState();
    });
  }

  ["br"].forEach((pos) => {
    const handle = document.createElement("div");
    handle.className = "corner " + pos;
    handle.addEventListener("mousedown", (e) => startResize(e, el, pos));
    el.appendChild(handle);
  });

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    selectElement(data.id);
  });

  el.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("corner")) return;
    startDrag(e, el);
  });

  return el;
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
  propertiesPanel.innerHTML = "<h3>Properties</h3>";
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

function displayProperties() {
  const el = getSelectedDOM();
  if (!el) return;

  const data = state.elements.find((e) => e.id === state.selectedId);

  propertiesPanel.innerHTML = `
    <h3>Properties</h3>
    <label>Width <input type="number" data-prop="width" value="${data.width}"></label>
    <label>Height <input type="number" data-prop="height" value="${data.height}"></label>
    <label>X <input type="number" data-prop="x" value="${data.x}"></label>
    <label>Y <input type="number" data-prop="y" value="${data.y}"></label>
    <label>Color <input type="color" data-prop="color" value="${data.color}"></label>
  `;

  propertiesPanel.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      const prop = input.dataset.prop;
      data[prop] = input.type === "color" ? input.value : Number(input.value);
      applyProperties(el, data);
      saveState();
    });
  });
}

function syncState(el) {
  const data = state.elements.find((e) => e.id === el.dataset.id);
  if (!data) return;

  data.x = el.offsetLeft;
  data.y = el.offsetTop;
  data.width = el.offsetWidth;
  data.height = el.offsetHeight;
}

function applyProperties(el, data) {
  el.style.left = data.x + "px";
  el.style.top = data.y + "px";
  el.style.width = data.width + "px";
  el.style.height = data.height + "px";
  el.style.backgroundColor = data.color;
  el.style.zIndex = data.zIndex;
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

      item.ondragstart = () => (draggedLayerId = el.id);
      item.ondragover = (e) => e.preventDefault();
      item.ondrop = () => reorderLayers(draggedLayerId, el.id);

      layersPanel.appendChild(item);
    });
}

function reorderLayers(fromId, toId) {
  const from = state.elements.findIndex((e) => e.id === fromId);
  const to = state.elements.findIndex((e) => e.id === toId);

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

document.addEventListener("keydown", (e) => {
  const el = getSelectedDOM();
  if (!el) return;

  let x = el.offsetLeft;
  let y = el.offsetTop;
  const step = 5;

  if (e.key === "Delete") {
    el.remove();
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

  el.style.left = x + "px";
  el.style.top = y + "px";
  syncState(el);
});

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
    .map((el) => {
      return `
      <div style="
        position:absolute;
        left:${el.x}px;
        top:${el.y}px;
        width:${el.width}px;
        height:${el.height}px;
        background:${el.color};
        z-index:${el.zIndex};
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:system-ui;
        border-radius:4px;
      ">
        ${el.type === "text" ? el.text : ""}
      </div>`;
    })
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
    background:#111;
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
    box-shadow:0 20px 60px rgba(0,0,0,.5);
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

window.addEventListener("load", () => {
  const saved = JSON.parse(localStorage.getItem("figma-state"));
  if (!saved) return;

  state.elements = saved;
  saved.forEach((el) => canvas.appendChild(makeElement(el)));

  updateZIndex();
  layerSetup();
});

exportJSONBtn?.addEventListener("click", exportJSON);
exportHTMLBtn?.addEventListener("click", exportHTML);
clearBtn?.addEventListener("click", clearCanvas);
