/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'wall-bg': '#111111',
        'wall-surface': '#161616',
        'wall-card': '#1e1e1e',
        'wall-cardHover': '#252525',
        'wall-cardBorder': '#2a2a2a',
        'wall-text': '#e0e0e0',
        'wall-textMuted': '#888888',
        'wall-textDim': '#555555',
        'wall-accent': '#e0e0e0',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Courier New', 'monospace'],
        handwriting: ['IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
