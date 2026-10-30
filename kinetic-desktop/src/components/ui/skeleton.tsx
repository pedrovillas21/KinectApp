import { cn } from "@/utils/cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("k-skeleton rounded-md bg-k-surface1", className)}
      {...props}
    />
  )
}

export { Skeleton }
