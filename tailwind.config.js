/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      backgroundImage: {
        'custom-gradient': 'linear-gradient(to right, #21897E, #2589BD)',
      },
      colors: {
        'custom-hover': '#6c757d',
      },
    },
    variants: {
      extend: {
        backgroundColor: ['hover'],
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}

