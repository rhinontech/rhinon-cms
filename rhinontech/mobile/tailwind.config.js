/**
 * Tokens mirror the admin panel's (rhinontech/admin-panel/app/globals.css),
 * converted from oklch to RGB channels so NativeWind can apply opacity
 * modifiers (`bg-primary/10`). Values live in src/global.css.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // "class" so Settings can override the device theme (light / dark / system).
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: { DEFAULT: token("card"), foreground: token("foreground") },
        primary: { DEFAULT: token("primary"), foreground: token("primary-foreground") },
        muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
        accent: { DEFAULT: token("accent"), foreground: token("foreground") },
        border: token("border"),
        destructive: token("destructive"),
        brand: { DEFAULT: token("brand"), foreground: token("brand-foreground") },
        success: token("success"),
        warning: token("warning"),
      },
      fontFamily: {
        sans: ["Geist_400Regular"],
        medium: ["Geist_500Medium"],
        semibold: ["Geist_600SemiBold"],
        bold: ["Geist_700Bold"],
        extrabold: ["Geist_800ExtraBold"],
      },
      borderRadius: { xl: "14px", "2xl": "18px", "3xl": "24px" },
    },
  },
  plugins: [],
};
