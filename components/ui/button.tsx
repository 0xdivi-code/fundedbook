import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-[0.005em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(112deg,#d7ff3e_0%,#6dfb78_46%,#00f5a0_100%)] text-primary-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.28)_inset,0_10px_26px_-12px_rgba(0,245,160,0.85)] hover:brightness-110 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.3)_inset,0_12px_30px_-10px_rgba(215,255,62,0.75)]",
        lemon:
          "bg-[linear-gradient(112deg,#f2ff8a_0%,#d7ff3e_55%,#a6ff00_100%)] text-lemon-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.3)_inset,0_10px_26px_-12px_rgba(215,255,62,0.85)] hover:brightness-110",
        destructive:
          "bg-[linear-gradient(112deg,#ff6b83_0%,#ff4d6d_100%)] text-destructive-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset,0_10px_26px_-14px_rgba(255,77,109,0.8)] hover:brightness-110",
        outline:
          "border border-primary/25 bg-[linear-gradient(160deg,rgba(0,245,160,0.08),rgba(10,16,13,0.6))] text-foreground hover:border-primary/50 hover:text-primary hover:shadow-[0_0_24px_-12px_rgba(0,245,160,0.8)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent hover:text-primary",
        ghost:
          "text-muted-foreground hover:bg-accent hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline hover:text-lemon",
        profit:
          "bg-profit/12 text-profit border border-profit/30 hover:bg-profit/20 hover:shadow-[0_0_24px_-12px_rgba(0,245,160,0.9)]",
        loss: "bg-loss/12 text-loss border border-loss/30 hover:bg-loss/20 hover:shadow-[0_0_24px_-12px_rgba(255,77,109,0.9)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-[13px]",
        lg: "h-10 px-6 rounded-xl",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
