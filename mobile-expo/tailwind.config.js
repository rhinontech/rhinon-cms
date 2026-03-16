/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./screens/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        rhinon: {
          bg: "#060A12",
          card: "#101826",
          surface: "#0B1320",
          border: "#1D2A3E",
          muted: "#8FA3C7",
          text: "#F5F7FB",
          cyan: "#22D3EE",
          blue: "#3B82F6",
          violet: "#8B5CF6",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
        },
      },
    },
  },
};
