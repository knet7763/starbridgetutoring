/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#EAB308", // Yellow-500
                secondary: "#CA8A04", // Yellow-600
                accent: "#2563EB", // Blue-600
            },
        },
    },
    plugins: [],
}
