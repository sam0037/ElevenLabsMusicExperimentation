import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[0.01em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-100 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "border border-white/25 bg-[linear-gradient(135deg,#0f6cbd_0%,#0ea5e9_55%,#38bdf8_100%)] text-white shadow-[0_16px_30px_rgba(15,108,189,0.28)] hover:-translate-y-0.5 hover:brightness-[1.03] hover:shadow-[0_20px_36px_rgba(15,108,189,0.34)] active:translate-y-0 disabled:border-white/20 disabled:text-white/88 disabled:shadow-[0_12px_24px_rgba(15,108,189,0.18)] disabled:brightness-[0.98]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-primary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,247,255,0.92))] text-foreground shadow-[0_8px_18px_rgba(20,33,61,0.08)] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-accent/65 hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "border border-white/40 bg-[linear-gradient(135deg,#fde68a_0%,#fb923c_100%)] text-[#5e3500] shadow-[0_14px_28px_rgba(251,146,60,0.22)] hover:-translate-y-0.5 hover:brightness-[1.02]",
        ghost:
          "text-foreground hover:bg-secondary/80 hover:text-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2 has-[>svg]:px-4",
        sm: "h-9 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
