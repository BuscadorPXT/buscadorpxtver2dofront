import * as React from "react"
import { cn } from "@/lib/utils"

function BackgroundDecoration({ variant = "default", className }) {
  const opacityMap = {
    default: { accent: "opacity-30", neutral: "opacity-20" },
    subtle: { accent: "opacity-20", neutral: "opacity-10" },
    vibrant: { accent: "opacity-40", neutral: "opacity-30" },
  }

  const opacity = opacityMap[variant] || opacityMap.default

  return (
    <div
      className={cn("fixed inset-0 -z-10 overflow-hidden pointer-events-none", className)}
      aria-hidden="true"
    >
      {/* Top right accent blob */}
      <div
        className={cn(
          "absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl",
          "bg-blob-accent-1",
          opacity.accent
        )}
      />

      {/* Bottom left accent blob */}
      <div
        className={cn(
          "absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl",
          "bg-blob-accent-2",
          opacity.accent
        )}
      />

      {/* Center neutral blob */}
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl",
          "bg-gradient-to-br from-neutral-200 to-neutral-300",
          opacity.neutral
        )}
      />

      {/* Small floating accent */}
      <div
        className={cn(
          "absolute top-1/4 right-1/4 w-32 h-32 rounded-full blur-2xl animate-float",
          "bg-blob-accent-3",
          opacity.accent
        )}
      />

      {/* Another small floating accent */}
      <div
        className={cn(
          "absolute bottom-1/4 left-1/3 w-24 h-24 rounded-full blur-2xl animate-float delay-1000",
          "bg-blob-accent-4",
          opacity.accent
        )}
      />
    </div>
  )
}

export { BackgroundDecoration }
