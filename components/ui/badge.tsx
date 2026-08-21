import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4 tracking-[0.01em] transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-[linear-gradient(120deg,rgba(215,255,62,0.16),rgba(0,245,160,0.14))] text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-muted-foreground",
        profit: "border-transparent bg-profit/12 text-profit",
        loss: "border-transparent bg-loss/12 text-loss",
        muted: "border-transparent bg-muted text-muted-foreground",
        accent: "border-transparent bg-accent text-accent-foreground",
        subtle: "border-transparent bg-primary/[0.07] text-muted-foreground",
        lemon:
          "border-lemon/25 bg-lemon/12 text-lemon",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
