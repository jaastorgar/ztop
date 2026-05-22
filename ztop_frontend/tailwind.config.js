/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-purple': '#4A008B',
        'secondary-purple': '#7B1FA2',
        'light-purple': '#F3E8FF',
        'dark-text': '#343A40',
        'turquoise': '#0AE8C6',
      },
      fontFamily: {
        'sans': ['HankenGrotesk', 'sans-serif'],
        'heading': ['InterTight', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
