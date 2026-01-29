import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary-600 text-white shadow-soft hover:bg-primary-700 focus-visible:ring-primary-500',
        secondary:
          'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 focus-visible:ring-neutral-400',
        outline:
          'border border-neutral-300 bg-white text-neutral-700 shadow-soft hover:bg-neutral-50 hover:border-neutral-400 focus-visible:ring-neutral-400',
        ghost:
          'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-400',
        destructive:
          'bg-error-600 text-white shadow-soft hover:bg-error-700 focus-visible:ring-error-500',
        success:
          'bg-accent-600 text-white shadow-soft hover:bg-accent-700 focus-visible:ring-accent-500',
        link: 'text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-6',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { buttonVariants };
