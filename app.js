const addRect = document.querySelector(".rect");
const addText = document.querySelector(".text");
const canvas = document.querySelector(".canvas-workspace");
const propertiesPanel = document.querySelector(".element-property");
const layersPanel = document.querySelector(".layers");

const state = {
  elements: [],
  selectedId: null,
};

let layerId = null;

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
  };

  state.elements.push(defaultData);
  const elem = makeElement(defaultData);
  canvas.appendChild(elem);
  selectElement(defaultData.id);
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

  ["br"].forEach((pos) => {
    const h = document.createElement("div");
    h.classList.add("corner", pos);
    h.addEventListener("mousedown", (e) => startResize(e, elem, pos));
    elem.appendChild(h);
  });

  elem.addEventListener("click", (e) => {
    e.stopPropagation();
    selectElement(data.id);
  });

  elem.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("corner")) return;
    startDrag(e, elem);
  });

  return elem;
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

function refreshPropertiesPanel() {
  if (!state.selectedId) return;
  if (isEditingProperty) return;
  displayProperties();
}

let isEditingProperty = false;

document.addEventListener("focusin", (e) => {
  if (e.target.closest(".element-property")) {
    isEditingProperty = true;
  }
});

document.addEventListener("focusout", (e) => {
  if (e.target.closest(".element-property")) {
    isEditingProperty = false;
  }
});

window.addEventListener("load", () => {
  const saved = JSON.parse(localStorage.getItem("figma-state"));
  if (!saved) return;

  state.elements = saved;
  saved.forEach((el) => {
    canvas.appendChild(makeElement(el));
  });
  updateZIndex();
  layerSetup();
});

const exportJSONBtn = document.querySelector(".btn-json");
const exportHTMLBtn = document.querySelector(".btn-html");
const clearBtn = document.querySelector(".btn-clear");

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

exportJSONBtn.addEventListener("click", exportJSON);
exportHTMLBtn.addEventListener("click", exportHTML);
clearBtn.addEventListener("click", clearCanvas);

document.addEventListener("input", (e) => {
  if (!e.target.classList.contains("new-element")) return;
  const id = e.target.dataset.id;
  if (!id) return;

  const data = state.elements.find((el) => el.id === id);
  if (!data || data.type !== "text") return;

  data.text = e.target.textContent;
  saveState();
});
