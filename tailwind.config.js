/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Claude-inspired dark theme
        dark: {
          bg: '#0A0A0A',           // Main background - deep near-black
          'bg-secondary': '#111111', // Secondary background
          surface: '#1C1C1C',       // Cards, panels, chat messages
          'surface-hover': '#1F1F1F', // Slightly lighter for hover states
          border: '#2A2A2A',        // Borders
          'border-light': '#333333',
          text: '#FFFFFF',          // Primary text
          'text-secondary': '#B1ADA1', // Muted text (Cloudy)
          'text-muted': '#6B6B6B',
          accent: '#C15F3C',        // Crail - terracotta orange
          'accent-hover': '#A84E2F',
          'accent-light': '#D47A5A',
          success: '#5A9A6E',
          'success-hover': '#4A8A5E',
          danger: '#C45C5C',
          'danger-hover': '#B44C4C',
          warning: '#C49A5C',
        },
        // Light mode colors
        light: {
          bg: '#F4F3EE',           // Pampas - warm off-white
          'bg-secondary': '#FFFFFF',
          surface: '#FFFFFF',
          border: '#E5E5E5',
          text: '#1A1A1A',
          'text-secondary': '#6B6B6B',
        },
        // Named colors
        crail: '#C15F3C',          // Primary accent
        cloudy: '#B1ADA1',         // Secondary/muted
        pampas: '#F4F3EE',         // Light mode background
      },
      boxShadow: {
        'glow': '0 0 30px rgba(193, 95, 60, 0.2)',
        'glow-sm': '0 0 15px rgba(193, 95, 60, 0.15)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
}