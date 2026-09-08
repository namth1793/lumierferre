/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#F8F5F0',
        'warm-gray': '#8A8A8A',
        'light-gray': '#E8E8E8',
        charcoal: '#2C2C2C',
      },
      letterSpacing: {
        'super-wide': '0.25em',
        'ultra-wide': '0.35em',
      },
      transitionDuration: {
        400: '400ms',
      },
    },
  },
  plugins: [],
};
