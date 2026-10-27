import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/utils/cn"

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow] outline-none focus-visible:shadow-[0_0_0_4px_rgba(0,229,255,0.18)] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-k-primary font-bold text-k-on-primary hover:bg-[#7df1ff] hover:shadow-[0_0_0_4px_rgba(0,229,255,0.14),0_10px_26px_-12px_rgba(0,229,255,0.8)]",
        destructive:
          "border border-k-alert/30 bg-k-alert/[0.12] text-k-alert hover:bg-k-alert/[0.2]",
        outline:
          "border border-white/[0.12] bg-transparent text-k-text hover:bg-white/[0.06]",
        secondary:
          "border border-white/10 bg-k-surface2 text-k-text hover:bg-k-surface3",
        ghost:
          "text-k-text-dim hover:bg-white/[0.06] hover:text-k-text",
        link: "text-k-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3.5",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-5",
        icon: "size-9 rounded-[10px]",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
