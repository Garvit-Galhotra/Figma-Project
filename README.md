# 🎨 DesignX — Figma-Style Web Design Editor (Vanilla JavaScript)

## 📌 Project Overview

**DesignX** is a **Figma-inspired web-based design editor** built using **pure HTML, CSS, and Vanilla JavaScript**.  
The core objective of this project was to understand and implement **real-world editor architecture**, including **state management, DOM-based rendering, drag & drop systems, property binding, layer control, persistence, and export workflows** — without using any frameworks or libraries.

---

## 🧠 Core Concept — State-Based Architecture (Inspired by React)

The entire editor is built around a **central state management system**, inspired by React’s state concept.

A **global state object** stores all elements present on the canvas, along with their properties:

- Unique ID
- Position (X, Y)
- Dimensions (Width, Height)
- Color
- Rotation
- Z-index
- Text content

Each newly created element is **pushed into this central state** using a **unique ID generated via `crypto.randomUUID()`**.

This architecture allows:

- Element selection using unique IDs
- DOM ↔ state synchronization
- LocalStorage persistence
- Reliable export pipelines

---

## ➕ Element Creation Workflow

When the **Rectangle** or **Text** button is clicked:

1. A function generates a **unique ID**
2. Default properties are assigned
3. The element object is added to the **central state**
4. DOM element is created and appended
5. State is saved to **LocalStorage**

---

## 🎛️ Properties Panel System

On element selection:

- The matching state object is found using the unique ID
- The panel renders:
  - Width
  - Height
  - X
  - Y
  - Color
  - Rotation

All inputs are **two-way bound**, ensuring real-time updates.

---

## 🖱️ Drag System

Elements are draggable using:

- `mousedown` → start drag
- `mousemove` → live position update
- `mouseup` → state save

---

## 🔲 Resize System

Resize handles enable dynamic resizing by recalculating width & height during mouse movement.

---

## 🔄 Rotation System

A circular handle appears above the selected element.  
Dragging this handle rotates the element using trigonometric angle calculations.

Rotation is fully synced with state and LocalStorage.

---

## 🗂️ Layer Panel System

Each element appears inside a **draggable layers panel**:

- Supports drag & drop reorder
- Auto updates z-index

---

## 💾 Persistent Storage

All editor state is stored using **LocalStorage** and restored on reload.

---

## 📤 Export System

### JSON Export

Downloads complete project state.

### HTML Export

Generates a standalone HTML layout matching the canvas exactly.

---

## 🧹 Clear Canvas

Clears all elements, resets state, and wipes LocalStorage.

---

## ⌨️ Keyboard Controls

- **Shift + Arrow Keys** → Move element by 5px
- **Delete** → Remove element

---

## 📊 Contribution Disclosure

**75% of the code was written by me.**  
Remaining was assisted using ChatGPT and YouTube for optimization and learning.

---

## 🏆 Final Note

DesignX simulates **professional-grade editor engineering**, demonstrating strong frontend architecture, UI engineering, and interaction logic.

---

**Author:** Garvit Galhotra  
**Project Name:** DesignX
