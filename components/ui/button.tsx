import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[#0f4d50] focus-visible:outline-[var(--primary)]",
        secondary:
          "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[#dedbcf] focus-visible:outline-[var(--primary)]",
        outline:
          "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-[var(--primary)]",
        ghost:
          "text-[var(--foreground)] hover:bg-[var(--muted)] focus-visible:outline-[var(--primary)]",
        destructive:
          "bg-[#a5372d] text-white hover:bg-[#872c25] focus-visible:outline-[#a5372d]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
