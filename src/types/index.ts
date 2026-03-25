@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #0a0a0a;
    color: #e0e0e0;
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: #111111;
  }

  ::-webkit-scrollbar-thumb {
    background: #333333;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #444444;
  }
}

/* React Flow overrides */
.react-flow__background {
  background-color: #0a0a0a !important;
}

.react-flow__controls {
  background: #1a1a1a !important;
  border: 1px solid #2a2a2a !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
}

.react-flow__controls-button {
  background: #1a1a1a !important;
  border-color: #2a2a2a !important;
  fill: #888888 !important;
}

.react-flow__controls-button:hover {
  background: #222222 !important;
  fill: #cccccc !important;
}

.react-flow__minimap {
  background: #111111 !important;
  border: 1px solid #2a2a2a !important;
  border-radius: 8px !important;
}

.react-flow__minimap-mask {
  fill: rgba(200, 200, 200, 0.1) !important;
}

.react-flow__edge-path {
  stroke-linecap: round;
}

.react-flow__node {
  cursor: grab;
}

.react-flow__node:active {
  cursor: grabbing;
}

/* Paper card texture */
.paper-texture {
  background-color: #f5f5f0;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
}

/* Pin hole at top of card */
.pin-hole::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #333;
  border: 1px solid #555;
  z-index: 10;
}

/* Selection ring */
.react-flow__node.selected .paper-card {
  box-shadow: 0 0 0 2px rgba(200, 200, 200, 0.4), 2px 3px 12px rgba(0, 0, 0, 0.5);
}

/* Iframe sandbox styling */
.sandboxed-frame {
  border: none;
  border-radius: 4px;
  background: white;
}

/* Modal backdrop */
.modal-backdrop {
  backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.7);
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}