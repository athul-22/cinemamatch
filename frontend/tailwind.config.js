export const content = ['./src/**/*.{js,jsx,ts,tsx}'];
export const theme = {
    extend: {
        colors: {
            royalViolet: '#6b21a8', 
        },
        animation: {
            fadeIn: 'fadeIn 0.5s ease-in',
        },
        keyframes: {
            fadeIn: {
                '0%': { opacity: '0', transform: 'translateY(10px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
            },
        },
    },
};
export const plugins = [];