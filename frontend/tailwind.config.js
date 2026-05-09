/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom trading palette
        surface: {
          DEFAULT: '#0f0f11',
          1: '#141418',
          2: '#1a1a20',
          3: '#222228',
          4: '#2a2a32',
        },
        border: {
          DEFAULT: '#2a2a32',
          light: '#3a3a44',
        },
        profit: {
          DEFAULT: '#22c55e',
          dim: '#16a34a',
          muted: '#15803d20',
        },
        loss: {
          DEFAULT: '#ef4444',
          dim: '#dc2626',
          muted: '#dc262620',
        },
        accent: {
          DEFAULT: '#6366f1',
          dim: '#4f46e5',
          muted: '#6366f120',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
