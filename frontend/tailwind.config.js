/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      },
      fontFamily: {
        sans: [
          'Hiragino Sans',
          'ヒラギノ角ゴシック',
          'Yu Gothic UI',
          'Meiryo UI',
          'Segoe UI',
          'sans-serif'
        ],
      }
    },
  },
  plugins: [],
}