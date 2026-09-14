/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Restrained, professional palette per BODY FLEX design spec.
        bg: "#F7F8FA",
        surface: "#FFFFFF",
        ink: "#171717",
        muted: "#6B7280",
        line: "#E5E7EB",
        brand: {
          DEFAULT: "#1F3A5F",
          50: "#EEF2F6",
          100: "#D9E1EA",
          600: "#1F3A5F",
          700: "#18304E",
          900: "#0F1F33",
        },
        slate2: "#64748B",
        status: {
          paidBg: "#ECFDF3",
          paidText: "#0F7A4D",
          dueBg: "#FFFBEB",
          dueText: "#92400E",
          overdueBg: "#FEF2F2",
          overdueText: "#B91C1C",
          inactiveBg: "#F3F4F6",
          inactiveText: "#4B5563",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
