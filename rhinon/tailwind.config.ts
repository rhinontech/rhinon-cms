import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        panel: "#0f172a",
        slateGlass: "rgba(15, 23, 42, 0.6)",
        accent: "#22d3ee",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34, 211, 238, 0.24), 0 12px 40px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
