import { forwardRef, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'default' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

type MotionButtonProps = ComponentProps<typeof motion.button>;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#FF6B35] text-white hover:bg-[#E85A2A] hover:shadow-[0_4px_16px_rgba(255,107,53,0.3)]',
  secondary:
    'bg-transparent border-[1.5px] border-[#E2E8F0] text-[#1E293B] hover:border-[#1E293B] hover:bg-[#F8FAFC]',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'px-6 py-3 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'default', className = '', children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`
          inline-flex items-center justify-center
          rounded-lg font-semibold
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...(props as MotionButtonProps)}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
