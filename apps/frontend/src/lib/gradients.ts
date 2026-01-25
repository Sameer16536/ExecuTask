// Modern gradient and color utilities for ExecuTask

export const gradients = {
    primary: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-600',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600',
    info: 'bg-gradient-to-r from-blue-500 to-cyan-600',

    // Hero gradients
    hero: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
    heroAlt: 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600',

    // Subtle gradients for cards
    cardLight: 'bg-gradient-to-br from-white to-gray-50',
    cardDark: 'bg-gradient-to-br from-gray-900 to-gray-800',

    // Text gradients
    textPrimary: 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent',
    textSuccess: 'bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent',
    textWarning: 'bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent',
};

export const glassEffect = {
    light: 'bg-white/10 backdrop-blur-lg border border-white/20',
    dark: 'bg-gray-900/10 backdrop-blur-lg border border-gray-700/20',
    colored: 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20',
};

export const shadows = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg shadow-indigo-500/10',
    xl: 'shadow-xl shadow-indigo-500/20',
    '2xl': 'shadow-2xl shadow-indigo-500/30',
    glow: 'shadow-lg shadow-purple-500/50',
    glowStrong: 'shadow-2xl shadow-purple-500/70',
};

export const hoverEffects = {
    lift: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
    scale: 'transition-transform duration-300 hover:scale-105',
    glow: 'transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50',
    brighten: 'transition-all duration-300 hover:brightness-110',
};
