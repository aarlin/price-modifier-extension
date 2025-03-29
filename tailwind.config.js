/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blackA: {
          1: 'rgba(0, 0, 0, 0.05)',
          2: 'rgba(0, 0, 0, 0.1)',
          3: 'rgba(0, 0, 0, 0.15)',
          4: 'rgba(0, 0, 0, 0.2)',
          5: 'rgba(0, 0, 0, 0.25)',
          6: 'rgba(0, 0, 0, 0.3)',
          7: 'rgba(0, 0, 0, 0.35)',
          8: 'rgba(0, 0, 0, 0.4)',
          9: 'rgba(0, 0, 0, 0.45)',
          10: 'rgba(0, 0, 0, 0.5)',
          11: 'rgba(0, 0, 0, 0.55)',
          12: 'rgba(0, 0, 0, 0.6)',
        },
      },
    },
  },
  plugins: [],
}; 