/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#0f1115',
          panel: '#181a20',
          panelBorder: '#282b35',
          header: '#13151a',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          text: '#e2e8f0',
          textMuted: '#94a3b8',
          activeItem: '#2d3342',
          hoverItem: '#20242d',
          danger: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
