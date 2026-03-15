import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-all duration-300',
    {
        variants: {
            variant: {
                default:
                    'bg-gradient-to-b from-[#10131C] to-[rgba(216,231,242,0.07)] text-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_0_20px_rgba(64,120,168,0.1)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),_0_0_30px_rgba(64,120,168,0.2)] border border-white/5 hover:border-white/10',
                ghost: 'hover:bg-white/5 hover:text-white text-muted border border-transparent hover:border-white/5',
                outline:
                    'border border-white/10 bg-transparent hover:bg-white/5 text-foreground',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-12 rounded-lg px-8 text-base',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
