import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusPillVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
  {
    variants: {
      variant: {
        online: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
        offline: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
        warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
        error: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
        info: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "online",
    },
  }
)

const dotColors = {
  online: "bg-emerald-500",
  offline: "bg-neutral-400",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
}

function StatusPill({ className, variant = "online", children, ...props }) {
  return (
    <span className={cn(statusPillVariants({ variant }), className)} {...props}>
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            dotColors[variant]
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            dotColors[variant]
          )}
        />
      </span>
      {children}
    </span>
  )
}

export { StatusPill, statusPillVariants }
