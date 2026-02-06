import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        accent: "btn-variant-accent",
        accentOutline: "btn-variant-accent-outline",
        accentGhost: "btn-variant-accent-ghost",
        accentSubtle: "btn-variant-accent-subtle",
        lime:
          "bg-lime-500 text-white shadow-lg hover:bg-lime-600 focus-visible:ring-lime-500/30",
        limeOutline:
          "border border-lime-500 text-lime-700 hover:bg-lime-50 dark:text-lime-400 dark:hover:bg-lime-950/30",
        limeGhost:
          "text-lime-700 hover:bg-lime-50 dark:text-lime-400 dark:hover:bg-lime-950/30",
        limeSubtle:
          "bg-lime-50 text-lime-700 hover:bg-lime-100 dark:bg-lime-950/30 dark:text-lime-400 dark:hover:bg-lime-950/50",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        pill: "h-11 px-8 rounded-full",
        pillSm: "h-9 px-6 rounded-full text-sm",
        pillLg: "h-12 px-10 rounded-full text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
