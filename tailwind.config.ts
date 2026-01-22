import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bedtijdavonturen: calm bedtime palette (Refactor 2026)
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          800: '#243B53',
          900: '#102A43', // Primary Deep Navy
          950: '#0B1C2E', // Darker Reader Mode
        },
        teal: {
          100: '#E3F8F3',
          400: '#3EBD93',
          500: '#199473', // Primary Access
          600: '#137C5E', // Hover / Darker
          700: '#0F6049', // Active
        },
        amber: {
          100: '#FBF3D0',
          400: '#F0B429', // Highlight
          500: '#CB6E17',
        },
        ink: {
          950: '#102A43', // Mapped to Navy-900 for transition
          900: '#243B53',
          800: '#334E68',
          700: '#486581',
        },
        moon: {
          50: '#F0F4F8', // Mapped to Navy-50
          100: '#D9E2EC',
          200: '#BCCCDC',
        },
        lavender: {
          300: '#B7B5FF',
          400: '#7C78FF', // Kept for legacy compatibility
          500: '#645DD7',
        },
        bg: {
          DEFAULT: '#F5F2EC', // "Warm Paper" / Off-white from Mockup
          dark: '#102A43',
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
