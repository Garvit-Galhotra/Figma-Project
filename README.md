# 🎨 DesignX --- Figma-Style Web Design Editor (Pure HTML, CSS & Vanilla JS)

## 📌 Project Overview

**DesignX** is a **Figma-inspired web-based design editor** built
entirely using **pure HTML, CSS, and Vanilla JavaScript**, without any
external frameworks or libraries.

The goal of this project is to deeply understand and implement
**real-world frontend editor architecture**, including:

- Centralized **state management**
- **DOM-based rendering engine**
- Drag, resize & rotate interaction systems
- **Layer ordering & z-index control**
- **Live properties inspector**
- **LocalStorage persistence**
- **Export pipelines (JSON + HTML)**
- Modern **UI/UX engineering**

This project simulates the **core internal systems of professional
design tools like Figma and Canva**, making it a strong demonstration of
**advanced frontend engineering skills**.

---

## 🧠 Core Architecture --- State-Driven Design Engine

The entire editor is powered by a **centralized state object**, inspired
by React-style architecture.

```js
const state = {
  elements: [],
  selectedId: null,
  canvasColor: ...
};
```

Each element is stored inside this state with:

- Unique ID (`crypto.randomUUID()`)
- Type (rectangle / text)
- Position (X, Y)
- Dimensions (Width, Height)
- Background Color
- Rotation Angle
- Z-index (layer ordering)
- Text content (for text elements)

This enables:

- Precise **DOM ↔ state synchronization**
- Clean **selection management**
- Persistent **LocalStorage storage**
- Reliable **export generation**
- Scalable architecture for future features

---

## ➕ Element Creation Workflow

When **Rectangle** or **Text** is added:

1.  Unique ID is generated
2.  Default properties are assigned
3.  Element object is pushed into global state
4.  DOM element is dynamically created
5.  Element becomes selectable
6.  State is saved to **LocalStorage**
7.  Layers panel is updated

---

## 🎛️ Properties Inspector (Live Property Binding)

Selecting any element opens a **dynamic properties panel** allowing
real-time control of:

- Width\
- Height\
- X position\
- Y position\
- Color\
- Rotation

All inputs are **two-way bound** to the state engine, ensuring instant
UI updates and persistent storage.

---

## 🖱️ Drag System

Elements support **free-form drag movement** using:

- `mousedown` → drag start\
- `mousemove` → real-time movement\
- `mouseup` → save final state

Movement is **pixel-perfect** and fully synchronized with state.

---

## 🔲 Resize System

Each element includes a **resize handle** enabling:

- Dynamic width & height changes
- Minimum size enforcement
- Live visual resizing
- State & DOM synchronization

---

## 🔄 Rotation System

A **dedicated rotation handle** appears above selected elements.

Rotation uses **trigonometric angle calculations**:

- Calculates center point
- Tracks mouse movement
- Computes rotation using `Math.atan2()`
- Applies smooth real-time rotation

All rotation data is **persisted and exportable**.

---

## 🗂️ Layer Panel System

Each canvas element appears in the **layers panel**, supporting:

- Drag & drop reordering
- Dynamic z-index recalculation
- Live canvas layering updates

This system mirrors **professional layer control mechanisms** found in
real design tools.

---

## 🎨 Theme Engine

DesignX supports **four dynamic UI themes**:

- Dark\
- Light\
- Ocean\
- Cyber

Theme selection is:

- Instantly applied\
- Persisted using LocalStorage\
- Smoothly animated using CSS transitions

---

## 🎨 Canvas Color Control

When no element is selected, the properties panel exposes **canvas
background color control**, allowing users to modify the design surface
itself.

---

## 💾 Persistent Storage (LocalStorage Engine)

All editor state is stored using **LocalStorage**, enabling:

- Auto-save functionality\
- Full restoration after reload\
- Seamless editing continuity

---

## 📤 Export System

### 📄 JSON Export

Exports the **entire project state** for:

- Backup
- Debugging
- External processing
- Future import pipelines

---

### 🌐 HTML Export

Generates a **fully standalone HTML file** reproducing:

- Exact element positions
- Dimensions
- Colors
- Rotations
- Layer ordering

This allows **direct hosting and sharing of designs**.

---

## 🧹 Clear Canvas

Provides a full reset:

- Clears canvas
- Resets state
- Wipes LocalStorage
- Restores clean workspace

---

## ⌨️ Keyboard Controls

Key Action

---

Arrow Keys Move selected element (5px step)
Delete Remove selected element

---

## 🧠 Engineering Highlights

- Fully **state-driven UI system**
- Zero frameworks --- **pure Vanilla JavaScript**
- Advanced **drag / resize / rotate math**
- DOM performance optimizations
- Real editor-style architecture
- Professional UI polish

---

## 📊 Contribution Disclosure

**Primary Developer:** Garvit Galhotra

This project was **primarily developed by me**, with **AI-assisted
optimization and debugging support** for learning and improvement.

---

## 🏆 Final Note

DesignX demonstrates **real-world frontend engineering practices**,
editor architecture design, and interaction logic.

This project reflects **professional-grade development principles** and
showcases strong skills in:

- UI Engineering\
- Frontend System Design\
- State Architecture\
- Interaction Modeling

---

**Author:** Garvit Galhotra\
**Project Name:** DesignX\
**Category:** Advanced Frontend Engineering Project
