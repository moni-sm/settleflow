/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        settled: '#1D9E75',
        retrying: '#BA7517',
        failed: '#A32D2D',
      },
    },
  },
  plugins: [],
};
