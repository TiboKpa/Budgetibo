/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9', // Sky blue
          600: '#0284c7',
          900: '#0c4a6e',
        },
        dark: {
          bg: '#111827',
          card: '#1f2937',
          text: '#f3f4f6'
        }
      }
    },
  },
  plugins: [],
}
