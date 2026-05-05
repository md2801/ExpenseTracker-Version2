// frontend/src/index.js
// ============================================================
// Application entry point — mounts the React app into the DOM
// React 18 uses createRoot() instead of the old ReactDOM.render()
// ============================================================

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Find the <div id="root"> in public/index.html and attach React to it
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the top-level App component
// React.StrictMode enables extra development warnings (removed in production build)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
