/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#1DA1F2",  // Custom primary color
        secondary: "#FF6B00", // Custom secondary color
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'], // Custom font
        arial: ['Arial', 'sans-serif'],// You can add more custom fonts here
      },
      spacing: {
        '72': '18rem', // Custom spacing
        '84': '21rem', 
        '96': '24rem',
      },
      screens: {
        'xs': '480px', // Custom breakpoint for extra small screens
        // You can add more breakpoints here
      },
    },
  },
  plugins: [],
};
