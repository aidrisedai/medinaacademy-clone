/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#1a1d21',
          hover: '#27242c',
          active: '#27242c',
          border: '#2c2d30',
          text: '#b9bbbe',
          'text-dim': '#72767d',
          'text-active': '#ffffff',
        },
        surface: {
          primary: '#ffffff',
          secondary: '#f8f8f8',
          elevated: '#ffffff',
          overlay: 'rgba(0,0,0,0.5)',
        },
        brand: {
          50: '#f0e6ff',
          100: '#e0ccff',
          200: '#c199ff',
          300: '#a166ff',
          400: '#8233ff',
          500: '#6200ee',
          600: '#4e00be',
          700: '#3b008f',
          800: '#27005f',
          900: '#140030',
          DEFAULT: '#4a154b',
        },
        message: {
          hover: '#f8f8f8',
          selected: '#eef0f3',
        },
      },
      fontFamily: {
        sans: [
          'Lato',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['Slack-Mono', 'Monaco', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.46667rem' }],
      },
      animation: {
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'slide-out-right': 'slideOutRight 0.2s ease-in',
        'fade-in': 'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.1s ease-out',
        'bounce-in': 'bounceIn 0.3s cubic-bezier(0.68,-0.55,0.265,1.55)',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          from: { transform: 'translateX(0)', opacity: '1' },
          to: { transform: 'translateX(100%)', opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          from: { transform: 'scale(0)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'message-hover': '0 1px 3px rgba(0,0,0,0.12)',
        'thread': '0 0 0 1px rgba(var(--sk_primary_background, #fff), 0.2)',
        'popover': '0 0 0 1px rgba(29,28,29,0.13), 0 4px 12px rgba(29,28,29,0.15)',
        'modal': '0 0 0 1px rgba(29,28,29,0.13), 0 8px 32px rgba(29,28,29,0.25)',
      },
    },
  },
  plugins: [],
}
