import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bedtijdavonturen: calm bedtime palette
        ink: {
          950: '#0B1020',
          900: '#0F1730',
          800: '#141F3D',
          700: '#1C2A54',
        },
        moon: {
          50: '#F5F7FF',
          100: '#ECEFFF',
          200: '#D9E0FF',
        },
        lavender: {
          300: '#B7B5FF',
          400: '#9A97FF',
          500: '#7C78FF',
        },
        mint: {
          400: '#3EE2C1',
          500: '#22C7A9',
        },
        sand: {
          50: '#FFF9F0',
          100: '#FFF0D9',
        },
        danger: {
          500: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 12px 30px rgba(5, 10, 30, 0.18)',
        card: '0 10px 24px rgba(5, 10, 30, 0.14)',
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
