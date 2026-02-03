import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * ModalPortal renders modal content at the document body level using React Portal.
 * This ensures modals appear above all other content regardless of stacking contexts.
 */
export function ModalPortal({ isOpen, onClose, children, className = '' }: ModalPortalProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm ${className}`}
          onClick={onClose}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * ModalContent is the inner content wrapper that prevents click propagation.
 */
export function ModalContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      {children}
    </motion.div>
  );
}
