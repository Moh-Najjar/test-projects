import React from 'react';
import { motion } from 'framer-motion';

/**
 * Props for the PageTransition component.
 */
interface PageTransitionProps {
  /** The content to be animated (usually the page component). */
  children: React.ReactNode;
}

/**
 * A wrapper component that applies smooth fade and slide transitions
 * to its children using framer-motion.
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      // Initial state: invisible and slightly shifted down
      initial={{ opacity: 0, y: 10 }}
      // Animate to: visible and at original position
      animate={{ opacity: 1, y: 0 }}
      // Exit state: invisible and slightly shifted up
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
