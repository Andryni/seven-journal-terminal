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
          bg: '#0e0f12',
          card: '#181920',
          panel: '#15161c',
          border: '#262833',
          'border-bright': '#363948',
          indigo: {
            DEFAULT: '#6366f1',
            hover: '#4f46e5',
            light: '#818cf8',
            glow: 'rgba(99, 102, 241, 0.25)',
          },
          violet: {
            DEFAULT: '#8b5cf6',
            light: '#a78bfa',
            glow: 'rgba(139, 92, 246, 0.25)',
          },
          cyan: {
            DEFAULT: '#06b6d4',
            light: '#67e8f9',
            glow: 'rgba(6, 182, 212, 0.25)',
          },
          green: {
            DEFAULT: '#10b981',
            light: '#34d399',
            dark: '#065f46',
            glow: 'rgba(16, 185, 129, 0.2)',
          },
          red: {
            DEFAULT: '#ef4444',
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
        mono:    ['JetBrains Mono', 'Geist Mono', 'Fira Code', 'monospace'],
        heading: ['Space Grotesk', 'Outfit', 'sans-serif'],
        sans:    ['DM Sans', 'Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up':    'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':       'fadeIn 0.2s ease-out both',
        'slide-in-left': 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'border-glow':   'borderGlow 4s ease infinite',
        'neon-flicker':  'neonFlicker 3s infinite',
        'glow-pulse':    'glowPulse 2.5s ease-in-out infinite',
        'stagger-in':    'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'float':         'float 3s ease-in-out infinite',
        'live-pulse':    'livePulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        borderGlow: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        neonFlicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
          '20%, 24%, 55%': { opacity: '0.7' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(99,102,241,0.3)' },
          '50%':       { boxShadow: '0 0 24px rgba(99,102,241,0.7), 0 0 40px rgba(99,102,241,0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-6px)' },
        },
        livePulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':       { transform: 'scale(1.5)', opacity: '0.6' },
        },
      },
      boxShadow: {
        'tradezella-sm':   '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'tradezella-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'indigo-glow':     '0 0 16px rgba(99, 102, 241, 0.3)',
        'green-glow':      '0 0 16px rgba(16, 185, 129, 0.3)',
        'red-glow':        '0 0 16px rgba(239, 68, 68, 0.3)',
        'violet-glow':     '0 0 20px rgba(139, 92, 246, 0.35)',
        'cyan-glow':       '0 0 20px rgba(6, 182, 212, 0.35)',
        'card-premium':    '0 10px 30px -5px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
        'neon-border':     '0 0 0 1px rgba(99,102,241,0.5), 0 0 20px rgba(99,102,241,0.2)',
      },
    },
  },
  plugins: [],
}
