const addRect = document.querySelector(".rect");
const addText = document.querySelector(".text");
const canvas = document.querySelector(".canvas-workspace");
const propertiesPanel = document.querySelector(".element-property");
const layersPanel = document.querySelector(".layers");

const state = {
  elements: [],
  selectedId: null,
};

let draggedLayerId = null;

function uid() {
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
    id: uid(),
    type,
    x: 100,
    y: 100,
    width: type === "rectangle" ? 300 : 250,
    height: type === "rectangle" ? 200 : 120,
    color: type === "rectangle" ? "#ff0000" : "#333333",
    text: type === "text" ? "Text" : "",
    zIndex: state.elements.length + 1,
  };

  state.elements.push(data);
  const el = buildDOMElement(data);
  canvas.appendChild(el);
  selectElement(data.id);
  updateZIndex();
  renderLayers();
  saveState();
}

function buildDOMElement(data) {
  const el = document.createElement("div");
  el.className = "new-element";
  el.dataset.id = data.id;

  applyState(el, data);

  if (data.type === "text") {
    el.textContent = data.text;
    el.contentEditable = true;
  }

  ["tl", "tr", "bl", "br"].forEach((pos) => {
    const h = document.createElement("div");
    h.classList.add("corner", pos);
    h.addEventListener("mousedown", (e) => startResize(e, el, pos));
    el.appendChild(h);
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
  renderProperties();
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

function renderProperties() {
  const el = getSelectedDOM();
  if (!el) return;

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
      applyState(el, data);
      saveState();
    });
  });
}

function syncState(el) {
  const data = state.elements.find((e) => e.id === el.dataset.id);
  data.x = el.offsetLeft;
  data.y = el.offsetTop;
  data.width = el.offsetWidth;
  data.height = el.offsetHeight;
}

function applyState(el, data) {
  el.style.left = data.x + "px";
  el.style.top = data.y + "px";
  el.style.width = data.width + "px";
  el.style.height = data.height + "px";
  el.style.backgroundColor = data.color;
  el.style.zIndex = data.zIndex;
}

function renderLayers() {
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
        draggedLayerId = el.id;
        item.classList.add("dragging");
      };

      item.ondragend = () => {
        draggedLayerId = null;
        item.classList.remove("dragging");
      };

      item.ondragover = (e) => e.preventDefault();

      item.ondrop = () => reorderLayers(draggedLayerId, el.id);

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
  renderLayers();
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
    renderLayers();
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

window.addEventListener("load", () => {
  const saved = JSON.parse(localStorage.getItem("figma-state"));
  if (!saved) return;

  state.elements = saved;
  saved.forEach((el) => {
    canvas.appendChild(buildDOMElement(el));
  });
  updateZIndex();
  renderLayers();
});
