/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#050d1a',
          800: '#0a1628',
          700: '#0f1f3d',
          600: '#1a2f55',
        },
        gold: {
          400: '#d4a847',
          500: '#c9993c',
          600: '#b8842f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to bottom, rgba(5,13,26,0.55) 0%, rgba(5,13,26,0.75) 100%)',
      },
    },
  },
  plugins: [],
}
