/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        border: 'rgb(229 231 235)',
        background: 'rgb(249 250 251)',
        foreground: 'rgb(17 24 39)',
      }
    },
  },
  plugins: [],
}