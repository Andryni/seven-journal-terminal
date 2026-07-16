/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bloomberg: {
          bg: '#020515',
          surface: 'rgba(6, 11, 40, 0.74)',
          'surface-2': 'rgba(10, 16, 56, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-bright': 'rgba(255, 255, 255, 0.16)',
          gold: {
            DEFAULT: '#0075ff', // Utilisation de bleu électrique principal style Vision UI
            hover: '#005ecc',
            light: '#59a2ff',
            glow: '#80baff',
          },
          green: {
            DEFAULT: '#01b574',
            light: '#05cd99',
            glow: '#33f0c0',
          },
          red: {
            DEFAULT: '#ee5d50',
            light: '#ff7c70',
            glow: '#ff9d94',
          },
          blue: {
            DEFAULT: '#0075ff',
            light: '#59a2ff',
          },
          text: {
            primary: '#ffffff',
            secondary: '#a0aec0',
            muted: '#4a5568',
          }
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Geist Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.35s ease-out both',
        'fade-in': 'fadeIn 0.25s ease-out both',
        'slide-in-left': 'slideInLeft 0.3s ease-out both',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2.2s linear infinite',
        'scan-line': 'scanLine 3s linear infinite',
        'ticker': 'ticker 20s linear infinite',
        'blink': 'blink 1.1s step-end infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0px rgba(217, 119, 6, 0)' },
          '50%': { boxShadow: '0 0 16px rgba(217, 119, 6, 0.25)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'gold-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(217,119,6,0.15) 50%, transparent 100%)',
        'subtle-grid': 'linear-gradient(rgba(26,26,31,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,31,0.4) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'gold-sm': '0 0 10px rgba(0, 117, 255, 0.25)',
        'gold-md': '0 10px 30px rgba(0, 117, 255, 0.35)',
        'green-sm': '0 0 10px rgba(1, 181, 116, 0.25)',
        'red-sm': '0 0 10px rgba(238, 93, 80, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'inner-dark': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
}
