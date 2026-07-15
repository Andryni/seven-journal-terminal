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
          bg: '#050506',
          surface: '#0a0a0d',
          'surface-2': '#0f0f14',
          border: '#1a1a1f',
          'border-bright': '#2a2a32',
          gold: {
            DEFAULT: '#d97706',
            hover: '#b45309',
            light: '#f59e0b',
            glow: '#fbbf24',
          },
          green: {
            DEFAULT: '#059669',
            light: '#10b981',
            glow: '#34d399',
          },
          red: {
            DEFAULT: '#dc2626',
            light: '#ef4444',
            glow: '#f87171',
          },
          blue: {
            DEFAULT: '#2563eb',
            light: '#3b82f6',
          },
          text: {
            primary: '#e4e4e7',
            secondary: '#71717a',
            muted: '#3f3f46',
          }
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Geist Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
        'gold-sm': '0 0 8px rgba(217, 119, 6, 0.2)',
        'gold-md': '0 0 20px rgba(217, 119, 6, 0.3)',
        'green-sm': '0 0 8px rgba(5, 150, 105, 0.2)',
        'red-sm': '0 0 8px rgba(220, 38, 38, 0.2)',
        'inner-dark': 'inset 0 1px 0 rgba(255,255,255,0.03)',
      },
    },
  },
  plugins: [],
}
