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
          darkBg: '#2C0140',
          primary: '#4A008B',
          secondary: '#7B1FA2',
          lightBg: '#F3E8FF',
          textDark: '#343A40',
          textMuted: '#A0A0A0', // Ajustado para mejor legibilidad en inputs oscuros
          accent: '#0AE8C6',
          hoverDark: '#38006B',
          hoverLight: '#E0B3FF',
        }
      },
      fontFamily: {
        tight: ['InterTight', 'sans-serif'],
        sans: ['HankenGrotesk', 'sans-serif'],
      },
      boxShadow: {
        'touch-1': '0 2px 10px rgba(0,0,0,.08)',
        'touch-2': '0 8px 22px rgba(0,0,0,.14)',
        'touch-3': '0 18px 44px rgba(0,0,0,.22)',
      },
      // 🚀 Agregamos la animación para el botón turquesa ¡STOP!
      animation: {
        'pulse-vibrant': 'pulseVibrant 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseVibrant: {
          '0%, 100%': { opacity: 1, boxShadow: '0 18px 44px rgba(10, 232, 198, 0.15)' },
          '50%': { opacity: 0.95, boxShadow: '0 18px 44px rgba(10, 232, 198, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}