import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F7F3EE",
          50: "#FDFBF8",
          100: "#F7F3EE",
          200: "#EDE4D8",
        },
        amber: {
          DEFAULT: "#E8B84B",
          dark: "#D4A017",
          light: "#F0C96A",
          50: "#FDF8EC",
          100: "#FAF0D2",
          200: "#F5E0A6",
          300: "#F0C96A",
          400: "#E8B84B",
          500: "#D4A017",
          600: "#B8880F",
          700: "#9A700C",
        },
        charcoal: {
          DEFAULT: "#1A1A2E",
          50: "#E8E8EF",
          100: "#C5C5D5",
          200: "#9B9BB5",
          300: "#6B6B95",
          400: "#3D3D70",
          500: "#1A1A2E",
          600: "#141424",
          700: "#0E0E1A",
        },
        muted: {
          DEFAULT: "#8B7355",
          light: "#A8906E",
          dark: "#6A5840",
        },
        badge: {
          sale: "#E53E3E",
          "sale-bg": "#FED7D7",
          new: "#38A169",
          "new-bg": "#C6F6D5",
        },
        border: "#E8DDD0",
        sidebar: "#F0EAE2",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 8px 24px rgba(0, 0, 0, 0.12)",
        sidebar: "2px 0 8px rgba(0, 0, 0, 0.05)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
