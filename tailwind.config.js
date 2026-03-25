/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wall: {
          bg: '#0a0a0a',
          surface: '#111111',
          card: '#1a1a1a',
          cardBorder: '#2a2a2a',
          cardHover: '#222222',
          text: '#e0e0e0',
          textMuted: '#888888',
          textDim: '#555555',
          accent: '#cccccc',
          paper: '#f5f5f0',
          paperBorder: '#d0d0c8',
          paperText: '#1a1a1a',
          paperMuted: '#666666',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        handwriting: ['Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)',
        cardHover: '0 4px 16px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.5)',
        paper: '2px 3px 12px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};