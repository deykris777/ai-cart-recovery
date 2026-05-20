/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080C10",
        surface: "#0E1318",
        border: "#1C232B",
        accent: "#2DD4BF",
        "accent-dim": "rgba(45, 212, 191, 0.15)",
        textPrimary: "#F3F4F6",
        textSecondary: "#9CA3AF",
        textMuted: "#6B7280",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
}
