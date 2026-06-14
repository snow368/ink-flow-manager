/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f6f9',
          100: '#e7e7ef',
          200: '#d1d1e2',
          300: '#afafcc',
          400: '#8888b0',
          500: '#6b6b98',
          600: '#56567d',
          700: '#484865',
          800: '#3e3e55',
          900: '#373749',
          950: '#1c1c28',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Noto Sans SC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
