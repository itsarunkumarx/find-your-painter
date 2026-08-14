/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['selector', '[data-theme="dark"]'],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'royal-gold': '#D4AF37',
                'gold-dark': '#B8860B',
                'navy-deep': '#0f172a',
                'royal-navy': '#1e293b',
                'ivory-light': '#FDFBF7',
                'ivory-subtle': '#FDFBF7',
                'ivory-highlight': '#FFF9E6',
                'royal-ivory': '#FFF9E6',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                royal: ['Playfair Display', 'serif'],
            },
            animation: {
                'aurora-shift': 'aurora-shift 20s ease-in-out infinite alternate',
                'float': 'float 6s ease-in-out infinite',
                'spin-slow': 'spin 8s linear infinite',
            },
            keyframes: {
                'aurora-shift': {
                    '0%': { transform: 'translate(0, 0) scale(1)' },
                    '100%': { transform: 'translate(2%, 2%) scale(1.1)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
