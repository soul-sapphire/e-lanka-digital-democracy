/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lanka: {
          maroon: '#8D153A',   // Sri Lanka National Flag Maroon
          gold: '#FFBE29',     // Sri Lanka Flag Gold / Orange
          emerald: '#00534E',  // Flag Teal / Green
          navy: '#0F172A',     // Deep Slate Navy
          slate: '#334155'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        sinhala: ['Noto Sans Sinhala', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'sans-serif']
      }
    },
  },
  plugins: [],
}

