import * as React from "react"

import { cn } from "@/utils/cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-white/10 bg-k-bg px-3.5 py-0 text-[15px] transition-[border-color,box-shadow] outline-none selection:bg-k-primary selection:text-k-on-primary file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-k-text-muted hover:border-white/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-k-primary focus-visible:shadow-[0_0_0_4px_rgba(0,229,255,0.12)]",
        "aria-invalid:border-k-alert/60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
