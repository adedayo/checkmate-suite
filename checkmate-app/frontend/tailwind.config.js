/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          800: 'hsl(220 20% 8%)',
        },
        indigo: {
          500: 'hsl(238 82% 65%)',
        },
        purple: {
          500: 'hsl(270 60% 50%)',
        }
      }
    },
  },
  plugins: [],
}
