/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {
      backgroundImage: {
        'custom-gradient': 'linear-gradient(to right, #21897E, #2589BD)',
      },
      buttonStyles: {
        primary: 'text-sm tracking-wide font-semibold bg-indigo-500 text-gray-100 py-2 px-5 rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out focus:shadow-outline focus:outline-none',
      },
      colors: {
        'custom-hover': '#6c757d',
      },
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: 0 },
        '100%': { opacity: 1 },
      },
    },
    animation: {
      fadeIn: 'fadeIn 1s ease-in-out',
    },
    variants: {
      extend: {
        backgroundColor: ['hover'],
      },
    },
  },
  plugins: [
    require('flowbite/plugin'),
    function ({ addComponents }) {
      addComponents({
        '.btn-primary': {
          '@apply text-sm tracking-wide font-semibold bg-indigo-500 text-gray-100 py-2 px-5 rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out focus:outline-none': {},
        },
        '.btn-light': {
          '@apply text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700': {},
        },
      });
    },
  ],
}

