/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        boomwhackers: {
          C: '#EF4444', // 도 (빨강)
          D: '#F97316', // 레 (주황)
          E: '#EAB308', // 미 (노랑)
          F: '#22C55E', // 파 (초록)
          G: '#06B6D4', // 솔 (하늘/파랑)
          A: '#6366F1', // 라 (남색)
          B: '#A855F7', // 시 (보라)
        }
      }
    },
  },
  plugins: [],
}
