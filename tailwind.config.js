/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#FF6B35',
          50: '#FFF5F0',
          100: '#FFE8DE',
          200: '#FFD0BC',
          300: '#FFB899',
          400: '#FF9167',
          500: '#FF6B35',
          600: '#E55A2B',
          700: '#CC4A21',
          800: '#B23A17',
          900: '#992A0D',
        },
        navy: {
          DEFAULT: '#1E293B',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        teal: {
          DEFAULT: '#14B8A6',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        cream: '#FFFBEB',
        'gray-light': '#F8FAFC',
        border: '#E2E8F0',
        success: '#22C55E',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['56px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'section': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      maxWidth: {
        'container': '1200px',
      },
      borderRadius: {
        'button': '8px',
        'card': '12px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(30, 41, 59, 0.05)',
        'md': '0 4px 12px rgba(30, 41, 59, 0.08)',
        'lg': '0 8px 24px rgba(30, 41, 59, 0.12)',
      },
    },
  },
  plugins: [],
}
