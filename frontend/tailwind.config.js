/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Brand colors from Figma
        coral: {
          50:  '#FEF4F4',
          100: '#FDE6E6',
          200: '#FBCCCC',
          300: '#F5A9A9',
          400: '#EF7B7B',   // primary coral
          500: '#E86767',
          600: '#D94F4F',
        },
        lavender: {
          50:  '#F5F2FB',
          100: '#EBE6F6',
          200: '#DDD3F0',
          300: '#C9BAE8',
          400: '#B6A7E1',   // primary lavender
          500: '#9B8AD3',
          600: '#7F6EBF',
        },
        cream: { 50: '#FFFCFA', 100: '#FFF8F2' },
        ink:   { DEFAULT: '#46454B', 900: '#46454B' },
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'pinky-word-in':  { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pinky-nudge':    { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'pinky-word-in':  'pinky-word-in 0.5s ease-out both',
        'pinky-nudge':    'pinky-nudge 2.4s ease-in-out infinite',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
