/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#171615',
        charcoal: '#242220',
        surface: '#2D2A27',
        'surface-elevated': '#35322F',
        copper: '#C86B3C',
        'copper-hover': '#D47A4B',
        'copper-light': '#E08A5E',
        teal: '#5FA7A0',
        'teal-dark': '#3D736E',
        sage: '#8BA58A',
        'sage-dark': '#5E745D',
        amber: '#D99A4E',
        'amber-dark': '#9A6B32',
        coral: '#C95F55',
        'coral-dark': '#8E3F37',
        ivory: '#E9DFC8',
        'text-secondary': '#B8B1A5',
        'text-muted': '#817A71',
        border: '#3A3631',
        'border-subtle': '#2B2824',
        'border-highlight': '#4D4741',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
