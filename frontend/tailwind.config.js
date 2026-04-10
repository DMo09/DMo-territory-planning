/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        os: {
          red: '#E2001A',
          'red-dark': '#B8001A',
          'red-light': '#FF1A35',
          navy: '#0F0F1A',
          'navy-light': '#1A1A2E',
          'navy-surface': '#252540',
        },
        tier: {
          1: '#E2001A',
          2: '#F59E0B',
          3: '#6B7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
