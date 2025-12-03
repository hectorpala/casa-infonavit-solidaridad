/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./culiacan/**/*.html",
    "./monterrey/**/*.html",
    "./mazatlan/**/*.html",
    "./solidaridad/**/*.html",
    "./*.html"
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#FF6A00',
        'primary-dark': '#D35500',
        'hector': '#FF6A00',
        'hector-dark': '#D35500',
        'bg-alt': '#121A2D',
        'card-glass': 'rgba(255,255,255,0.08)',
        'card-border': 'rgba(255,255,255,0.12)',
        'text-muted': '#64748B',
        'success': '#22C55E',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'system': ['Poppins', 'system-ui', 'Arial', 'sans-serif'],
      },
      fontWeight: {
        'heading': '800',
      },
      letterSpacing: {
        'heading': '-0.02em',
      },
      boxShadow: {
        'elevation': '0 10px 25px rgba(0,0,0,0.25)',
        'shadow': '0 10px 25px rgba(0,0,0,0.35)',
      }
    }
  },
  plugins: [],
}
