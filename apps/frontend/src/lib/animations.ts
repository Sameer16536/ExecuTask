import { Variants } from 'framer-motion';

// Page transition animations
export const pageVariants: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.2,
            ease: 'easeIn',
        },
    },
};

// List item stagger animation
export const listContainerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

export const listItemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
};

// Card hover animation
export const cardHoverVariants: Variants = {
    rest: {
        scale: 1,
    },
    hover: {
        scale: 1.02,
        transition: {
            duration: 0.2,
            ease: 'easeInOut',
        },
    },
};

// Modal animation
export const modalVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.15,
            ease: 'easeIn',
        },
    },
};

// Backdrop animation
export const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

// Slide in from right
export const slideInRightVariants: Variants = {
    hidden: {
        x: '100%',
        opacity: 0,
    },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            damping: 25,
            stiffness: 200,
        },
    },
    exit: {
        x: '100%',
        opacity: 0,
        transition: {
            duration: 0.2,
        },
    },
};

// Fade in animation
export const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.3,
        },
    },
};

// Scale in animation
export const scaleInVariants: Variants = {
    hidden: {
        scale: 0,
        opacity: 0,
    },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            type: 'spring',
            damping: 15,
            stiffness: 200,
        },
    },
};
