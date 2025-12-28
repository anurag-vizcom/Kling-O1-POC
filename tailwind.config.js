/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        canvas: {
          bg: '#0a0a0b',
          grid: '#1a1a1d',
        },
        node: {
          bg: '#141416',
          border: '#2a2a2e',
          hover: '#3a3a40',
        },
        accent: {
          primary: '#00d4aa',
          secondary: '#7c3aed',
          warning: '#f59e0b',
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 212, 170, 0.4)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(0, 212, 170, 0.2)' },
        }
      }
    },
  },
  plugins: [],
}

