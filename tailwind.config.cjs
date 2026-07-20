/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './App.tsx',
        './components/**/*.{ts,tsx}',
        './constants/**/*.{ts,tsx}',
        './hooks/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
