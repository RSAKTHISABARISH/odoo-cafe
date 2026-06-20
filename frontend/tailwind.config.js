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
        primary: {
          50:  '#FFF5F5',
          100: '#FFE0E0',
          200: '#FFC5C5',
          300: '#FF9E9E',
          400: '#FF6B6B',
          500: '#EF4444', // Vivid Red
          600: '#DC2626', // Deep Red
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        accent: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316', // Vivid Orange
          600: '#EA580C', // Deep Orange
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        surface: {
          50:  '#FFFFFF',
          100: '#FFF8F5', // Warm white tinted background
          200: '#FFE9E0',
          300: '#FFD5C8',
          400: '#FFBBA6',
          500: '#E89080',
          600: '#C06450',
          700: '#8B3A28',
          800: '#5C2318',
          900: '#3D1610',
          950: '#220C07',
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
      boxShadow: {
        'solid':       '0 4px 20px rgba(220, 38, 38, 0.08)',
        'solid-hover': '0 8px 30px rgba(220, 38, 38, 0.14)',
        'float':       '0 12px 40px rgba(220, 38, 38, 0.18)',
        'header':      '0 2px 10px rgba(220, 38, 38, 0.05)',
        'glow':        '0 0 20px rgba(249, 115, 22, 0.35)',
      },
      animation: {
        'fade-in':       'fadeIn 0.3s ease-out forwards',
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right':'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in':      'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slow-zoom':     'slowZoom 20s ease-in-out infinite alternate',
        'glow-pulse':    'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slowZoom: {
          '0%':   { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.15)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(249,115,22,0.3)' },
          '50%':       { boxShadow: '0 0 30px rgba(249,115,22,0.7)' },
        },
      }
    },
  },
  plugins: [],
}