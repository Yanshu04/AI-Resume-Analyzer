import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        text: '#F5F5F0',
        accent: '#C8F135', // sharp lime
        card: '#1A1A1A',
        border: '#2A2A2A',
        muted: '#A3A3A3',
        hover: '#1F1F1F',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
