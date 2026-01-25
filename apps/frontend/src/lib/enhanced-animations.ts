// Enhanced animation variants for Framer Motion
// Optimized for 60fps performance with GPU acceleration

// Page transitions
export const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1], // Custom easing
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 1, 1],
        }
    },
};

// Fade in from bottom
export const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
        }
    },
};

// Stagger container for lists
export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

// List item animation
export const listItem = {
    initial: { opacity: 0, x: -20 },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        }
    },
};

// Scale on hover
export const scaleOnHover = {
    rest: { scale: 1 },
    hover: {
        scale: 1.05,
        transition: {
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
        }
    },
};

// Subtle scale on hover (for cards)
export const cardHover = {
    rest: {
        scale: 1,
        y: 0,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    hover: {
        scale: 1.02,
        y: -4,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
        }
    },
};

// Pulse animation
export const pulse = {
    animate: {
        scale: [1, 1.05, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

// Slide in from right
export const slideInRight = {
    initial: { x: 100, opacity: 0 },
    animate: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
        }
    },
};

// Slide in from left
export const slideInLeft = {
    initial: { x: -100, opacity: 0 },
    animate: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
        }
    },
};

// Fade in
export const fadeIn = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.6,
            ease: "easeOut",
        }
    },
};

// Scale in
export const scaleIn = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
        }
    },
};

// Rotate in
export const rotateIn = {
    initial: { rotate: -10, opacity: 0 },
    animate: {
        rotate: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
        }
    },
};

// Floating animation (for hero elements)
export const floating = {
    animate: {
        y: [-10, 10, -10],
        transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

// Number count up animation helper
export const countUp = (target: number, duration: number = 2) => ({
    initial: { value: 0 },
    animate: {
        value: target,
        transition: {
            duration,
            ease: "easeOut",
        }
    },
});
