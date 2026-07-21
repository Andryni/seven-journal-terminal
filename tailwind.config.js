/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tradezella: {
          bg: '#0e0f12',         // Anthracite sombre principal
          card: '#181920',       // Cartes & surfaces
          panel: '#15161c',      // Panneaux secondaires
          border: '#262833',     // Fines bordures
          'border-bright': '#363948',
          indigo: {
            DEFAULT: '#6366f1',  // Violet Indigo TradeZella
            hover: '#4f46e5',
            light: '#818cf8',
            glow: 'rgba(99, 102, 241, 0.25)',
          },
          green: {
            DEFAULT: '#10b981',  // Vert Émeraude TradeZella
            light: '#34d399',
            dark: '#065f46',
            glow: 'rgba(16, 185, 129, 0.2)',
          },
          red: {
            DEFAULT: '#ef4444',    // Rouge Pertes
            light: '#f87171',
            dark: '#881337',
            glow: 'rgba(239, 68, 68, 0.2)',
          },
          text: {
            primary: '#f8fafc',
            secondary: '#94a3b8',
            muted: '#64748b',
          }
        },
        // Alias de compatibilité redirigés sur la palette TradeZella
        bloomberg: {
          bg: '#0e0f12',
          surface: '#181920',
          'surface-2': '#1c1e27',
          border: '#262833',
          'border-bright': '#363948',
          gold: {
            DEFAULT: '#6366f1',
            hover: '#4f46e5',
            light: '#818cf8',
            glow: 'rgba(99, 102, 241, 0.25)',
          },
          green: {
            DEFAULT: '#10b981',
            light: '#34d399',
            glow: 'rgba(16, 185, 129, 0.2)',
          },
          red: {
            DEFAULT: '#ef4444',
            light: '#f87171',
            glow: 'rgba(239, 68, 68, 0.2)',
          },
          blue: {
            DEFAULT: '#6366f1',
            light: '#818cf8',
          },
          text: {
            primary: '#f8fafc',
            secondary: '#94a3b8',
            muted: '#64748b',
          }
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Geist Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.2s ease-out both',
        'slide-in-left': 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'tradezella-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'tradezella-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'indigo-glow': '0 0 16px rgba(99, 102, 241, 0.3)',
        'green-glow': '0 0 16px rgba(16, 185, 129, 0.3)',
        'red-glow': '0 0 16px rgba(239, 68, 68, 0.3)',
      },
    },
  },
  plugins: [],
}
