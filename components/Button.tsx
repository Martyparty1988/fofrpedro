import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
    const baseClasses = "px-6 py-3 text-lg font-bold tracking-wider uppercase rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black transform active:scale-95";
    const variantClasses = variant === 'primary' 
        ? "glassmorphism text-white border-2 border-fuchsia-500/50 shadow-lg shadow-fuchsia-500/20 hover:bg-fuchsia-500/20 hover:shadow-fuchsia-500/40 hover:border-fuchsia-500 focus:ring-fuchsia-500"
        : "bg-transparent text-gray-300 hover:text-white hover:bg-gray-700/50 focus:ring-gray-400";

    return (
        <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
            {children}
        </button>
    );
};