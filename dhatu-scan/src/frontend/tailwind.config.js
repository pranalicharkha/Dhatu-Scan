import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        /* Healthcare semantic colors */
        "teal-health": {
          DEFAULT: "oklch(0.72 0.18 176)",
          light: "oklch(0.82 0.15 176)",
          dark: "oklch(0.55 0.18 176)",
        },
        "blue-health": {
          DEFAULT: "oklch(0.60 0.15 235)",
          light: "oklch(0.72 0.14 235)",
          dark: "oklch(0.48 0.16 235)",
        },
        "green-health": {
          DEFAULT: "oklch(0.70 0.19 155)",
          light: "oklch(0.80 0.16 155)",
          dark: "oklch(0.55 0.19 155)",
        },
        "navy-health": {
          DEFAULT: "oklch(0.13 0.025 260)",
          light: "oklch(0.20 0.025 260)",
          dark: "oklch(0.09 0.020 260)",
        },
        "risk-low": "oklch(0.70 0.19 155)",
        "risk-moderate": "oklch(0.78 0.18 65)",
        "risk-high": "oklch(0.65 0.22 25)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        subtle: "0 4px 12px rgba(0,0,0,0.12)",
        elevated: "0 12px 32px rgba(0,0,0,0.25)",
        "glass-light": "inset 0 1px 0 rgba(255,255,255,0.1)",
        "glow-teal": "0 0 24px oklch(0.72 0.18 176 / 0.35)",
        "glow-green": "0 0 24px oklch(0.70 0.19 155 / 0.35)",
        "glow-blue": "0 0 24px oklch(0.60 0.15 235 / 0.35)",
        "card-glass": "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.75" },
        },
        "scan-pulse": {
          "0%": { transform: "translateY(0%)", opacity: "0.8" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0.8" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "blob-drift": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(20px, -20px) scale(1.05)" },
          "66%": { transform: "translate(-15px, 10px) scale(0.95)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 4s ease-in-out infinite",
        "float-slow": "float 6s ease-in-out infinite",
        "float-fast": "float 3s ease-in-out infinite",
        "pulse-gentle": "pulse-gentle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-pulse": "scan-pulse 2s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "blob-drift": "blob-drift 8s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out both",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
