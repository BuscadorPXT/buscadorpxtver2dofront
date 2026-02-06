import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassCardVariants = cva(
  "rounded-2xl transition-all duration-300",
  {
    variants: {
      variant: {
        panel: "glass-panel",
        card: "glass-card",
        dark: "glass-card-dark",
        subtle: "bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/5",
      },
      hover: {
        none: "",
        lift: "hover-lift",
        glow: "hover:shadow-glow",
        scale: "hover-scale",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "card",
      hover: "none",
      padding: "md",
    },
  }
)

const GlassCard = React.forwardRef(
  ({ className, variant, hover, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, hover, padding, className }))}
        {...props}
      />
    )
  }
)
GlassCard.displayName = "GlassCard"

export { GlassCard, glassCardVariants }
