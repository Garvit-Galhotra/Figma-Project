# 🎨 Figma Style Design Tool (Vanilla JS)

A **lightweight Figma-style design editor** built using **pure HTML, CSS, and JavaScript**.  
This project allows users to **create, move, resize, layer, and edit elements** on a canvas — similar to core Figma functionality — without any external libraries or frameworks.

> Built as a learning + experimentation project to understand **drag-drop systems, canvas interactions, UI state management, and editor-style workflows**.

---

## 🚀 Features

- ➕ Add **Rectangles & Text elements**
- 🖱️ **Drag & move** elements freely on canvas
- 🔲 **Resize** using corner handles (4 directions)
- 🎯 **Element selection system**
- 🎛️ **Live properties panel**:
  - Position (X, Y)
  - Size (Width, Height)
  - Color
- 🗂️ **Layer system**:
  - Reorder elements using **drag & drop**
  - Auto-managed **z-index stacking**
- 💾 **Persistent state using LocalStorage**
- ⌨️ **Keyboard controls**:
  - Arrow keys → Move selected element
  - Delete → Remove selected element
- 🧠 **State-driven architecture**

---

## 🛠️ Tech Stack

- **HTML5**
- **CSS3 (Flexbox + UI styling)**
- **Vanilla JavaScript (No frameworks, no libraries)**

---

## 📂 Project Structure

```
├── index.html   → UI layout & structure
├── style.css    → Complete UI & canvas styling
├── app.js       → Core logic (drag, resize, state, layers, properties)
```

---

## 🧪 How To Run Locally

```bash
git clone https://github.com/Garvit-Galhotra/Figma-Project
cd Figma-Project
```

Open index.html in your browser.

---

## 👨‍💻 Author

**Garvit Galhotra**
