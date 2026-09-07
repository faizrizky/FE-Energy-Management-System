import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './column/**/*.{ts,tsx}',
    './feat/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          700: '#047857',
        },
        slate: {
          50: '#f8fafc',
          200: '#e2e8f0',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          950: '#020617',
        },
        status: {
          error: '#ef4444',
        },
      },
      fontFamily: {
        display: ['var(--font-oxanium)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        md: '8px',
        lg: '10px',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
